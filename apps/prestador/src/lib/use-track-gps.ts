/**
 * useTrackGps — el orquestador de la captura del recorrido (S44-B4.3;
 * curas S62; S63-B: D-292 — GPS BACKGROUND).
 *
 * El buffer/throttle/flush viven en track-gps-fondo.ts (estado de módulo,
 * compartido con la tarea de background). Este hook decide el MODO y
 * traduce la sesión a estado de React para la pantalla:
 *
 *   · modo 'fondo' (D-292): permiso "siempre" concedido →
 *     startLocationUpdatesAsync + servicio con notificación honesta.
 *     El track sigue con el teléfono en el bolsillo y AL NAVEGAR fuera
 *     del Durante (el cleanup NO apaga el servicio — lo apaga Terminar
 *     o el hard-stop del server).
 *   · modo 'pantalla' (fallback S44/S62): solo permiso "mientras se usa"
 *     → watchPositionAsync foreground, la limitación se declara con la
 *     voz honesta de S62 (que en modo fondo SE RETIRA).
 *
 * El permiso "siempre" JAMÁS se pide a ciegas: el hook expone
 * `fondoPedible` y la PANTALLA muestra primero la voz honesta (batería
 * declarada) — recién con el sí del paseador se dispara el prompt
 * nativo vía `pedirFondo()`.
 *
 * Contrato S62 intacto: estados del chip, timeout del primer punto,
 * denegado-sin-re-pregunta → Ajustes, aproximado persistente, flush
 * final que declara pendientes.
 *
 * DEV: EXPO_PUBLIC_GPS_FAKE=1 simula una caminata (browser/emulador).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  aceptarPunto,
  detenerCapturaFondo,
  flushFinalTrack,
  flushTrack,
  iniciarCapturaFondo,
  iniciarSesionTrack,
  puntosSesionActual,
  sesionDetenidaPorServer,
  suscribirTrack,
} from './track-gps-fondo';
import { useTraduccion } from '@/i18n';

export type EstadoGps =
  | 'inactivo'
  | 'iniciando'
  | 'activo'
  | 'aproximado'
  | 'sin_permiso'
  | 'sin_permiso_ajustes'
  | 'sin_senal'
  | 'no_disponible'
  | 'error';

export type ModoTrack = 'fondo' | 'pantalla';

const INTERVALO_MS = 5_000;
const FLUSH_PERIOD_MS = 60_000;
/** S62: si el GPS no entrega el PRIMER punto en este plazo, el chip
 *  pasa a 'sin_senal' (voz honesta) — la captura no se detiene. */
const TIMEOUT_PRIMER_PUNTO_MS = 30_000;
const FAKE = __DEV__ && process.env.EXPO_PUBLIC_GPS_FAKE === '1';
const FAKE_PERIOD_MS = 3_000;

export interface ResultadoFlushFinal {
  /** Total REAL confirmado por el server. */
  total: number;
  /** Puntos capturados que NO llegaron a DB (red caída): si >0, la
   *  pantalla lo declara y NO cierra con el total viejo. */
  pendientes: number;
}

export interface UseTrackGps {
  estado: EstadoGps;
  puntosTotal: number;
  ultimoPunto: { lat: number; lng: number } | null;
  puntosSesion: { lat: number; lng: number }[];
  /** 'fondo' = D-292 vivo (el bolsillo registra) · 'pantalla' = fallback
   *  foreground: la voz honesta "pantalla encendida" sigue vigente. */
  modo: ModoTrack;
  /** true = hay permiso foreground pero el "siempre" está pedible: la
   *  pantalla muestra la voz honesta ANTES del prompt nativo. */
  fondoPedible: boolean;
  /** Dispara el prompt nativo del permiso "siempre" (tras la voz honesta
   *  de la pantalla). true = concedido y el modo ya subió a 'fondo'. */
  pedirFondo: () => Promise<boolean>;
  /** Vacía el buffer y devuelve el total real del server + pendientes. */
  flushFinal: () => Promise<ResultadoFlushFinal>;
  /** Apaga TODA la captura (watcher + servicio de fondo). Lo llama la
   *  pantalla cuando el paseo TERMINÓ — navegar no apaga el fondo. */
  detenerTrack: () => Promise<void>;
  /** Re-pide el permiso / re-arranca el watcher (cards de estado). */
  reintentarPermiso: () => void;
}

