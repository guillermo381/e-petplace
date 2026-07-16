/**
 * track-gps-fondo.ts — LA SESIÓN DE TRACK del paseo (S63-B, D-292).
 *
 * El buffer, el throttle y el flush que vivían dentro de use-track-gps
 * suben a ESTE módulo (estado de módulo, no de React): así los alimentan
 * por igual el watcher foreground (fallback) y la tarea de background de
 * expo-task-manager — y sobreviven a que la pantalla del Durante se
 * desmonte mientras el paseo sigue con el teléfono en el bolsillo.
 *
 * Contrato heredado VERBATIM de las curas S62 (nada se relaja):
 *   · punto aceptado cada ≥5s
 *   · flush al juntar 12 puntos O cada 60s — el reloj se revisa EN CADA
 *     PUNTO (en background los timers de JS no son confiables; el que
 *     dispara es el punto que llega, no un setInterval)
 *   · error de red → lote reinyectado al buffer
 *   · atencion_no_en_curso → hard-stop (server mandó): se apaga también
 *     el servicio de background y se avisa al oyente
 *   · flushFinal devuelve total real + pendientes (la pantalla declara)
 *
 * HEADLESS (el servicio sobrevive a la app muerta): la sesión activa se
 * persiste en AsyncStorage; si la tarea despierta sin estado de módulo,
 * lo restaura de disco — y si no hay nada, apaga el servicio huérfano.
 * Best-effort declarado: el camino primario es la app viva en bolsillo.
 *
 * IMPORTANTE: este módulo se importa desde el _layout raíz — la tarea
 * tiene que estar definida en global scope en TODO arranque del proceso
 * (incluido el relanzamiento headless del servicio).
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registrarTrackPaseo, type PuntoGpsPaseo } from '@epetplace/api';

export const TAREA_TRACK_GPS = 'epetplace-track-paseo';
const STORAGE_SESION = 'track-gps-sesion-activa';

const INTERVALO_MS = 5_000;
const MAX_BUFFER = 12;
const FLUSH_PERIOD_MS = 60_000;

export interface OyenteTrack {
  onPunto?: (p: { lat: number; lng: number }) => void;
  onTotal?: (total: number) => void;
  /** El server declaró la atención fuera de curso: la captura ya se apagó. */
  onServerDetuvo?: () => void;
}

interface SesionTrack {
  eventoAtencionId: string;
  buffer: PuntoGpsPaseo[];
  puntosSesion: { lat: number; lng: number }[];
  lastT: number;
  lastFlushT: number;
  flushing: boolean;
  detenidaPorServer: boolean;
  total: number;
}

let sesion: SesionTrack | null = null;
let oyente: OyenteTrack | null = null;

/** Idempotente: el remontaje del Durante ADOPTA la sesión viva del mismo
 *  paseo (los puntos sin flushear siguen ahí). El total de DB que trae la
 *  pantalla solo asciende — un flush previo puede saber más que el load. */
export function iniciarSesionTrack(eventoAtencionId: string, totalInicial: number): void {
  if (sesion?.eventoAtencionId === eventoAtencionId) {
    sesion.total = Math.max(sesion.total, totalInicial);
    return;
  }
  sesion = {
    eventoAtencionId,
    buffer: [],
    puntosSesion: [],
    lastT: 0,
    lastFlushT: Date.now(),
    flushing: false,
    detenidaPorServer: false,
    total: totalInicial,
  };
}

export function suscribirTrack(o: OyenteTrack): () => void {
  oyente = o;
  return () => {
    if (oyente === o) oyente = null;
  };
}

export function puntosSesionActual(): { lat: number; lng: number }[] {
  return sesion ? [...sesion.puntosSesion] : [];
}

export function sesionDetenidaPorServer(): boolean {
  return sesion?.detenidaPorServer ?? false;
}

