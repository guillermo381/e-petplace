/**
 * EL CORREO — una sola validación para toda la casa (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **POR QUÉ NACE, y el caso es real: `karina charry@gmail.com`.**
 *
 * En S105 ese correo —con un espacio en el medio— **entró**, porque el
 * validador de entonces sólo buscaba una `@`. *Un validador que sólo busca `@`
 * no valida un correo: confirma que alguien escribió una arroba.* El correo
 * **murió veinte minutos después en una cola que nadie leía**, así que el
 * defecto no tuvo síntoma del lado de quien lo escribió.
 *
 * ⇒ **CERO ESPACIOS, y forma mínima.** Es lo que esta función existe para
 * garantizar.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ UNA SOLA, y no «alinear las que hay» ──────────────────────────
 * Censo del monorepo: **TRES validaciones, en tres archivos del prestador, y
 * ninguna en `packages/ui`**:
 * ```
 *   ventas/repartidor/[id].tsx   /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *   mostrador/nueva.tsx          /^[^@\s]+@[^@\s]+\.[^@\s]+$/     ← equivalente
 *   cuenta/perfil.tsx            /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/ ← MÁS ESTRICTA
 * ```
 * Las dos primeras coinciden **por copia**, que es la forma más frágil de
 * coincidir; la tercera valida mejor los subdominios. *Alinearlas deja tres
 * cosas que hay que acordarse de mantener iguales; una sola fuente no.* Es la
 * misma forma que la plata: **`L-534` — lo que dura es el invariante «una sola
 * fuente», no el valor del regex.**
 *
 * ── CUÁL GANÓ, Y POR QUÉ ─────────────────────────────────────────────────
 * **La de `perfil.tsx`, la más estricta**: exige al menos un punto en el
 * dominio y **que ningún segmento esté vacío** (`a@b..c` no pasa). Las otras
 * dos aceptan `a@b.` y `a@.b`. *Entre tres que ya viven en producción, gana la
 * que rechaza más — porque el costo de rebotar un correo raro es que la
 * persona lo corrija, y el de aceptarlo es que no le llegue la factura.*
 *
 * ⚠️ **LO QUE ESTA FUNCIÓN NO HACE, declarado:** no dice que el buzón EXISTA.
 * Ningún regex puede. La única prueba de que un correo existe es mandarle algo
 * y que no rebote — *y eso es del motor, no de un campo.*
 */

/** Forma mínima y **cero espacios**. Ver la cabecera para el caso que la funda
 *  y para por qué ésta y no otra de las tres que había. */
const FORMA_DE_CORREO = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/**
 * `true` si el texto tiene forma de correo. **No afirma que el buzón exista.**
 *
 * No hace `trim()` a propósito: un correo con espacios al borde **es** un
 * correo mal escrito, y limpiarlo en silencio esconde el error justo donde
 * esta función existe para mostrarlo. Quien quiera tolerar el pegado con
 * espacios que lo limpie ANTES, a la vista.
 */
export function esCorreoValido(texto: string): boolean {
  return FORMA_DE_CORREO.test(texto)
}
