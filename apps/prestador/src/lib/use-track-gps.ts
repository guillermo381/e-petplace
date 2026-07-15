/**
 * useTrackGps — captura FOREGROUND del recorrido (S44-B4.3; lote de
 * curas del track S62 — pedido founder post-bifurcación).
 *
 * GPS en background sigue siendo D-292 (dev build + permisos always +
 * servicio): acá el track vive mientras la pantalla del Durante está
 * al frente — limitación asumida de F1, documentada.
 *
 * Patrón heredado del relevamiento B0 (repo viejo, useTrackGps):
 *   · punto aceptado cada ≥5s
 *   · flush a DB al juntar 12 puntos o cada 60s (registrarTrackPaseo append)
 *   · error de red → lote reinyectado al buffer
 *   · atencion_no_en_curso → hard-stop silencioso (el server mandó)
 *   · flushFinal() para Terminar — S62: devuelve TAMBIÉN los puntos
 *     que NO se pudieron guardar (pendientes>0 = la red falló; la
 *     pantalla lo declara, jamás cierra con el total viejo en silencio)
 *
 * CURAS S62 (todas OTA):
 *   · el cleanup FLUSHEA el buffer antes de soltar (los hasta-11
 *     puntos ya no se pierden al salir de la pantalla)
 *   · timeout del primer punto (30s) → 'sin_senal' honesto (muere el
 *     "iniciando" eterno; el watcher sigue vivo — si el punto llega,
 *     el estado se cura solo)
 *   · denegado SIN re-pregunta (canAskAgain=false) → 'sin_permiso_ajustes'
 *     (la pantalla abre los Ajustes del sistema)
 *   · permiso APROXIMADO (Android coarse / iOS reduced) → 'aproximado'
 *     PERSISTENTE mientras captura (la app no finge track fino)
 *
 * Chip de estados: inactivo · iniciando · activo · aproximado ·
 * sin_permiso · sin_permiso_ajustes · sin_senal · no_disponible · error.
 *
 * DEV: EXPO_PUBLIC_GPS_FAKE=1 simula una caminata (browser/emulador).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { registrarTrackPaseo, type PuntoGpsPaseo } from '@epetplace/api';

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

const INTERVALO_MS = 5_000;
const MAX_BUFFER = 12;
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
  /** Vacía el buffer y devuelve el total real del server + pendientes. */
  flushFinal: () => Promise<ResultadoFlushFinal>;
  /** Re-pide el permiso / re-arranca el watcher (cards de estado). */
  reintentarPermiso: () => void;
}

export function useTrackGps(eventoAtencionId: string, puntosIniciales: number): UseTrackGps {
  const [estado, setEstado] = useState<EstadoGps>('iniciando');
  const [puntosTotal, setPuntosTotal] = useState(puntosIniciales);
  const [puntosSesion, setPuntosSesion] = useState<{ lat: number; lng: number }[]>([]);
  const [intento, setIntento] = useState(0);

  const bufferRef = useRef<PuntoGpsPaseo[]>([]);
  const lastTRef = useRef(0);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fakeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushingRef = useRef(false);
  const detenidoRef = useRef(false);
  const totalRef = useRef(puntosIniciales);
  /** S62: con permiso aproximado el estado NO asciende a 'activo' —
   *  la app dice la verdad del fix mientras captura. */
  const aproximadoRef = useRef(false);

  const detener = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (fakeRef.current !== null) clearInterval(fakeRef.current);
    fakeRef.current = null;
  }, []);

  const aceptarPunto = useCallback((lat: number, lng: number) => {
    const ahora = Date.now();
    if (ahora - lastTRef.current < INTERVALO_MS) return;
    lastTRef.current = ahora;
    bufferRef.current.push({ lat, lng, t: new Date(ahora).toISOString() });
    setPuntosSesion((p) => [...p, { lat, lng }]);
    setEstado(aproximadoRef.current ? 'aproximado' : 'activo');
    if (bufferRef.current.length >= MAX_BUFFER) void flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current || bufferRef.current.length === 0) return;
    flushingRef.current = true;
    const lote = bufferRef.current.slice();
    bufferRef.current = [];
    try {
      const r = await registrarTrackPaseo({ evento_atencion_id: eventoAtencionId, puntos: lote, append: true });
      if (r.ok) {
        totalRef.current = r.data.puntos_total;
        setPuntosTotal(r.data.puntos_total);
        return;
      }
      if (r.codigo === 'atencion_no_en_curso' || r.codigo === 'atencion_estado_invalido') {
        detenidoRef.current = true;
        detener();
        setEstado('inactivo');
        return;
      }
      // Transitorio: reinyectar para el próximo flush.
      bufferRef.current = [...lote, ...bufferRef.current];
    } finally {
      flushingRef.current = false;
    }
  }, [eventoAtencionId, detener]);

  const flushFinal = useCallback(async (): Promise<ResultadoFlushFinal> => {
    await flush();
    // S62: lo que quedó en el buffer tras el intento NO llegó a DB —
    // el caller lo declara (jamás cierre silencioso con total viejo).
    return { total: totalRef.current, pendientes: bufferRef.current.length };
  }, [flush]);

  useEffect(() => {
    if (detenidoRef.current) return;
    let cancelado = false;

    async function arrancar() {
      setEstado('iniciando');

      if (FAKE) {
        // Caminata simulada alrededor del Parque La Carolina.
        let paso = 0;
        fakeRef.current = setInterval(() => {
          paso += 1;
          aceptarPunto(-0.185 + Math.sin(paso / 8) * 0.0012, -78.481 + paso * 0.00012);
        }, FAKE_PERIOD_MS);
        intervalRef.current = setInterval(() => void flush(), FLUSH_PERIOD_MS);
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
      try {
        subRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: INTERVALO_MS, distanceInterval: 0 },
          (pos) => aceptarPunto(pos.coords.latitude, pos.coords.longitude),
        );
        intervalRef.current = setInterval(() => void flush(), FLUSH_PERIOD_MS);
        if (aproximadoRef.current) setEstado('aproximado');
        // S62: el "iniciando" eterno muere — sin primer punto en 30s,
        // voz honesta (el watcher sigue: un punto tardío cura el chip).
        timeoutRef.current = setTimeout(() => {
          setEstado((e) => (e === 'iniciando' ? 'sin_senal' : e));
        }, TIMEOUT_PRIMER_PUNTO_MS);
      } catch {
        setEstado('error');
      }
    }

    void arrancar();
    return () => {
      cancelado = true;
      detener();
      // S62: el buffer se flushea al soltar la pantalla — los hasta-11
      // puntos del lote a medio juntar ya no se pierden. Fire-and-forget:
      // el RPC sobrevive al unmount; si además hay un flush EN VUELO,
      // este intento sale vacío y el lote en vuelo sigue su camino
      // (micro-hueco declarado: puntos aceptados DURANTE ese vuelo
      // esperan al próximo montaje o al flush final).
      void flush();
    };
  }, [intento, aceptarPunto, flush, detener]);

  const ultimoPunto = puntosSesion.length > 0 ? puntosSesion[puntosSesion.length - 1] : null;

  return {
    estado,
    puntosTotal,
    ultimoPunto,
    puntosSesion,
    flushFinal,
    reintentarPermiso: () => setIntento((i) => i + 1),
  };
}
