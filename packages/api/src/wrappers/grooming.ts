// LA OFERTA DE GROOMING (S59-B5, sobre la fundación S59-A3).
// Contrato de DB (reporte de estructura de la A, migraciones
// 20260713210000 + 20260713213000):
//   · prestador_servicios: una fila por servicio comprable —
//     tipo_servicio 'grooming' (Baño) / 'grooming_completo' (Baño+corte);
//     especies_compatibles = el recorte del groomer (el techo de
//     plataforma vive en tipos_servicio.especies_elegibles);
//     precio/duracion_minutos quedan como LEGACY/fallback (el server de
//     cobro aún los lee flat) — este wrapper los puentea con la talla M.
//   · prestador_servicio_tallas: la matriz servicio × talla (S/M/L),
//     precio ≥ 0, duración 30–240 en pasos de 15' (CHECKs de DB).
//     RLS pst_own — el wizard escribe DIRECTO.
//   · INVARIANTE: oferta grooming ACTIVA exige exactamente 3 tallas al
//     commit (constraint triggers diferidos). La puerta única NO tiene
//     transacción multi-tabla → el guardado respeta el invariante POR
//     ORDEN: nace inactiva → tallas → recién ahí activo=true. El fallo
//     parcial deja una oferta INACTIVA (invisible a familias por
//     pst_public) y reintentable. La RPC atómica es D-369.
//   · prestadores.grooming_extra_pelaje_largo: UN extra fijo del
//     prestador; NULL honesto = sin extra (policy prestadores_own).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const SERVICIOS_GROOMING = ['grooming', 'grooming_completo'] as const;
export type ServicioGrooming = (typeof SERVICIOS_GROOMING)[number];

export const TALLAS_GROOMING = ['S', 'M', 'L'] as const;
export type TallaGrooming = (typeof TALLAS_GROOMING)[number];

export interface TallaOfertaGrooming {
  id: string;
  talla: TallaGrooming;
  precio: number;
  duracionMinutos: number;
}

export interface OfertaGroomingPropia {
  id: string;
  tipoServicio: ServicioGrooming;
  activo: boolean;
  /** especies_compatibles del groomer (el recorte, dentro del techo). */
  especies: string[];
  /** Las 3 tallas si existen (una oferta jamás guardada puede tener 0). */
  tallas: Partial<Record<TallaGrooming, TallaOfertaGrooming>>;
}

const CODIGOS = ['sin_sesion', 'tallas_incompletas'] as const;
export type CodigoErrorGrooming = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorGrooming | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_sesion:           'No hay sesión activa.',
  tallas_incompletas:   'Para activar el servicio hacen falta las tres tallas con precio y duración.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
};

function esTalla(v: unknown): v is TallaGrooming {
  return v === 'S' || v === 'M' || v === 'L';
}

function esServicioGrooming(v: unknown): v is ServicioGrooming {
  return v === 'grooming' || v === 'grooming_completo';
}

interface FilaTallaCruda {
  id: string;
  talla: string;
  precio: number;
  duracion_minutos: number;
}

function normalizarOferta(fila: {
  id: string;
  tipo_servicio: string;
  activo: boolean;
  especies_compatibles: unknown;
  tallas: FilaTallaCruda[];
}): OfertaGroomingPropia | null {
  if (!esServicioGrooming(fila.tipo_servicio)) return null;
  const tallas: Partial<Record<TallaGrooming, TallaOfertaGrooming>> = {};
  for (const t of fila.tallas) {
    if (!esTalla(t.talla)) continue;
    tallas[t.talla] = { id: t.id, talla: t.talla, precio: t.precio, duracionMinutos: t.duracion_minutos };
  }
  const especies = Array.isArray(fila.especies_compatibles)
    ? fila.especies_compatibles.filter((e): e is string => typeof e === 'string')
    : [];
  return { id: fila.id, tipoServicio: fila.tipo_servicio, activo: fila.activo, especies, tallas };
}

const SELECT_OFERTA =
  'id, tipo_servicio, activo, especies_compatibles, tallas:prestador_servicio_tallas(id, talla, precio, duracion_minutos)';

