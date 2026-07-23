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

// S75-A1 (C1) — NO se duplica el resolvedor: este wrapper CONSUME
// `obtenerMiPrestador` (R1). Hasta S74 resolvía su propio prestador con
// un SELECT por `user_id`, que es exactamente la consulta que R1 acaba
// de enseñar a entender de empleados; dejarla acá habría hecho que el
// empleado viera su negocio en 26 pantallas y siguiera sin comisión en
// el taller. L-150: una sola verdad, jamás dos cabezas del mismo gap.
import { getClient } from '../client';
import { obtenerMiPrestador } from './prestador';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  sin_prestador:        'Tu usuario no tiene un prestador asociado.',
  sin_fee_vigente:      'No hay una comisión vigente configurada.',
  // S75-A1: lo levanta `resolver_fee_aplicable` (gate D-348, S56) cuando el
  // caller no es `cuentas_comerciales.owner_profile_id`. Antes de R1 este
  // camino era INALCANZABLE — solo el titular llegaba hasta acá —, y el
  // resolvedor nuevo lo hizo alcanzable para el empleado. Tiparlo es parte
  // de R1: un camino nuevo no se estrena diciendo "error inesperado"
  // (regla 35 — jamás string matching en la superficie).
  cuenta_ajena:         'La comisión del negocio la ve quien administra la cuenta.',
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
  // Los códigos de R1 (`sin_sesion` / `sin_prestador` / `error_desconocido`)
  // son un SUBCONJUNTO de los de acá: el error viaja tal cual, sin
  // traducción ni string matching (regla 35).
  const propio = await obtenerMiPrestador();
  if (!propio.ok) return falla(propio.codigo);
  const prestador = propio.data;

  const { data, error } = await getClient().rpc('resolver_fee_aplicable', {
    p_cuenta_comercial_id: prestador.cuenta_comercial_id,
    p_tipo_actor: 'prestador_servicios',
    p_country_code: prestador.country_code,
    p_revenue_stream: 'transaccional',
    p_tipo_origen: 'cita',
  });
  // L-115: se normaliza por prefijo, jamás por igualdad — el motor levanta
  // '<codigo>: <detalle>'.
  if (error) {
    return falla(error.message?.startsWith('cuenta_ajena') ? 'cuenta_ajena' : 'error_desconocido');
  }
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
