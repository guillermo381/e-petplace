// Wrappers del timeline del dueño (S45-B5.1) — lectura de los datos
// que S44 dejó vivos. Shapes en VOZ DE DATOS: el diccionario de voz
// humana vive en LineaDeVida (packages/ui), acá viajan códigos.
// RLS: todo pasa por user_tiene_acceso_a_mascota (tablas) y la policy
// cita_archivos_storage_select_acceso_mascota (objetos, S45-B5.1).
// Readers: mismas claves siempre, null sin dato (L-124).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_TIMELINE = ['acceso_denegado', 'no_encontrado'] as const;

export type CodigoErrorTimeline = (typeof CODIGOS_ERROR_TIMELINE)[number];

const MENSAJES: Record<CodigoErrorTimeline | 'error_desconocido' | 'datos_inconsistentes', string> = {
  acceso_denegado:      'No tenés acceso a esta mascota.',
  no_encontrado:        'No encontramos ese momento.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function fallo<T>(codigo: CodigoErrorTimeline | 'error_desconocido' | 'datos_inconsistentes'): ResultadoWrapper<T, CodigoErrorTimeline> {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** TTL corto de las signed URLs (segundos) — la pantalla refresca al volver. */
const TTL_FOTOS = 300;
const BUCKET_ADJUNTOS = 'cita-archivos';

// ── 4a · timeline ────────────────────────────────────────────────────────────

export interface ItemTimeline {
  evento_id: string;
  /** Código crudo de eventos_mascota.tipo — la voz humana es de LineaDeVida. */
  tipo: string;
  eje_jtbd: string | null;
  fecha_evento: string;
  /** Nombre comercial del prestador (título-fuente) o null. */
  titulo_fuente: string | null;
  /** Solo eventos con atención asociada (minutos, redondeados). */
  duracion_min: number | null;
  atencion_id: string | null;
  fotos_count: number;
  /** Solo tipo=vacuna_aplicada: eventos_mascota.datos->>'vacuna' (lo
   *  escribe el trigger _trg_vacuna_crear_evento) — insumo de la voz
   *  "Recibió la vacuna {nombre}" de LineaDeVida (S47-B1.2 C). */
  vacuna_nombre: string | null;
  /** Evento de FECHA sola (S48-B6.3): su fuente de verdad es un date
   *  sin hora (vacuna del carnet) y el trigger ancla fecha_evento en la
   *  medianoche UTC de ese día SOLO para ordenar. El display muestra el
   *  día calendario (partes UTC) y JAMÁS una hora — sin esto, UTC-5 lo
   *  corre a "un día antes · 19:00". */
  fecha_sola: boolean;
}

export interface PaginaTimeline {
  items: ItemTimeline[];
  /** fecha_evento del último item — pasarlo como cursor de la página siguiente; null = no hay más. */
  siguiente_cursor: string | null;
}

/**
 * Timeline de una mascota, reciente primero, paginado por cursor de
 * fecha_evento. FILTRA cita_servicio: el momento significativo del
 * dueño es la atención, no su cita administrativa (decisión B5.2 —
 * el diccionario de LineaDeVida lo documenta).
 */
export async function leerTimelineMascota(
  mascotaId: string,
  opciones?: { limite?: number; cursor?: string },
): Promise<ResultadoWrapper<PaginaTimeline, CodigoErrorTimeline>> {
  const limite = opciones?.limite ?? 20;

  let q = getClient()
    .from('eventos_mascota')
    .select('id, tipo, eje_jtbd, fecha_evento, prestador_id, datos')
    .eq('mascota_id', mascotaId)
    .eq('soft_delete', false)
    .neq('tipo', 'cita_servicio')
    .order('fecha_evento', { ascending: false })
    .limit(limite);
  if (opciones?.cursor !== undefined) q = q.lt('fecha_evento', opciones.cursor);

  const { data: eventos, error } = await q;
  if (error) return fallo('error_desconocido');
  if (!Array.isArray(eventos)) return fallo('datos_inconsistentes');
  if (eventos.length === 0) return { ok: true, data: { items: [], siguiente_cursor: null } };

  const eventoIds = eventos.map((e) => e.id);
  const prestadorIds = [...new Set(eventos.map((e) => e.prestador_id).filter((p): p is string => p !== null))];

  const [atenciones, adjuntos, prestadores] = await Promise.all([
    getClient()
      .from('evento_atencion')
      .select('id, evento_id, iniciada_en, terminada_en')
      .in('evento_id', eventoIds),
    getClient()
      .from('evento_archivo_adjunto')
      .select('evento_padre_id')
      .in('evento_padre_id', eventoIds),
    prestadorIds.length > 0
      ? getClient().from('prestadores').select('id, nombre_comercial').in('id', prestadorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nombre_comercial: string | null }>, error: null }),
  ]);
  if (atenciones.error || adjuntos.error || prestadores.error) return fallo('error_desconocido');

  const atencionPorEvento = new Map(
    (atenciones.data ?? []).map((a) => [a.evento_id, a]),
  );
  const fotosPorEvento = new Map<string, number>();
  for (const a of adjuntos.data ?? []) {
    if (a.evento_padre_id !== null) {
      fotosPorEvento.set(a.evento_padre_id, (fotosPorEvento.get(a.evento_padre_id) ?? 0) + 1);
    }
  }
  const nombrePrestador = new Map((prestadores.data ?? []).map((p) => [p.id, p.nombre_comercial]));

  const items: ItemTimeline[] = eventos.map((e) => {
    const at = atencionPorEvento.get(e.id);
    let duracion: number | null = null;
    if (at && at.iniciada_en !== null && at.terminada_en !== null) {
      duracion = Math.round(
        (new Date(at.terminada_en).getTime() - new Date(at.iniciada_en).getTime()) / 60000,
      );
    }
    const datos = e.datos as Record<string, unknown> | null;
    const vacuna = e.tipo === 'vacuna_aplicada' && datos && typeof datos.vacuna === 'string' ? datos.vacuna : null;
    return {
      evento_id: e.id,
      tipo: e.tipo,
      eje_jtbd: e.eje_jtbd ?? null,
      fecha_evento: e.fecha_evento,
      titulo_fuente: (e.prestador_id !== null ? nombrePrestador.get(e.prestador_id) : null) ?? null,
      duracion_min: duracion,
      atencion_id: at?.id ?? null,
      fotos_count: fotosPorEvento.get(e.id) ?? 0,
      vacuna_nombre: vacuna,
      // La vacuna es fecha-sola POR TIPO (el carnet registra días, no
      // momentos). Si nace otro tipo fecha-sola, la precisión pasa al
      // modelo (eventos_mascota) — D-312.
      fecha_sola: e.tipo === 'vacuna_aplicada',
    };
  });

  return {
    ok: true,
    data: {
      items,
      siguiente_cursor: eventos.length === limite ? eventos[eventos.length - 1].fecha_evento : null,
    },
  };
}

