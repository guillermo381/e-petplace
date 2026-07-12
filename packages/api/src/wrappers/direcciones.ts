// Wrappers de la dirección del HOGAR (S56-A Tarea 1 — D-339).
// La dirección vive en `direcciones_guardadas` (RLS dir_own: solo-dueño);
// la cita de paseo lleva SNAPSHOT congelado (evento_cita_servicio.
// direccion_snapshot, claves fijas — lo estampa el server al crear el
// hold o al pagar, JAMÁS el cliente). Patrón canónico del monorepo:
// códigos tipados + normalización por prefijo (L-115) + guards de shape
// contra el DDL real de la migración 20260712090000 (L-124).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE del body) ────────────────

const CODIGOS_ERROR_DIRECCION = [
  'acceso_denegado',
  'direccion_requerida',
  'ciudad_requerida',
  'telefono_invalido',
] as const;

export type CodigoErrorDireccion = (typeof CODIGOS_ERROR_DIRECCION)[number];

const MENSAJES_ERROR_DIRECCION: Record<
  CodigoErrorDireccion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'No tenés acceso para hacer esto.',
  direccion_requerida:  'Contanos la dirección de tu hogar.',
  ciudad_requerida:     'Contanos en qué ciudad está tu hogar.',
  telefono_invalido:    'El teléfono no es válido — sin el signo +.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorDireccion | 'error_desconocido' {
  if (raw === 'auth_required') return 'acceso_denegado';
  for (const codigo of CODIGOS_ERROR_DIRECCION) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorDireccion> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_DIRECCION[codigo] };
}

// ── Lectura: la dirección principal del hogar (null honesto sin dato) ───────

export interface DireccionHogar {
  id: string;
  direccion: string;
  ciudad: string;
  sector: string | null;
  referencias: string | null;
  telefono: string | null;
}

/**
 * La dirección principal del hogar del user autenticado, o null honesto
 * si todavía no la contó. La RLS dir_own es la puerta (solo-dueño).
 */
export async function obtenerDireccionHogar(): Promise<
  ResultadoWrapper<DireccionHogar | null, CodigoErrorDireccion>
> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('direcciones_guardadas')
    .select('id, direccion, ciudad, sector, referencias, telefono')
    .eq('es_principal', true)
    .maybeSingle();

  if (error) return mapeoErrorAResultado(error.message);
  if (data === null) return { ok: true, data: null };
  if (typeof data.id !== 'string' || typeof data.direccion !== 'string' || typeof data.ciudad !== 'string') {
    return {
      ok: false,
      codigo: 'datos_inconsistentes',
      mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes,
    };
  }
  return {
    ok: true,
    data: {
      id: data.id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      sector: data.sector ?? null,
      referencias: data.referencias ?? null,
      telefono: data.telefono ?? null,
    },
  };
}

// ── Escritura: upsert de la dirección del hogar (RPC, puerta única) ─────────

export interface GuardarDireccionHogarInput {
  direccion: string;
  ciudad: string;
  sector?: string | null;
  referencias?: string | null;
  /** E.164 SIN '+' (regla 28) — el server rebota telefono_invalido si lo trae. */
  telefono?: string | null;
}

/**
 * Guarda (o actualiza) LA dirección principal del hogar — una sola fila
 * por user (índice parcial uq_direcciones_principal_por_user). Los holds
 * de paseo posteriores nacen con su snapshot; un hold vigente sin
 * dirección la congela al PAGAR (server-side, D-339).
 */
export async function guardarDireccionHogar(
  input: GuardarDireccionHogarInput,
): Promise<ResultadoWrapper<{ direccionId: string }, CodigoErrorDireccion>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('guardar_direccion_hogar', {
    p_direccion: input.direccion,
    p_ciudad: input.ciudad,
    p_sector: input.sector ?? undefined,
    p_referencias: input.referencias ?? undefined,
    p_telefono: input.telefono ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.direccion_id !== 'string') {
    return {
      ok: false,
      codigo: 'datos_inconsistentes',
      mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes,
    };
  }
  return { ok: true, data: { direccionId: o.direccion_id } };
}
