/**
 * useTrackGps — captura FOREGROUND del recorrido (S44-B4.3).
 *
 * GPS en background es B5 (dev build + permisos always + servicio):
 * acá el track vive mientras la pantalla del Durante está al frente —
 * limitación asumida de F1, documentada.
 *
 * Patrón heredado del relevamiento B0 (repo viejo, useTrackGps):
 *   · punto aceptado cada ≥5s
 *   · flush a DB al juntar 12 puntos o cada 60s (registrarTrackPaseo append)
 *   · error de red → lote reinyectado al buffer
 *   · atencion_no_en_curso → hard-stop silencioso (el server mandó)
 *   · flushFinal() para Terminar (devuelve el total real del server)
 *
 * Chip de 6 estados heredado: inactivo · iniciando · activo ·
 * sin_permiso · no_disponible · error.
 *
 * DEV: EXPO_PUBLIC_GPS_FAKE=1 simula una caminata (browser/emulador).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { registrarTrackPaseo, type PuntoGpsPaseo } from '@epetplace/api';

export type EstadoGps = 'inactivo' | 'iniciando' | 'activo' | 'sin_permiso' | 'no_disponible' | 'error';

const INTERVALO_MS = 5_000;
const MAX_BUFFER = 12;
const FLUSH_PERIOD_MS = 60_000;
const FAKE = __DEV__ && process.env.EXPO_PUBLIC_GPS_FAKE === '1';
const FAKE_PERIOD_MS = 3_000;

export interface UseTrackGps {
  estado: EstadoGps;
  puntosTotal: number;
  ultimoPunto: { lat: number; lng: number } | null;
  puntosSesion: { lat: number; lng: number }[];
  /** Vacía el buffer y devuelve el total real del server. */
  flushFinal: () => Promise<number>;
  /** Re-pide el permiso (card de permiso denegado). */
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
  const fakeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushingRef = useRef(false);
  const detenidoRef = useRef(false);
  const totalRef = useRef(puntosIniciales);

  const detener = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (fakeRef.current !== null) clearInterval(fakeRef.current);
    fakeRef.current = null;
  }, []);

  const aceptarPunto = useCallback((lat: number, lng: number) => {
    const ahora = Date.now();
    if (ahora - lastTRef.current < INTERVALO_MS) return;
    lastTRef.current = ahora;
    bufferRef.current.push({ lat, lng, t: new Date(ahora).toISOString() });
    setPuntosSesion((p) => [...p, { lat, lng }]);
    setEstado('activo');
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

  const flushFinal = useCallback(async () => {
    await flush();
    return totalRef.current;
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
        setEstado('sin_permiso');
        return;
      }
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
      } catch {
        setEstado('error');
      }
    }

    void arrancar();
    return () => {
      cancelado = true;
      detener();
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
