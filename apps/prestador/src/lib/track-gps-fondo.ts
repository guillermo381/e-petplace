/**
 * track-gps-fondo.ts — LAS SESIONES DE TRACK del paseo (S63-B, D-292;
 * S85-C: D-595 — VARIOS PASEOS A LA VEZ).
 *
 * El buffer, el throttle y el flush que vivían dentro de use-track-gps
 * suben a ESTE módulo (estado de módulo, no de React): así los alimentan
 * por igual el watcher foreground (fallback) y la tarea de background de
 * expo-task-manager — y sobreviven a que la pantalla del Durante se
 * desmonte mientras el paseo sigue con el teléfono en el bolsillo.
 *
 * ═══════ S85-C · D-595 — DE UN SINGLETON A UN MAPA ═══════
 *
 * **La verdad de producto (founder, gate S83): varios paseos simultáneos
 * NO son un borde — son el caso normal del oficio.** El motor lo sabe
 * desde S67-V0 (ocupación por PERSONA, `cupo_techo` 4 en el paseo); la
 * captura no lo sabía.
 *
 * **EL DEFECTO ①, medido y reproducido por el founder en campo:** había
 * UNA `sesion` de módulo, y `aceptarPunto` no recibía id — tomaba *"la
 * que estuviera puesta"*. Abrir el Durante del segundo paseo PISABA la
 * sesión del primero (y perdía su buffer sin flushear, en silencio). El
 * campo del founder: un paseo cerró con **~830 puntos** y el otro con
 * **~2 — y esos 2 coinciden con los ratos en que sacó el teléfono**, o
 * sea con los ratos en que ESA pantalla estuvo montada y volvió a pisar
 * la sesión. *La captura de fondo alimentaba a uno solo porque solo
 * existía uno.*
 *
 * **EL DEFECTO ②, la otra mitad y por eso se curan JUNTOS:** hay **UN
 * registro de ubicación en el SO** (`TAREA_TRACK_GPS`), así que apagarlo
 * al Terminar apagaba la captura de TODOS los paseos vivos. Curar solo
 * ① habría dejado que el segundo paseo se muriera en cuanto el primero
 * terminara — que es justo la mitad del recorrido de campo.
 *
 * **LO QUE RIGE AHORA:**
 *   · `sesiones: Map<atencionId, SesionTrack>` — **nadie pisa a nadie**.
 *   · un punto del fondo se **REPARTE a TODAS las sesiones activas**;
 *     cada una conserva su propio throttle, buffer, total y flush.
 *   · `terminarSesionTrack(id)` saca UNA del mapa y **apaga el servicio
 *     del SO SOLO si no queda ninguna**.
 *   · el hard-stop del server marca **solo la sesión que rebotó** — un
 *     `atencion_no_en_curso` de una atención ya no calla a las otras.
 *   · `oyentes: Map<atencionId, OyenteTrack>` — dos Durante montados
 *     reciben cada uno LO SUYO (antes el segundo tapaba al primero).
 *
 * **UNA SOLA SUSCRIPCIÓN DE GPS PARA N TRACKS, y es a propósito:** el
 * aparato tiene una antena. Pedir N suscripciones no daría N recorridos
 * distintos — daría el mismo recorrido N veces, con N veces la batería.
 * *El paseador camina UNA vez; lo que se reparte es su recorrido.*
 *
 * Contrato heredado VERBATIM de las curas S62 (nada se relaja, y ahora
 * rige POR SESIÓN):
 *   · punto aceptado cada ≥5s
 *   · flush al juntar 12 puntos O cada 60s — el reloj se revisa EN CADA
 *     PUNTO (en background los timers de JS no son confiables; el que
 *     dispara es el punto que llega, no un setInterval)
 *   · error de red → lote reinyectado al buffer
 *   · atencion_no_en_curso → hard-stop (server mandó) DE ESA SESIÓN
 *   · flushFinal devuelve total real + pendientes (la pantalla declara)
 *
 * HEADLESS (el servicio sobrevive a la app muerta): las sesiones activas
 * se persisten en AsyncStorage como LISTA de ids; si la tarea despierta
 * sin estado de módulo, las restaura todas de disco — y si no hay
 * ninguna, apaga el servicio huérfano. Best-effort declarado: el camino
 * primario es la app viva en bolsillo.
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
  onPunto?: (p: PuntoGpsPaseo) => void;
  onTotal?: (total: number) => void;
  /** El server declaró la atención fuera de curso: la captura ya se apagó. */
  onServerDetuvo?: () => void;
}

