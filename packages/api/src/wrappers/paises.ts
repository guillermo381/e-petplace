// Países activos con su NOMBRE (S58-B, curas del gate) — la voz humana
// para agrupar catálogos por país (zonas del taller: la Hoja "Otra
// ciudad" jamás muestra un código de motor, Ley 3/17.2). Puerta única
// sobre la RPC pública pre-login `get_paises_activos` (familia L-140:
// EXECUTE público intacto por decisión — es catálogo de arranque).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_PAISES = ['error_desconocido'] as const;
export type CodigoErrorPaises = (typeof CODIGOS_ERROR_PAISES)[number];

const MENSAJES: Record<CodigoErrorPaises, string> = {
  error_desconocido: 'No pudimos cargar los países. Prueba de nuevo.',
};

export interface PaisActivo {
  codigo: string; // iso2 — la key de agrupación (country_code de la casa)
  nombre: string;
}

export async function obtenerPaisesActivos(): Promise<ResultadoWrapper<PaisActivo[], CodigoErrorPaises>> {
  const { data, error } = await getClient().rpc('get_paises_activos');
  if (error || !Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const paises: PaisActivo[] = [];
  for (const fila of data) {
    if (typeof fila?.codigo_iso2 === 'string' && typeof fila?.nombre === 'string') {
      paises.push({ codigo: fila.codigo_iso2, nombre: fila.nombre });
    }
  }
  return { ok: true, data: paises };
}