export function aceptarPunto(lat: number, lng: number): void {
  const s = sesion;
  if (!s || s.detenidaPorServer) return;
  const ahora = Date.now();
  if (ahora - s.lastT < INTERVALO_MS) return;
  s.lastT = ahora;
  s.buffer.push({ lat, lng, t: new Date(ahora).toISOString() });
  s.puntosSesion.push({ lat, lng });
  oyente?.onPunto?.({ lat, lng });
  if (s.buffer.length >= MAX_BUFFER || ahora - s.lastFlushT >= FLUSH_PERIOD_MS) void flushTrack();
}

export async function flushTrack(): Promise<void> {
  const s = sesion;
  if (!s || s.flushing || s.buffer.length === 0) return;
  s.flushing = true;
  const lote = s.buffer.slice();
  s.buffer = [];
  try {
    const r = await registrarTrackPaseo({ evento_atencion_id: s.eventoAtencionId, puntos: lote, append: true });
    if (r.ok) {
      s.lastFlushT = Date.now();
      s.total = r.data.puntos_total;
      oyente?.onTotal?.(s.total);
      return;
    }
    if (r.codigo === 'atencion_no_en_curso' || r.codigo === 'atencion_estado_invalido') {
      s.detenidaPorServer = true;
      await detenerCapturaFondo();
      oyente?.onServerDetuvo?.();
      return;
    }
    // Transitorio: reinyectar para el próximo flush.
    s.buffer = [...lote, ...s.buffer];
  } finally {
    s.flushing = false;
  }
}

export async function flushFinalTrack(): Promise<{ total: number; pendientes: number }> {
  await flushTrack();
  return { total: sesion?.total ?? 0, pendientes: sesion?.buffer.length ?? 0 };
}

/** Arranca el servicio de ubicación en background (permiso "siempre" ya
 *  concedido). La notificación del servicio es la voz honesta del sistema:
 *  Android la exige y la familia del permiso la merece. */
export async function iniciarCapturaFondo(notificacion: { titulo: string; cuerpo: string }): Promise<void> {
  const s = sesion;
  if (!s || s.detenidaPorServer) return;
  await AsyncStorage.setItem(STORAGE_SESION, JSON.stringify({ eventoAtencionId: s.eventoAtencionId })).catch(
    () => {},
  );
  const yaCorre = await Location.hasStartedLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => false);
  if (yaCorre) return;
  await Location.startLocationUpdatesAsync(TAREA_TRACK_GPS, {
    accuracy: Location.Accuracy.High,
    timeInterval: INTERVALO_MS,
    distanceInterval: 0,
    // iOS: caminata — el sistema no pausa el track por ritmo lento.
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: notificacion.titulo,
      notificationBody: notificacion.cuerpo,
      // false: el servicio sobrevive al swipe-kill y el camino headless
      // restaura la sesión de disco — el track no muere con la app.
      killServiceOnDestroy: false,
    },
  });
}

/** Apaga el servicio y borra la sesión persistida. Se llama al terminar
 *  el paseo, en el hard-stop del server, y al detectar huérfanos. */
export async function detenerCapturaFondo(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_SESION).catch(() => {});
  const corre = await Location.hasStartedLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => false);
  if (corre) await Location.stopLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => {});
}

TaskManager.defineTask(TAREA_TRACK_GPS, async ({ data, error }) => {
  if (error) {
    console.error(`[track-fondo] tarea con error: ${error.message}`);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  if (locations.length === 0) return;
  if (!sesion) {
    // Proceso relanzado headless: el servicio siguió vivo sin la app.
    const crudo = await AsyncStorage.getItem(STORAGE_SESION).catch(() => null);
    let guardada: { eventoAtencionId?: string } | null = null;
    try {
      guardada = crudo ? (JSON.parse(crudo) as { eventoAtencionId?: string }) : null;
    } catch {
      guardada = null;
    }
    if (!guardada?.eventoAtencionId) {
      // Servicio huérfano (nadie lo reclama): se apaga solo.
      await detenerCapturaFondo();
      return;
    }
    // total 0 provisorio: el primer flush trae el total real del server.
    iniciarSesionTrack(guardada.eventoAtencionId, 0);
  }
  for (const l of locations) aceptarPunto(l.coords.latitude, l.coords.longitude);
});