interface SesionTrack {
  eventoAtencionId: string;
  buffer: PuntoGpsPaseo[];
  // S81 (D-578): la sesión conserva `t` — el filtro del dibujo lo necesita.
  puntosSesion: PuntoGpsPaseo[];
  lastT: number;
  lastFlushT: number;
  flushing: boolean;
  detenidaPorServer: boolean;
  total: number;
}

/** D-595: EL MAPA. Antes era `let sesion: SesionTrack | null` y ahí vivía
 *  el defecto entero — una variable que solo puede tener un valor obliga
 *  a que el segundo paseo pise al primero. */
const sesiones = new Map<string, SesionTrack>();
/** D-595: un oyente POR SESIÓN. Antes era un slot único y el segundo
 *  Durante montado tapaba al primero. */
const oyentes = new Map<string, OyenteTrack>();

/** Las que todavía capturan: existen en el mapa y el server no las frenó. */
function sesionesActivas(): SesionTrack[] {
  return [...sesiones.values()].filter((s) => !s.detenidaPorServer);
}

/** La lista de ids que el camino headless necesita para resucitar. Se
 *  reescribe ENTERA en cada cambio: una lista parcial reviviría media
 *  captura, que es peor que ninguna. */
async function persistirSesiones(): Promise<void> {
  const ids = sesionesActivas().map((s) => s.eventoAtencionId);
  if (ids.length === 0) {
    await AsyncStorage.removeItem(STORAGE_SESION).catch(() => {});
    return;
  }
  await AsyncStorage.setItem(STORAGE_SESION, JSON.stringify({ ids })).catch(() => {});
}

/** Idempotente: el remontaje del Durante ADOPTA la sesión viva del mismo
 *  paseo (los puntos sin flushear siguen ahí). El total de DB que trae la
 *  pantalla solo asciende — un flush previo puede saber más que el load.
 *
 *  D-595: y ahora **NO TOCA a las otras**. Antes, un id distinto
 *  reasignaba la variable y el paseo anterior perdía sesión y buffer. */
export function iniciarSesionTrack(eventoAtencionId: string, totalInicial: number): void {
  const viva = sesiones.get(eventoAtencionId);
  if (viva) {
    viva.total = Math.max(viva.total, totalInicial);
    return;
  }
  sesiones.set(eventoAtencionId, {
    eventoAtencionId,
    buffer: [],
    puntosSesion: [],
    lastT: 0,
    lastFlushT: Date.now(),
    flushing: false,
    detenidaPorServer: false,
    total: totalInicial,
  });
}

export function suscribirTrack(eventoAtencionId: string, o: OyenteTrack): () => void {
  oyentes.set(eventoAtencionId, o);
  return () => {
    if (oyentes.get(eventoAtencionId) === o) oyentes.delete(eventoAtencionId);
  };
}

export function puntosSesionActual(eventoAtencionId: string): PuntoGpsPaseo[] {
  const s = sesiones.get(eventoAtencionId);
  return s ? [...s.puntosSesion] : [];
}

export function sesionDetenidaPorServer(eventoAtencionId: string): boolean {
  return sesiones.get(eventoAtencionId)?.detenidaPorServer ?? false;
}

/**
 * EL REPARTO (D-595 ①). Un punto del aparato entra a **todas** las
 * sesiones activas. Cada una decide sola si lo acepta: el throttle de
 * 5 s es POR SESIÓN, así que dos paseos arrancados con segundos de
 * diferencia conservan cada uno su propia cadencia y su propio buffer.
 *
 * *No se filtra por "cuál está en pantalla": ésa era la pregunta que
 * fabricaba el defecto.*
 */
