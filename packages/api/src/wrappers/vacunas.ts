// Wrappers del carnet de vacunas (S46-B1.1): extracción vía Edge Function
// extract-vacuna (re-targeteada S46, errores tipados por status) +
// escritura atómica vía RPC registrar_vacunas_de_carnet (SECURITY
// INVOKER — la RLS del dueño es la puerta, relevada en S46-B1.0).
// Guards de shape contra el retorno REAL verificado con
// pg_get_functiondef y contra el contrato de la function (L-124).
// SIN UI todavía: la decisión de flujo del founder sigue abierta.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── Extracción (Edge Function extract-vacuna) ────────────────────────────────

/** Ítem extraído del carnet — claves = columnas reales de
 *  evento_vacuna_aplicada. Ilegible = null, jamás '' (contrato S46). */
export interface VacunaExtraida {
  nombre: string;
  /** YYYY-MM-DD o null. */
  fecha_aplicada: string | null;
  /** YYYY-MM-DD o null. */
  fecha_proxima: string | null;
  veterinario_nombre_externo: string | null;
  tipo_vacuna: string | null;
  lote: string | null;
}

export interface InputExtraerVacunas {
  imageBase64: string;
  /** Default de la function: image/jpeg. */
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

const CODIGOS_ERROR_EXTRACCION = [
  'imagen_invalida',
  'configuracion_faltante',
  'error_modelo',
  'extraccion_fallida',
] as const;

export type CodigoErrorExtraccion = (typeof CODIGOS_ERROR_EXTRACCION)[number];

const MENSAJES_EXTRACCION: Record<
  CodigoErrorExtraccion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  imagen_invalida:        'La foto no se pudo procesar. Probá con otra foto del carnet.',
  configuracion_faltante: 'El servicio de lectura no está disponible en este momento.',
  error_modelo:           'No pudimos leer el carnet ahora. Probá de nuevo en un rato.',
  extraccion_fallida:     'No pudimos entender el carnet. Probá con una foto más nítida y completa.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Probá de nuevo.',
};

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function campoTexto(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0);
}

function campoFecha(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && RE_FECHA.test(v));
}

function esVacunaExtraida(v: unknown): v is VacunaExtraida {
  if (!esObj(v)) return false;
  return (
    typeof v.nombre === 'string' && v.nombre.trim().length > 0 &&
    campoFecha(v.fecha_aplicada) &&
    campoFecha(v.fecha_proxima) &&
    campoTexto(v.veterinario_nombre_externo) &&
    campoTexto(v.tipo_vacuna) &&
    campoTexto(v.lote)
  );
}

/** Extrae las vacunas de la foto de un carnet físico. `data: []` es un
 *  resultado honesto (carnet sin filas legibles) — los fallos llegan
 *  siempre como error tipado (regla 36, contrato de la function S46). */
export async function extraerVacunasDeCarnet(
  input: InputExtraerVacunas,
): Promise<ResultadoWrapper<VacunaExtraida[], CodigoErrorExtraccion>> {
  const { data, error } = await getClient().functions.invoke('extract-vacuna', {
    body: { imageBase64: input.imageBase64, mediaType: input.mediaType },
  });

  if (error) {
    // La function responde errores como { codigo, mensaje } con status
    // de error; functions-js los entrega como FunctionsHttpError con la
    // Response sin consumir en .context.
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo: unknown = await error.context.json();
        const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
        if (
          typeof codigo === 'string' &&
          (CODIGOS_ERROR_EXTRACCION as readonly string[]).includes(codigo)
        ) {
          const c = codigo as CodigoErrorExtraccion;
          return { ok: false, codigo: c, mensaje: MENSAJES_EXTRACCION[c] };
        }
      } catch {
        // body no-JSON: cae al error_desconocido de abajo.
      }
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_EXTRACCION.error_desconocido };
  }

  if (!esObj(data) || !Array.isArray(data.vacunas)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
  }
  const vacunas: VacunaExtraida[] = [];
  for (const item of data.vacunas) {
    if (!esVacunaExtraida(item)) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
    }
    vacunas.push({
      nombre: item.nombre,
      fecha_aplicada: item.fecha_aplicada,
      fecha_proxima: item.fecha_proxima,
      veterinario_nombre_externo: item.veterinario_nombre_externo,
      tipo_vacuna: item.tipo_vacuna,
      lote: item.lote,
    });
  }
  return { ok: true, data: vacunas };
}

// ── Escritura (RPC registrar_vacunas_de_carnet) ──────────────────────────────

/** type (no interface): la index signature implícita lo hace asignable a Json. */
export type VacunaCarnetInput = {
  nombre: string;
  fecha_aplicada?: string | null;
  fecha_proxima?: string | null;
  veterinario_nombre_externo?: string | null;
  tipo_vacuna?: string | null;
  lote?: string | null;
  /** Opcional (el output de extracción no la trae); la RPC la valida
   *  contra el CHECK real de la tabla. */
  via_administracion?: string | null;
};

export interface InputRegistrarVacunas {
  mascota_id: string;
  vacunas: VacunaCarnetInput[];
  /** PATH del carnet en el bucket mascotas (carpeta del dueño) — el
   *  MISMO respalda las N filas del lote (D-308, S47-B1.2). Nullable:
   *  la carga sin foto es primera clase. */
  archivo_url?: string | null;
}

export interface ResultadoRegistrarVacunas {
  mascota_id: string;
  insertadas: number;
  ids: string[];
  archivo_url: string | null;
}

