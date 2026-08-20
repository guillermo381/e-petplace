/**
 * S101-B · FASE 3 · EL COBRO — puerta única.
 *
 * 🔴 **SOLO IDS VIAJAN.** El monto lo lee el servidor del desglose congelado.
 *    *Si el monto llegara de acá, la compuerta 2 estaría verificando un número
 *    contra sí mismo.*
 *
 * 🔴 La autorización es **la sesión de la familia** — `functions.invoke` la
 *    lleva sola. Ningún secreto compartido: una app publicada no los guarda.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoCobro =
  | 'sin_sesion' | 'sesion_no_verificable' | 'datos_invalidos'
  | 'monto_no_se_recibe' | 'compra_no_existe' | 'token_ausente'
  | 'desglose_incompleto' | 'rechazado' | 'sin_respuesta'
  | 'no_se_pudo_completar' | 'servidor_sin_configurar';

/** 🔴 Lo que vuelve es **señal optimista**, jamás «pagado». */
export type SenalDeCobro = { senal: 'optimista'; estado: 'confirmando' };

export async function cobrarCompra(
  compraId: string,
  tarjetaId: string,
): Promise<ResultadoWrapper<SenalDeCobro, CodigoCobro>> {
  const { data, error } = await getClient().functions.invoke('pagos-cobro', {
    body: { compra_id: compraId, tarjeta_id: tarjetaId },
  });

  if (error) {
    const d = (data ?? {}) as Record<string, unknown>;
    const codigo = typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar';
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) {
    const codigo = typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar';
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  return { ok: true, data: { senal: 'optimista', estado: 'confirmando' } };
}
