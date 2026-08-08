/**
 * LA SEÑAL DE RESERVA — del detalle del prestador de vuelta a su lista.
 *
 * ── POR QUÉ EXISTE, con el nudo medido ──────────────────────────────────
 * La firma manda que «Reservar» viva en el DETALLE. Pero reservar necesita
 * lo que solo la LISTA tiene: el objeto de oferta, las mascotas elegibles,
 * el param de mascota — y abre TRES Hojas (selector, guard social, saldo).
 * Mudar eso al detalle sería clonar el flujo entero: la segunda verdad que
 * diverge sola, que es lo que esta sesión viene evitando en `voz-oficio` y
 * en `FichaPrestador`.
 *
 * ⇒ El detalle NO reserva: PIDE. Vuelve, y la lista —que sigue siendo la
 * única que sabe reservar— ejecuta su propio camino de siempre.
 *
 * ── POR QUÉ NO VIAJA POR PARAMS, que sería lo natural en esta casa ──────
 * El borrador del alta viaja por params y su cabecera explica el porqué
 * (URL-reconstruible, back de Android sin estado global). Acá no se puede:
 * `router.back()` NO acepta params, y volver con `replace` a la lista la
 * RE-MONTA — perdería la fecha, la hora y el scroll que el usuario ya
 * eligió, que es justamente el contexto que venía a mirar y volver.
 *
 * ── QUÉ ES Y QUÉ NO ES ──────────────────────────────────────────────────
 * NO es estado global de la app: es un pedido de UN SOLO USO entre dos
 * pantallas vecinas. Se CONSUME al leerlo —`tomarPedido()` lo borra— así
 * que no puede re-dispararse al volver a enfocar, que es el modo de falla
 * obvio de un flag y la razón de que la lectura sea destructiva.
 */

let pedido: string | null = null;

/** El detalle pide reservar ESTA oferta y vuelve. */
export function pedirReserva(ofertaId: string): void {
  pedido = ofertaId;
}

/** La lista lo toma UNA vez. La segunda llamada devuelve null — un pedido
 *  que sobrevive a su ejecución reservaría dos veces. */
export function tomarPedido(): string | null {
  const p = pedido;
  pedido = null;
  return p;
}
