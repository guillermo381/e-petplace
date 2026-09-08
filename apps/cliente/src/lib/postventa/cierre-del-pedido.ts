/**
 * CUÁNDO TERMINÓ UN PEDIDO — el ancla de la ventana de 7 días (§1).
 *
 * 🔴 **No es «cuándo se entregó»: es «cuándo terminó».** La diferencia no es
 * de vocabulario — es que las **dos fallas de clase 1** del catálogo de la
 * letra (`no_entregado` y `cancelado_vendedor`) ocurren sobre pedidos que
 * **jamás se entregaron**. Anclado en la entrega, la puerta se abría para
 * todo menos para los casos en que el motor ya sabe que a la familia le
 * fallaron. *Justo los que la letra resuelve sola.*
 *
 * Las tres narrativas terminales, y de dónde sale la fecha de cada una:
 *
 * | narrativa | ancla | por qué |
 * |---|---|---|
 * | `entregado` | `envio.entregado_en` | el hito real, estampado por el motor |
 * | `no_llego` | `actualizado_en` | no hay hito de entrega: nunca llegó |
 * | `cancelado` | `actualizado_en` | tampoco, y además puede no tener envío |
 *
 * ⚠️ **`actualizado_en` es una APROXIMACIÓN y se dice.** Es la última
 * escritura de la fila, no el instante en que el pedido terminó: cualquier
 * update posterior la corre hacia adelante y **alarga** la ventana.
 *
 * **Se elige a propósito el error que ABRE y no el que cierra.** Si la
 * ventana queda de más, el motor rebota `fuera_de_ventana` —está en el
 * contrato pedido a A— y la familia lee un no con su razón. Si queda de
 * menos, la familia se queda **sin la puerta que la letra le prometió, y de
 * eso no se entera nadie**: no hay error, no hay log, no hay síntoma. *Entre
 * dos aproximaciones, gana la que falla ruidosamente.*
 *
 * **La cura de raíz es de A:** un `cerrado_en` por objeto, servido en
 * `docs/loop/S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`. El día que llegue,
 * este archivo se borra y la pantalla lo lee del detalle.
 */

type PedidoParaCierre = {
  pedido: { narrativa: string };
  envio: { entregado_en: string | null } | null;
};

/** Las que el motor considera terminadas. Las demás siguen en curso. */
const TERMINALES = new Set(['entregado', 'no_llego', 'cancelado']);

export function cierreDelPedido(
  d: PedidoParaCierre & { pedido: { actualizado_en?: string } },
): string | null {
  const { narrativa } = d.pedido;
  if (!TERMINALES.has(narrativa)) return null;

  /* La entrega tiene su hito propio y gana siempre que exista: es un hecho
     del motor, no una inferencia. */
  const entregado = d.envio?.entregado_en ?? null;
  if (entregado !== null) return entregado;

  /* Terminó sin entregarse. Acá vive la aproximación de la cabecera. */
  const actualizado = d.pedido.actualizado_en;
  return typeof actualizado === 'string' && actualizado.length > 0 ? actualizado : null;
}
