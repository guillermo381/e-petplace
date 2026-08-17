/**
 * LA GRILLA DE DOS COLUMNAS — el patrón, en CÓDIGO y una sola vez (S100-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y es la advertencia de `Baldosa` cumplida al pie de la
 * letra. Ese archivo dice, literal:
 *
 *   *«No se sincronizan dos copias: se deja UNA. Un patrón repetido no
 *   diverge algún día — diverge la primera vez que alguien cura el otro.»*
 *
 * Cuando `TarjetaProducto` necesitó la misma grilla, había exactamente
 * dos caminos: **copiar el patrón** (y fabricar la segunda copia que esa
 * advertencia existe para evitar) o **sacarlo a código**. Se sacó.
 *
 * ⚠️ Hasta hoy el patrón vivía en un **comentario JSDoc**: ejecutable
 * por copia y verificable por nadie. *Un patrón que solo se puede
 * obedecer copiándolo ya tiene su divergencia agendada.*
 *
 * Vive en un `.ts` sin componente —como `caja-de-campo.ts`, `chevron.ts`
 * y `usePresionado`— porque **no es una pieza: es geometría compartida.**
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LOS NÚMEROS, CON SU HISTORIA (que es lo que los protege) ────────
 * `width: '50%'` · el aire ADENTRO de la celda · **SIN `gap`**.
 * `50 % + 50 % = 100 %` EXACTO en cualquier ancho, sin nada que sumarle.
 *
 * ⏪ **El patrón se equivocó DOS veces y la segunda fue peor** (medido
 * por A en dispositivo, D-804):
 *   · v1 `flexBasis: 47%` + `flexGrow: 1` — entraba por **7 px**, y al
 *     envolver el `flexGrow` estiraba cada celda al 100 % ⇒ ~800 px
 *     apilados.
 *   · v2 `width: '48%'` + gap — **falla SIEMPRE en vez de a veces**:
 *
 *         dos ítems entran ⟺ 2·pct·u + gap ≤ u
 *         48 % ⟺ u ≥ 400  ⇒ 🔴 NINGÚN teléfono
 *
 *     Los cuatro anchos reales envuelven: Android 412 · web 420 ·
 *     Android 360 · **iPhone 430 (por 0,08 px)**.
 *
 * 🔴 **POR QUÉ EL ERROR ES FÁCIL Y NO DESCUIDADO:** ***el `gap` no se ve
 * en el porcentaje.*** `48 + 48 = 96 < 100` invita a concluir que sobra
 * 4 % — y sobra, pero el gap se come 16 px, que en 380 son **4,2 %**.
 * *El porcentaje y el gap están en unidades distintas y la resta se hace
 * en píxeles.*
 *
 * ⇒ La cura no es un tercer porcentaje con más margen: es **sacar el gap
 * de la cuenta**. Un patrón que depende de cuánto sobra no es
 * determinista — es una coincidencia con suerte.
 *
 * ── PENDIENTE DECLARADO, no hecho ──────────────────────────────────
 * **`Baldosa` sigue con el patrón en su comentario y no consume esto.**
 * No se migró acá a propósito: tocarla exige censar sus consumidores, y
 * ese censo es tanda propia. *Se declara para que el próximo que la
 * toque lo cierre, en vez de descubrirlo cuando los dos diverjan.*
 */

import { spacing } from '../tokens/spacing'

/** La CELDA de la grilla: envuelve a la pieza, jamás la pieza a sí misma.
 *  El aire va adentro (ver la cabecera: sin `gap`, la cuenta cierra). */
export const CELDA_DE_GRILLA = {
  width: '50%',
  paddingHorizontal: spacing[2],
  paddingBottom: spacing[4],
} as const

/** El CONTENEDOR. El margen negativo devuelve el padding de los bordes
 *  para que la grilla quede alineada con el resto de la pantalla. */
export const GRILLA_DE_DOS = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -spacing[2],
} as const
