/**
 * 🔴 CUÁNTO SE PUEDE LLEVAR DE VERDAD — el tope, en UN solo lugar (S100d, punto 20).
 *
 * ── EL CASO DEL FOUNDER ───────────────────────────────────────────────────
 * *«pedí 3 y hay 1»*. El pedido llega a la caja y revienta ahí. Su otra mitad
 * —«se agotó»— la caza `hay_stock`, que es **booleano por firma de S99** (*la
 * familia necesita «¿puedo comprar esto?», no el inventario ajeno*) y por eso
 * **no puede** contestar «¿alcanza para 3?». Eso lo contesta el motor con
 * `maximo_comprable_de_ofertas`, que devuelve `LEAST(pedido, disponible)`:
 * **nunca cuánto hay, siempre cuánto podés llevar.**
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN LA PANTALLA NI EN LA PIEZA ───────────────────
 * Medido en S100d: hay **TRES puertas** que suben cantidad y solo una tenía el
 * tope —la ficha, inline—:
 *
 *   · ficha    `producto/[productoId].tsx`  → consultaba y topeaba (S100c)
 *   · vitrina  `despensa/index.tsx:463`     → `fijarCantidad` pelado
 *   · carrito  `carrito.tsx:401`            → `fijarCantidad` pelado
 *
 * **No puede vivir en `packages/ui`**: el dato es una consulta asíncrona al
 * motor, y una pieza presentacional que consulta la base deja de serlo — es la
 * línea que esta casa no cruza. **Y no puede vivir en una pantalla**: curarlo en
 * una lo esconde en esa y lo deja vivo en las otras dos. ⇒ vive en `lib/`, que
 * es de la app y no de la pieza, y las tres pantallas lo montan.
 *
 * La decisión es **PURA y está aparte de la consulta** (`decidirTope`) por la
 * misma razón que `disponibilidad.ts`: para que un instrumento importe **LA
 * función que la pantalla usa**. *Un test que re-escribe la regla adentro mide
 * su propio eco.*
 *
 * ── ⚠️ LEY 13, Y ES LA MITAD QUE SE ROMPE SOLA SI ALGUIEN «SIMPLIFICA» ─────
 * Si la consulta falla, **NO se bloquea**: se agrega lo que la persona pidió y
 * el motor sigue siendo la última palabra. *Un fallo de red no se disfraza de
 * «no hay stock» — eso es inventar una mala noticia, que es peor que darla
 * tarde.* Por eso `sin_medir` es una clase PROPIA y no un alias de `agotado`:
 * el día que alguien las junte, una caída de red le va a decir a la familia que
 * el producto se acabó.
 */

/**
 * ⚠️ `maximo` es lo que devolvió el motor para ESA cantidad pedida, o `null` si
 * no se pudo medir. **Jamás es el stock**: pedir 3 sobre 500 devuelve 3.
 */
export type ResultadoTope =
  /** Entra completo: el motor confirmó que se puede llevar lo pedido. */
  | { clase: 'entra'; cantidad: number }
  /** Se puede, pero menos: hay que decirlo Y ajustar. */
  | { clase: 'acotado'; cantidad: number }
  /** Cero: se agotó entre que se pintó la pantalla y este toque. */
  | { clase: 'agotado' }
  /** No se pudo medir. **Pasa igual** — ver Ley 13 en la cabecera. */
  | { clase: 'sin_medir'; cantidad: number };

export function decidirTope(pedido: number, maximo: number | null): ResultadoTope {
  // Pedir cero o menos no es un caso de stock: es quitar. Quien llama decide
  // qué hacer con eso; acá no se inventa un veredicto de disponibilidad sobre
  // una cantidad que no es una compra.
  if (pedido <= 0) return { clase: 'sin_medir', cantidad: pedido };
  if (maximo === null) return { clase: 'sin_medir', cantidad: pedido };
  if (maximo <= 0) return { clase: 'agotado' };
  if (maximo < pedido) return { clase: 'acotado', cantidad: maximo };
  // `maximo > pedido` no debería existir (el motor devuelve LEAST), pero si
  // llegara, **manda lo pedido**: subirle la cantidad a alguien porque el
  // motor dijo que podría es cambiarle el carrito sin que lo pida.
  return { clase: 'entra', cantidad: pedido };
}
