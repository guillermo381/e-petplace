/**
 * LAS SUPERFICIES QUE UNA PIEZA COMPARTE CON SU JUEZ — escritas UNA vez
 * (S103-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE, y no es prolijidad: **esta expresión vivía TRES
 * veces** — en `SelectorSegmentado` (donde se pinta) y **dos veces
 * más en `verify-contrast`**, reimplementada a mano en cada par que
 * la necesitaba.
 *
 * **Y eso rompía al gate de la forma más silenciosa que hay: el juez
 * medía su propio eco.** Probado moviendo la pieza y no el gate — con
 * `superficieActiva` cambiada a `accent.marcaEleccion` (o sea, la pata
 * del MISMO color que su fondo: invisible), **el gate siguió VERDE con
 * 388 pares y 0 fallos.** *Un instrumento que reimplementa la fórmula
 * que audita no mide la pieza: mide la copia que él mismo guarda, y esa
 * copia no se mueve cuando la pieza se rompe.*
 *
 * Vive en un `.ts` sin componente —como `caja-de-campo` y `chevron`—
 * por dos razones, y la segunda es la que importa: **no es una pieza,
 * es geometría compartida**, y **sin `react-native` adentro el gate lo
 * puede importar** (un módulo que arrastre RN no corre en Node).
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Theme } from '../themes'

/** El fondo sobre el que se pinta el segmento ELEGIDO.
 *
 *  En claro es una superficie propia (`bg.card`, el blanco que se apoya
 *  sobre el riel hundido). En oscuro y memorial **no hay superficie que
 *  apoyar** y lo que marca es el relleno del borde — precedente del
 *  agarre de la `Hoja`.
 *
 *  ⚠️ **Quien la cambie mueve al gate con ella, y eso es el punto:** los
 *  pares de contraste del segmento (texto y pata) salen de acá, así que
 *  una superficie nueva se mide sola en las cinco casas. */
export const superficieDelSegmentoActivo = (t: Theme): string =>
  t.mode === 'light' ? t.bg.card : t.border.default

/** El fondo del CHIP de `SelectorOpcion` en reposo — la superficie apoyada
 *  que se despega del riel.
 *
 *  🔴 Sube por la MISMA razón y con la misma prueba: el gate tenía esta
 *  expresión copiada como `superficieChip`, y **con `fondoReposo` cambiado
 *  en la pieza el gate seguía VERDE con 388 pares.** *Cuatro pares de
 *  contraste medían una superficie que la pieza ya no pintaba.* */
export const superficieDelChip = (t: Theme): string =>
  t.mode === 'dark' ? t.bg.elevated : t.bg.card
