// Configuración del país (S51-B2.4): services_enabled de country_config
// — la verdad de qué verticales están activas la dice la DB (regla 21),
// jamás un hardcode del front. RLS: country_config_read (público).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar los servicios. Prueba de nuevo.';

export interface ServiciosPais {
  walking: boolean;
  grooming: boolean;
  veterinary: boolean;
  training: boolean;
  telemedicine: boolean;
  adoption: boolean;
  hotel: boolean;
  insurance: boolean;
  prime: boolean;
}

// Guard de shape del jsonb (L-124): claves faltantes = false honesto
// (un servicio que la config no declara NO está activo).
function leerBandera(o: Record<string, unknown>, clave: string): boolean {
  return o[clave] === true;
}

export async function obtenerServiciosPais(
  countryCode: string,
): Promise<ResultadoWrapper<ServiciosPais, 'error_config_pais'>> {
  const { data, error } = await getClient()
    .from('country_config')
    .select('services_enabled')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_config_pais', mensaje: MENSAJE_ERROR };
  const se = data?.services_enabled;
  if (typeof se !== 'object' || se === null || Array.isArray(se)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_ERROR };
  }
  const o = se as Record<string, unknown>;
  return {
    ok: true,
    data: {
      walking: leerBandera(o, 'walking'),
      grooming: leerBandera(o, 'grooming'),
      veterinary: leerBandera(o, 'veterinary'),
      training: leerBandera(o, 'training'),
      telemedicine: leerBandera(o, 'telemedicine'),
      adoption: leerBandera(o, 'adoption'),
      hotel: leerBandera(o, 'hotel'),
      insurance: leerBandera(o, 'insurance'),
      prime: leerBandera(o, 'prime'),
    },
  };
}

// ── S82-A r15 · LA MONEDA DEL PAÍS — la otra mitad del riel ────────────
//
// El formato vive en `packages/i18n` (`monto`, función pura); LA CONFIG
// vive acá, porque es DATO y el dato lo dice la DB (regla 21). Las tres
// columnas están sembradas en `country_config` desde hace meses y hasta
// hoy **ningún consumidor las leía**: EC = USD `$` 2 · CO = COP `$` 2.
//
// CACHE POR PROCESO, y su porqué: la config de moneda de un país **no
// cambia entre renders** — pedirla en cada fila de precio sería un viaje
// de red por monto pintado. Se cachea por `country_code` (mismo criterio
// que `_cacheEstado` en onboarding.ts). No expira: si algún día cambia
// una moneda, cambia con un deploy, no en caliente.

const _cacheMoneda = new Map<string, ConfigMonedaPais>();

export interface ConfigMonedaPais {
  /** ISO 4217 — 'USD' | 'COP'. */
  codigo: string;
  simbolo: string;
  decimales: number;
}

/** La config de moneda de un país. **Devuelve `ok:false` en vez de
 *  inventar un default**: el llamador decide si cae al fallback del riel
 *  (`MONEDA_FALLBACK`) o si dice que no pudo — un monto pintado con la
 *  moneda equivocada es peor que un monto que no se pinta. */
export async function obtenerConfigMoneda(
  countryCode: string,
): Promise<ResultadoWrapper<ConfigMonedaPais, 'error_config_pais'>> {
  const cacheada = _cacheMoneda.get(countryCode);
  if (cacheada !== undefined) return { ok: true, data: cacheada };

  const { data, error } = await getClient()
    .from('country_config')
    .select('currency_code, currency_symbol, currency_decimals')
    .eq('country_code', countryCode)
    .maybeSingle();

  if (error || data === null) {
    return { ok: false, codigo: 'error_config_pais', mensaje: MENSAJE_ERROR };
  }
  // Guard de shape (L-124): una config incompleta NO se completa a ojo.
  if (
    typeof data.currency_code !== 'string' ||
    typeof data.currency_symbol !== 'string' ||
    typeof data.currency_decimals !== 'number'
  ) {
    return { ok: false, codigo: 'error_config_pais', mensaje: MENSAJE_ERROR };
  }
  const config: ConfigMonedaPais = {
    codigo: data.currency_code,
    simbolo: data.currency_symbol,
    decimales: data.currency_decimals,
  };
  _cacheMoneda.set(countryCode, config);
  return { ok: true, data: config };
}