// ── 4b · fotos de un evento ──────────────────────────────────────────────────

export interface FotoDeEvento {
  id: string;
  nombre_archivo: string | null;
  /** Signed URL (TTL corto) — legible por la policy S45-B5.1. */
  url: string;
}

export async function obtenerFotosDeEvento(
  eventoId: string,
): Promise<ResultadoWrapper<FotoDeEvento[], CodigoErrorTimeline>> {
  const { data, error } = await getClient()
    .from('evento_archivo_adjunto')
    .select('id, nombre_archivo, bucket, storage_path, orden')
    .eq('evento_padre_id', eventoId)
    .order('orden', { ascending: true });
  if (error) return fallo('error_desconocido');
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  if (data.length === 0) return { ok: true, data: [] };

  const paths = data.map((a) => a.storage_path);
  const firmadas = await getClient().storage.from(BUCKET_ADJUNTOS).createSignedUrls(paths, TTL_FOTOS);
  if (firmadas.error) return fallo('acceso_denegado');

  const urlPorPath = new Map((firmadas.data ?? []).map((f) => [f.path, f.signedUrl]));
  const fotos: FotoDeEvento[] = [];
  for (const a of data) {
    const url = urlPorPath.get(a.storage_path);
    if (typeof url === 'string' && url.length > 0) {
      fotos.push({ id: a.id, nombre_archivo: a.nombre_archivo ?? null, url });
    }
  }
  return { ok: true, data: fotos };
}

