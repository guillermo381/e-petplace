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
  'atencion_no_en_curso',
  'atencion_estado_invalido',
  'via_invalida',
  'categoria_invalida',
] as const;

export type CodigoErrorAtencion = (typeof CODIGOS_ERROR_ATENCION)[number];

const MENSAJES_ERROR_ATENCION: Record<
  CodigoErrorAtencion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:          'No tenés acceso a esta atención.',
  atencion_no_en_curso:     'La atención no está en curso.',
  atencion_estado_invalido: 'El estado de la atención no permite esta acción.',
  via_invalida:             'La vía de captura no es válida.',
  categoria_invalida:       'La categoría no es válida.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Probá de nuevo.',
};

function esCodigoErrorAtencion(v: string): v is CodigoErrorAtencion {
  return (CODIGOS_ERROR_ATENCION as readonly string[]).includes(v);
}

function normalizarCodigo(raw: string): CodigoErrorAtencion | 'error_desconocido' {
  if (raw === 'auth_required' || raw === 'no_access_to_prestador' || raw === 'no_access_to_mascota') {
    return 'acceso_denegado';
  }
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115)
  if (raw.startsWith('atencion_no_en_curso'))     return 'atencion_no_en_curso';
  if (raw.startsWith('atencion_estado_invalido')) return 'atencion_estado_invalido';
  if (raw.startsWith('via_invalida'))             return 'via_invalida';
  if (raw.startsWith('categoria_invalida'))       return 'categoria_invalida';
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
