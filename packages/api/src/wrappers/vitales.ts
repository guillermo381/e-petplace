// Vitales del perfil (S53-B2c): los paseos REALES de una mascota con
// su track — el dashboard calcula (domain) sobre datos verdaderos.
// RLS: atencion_select + la policy por mascota de eventos_mascota_paseo
// (S44-B5: el track vive ahí; el resumen server-side trae solo conteo).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos leer sus vitales. Probá de nuevo.';

export interface PaseoConTrack {
  fecha: string;
  duracionMin: number | null;
  puntos: Array<{ lat: number; lng: number }>;
}

// Guard de shape del track (L-124): puntos {lat,lng,t} relevados en
// DB viva S53 — lo que no matchee se descarta, jamás se inventa.
function parsearPuntos(track: unknown): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(track)) return [];
  const puntos: Array<{ lat: number; lng: number }> = [];
  for (const p of track) {
    if (typeof p === 'object' && p !== null) {
      const o = p as Record<string, unknown>;
      if (typeof o.lat === 'number' && typeof o.lng === 'number') {
        puntos.push({ lat: o.lat, lng: o.lng });
      }
    }
  }
  return puntos;
}

export async function obtenerPaseosConTrack(
  mascotaId: string,
): Promise<ResultadoWrapper<PaseoConTrack[], 'error_vitales'>> {
  const cliente = getClient();
  const atenciones = await cliente
    .from('evento_atencion')
    .select('id, iniciada_en, terminada_en, cerrada_en')
    .eq('mascota_id', mascotaId)
    .eq('estado', 'cerrada_con_calidad');
  if (atenciones.error) return { ok: false, codigo: 'error_vitales', mensaje: MENSAJE_ERROR };
  if (atenciones.data.length === 0) return { ok: true, data: [] };

  const tracks = await cliente
    .from('eventos_mascota_paseo')
    .select('evento_atencion_id, track_gps')
    .in('evento_atencion_id', atenciones.data.map((a) => a.id));
  if (tracks.error) return { ok: false, codigo: 'error_vitales', mensaje: MENSAJE_ERROR };

  const trackPorAtencion = new Map(tracks.data.map((t) => [t.evento_atencion_id, t.track_gps]));
  const paseos: PaseoConTrack[] = [];
  for (const a of atenciones.data) {
    const fecha = a.cerrada_en ?? a.terminada_en ?? a.iniciada_en;
    if (fecha === null) continue;
    const duracionMin =
      a.iniciada_en !== null && a.terminada_en !== null
        ? Math.max(0, Math.round((new Date(a.terminada_en).getTime() - new Date(a.iniciada_en).getTime()) / 60000))
        : null;
    paseos.push({ fecha, duracionMin, puntos: parsearPuntos(trackPorAtencion.get(a.id) ?? null) });
  }
  return { ok: true, data: paseos };
}