// ── 4c · detalle de una atención ─────────────────────────────────────────────

export interface NovedadDeAtencion {
  novedad_codigo: string;
  detalle: string | null;
  created_at: string;
}

export interface PuntoTrack {
  lat: number;
  lng: number;
  ts?: string;
}

export interface DetalleAtencion {
  atencion_id: string;
  evento_id: string | null;
  estado: string;
  iniciada_en: string | null;
  terminada_en: string | null;
  cerrada_en: string | null;
  mensaje_familia: string | null;
  titulo_fuente: string | null;
  gps_estado: string | null;
  track_gps: PuntoTrack[];
  novedades: NovedadDeAtencion[];
  fotos: FotoDeEvento[];
}

export async function leerDetalleAtencion(
  atencionId: string,
): Promise<ResultadoWrapper<DetalleAtencion, CodigoErrorTimeline>> {
  const { data: at, error } = await getClient()
    .from('evento_atencion')
    .select('id, evento_id, estado, iniciada_en, terminada_en, cerrada_en, mensaje_familia, prestador_id')
    .eq('id', atencionId)
    .maybeSingle();
  if (error) return fallo('error_desconocido');
  if (at === null) return fallo('no_encontrado');

  const [paseo, prestador, fotos] = await Promise.all([
    getClient()
      .from('eventos_mascota_paseo')
      .select('id, gps_estado, track_gps')
      .eq('evento_atencion_id', atencionId)
      .maybeSingle(),
    at.prestador_id !== null
      ? getClient().from('prestadores').select('nombre_comercial').eq('id', at.prestador_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    at.evento_id !== null
      ? obtenerFotosDeEvento(at.evento_id)
      : Promise.resolve({ ok: true as const, data: [] as FotoDeEvento[] }),
  ]);
  if (paseo.error) return fallo('error_desconocido');

  let novedades: NovedadDeAtencion[] = [];
  if (paseo.data !== null) {
    const r = await getClient()
      .from('evento_paseo_novedades')
      .select('novedad_codigo, detalle, created_at')
      .eq('paseo_id', paseo.data.id)
      .order('created_at', { ascending: true });
    if (r.error) return fallo('error_desconocido');
    novedades = (r.data ?? []).map((n) => ({
      novedad_codigo: n.novedad_codigo,
      detalle: n.detalle ?? null,
      created_at: n.created_at,
    }));
  }

  // track_gps es jsonb [[lat,lng,ts]...] o [{lat,lng,ts}...] según registrador —
  // normalizamos al shape de MapaRecorrido con guard, sin as ciego.
  const track: PuntoTrack[] = [];
  const crudo = paseo.data?.track_gps;
  if (Array.isArray(crudo)) {
    for (const p of crudo) {
      if (p !== null && typeof p === 'object' && !Array.isArray(p)) {
        const o = p as Record<string, unknown>;
        if (typeof o.lat === 'number' && typeof o.lng === 'number') {
          track.push({ lat: o.lat, lng: o.lng, ...(typeof o.ts === 'string' ? { ts: o.ts } : null) });
        }
      }
    }
  }

  return {
    ok: true,
    data: {
      atencion_id: at.id,
      evento_id: at.evento_id ?? null,
      estado: at.estado,
      iniciada_en: at.iniciada_en ?? null,
      terminada_en: at.terminada_en ?? null,
      cerrada_en: at.cerrada_en ?? null,
      mensaje_familia: at.mensaje_familia ?? null,
      titulo_fuente: prestador.data?.nombre_comercial ?? null,
      gps_estado: paseo.data?.gps_estado ?? null,
      track_gps: track,
      novedades,
      fotos: fotos.ok ? fotos.data : [],
    },
  };
}