export function aceptarPunto(lat: number, lng: number): void {
  const ahora = Date.now();
  for (const s of sesionesActivas()) {
    if (ahora - s.lastT < INTERVALO_MS) continue;
    s.lastT = ahora;
    const punto: PuntoGpsPaseo = { lat, lng, t: new Date(ahora).toISOString() };
    s.buffer.push(punto);
    s.puntosSesion.push(punto);
    oyentes.get(s.eventoAtencionId)?.onPunto?.(punto);
    if (s.buffer.length >= MAX_BUFFER || ahora - s.lastFlushT >= FLUSH_PERIOD_MS) {
      void flushSesion(s);
    }
  }
}

/** El flush de UNA sesión. Su contrato es el de S62, intacto — lo único
 *  que cambia es que el hard-stop del server ya NO apaga a las hermanas. */
async function flushSesion(s: SesionTrack): Promise<void> {
  if (s.flushing || s.buffer.length === 0) return;
  s.flushing = true;
  const lote = s.buffer.slice();
  s.buffer = [];
  try {
    const r = await registrarTrackPaseo({
      evento_atencion_id: s.eventoAtencionId,
      puntos: lote,
      append: true,
    });
    if (r.ok) {
      s.lastFlushT = Date.now();
      s.total = r.data.puntos_total;
      oyentes.get(s.eventoAtencionId)?.onTotal?.(s.total);
      return;
    }
    if (r.codigo === 'atencion_no_en_curso' || r.codigo === 'atencion_estado_invalido') {
      /* D-595 ②: el hard-stop es DE ESTA SESIÓN. Antes llamaba a
         `detenerCapturaFondo()` a secas y apagaba el servicio del SO —
         o sea que el server rebotando UNA atención dejaba mudas a las
         otras, que seguían perfectamente en curso. Ahora se marca la
         que rebotó, se avisa a SU oyente, y el servicio solo se apaga
         si con ésta se acabaron todas. */
      s.detenidaPorServer = true;
      await persistirSesiones();
      await apagarServicioSiNoQuedaNadie();
      oyentes.get(s.eventoAtencionId)?.onServerDetuvo?.();
      return;
    }
    // Transitorio: reinyectar para el próximo flush.
    s.buffer = [...lote, ...s.buffer];
  } finally {
    s.flushing = false;
  }
}

/** Flush de una sesión concreta, o de TODAS si no se nombra ninguna (el
 *  reloj del fallback foreground y el flush al soltar la pantalla). */
export async function flushTrack(eventoAtencionId?: string): Promise<void> {
  if (eventoAtencionId !== undefined) {
    const s = sesiones.get(eventoAtencionId);
    if (s && !s.detenidaPorServer) await flushSesion(s);
    return;
  }
  await Promise.all(sesionesActivas().map((s) => flushSesion(s)));
}

/**
 * El cierre de UN paseo: vacía su buffer y devuelve SU total.
 *
 * ⚠️ **PIDE EL ID, y no es ceremonia.** La versión vieja devolvía
 * `sesion?.total` —el singleton— así que el número con el que la
 * pantalla decide si pedir motivo de fallo (`total < 2`, el espejo del
 * guard de `20260715150000`) podía venir **del otro paseo**. Con dos
 * tracks vivos, un total ajeno es exactamente el dato inventado que ese
 * motor existe para no tener.
 */
export async function flushFinalTrack(
  eventoAtencionId: string,
): Promise<{ total: number; pendientes: number }> {
  await flushTrack(eventoAtencionId);
  const s = sesiones.get(eventoAtencionId);
  return { total: s?.total ?? 0, pendientes: s?.buffer.length ?? 0 };
}

/** Arranca el servicio de ubicación en background (permiso "siempre" ya
 *  concedido). La notificación del servicio es la voz honesta del sistema:
 *  Android la exige y la familia del permiso la merece.
 *
 *  D-595: **el servicio es UNO para N paseos.** El early-return cuando ya
 *  corre sigue siendo correcto —y ahora es la pieza que hace barato el
 *  caso simultáneo—, pero la lista persistida se reescribe SIEMPRE, antes
 *  del return: el segundo paseo tiene que entrar al disco aunque el
 *  servicio ya esté arriba. */
