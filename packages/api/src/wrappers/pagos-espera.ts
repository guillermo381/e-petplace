/**
 * S101-B · FASE 4 · LEER SI LA COMPRA YA SE CONFIRMÓ.
 *
 * 🔴 **LA FUENTE ES EL SERVIDOR, SIEMPRE.** La respuesta síncrona del débito
 *    fue **señal optimista**; el hecho está acá. *Nadie declara «pagado» desde
 *    la pantalla — lo dice la fila, movida por el webhook o por el barrido.*
 *
 * Lee por RLS (`compras_select`, de la persona): **no hace falta DEFINER** —
 * la familia tiene derecho a mirar su propia compra.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/** Los cinco del CHECK de `compras`, medidos de la migración de S100. */
export type EstadoCompra =
  | 'creada' | 'esperando_pago' | 'pagada' | 'fallida' | 'cancelada';

export type EsperaCompra = {
  estado: EstadoCompra;
  /** `true` cuando ya no tiene sentido seguir mirando. */
  resuelta: boolean;
};

export async function leerEstadoCompra(
  compraId: string,
): Promise<ResultadoWrapper<EsperaCompra, 'compra_no_visible'>> {
  const { data, error } = await getClient()
    .from('compras').select('estado').eq('id', compraId).maybeSingle();

  if (error) return { ok: false, codigo: 'compra_no_visible', mensaje: error.message };
  if (!data) return { ok: false, codigo: 'compra_no_visible', mensaje: 'compra_no_visible' };

  const estado = data.estado as EstadoCompra;
  return {
    ok: true,
    data: {
      estado,
      /* 🔴 `esperando_pago` NO es resuelta: es exactamente el estado en el que
         la espera vive. *Tratarla como final haría que la pantalla dejara de
         mirar justo cuando importa.* */
      resuelta: estado === 'pagada' || estado === 'fallida' || estado === 'cancelada',
    },
  };
}