export function useTrackGps(eventoAtencionId: string, puntosIniciales: number): UseTrackGps {
  const { t } = useTraduccion();
  const [estado, setEstado] = useState<EstadoGps>('iniciando');
  const [puntosTotal, setPuntosTotal] = useState(puntosIniciales);
  const [puntosSesion, setPuntosSesion] = useState<{ lat: number; lng: number }[]>([]);
  const [modo, setModo] = useState<ModoTrack>('pantalla');
  const [fondoPedible, setFondoPedible] = useState(false);
  const [intento, setIntento] = useState(0);

  const subRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fakeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** S62: con permiso aproximado el estado NO asciende a 'activo' —
   *  la app dice la verdad del fix mientras captura. */
  const aproximadoRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;
  /** Solo siembra la sesión al montar — el refetch en foco trae un objeto
   *  datos nuevo y NO debe reiniciar el watcher (comportamiento S62). */
  const puntosInicialesRef = useRef(puntosIniciales);
  puntosInicialesRef.current = puntosIniciales;

  const detenerLocal = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (fakeRef.current !== null) clearInterval(fakeRef.current);
    fakeRef.current = null;
  }, []);

  const flushFinal = useCallback(async (): Promise<ResultadoFlushFinal> => flushFinalTrack(), []);

  const detenerTrack = useCallback(async () => {
    detenerLocal();
    await detenerCapturaFondo();
    setEstado('inactivo');
  }, [detenerLocal]);

  const arrancarFondo = useCallback(async () => {
    await iniciarCapturaFondo({
      titulo: tRef.current('cita.fondoNotificacionTitulo'),
      cuerpo: tRef.current('cita.fondoNotificacionCuerpo'),
    });
    setModo('fondo');
    setFondoPedible(false);
  }, []);

  const pedirFondo = useCallback(async (): Promise<boolean> => {
    const permiso = await Location.requestBackgroundPermissionsAsync().catch(() => null);
    setFondoPedible(false);
    if (!permiso?.granted) return false;
    // Re-arranca el pipeline entero: con el "siempre" ya concedido,
    // arrancar() toma el camino del fondo — y si el servicio fallara,
    // cae solo al watcher foreground (mismo fallback de siempre).
    setIntento((i) => i + 1);
    return true;
  }, []);

  useEffect(() => {
    iniciarSesionTrack(eventoAtencionId, puntosInicialesRef.current);
    if (sesionDetenidaPorServer()) {
      setEstado('inactivo');
      return;
    }
    // Remontaje a mitad de paseo: los puntos de la sesión viva siembran
    // el estado local (el mapa no arranca vacío con el fondo corriendo).
    setPuntosSesion(puntosSesionActual());

    let cancelado = false;
    const desuscribir = suscribirTrack({
      onPunto: (p) => {
        if (cancelado) return;
        setPuntosSesion((prev) => [...prev, p]);
        setEstado(aproximadoRef.current ? 'aproximado' : 'activo');
      },
      onTotal: (total) => {
        if (!cancelado) setPuntosTotal(total);
      },
      onServerDetuvo: () => {
        if (cancelado) return;
        detenerLocal();
        setEstado('inactivo');
      },
    });

    async function arrancar() {
      setEstado('iniciando');

      if (FAKE) {
        // Caminata simulada alrededor del Parque La Carolina.
        let paso = 0;
        fakeRef.current = setInterval(() => {
          paso += 1;
          aceptarPunto(-0.185 + Math.sin(paso / 8) * 0.0012, -78.481 + paso * 0.00012);
        }, FAKE_PERIOD_MS);
        intervalRef.current = setInterval(() => void flushTrack(), FLUSH_PERIOD_MS);
        return;
      }

      const permiso = await Location.requestForegroundPermissionsAsync();
      if (cancelado) return;
      if (!permiso.granted) {
        // S62: tras el doble "No permitir", Android devuelve denegado
        // SIN re-mostrar el diálogo — el camino honesto son los Ajustes.
        setEstado(permiso.canAskAgain === false ? 'sin_permiso_ajustes' : 'sin_permiso');
        return;
      }
      // S62: fix grueso declarado (Android 12+ "aproximada" / iOS reduced).
      aproximadoRef.current =
        permiso.android?.accuracy === 'coarse' || permiso.ios?.accuracy === 'reduced';

      const activado = await Location.hasServicesEnabledAsync().catch(() => false);
      if (cancelado) return;
      if (!activado) {
        setEstado('no_disponible');
        return;
      }

      // S62: el "iniciando" eterno muere — sin primer punto en 30s,
      // voz honesta (la captura sigue: un punto tardío cura el chip).
      timeoutRef.current = setTimeout(() => {
        setEstado((e) => (e === 'iniciando' ? 'sin_senal' : e));
      }, TIMEOUT_PRIMER_PUNTO_MS);

      // D-292: con el "siempre" ya concedido, el fondo arranca derecho.
      const fondo = await Location.getBackgroundPermissionsAsync().catch(() => null);
      if (cancelado) return;
      if (fondo?.granted) {
        try {
          await arrancarFondo();
          return;
        } catch {
          // El servicio no arrancó: cae al watcher foreground (honesto).
        }
      } else {
        // fondo === null = la plataforma no sabe de background (web):
        // ahí no hay nada pedible — la voz honesta de pantalla rige.
        setFondoPedible(fondo !== null && fondo.canAskAgain !== false);
      }

      // Fallback foreground (S44/S62): pantalla al frente.
      try {
        subRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: INTERVALO_MS, distanceInterval: 0 },
          (pos) => aceptarPunto(pos.coords.latitude, pos.coords.longitude),
        );
        intervalRef.current = setInterval(() => void flushTrack(), FLUSH_PERIOD_MS);
        setModo('pantalla');
        if (aproximadoRef.current) setEstado('aproximado');
      } catch {
        setEstado('error');
      }
    }

    void arrancar();
    return () => {
      cancelado = true;
      desuscribir();
      detenerLocal();
      // S62: el buffer se flushea al soltar la pantalla (fire-and-forget;
      // micro-hueco del vuelo declarado en S62). D-292: el servicio de
      // FONDO NO se apaga acá — navegar no termina el paseo; lo apagan
      // Terminar (detenerTrack) o el hard-stop del server.
      void flushTrack();
    };
  }, [eventoAtencionId, intento, arrancarFondo, detenerLocal]);

  const ultimoPunto = puntosSesion.length > 0 ? puntosSesion[puntosSesion.length - 1] : null;

  return {
    estado,
    puntosTotal,
    ultimoPunto,
    puntosSesion,
    modo,
    fondoPedible,
    pedirFondo,
    flushFinal,
    detenerTrack,
    reintentarPermiso: () => setIntento((i) => i + 1),
  };
}