export async function iniciarCapturaFondo(
  eventoAtencionId: string,
  notificacion: { titulo: string; cuerpo: string },
): Promise<void> {
  const s = sesiones.get(eventoAtencionId);
  if (!s || s.detenidaPorServer) return;
  await persistirSesiones();
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
      // restaura las sesiones de disco — el track no muere con la app.
      killServiceOnDestroy: false,
    },
  });
}

/**
 * **D-595 ② — TERMINAR UNO NO MATA AL OTRO.**
 *
 * Saca la sesión del mapa y apaga el servicio del SO **solo si con ella
 * se fueron todas**. Antes, `detenerTrack` de un paseo llamaba derecho a
 * `stopLocationUpdatesAsync` y el paseo hermano quedaba sin captura: no
 * fallaba nada, no avisaba nada, y su track simplemente dejaba de crecer
 * hasta que alguien volviera a abrir su pantalla. *Un track que se corta
 * sin decirlo es la falla más cara de este módulo — es la que produce un
 * `registrado` honesto en la DB sobre un recorrido que no se registró.*
 */
export async function terminarSesionTrack(eventoAtencionId: string): Promise<void> {
  sesiones.delete(eventoAtencionId);
  oyentes.delete(eventoAtencionId);
  await persistirSesiones();
  await apagarServicioSiNoQuedaNadie();
}

/** El apagado, con su única condición: que no quede nadie capturando. */
async function apagarServicioSiNoQuedaNadie(): Promise<void> {
  if (sesionesActivas().length > 0) return;
  const corre = await Location.hasStartedLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => false);
  if (corre) await Location.stopLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => {});
}

/** Apaga TODO y borra el disco. Queda para el huérfano headless (nadie
 *  reclama el servicio) — **no es el camino de terminar un paseo**: ése
 *  es `terminarSesionTrack`, que respeta a los hermanos. */
export async function detenerCapturaFondo(): Promise<void> {
  sesiones.clear();
  await AsyncStorage.removeItem(STORAGE_SESION).catch(() => {});
  const corre = await Location.hasStartedLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => false);
  if (corre) await Location.stopLocationUpdatesAsync(TAREA_TRACK_GPS).catch(() => {});
}

/** Lee la lista de disco. **Acepta la forma VIEJA** (`{eventoAtencionId}`,
 *  de un solo paseo): un APK en la calle puede tener eso guardado, y
 *  descartarlo mataría el track de un paseo en curso durante la
 *  actualización. Se lee, se convierte, y la próxima escritura ya deja la
 *  forma nueva. */
function leerIdsGuardados(crudo: string | null): string[] {
  if (crudo === null) return [];
  try {
    const g = JSON.parse(crudo) as { ids?: unknown; eventoAtencionId?: unknown };
    if (Array.isArray(g.ids)) return g.ids.filter((x): x is string => typeof x === 'string');
    if (typeof g.eventoAtencionId === 'string') return [g.eventoAtencionId];
    return [];
  } catch {
    return [];
  }
}

TaskManager.defineTask(TAREA_TRACK_GPS, async ({ data, error }) => {
  if (error) {
    console.error(`[track-fondo] tarea con error: ${error.message}`);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
  if (locations.length === 0) return;
  if (sesiones.size === 0) {
    // Proceso relanzado headless: el servicio siguió vivo sin la app.
    // D-595: se restauran TODAS las sesiones, no la última.
    const crudo = await AsyncStorage.getItem(STORAGE_SESION).catch(() => null);
    const ids = leerIdsGuardados(crudo);
    if (ids.length === 0) {
      // Servicio huérfano (nadie lo reclama): se apaga solo.
      await detenerCapturaFondo();
      return;
    }
    // total 0 provisorio: el primer flush trae el total real del server.
    for (const id of ids) iniciarSesionTrack(id, 0);
  }
  for (const l of locations) aceptarPunto(l.coords.latitude, l.coords.longitude);
});