/** Las ofertas grooming PROPIAS (0, 1 o 2 filas — Baño / Baño+corte). */
export async function obtenerOfertasGroomingPropias(
  prestadorId: string,
): Promise<ResultadoWrapper<OfertaGroomingPropia[], CodigoErrorGrooming>> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select(SELECT_OFERTA)
    .eq('prestador_id', prestadorId)
    .in('tipo_servicio', [...SERVICIOS_GROOMING]);

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  const ofertas = (data ?? []).map(normalizarOferta).filter((o): o is OfertaGroomingPropia => o !== null);
  return { ok: true, data: ofertas };
}

export interface GuardarServicioGroomingInput {
  prestadorId: string;
  tipoServicio: ServicioGrooming;
  /** La fila existente (id) o null si jamás se guardó. */
  ofertaId: string | null;
  activo: boolean;
  especies: string[];
  tallas: Record<TallaGrooming, { precio: number; duracionMinutos: number }>;
}

/**
 * EL GUARDADO DE UN SERVICIO GROOMING — la secuencia que respeta el
 * invariante de DB en cada commit:
 *   1. la fila nace/queda INACTIVA mientras se escriben las tallas
 *      (una oferta inactiva no exige tallas y no se oferta a nadie);
 *   2. upsert de las 3 tallas (UNIQUE servicio+talla);
 *   3. recién ahí activo/especies/legado (precio flat = talla M — el
 *      puente DECLARADO hasta que el cobro lea por talla).
 * Apagar un servicio = solo el paso 3 (las tallas guardadas quedan).
 */
export async function guardarServicioGrooming(
  input: GuardarServicioGroomingInput,
): Promise<ResultadoWrapper<OfertaGroomingPropia, CodigoErrorGrooming>> {
  const client = getClient();
  const m = input.tallas.M;

  // 1) la fila — nace inactiva (el invariante de 3 tallas es solo de activas)
  let ofertaId = input.ofertaId;
  if (ofertaId === null) {
    if (!input.activo) {
      // un servicio jamás guardado que se apaga no deja rastro
      return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
    }
    const { data, error } = await client
      .from('prestador_servicios')
      .insert({
        prestador_id: input.prestadorId,
        tipo_servicio: input.tipoServicio,
        activo: false,
        precio: m.precio,
        duracion_minutos: m.duracionMinutos,
        especies_compatibles: input.especies,
      })
      .select('id')
      .single();
    if (error || data === null) {
      return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
    }
    ofertaId = data.id;
  }

  // 2) las tallas — upsert de las tres (siempre; el precio vive acá)
  const { error: eTallas } = await client.from('prestador_servicio_tallas').upsert(
    TALLAS_GROOMING.map((talla) => ({
      prestador_servicio_id: ofertaId as string,
      talla,
      precio: input.tallas[talla].precio,
      duracion_minutos: input.tallas[talla].duracionMinutos,
    })),
    { onConflict: 'prestador_servicio_id,talla' },
  );
  if (eTallas) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // 3) el estado + especies + el puente legacy (M)
  const { data: fila, error: eUpdate } = await client
    .from('prestador_servicios')
    .update({
      activo: input.activo,
      especies_compatibles: input.especies,
      precio: m.precio,
      duracion_minutos: m.duracionMinutos,
    })
    .eq('id', ofertaId)
    .select(SELECT_OFERTA)
    .single();
  if (eUpdate || fila === null) {
    // 23514 = el constraint trigger de las 3 tallas (no debería alcanzarse
    // desde la UI — el paso 2 las escribe siempre)
    const esInvariante = eUpdate?.code === '23514';
    return {
      ok: false,
      codigo: esInvariante ? 'tallas_incompletas' : 'error_desconocido',
      mensaje: esInvariante ? MENSAJES.tallas_incompletas : MENSAJES.error_desconocido,
    };
  }
  const oferta = normalizarOferta(fila);
  if (oferta === null) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.datos_inconsistentes };
  }
  return { ok: true, data: oferta };
}

/** El extra por pelaje largo del prestador — NULL honesto = sin extra. */
export async function actualizarExtraPelajeLargo(
  prestadorId: string,
  valor: number | null,
): Promise<ResultadoWrapper<{ valor: number | null }, CodigoErrorGrooming>> {
  const { data, error } = await getClient()
    .from('prestadores')
    .update({ grooming_extra_pelaje_largo: valor })
    .eq('id', prestadorId)
    .select('grooming_extra_pelaje_largo')
    .single();
  if (error || data === null) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: { valor: data.grooming_extra_pelaje_largo } };
}
