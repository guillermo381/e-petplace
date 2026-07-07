// ÚNICO wrapper de ejemplo del scaffold (S43-B0): establece el patrón canónico.
// Los demás wrappers migran del repo viejo cuando el flujo que los usa se construya.
// Patrón calcado de e-petplace-prestadores/src/lib/atencion/index.ts (S37):
//   1. codigos de error como const array + type guard (sin string matching libre),
//   2. normalizarCodigo con startsWith para códigos con sufijo ': <detalle>' (L-115),
//   3. guards de shape contra el retorno real de la RPC — verificado contra
//      pg_get_functiondef, nunca calcado de otra familia (L-124),
//   4. ResultadoWrapper como discriminated union.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_ATENCION = [
  'acceso_denegado',
  'atencion_no_existe',
  'atencion_no_en_curso',
  'atencion_estado_invalido',
  'via_invalida',
  'categoria_invalida',
  'texto_required',
  // agregar_incidencia_atencion (S44-B3)
  'incidencia_codigo_invalido',
  'incidencia_codigo_inactivo',
  'severidad_invalida',
  // registrar_archivo_atencion (S44-B3)
  'categoria_archivo_invalida',
  'categoria_archivo_inactiva',
] as const;

export type CodigoErrorAtencion = (typeof CODIGOS_ERROR_ATENCION)[number];

const MENSAJES_ERROR_ATENCION: Record<
  CodigoErrorAtencion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:            'No tenés acceso a esta atención.',
  atencion_no_existe:         'La atención no existe.',
  atencion_no_en_curso:       'La atención no está en curso.',
  atencion_estado_invalido:   'El estado de la atención no permite esta acción.',
  via_invalida:               'La vía de captura no es válida.',
  categoria_invalida:         'La categoría no es válida.',
  texto_required:             'Escribí el texto de la nota.',
  incidencia_codigo_invalido: 'La incidencia elegida no existe en el catálogo.',
  incidencia_codigo_inactivo: 'La incidencia elegida ya no está disponible.',
  severidad_invalida:         'La severidad no es válida.',
  categoria_archivo_invalida: 'La categoría del archivo no es válida.',
  categoria_archivo_inactiva: 'La categoría del archivo ya no está disponible.',
  datos_inconsistentes:       'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:          'Ocurrió un error inesperado. Probá de nuevo.',
};

function esCodigoErrorAtencion(v: string): v is CodigoErrorAtencion {
  return (CODIGOS_ERROR_ATENCION as readonly string[]).includes(v);
}

function normalizarCodigo(raw: string): CodigoErrorAtencion | 'error_desconocido' {
  if (raw === 'auth_required' || raw === 'no_access_to_prestador' || raw === 'no_access_to_mascota') {
    return 'acceso_denegado';
  }
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  // OJO: categoria_archivo_* ANTES que categoria_* (prefijo contenido).
  for (const codigo of CODIGOS_ERROR_ATENCION) {
    if (codigo === 'categoria_invalida') continue;
    if (raw.startsWith(codigo)) return codigo;
  }
  if (raw.startsWith('categoria_invalida')) return 'categoria_invalida';
  if (esCodigoErrorAtencion(raw)) return raw;
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorAtencion> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_ATENCION[codigo] };
}

export interface InputAgregarNota {
  evento_atencion_id: string;
  texto: string;
  via?: 'escrita' | 'dictada';
  categoria?: string;
}

/** Agrega una nota transversal a una atención en curso. Devuelve el id de la nota. */
export async function agregarNotaAtencion(
  input: InputAgregarNota,
): Promise<ResultadoWrapper<string, CodigoErrorAtencion>> {
  const { data, error } = await getClient().rpc('agregar_nota_atencion', {
    p_atencion_id: input.evento_atencion_id,
    p_texto:       input.texto,
    p_via:         input.via       ?? undefined,
    p_categoria:   input.categoria ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (o.ok !== true)            return mapeoErrorAResultado('datos_inconsistentes');
  if (typeof o.id !== 'string') return mapeoErrorAResultado('datos_inconsistentes');
  return { ok: true, data: o.id };
}

export interface InputAgregarIncidencia {
  evento_atencion_id: string;
  /** Código del catálogo de la FAMILIA de la atención (la RPC valida por familia). */
  incidencia_codigo: string;
  descripcion?: string;
  severidad?: 'leve' | 'media' | 'alta';
}

/** Registra una incidencia transversal (atención en curso). Devuelve el id. */
export async function agregarIncidenciaAtencion(
  input: InputAgregarIncidencia,
): Promise<ResultadoWrapper<string, CodigoErrorAtencion>> {
  const { data, error } = await getClient().rpc('agregar_incidencia_atencion', {
    p_atencion_id:       input.evento_atencion_id,
    p_incidencia_codigo: input.incidencia_codigo,
    p_descripcion:       input.descripcion ?? undefined,
    p_severidad:         input.severidad ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (o.ok !== true)            return mapeoErrorAResultado('datos_inconsistentes');
  if (typeof o.id !== 'string') return mapeoErrorAResultado('datos_inconsistentes');
  return { ok: true, data: o.id };
}

export interface InputRegistrarArchivo {
  evento_atencion_id: string;
  bucket: string;
  storage_path: string;
  nombre_archivo?: string;
  /** default de la RPC: 'foto_atencion' (cat_categorias_archivo). */
  categoria?: string;
  descripcion?: string;
  mime_type?: string;
  tamano_bytes?: number;
}

export interface ResultadoRegistrarArchivo {
  id: string;
  /** El HITO del bio-expediente del que cuelga el adjunto. */
  evento_padre_id: string;
}

/** Registra en DB un archivo ya subido a Storage (atención en curso). */
export async function registrarArchivoAtencion(
  input: InputRegistrarArchivo,
): Promise<ResultadoWrapper<ResultadoRegistrarArchivo, CodigoErrorAtencion>> {
  const { data, error } = await getClient().rpc('registrar_archivo_atencion', {
    p_atencion_id:    input.evento_atencion_id,
    p_bucket:         input.bucket,
    p_storage_path:   input.storage_path,
    p_nombre_archivo: input.nombre_archivo ?? undefined,
    p_categoria:      input.categoria ?? undefined,
    p_descripcion:    input.descripcion ?? undefined,
    p_mime_type:      input.mime_type ?? undefined,
    p_tamano_bytes:   input.tamano_bytes ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (o.ok !== true)                         return mapeoErrorAResultado('datos_inconsistentes');
  if (typeof o.id !== 'string')              return mapeoErrorAResultado('datos_inconsistentes');
  if (typeof o.evento_padre_id !== 'string') return mapeoErrorAResultado('datos_inconsistentes');
  return { ok: true, data: { id: o.id, evento_padre_id: o.evento_padre_id } };
}
