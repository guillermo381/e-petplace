// Comisión vigente sobre la cita — S56-B (TAREA 4; MODELO_FINANCIERO v2.6,
// regla transversal de 7.15: toda superficie donde el prestador pone precio
// muestra el NETO con el fee LEÍDO de fee_configs, jamás hardcodeado).
//
// Puerta segura relevada contra DB viva (S56-B): resolver_fee_aplicable —
// SECURITY DEFINER STABLE con EXECUTE a authenticated; el MISMO resolver
// que usa el motor (confirmar_cita_pagada) para pre-validar el fee. La RLS
// de fee_configs solo deja leer los fees PROPIOS de la cuenta; los defaults
// de plataforma (cuenta_comercial_id NULL) son invisibles por tabla — por
// eso la lectura va por el resolver y no por SELECT directo.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  sin_prestador:        'Tu usuario no tiene un prestador asociado.',
  sin_fee_vigente:      'No hay una comisión vigente configurada.',
  fee_no_porcentual:    'La comisión vigente no es un porcentaje simple.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorFees = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorFees; mensaje: string };
function falla(codigo: CodigoErrorFees): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface ComisionVigenteCita {
  /** Porcentaje que retiene e-PetPlace sobre el precio de la cita (0-100). */
  porcentaje: number;
  /** true = fee default de plataforma; false = fee negociado de la cuenta. */
  esDefault: boolean;
}

/**
 * La comisión vigente que se aplicará a las citas del prestador propio.
 * F1: el fee de cita es porcentual (seed {pct: 15}); si el vigente no es
 * porcentual, error tipado — la superficie muestra su voz honesta, jamás
 * un número inventado (regla 36).
 */
export async function obtenerComisionVigenteCita(): Promise<
  ResultadoWrapper<ComisionVigenteCita, CodigoErrorFees>
> {
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return falla('sin_sesion');

  const { data: prestador, error: errPrestador } = await getClient()
    .from('prestadores')
    .select('cuenta_comercial_id, country_code')
    .eq('user_id', uid)
    .maybeSingle();
  if (errPrestador) return falla('error_desconocido');
  if (prestador === null) return falla('sin_prestador');

  const { data, error } = await getClient().rpc('resolver_fee_aplicable', {
    p_cuenta_comercial_id: prestador.cuenta_comercial_id,
    p_tipo_actor: 'prestador_servicios',
    p_country_code: prestador.country_code,
    p_revenue_stream: 'transaccional',
    p_tipo_origen: 'cita',
  });
  if (error) return falla('error_desconocido');
  if (!Array.isArray(data)) return falla('datos_inconsistentes');
  if (data.length === 0) return falla('sin_fee_vigente');

  const fee = data[0];
  if (fee.tipo_calculo !== 'porcentual') return falla('fee_no_porcentual');

  const params = fee.parametros;
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    return falla('datos_inconsistentes');
  }
  const pct = params['pct'];
  if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 0 || pct >= 100) {
    return falla('datos_inconsistentes');
  }

  return { ok: true, data: { porcentaje: pct, esDefault: fee.es_default === true } };
}
