// Configuración del país (S51-B2.4): services_enabled de country_config
// — la verdad de qué verticales están activas la dice la DB (regla 21),
// jamás un hardcode del front. RLS: country_config_read (público).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar los servicios. Probá de nuevo.';

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
