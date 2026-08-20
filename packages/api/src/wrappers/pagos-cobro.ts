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
  | 'no_se_pudo_completar' | 'servidor_sin_configurar'
  /* Los de COMPUERTA: viajan tal cual desde el 409 del servidor. */
  | 'pago_en_proceso' | 'reserva_vencida' | 'vendedor_no_activo'
  | 'monto_divergente' | 'compra_sin_pedidos';

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
    /* 🔴 `functions.invoke` marca `error` para TODO status no-2xx —incluidos
       nuestros 409, que traen el código tipado en el cuerpo— y en ese caso
       **`data` viene vacío**. Leerlo solo de `data` perdía la causa y dejaba
       todo hablando con la voz genérica.
       *Medido en el aparato: el cobro dijo «no pudimos completar» cuando el
       motor sabía perfectamente qué había pasado. Un error que llega con su
       causa y se dibuja sin ella es peor que uno sin causa: hace creer que no
       la hay.*
       El cuerpo viaja en `error.context`, que es la Response. */
    let codigo = 'no_se_pudo_completar';
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof (ctx as Response).text === 'function') {
      try {
        const cuerpo = await (ctx as Response).clone().text();
        const j = JSON.parse(cuerpo) as Record<string, unknown>;
        if (typeof j.codigo === 'string') codigo = j.codigo;
      } catch { /* si no se puede leer, queda la voz genérica */ }
    }
    const d = (data ?? {}) as Record<string, unknown>;
    if (codigo === 'no_se_pudo_completar' && typeof d.codigo === 'string') codigo = d.codigo;
    /* 🔴 INSTRUMENTO — patrón `stoken_de` de S101-A: que el PRÓXIMO intento
       PRODUZCA el dato en vez de dejarnos hipotetizando. Sin logs de Edge
       Function por CLI, esta línea es la única forma de saber en qué punto
       cortó. **Solo el código y el status: ningún dato de la compra ni de la
       tarjeta.** Se retira cuando la causa esté identificada. */
    const st = (ctx as Response | undefined)?.status ?? '-';
    console.log(`[cobro] codigo=${codigo} http=${st} msg=${(error as Error).message ?? '-'}`);
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.ok !== true) {
    const codigo = typeof d.codigo === 'string' ? d.codigo : 'no_se_pudo_completar';
    return { ok: false, codigo: codigo as CodigoCobro, mensaje: codigo };
  }
  return { ok: true, data: { senal: 'optimista', estado: 'confirmando' } };
}