const CODIGOS_ERROR_REGISTRO = [
  'acceso_denegado',
  'sin_acceso_mascota',
  'vacunas_vacias',
  'item_invalido',
  'archivo_invalido',
] as const;

export type CodigoErrorRegistroVacunas = (typeof CODIGOS_ERROR_REGISTRO)[number];

/** Error del registro: union espejo de los RAISE + `indice_item`
 *  (1-based) cuando la RPC señaló QUÉ ítem del lote es el inválido —
 *  la pantalla de revisión marca ESA ficha como rechazada (B4). */
export type ErrorRegistrarVacunas = {
  ok: false;
  codigo: CodigoErrorRegistroVacunas | 'error_desconocido' | 'datos_inconsistentes';
  mensaje: string;
  indice_item?: number;
};

export type ResultadoRegistroVacunas =
  | { ok: true; data: ResultadoRegistrarVacunas }
  | ErrorRegistrarVacunas;

const MENSAJES_REGISTRO: Record<
  CodigoErrorRegistroVacunas | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'Tu sesión no está activa. Iniciá sesión de nuevo.',
  sin_acceso_mascota:   'No tenés acceso a esta mascota.',
  vacunas_vacias:       'No hay vacunas para registrar.',
  item_invalido:        'Una de las vacunas del carnet no es válida. Revisá los datos e intentá de nuevo.',
  archivo_invalido:     'La foto del carnet no se pudo vincular. Probá de nuevo.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigoRegistro(raw: string): CodigoErrorRegistroVacunas | 'error_desconocido' {
  if (raw.startsWith('auth_required')) return 'acceso_denegado';
  // 'item_invalido: <índice>: <motivo>' — normalización por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_REGISTRO) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

/** 'item_invalido: <n>: <motivo>' → n (1-based); undefined si no vino. */
function indiceDeItemInvalido(raw: string): number | undefined {
  const m = raw.match(/^item_invalido: (\d+):/);
  return m ? Number(m[1]) : undefined;
}

/** Registra en bloque las vacunas de un carnet. ATÓMICA: una fila mala
 *  = cero filas escritas (asserts S46-B1.1/S47-B1.2). El trigger de la
 *  tabla crea los eventos padre — el timeline las ve solo. */
export async function registrarVacunasDeCarnet(
  input: InputRegistrarVacunas,
): Promise<ResultadoRegistroVacunas> {
  const { data, error } = await getClient().rpc('registrar_vacunas_de_carnet', {
    p_mascota_id:  input.mascota_id,
    p_vacunas:     input.vacunas,
    p_archivo_url: input.archivo_url ?? undefined,
  });

  if (error) {
    const codigo = normalizarCodigoRegistro(error.message);
    const indice = codigo === 'item_invalido' ? indiceDeItemInvalido(error.message) : undefined;
    return {
      ok: false,
      codigo,
      mensaje: MENSAJES_REGISTRO[codigo],
      ...(indice !== undefined ? { indice_item: indice } : null),
    };
  }

  // Shape del retorno REAL (pg_get_functiondef S47-B1.2):
  // { ok: true, mascota_id, insertadas, ids, archivo_url }.
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.mascota_id !== 'string' ||
    typeof data.insertadas !== 'number' ||
    !Array.isArray(data.ids) ||
    (data.archivo_url !== null && typeof data.archivo_url !== 'string')
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_REGISTRO.datos_inconsistentes };
  }
  const ids: string[] = [];
  for (const id of data.ids) {
    if (typeof id !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_REGISTRO.datos_inconsistentes };
    }
    ids.push(id);
  }
  return {
    ok: true,
    data: {
      mascota_id: data.mascota_id,
      insertadas: data.insertadas,
      ids,
      archivo_url: data.archivo_url as string | null,
    },
  };
}

// ── Lectura: la vacuna detrás de un nodo del timeline (S47-B1.2 C) ───────────

export interface VacunaDeEvento {
  id: string;
  nombre_vacuna: string;
  tipo_vacuna: string | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
  veterinario_nombre_externo: string | null;
  lote: string | null;
  /** PATH del carnet en el bucket mascotas, o null (carga sin foto). */
  archivo_url: string | null;
}

const MENSAJE_VACUNA_EVENTO = 'No pudimos cargar la vacuna. Probá de nuevo.';

/** La fila tipada detrás de un evento vacuna_aplicada del timeline.
 *  RLS vacuna_select (user_tiene_acceso_a_mascota) es el guard. */
export async function obtenerVacunaPorEvento(
  eventoId: string,
): Promise<ResultadoWrapper<VacunaDeEvento, 'vacuna_no_encontrada'>> {
  const { data, error } = await getClient()
    .from('evento_vacuna_aplicada')
    .select('id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima, veterinario_nombre_externo, lote, archivo_url')
    .eq('evento_id', eventoId)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJE_VACUNA_EVENTO };
  if (data === null) {
    return { ok: false, codigo: 'vacuna_no_encontrada', mensaje: 'Esta vacuna ya no está disponible.' };
  }
  return {
    ok: true,
    data: {
      id: data.id,
      nombre_vacuna: data.nombre_vacuna,
      tipo_vacuna: data.tipo_vacuna ?? null,
      fecha_aplicada: data.fecha_aplicada ?? null,
      fecha_proxima: data.fecha_proxima ?? null,
      veterinario_nombre_externo: data.veterinario_nombre_externo ?? null,
      lote: data.lote ?? null,
      archivo_url: data.archivo_url ?? null,
    },
  };
}
