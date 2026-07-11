// Lectura del ledger propio — S54-B (peldaño 1 de liquidaciones en Negocio,
// DISEÑO_EXPERIENCIA §13 Zona 4: "el que trabaja ve lo que va a cobrar").
// SOLO LECTURA por RLS relevada (owner_select_own_eventos: el owner de la
// cuenta comercial ve sus eventos; cuenta_comercial_id IS NOT NULL).
// Verdad firme (test 8): SOLO estado='pendiente_liquidar' — lo reversado,
// en disputa o ya liquidado no cuenta acá.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion:           'No hay sesión activa.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorEventosEconomicos = 'sin_sesion';

export interface ResumenPendienteLiquidar {
  /** Cantidad de eventos económicos esperando liquidación. 0 = peldaño 0. */
  cantidad: number;
  /** Suma de monto_payout pendiente (lo que el prestador va a cobrar). */
  montoPayout: number;
  /** Moneda de los eventos (una cuenta = un país = una moneda). null sin eventos. */
  moneda: string | null;
}

/** Lo cobrado esperando liquidación, de la cuenta comercial propia. */
export async function obtenerResumenPendienteLiquidar(): Promise<
  ResultadoWrapper<ResumenPendienteLiquidar, CodigoErrorEventosEconomicos>
> {
  const { data: auth } = await getClient().auth.getUser();
  if (!auth.user?.id) {
    return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  }

  const { data, error } = await getClient()
    .from('eventos_economicos')
    .select('monto_payout, moneda')
    .eq('estado', 'pendiente_liquidar');

  if (error) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }

  let montoPayout = 0;
  for (const fila of data) {
    montoPayout += fila.monto_payout ?? 0;
  }

  return {
    ok: true,
    data: {
      cantidad: data.length,
      montoPayout,
      moneda: data.length > 0 ? data[0].moneda : null,
    },
  };
}
