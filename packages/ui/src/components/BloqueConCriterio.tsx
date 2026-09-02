/**
 * BloqueConCriterio — UN GRUPO QUE VA PRIMERO **DICE POR QUÉ VA PRIMERO** (S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN ORDEN SIN SU CRITERIO A LA VISTA SE LEE COMO UN RANKING.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Nace del bloque «Llevan más tiempo esperando» de `LETRA_ADOPCION` §4 —hoy su
 * único consumidor— pero **el nombre es del mecanismo y no del caso**, porque
 * lo que la pieza defiende no es de adopción: *cualquier lista que alguien
 * ordenó por un criterio tiene que decir cuál, o el lector inventa uno.* Y el
 * que inventa siempre es el mismo: «éstos son los mejores».
 *
 * ── 🔴 `porque` ES OBLIGATORIA, Y ES TODA LA PIEZA ────────────────────────
 * Sin ella esto es un `Texto seccion` con hijos, y no hacía falta un
 * componente. **Con ella, la única defensa del bloque contra leerse como
 * ranking no se puede omitir por olvido.** Es el mismo movimiento con el que
 * `Convivencia` exige la voz de `no_se_sabe` y `voces.sinObservar`: el estado
 * que cuesta caro no depende de que alguien se acuerde.
 *
 * **Va en UNA línea, no en un párrafo** — un párrafo explicativo permanente es
 * candidato a «i» (N22), y acá lo contrario es lo correcto: esto **no** se
 * pliega, porque es lo que hace que el orden se entienda al leerlo. *Lo que
 * hace falta para entender el orden es lo que hace falta para no
 * malinterpretarlo.*
 *
 * ── LO QUE LA PIEZA NO TIENE, Y ES DELIBERADO ─────────────────────────────
 * **Sin contador.** §4 no quiere que la lista se lea como inventario, y
 * S111-C ya quitó el contador de resultados por esa razón. **Sin numeración:**
 * la pieza recibe `children` y no los indexa, así que no puede escribir un
 * 1·2·3 al costado — *un ranking necesita números y acá no hay dónde
 * ponerlos.* **Sin acción propia:** no revela, no colapsa, no ordena. Ordenar
 * y filtrar es del servidor y de la pantalla; esta pieza sólo encabeza.
 *
 * ── ⚠️ SU CONDICIÓN DE USO, DECLARADA POR SU CONSUMIDOR ───────────────────
 * Para adopción, §4 **prohíbe explícito el orden por antigüedad** —*los que
 * más esperan suelen ser los más difíciles, y una primera pantalla de casos
 * duros hace rebotar al que entró a mirar*—. El criterio vive en el SERVIDOR
 * (flag por fila, `destacado_espera`). **Mientras ese flag no exista, este
 * bloque no se monta:** alimentarlo por `creadaEn` sería construir justo lo
 * que la letra no quiere. *La pieza existe lista; su puerta la abre el dato.*
 *
 * ── N21 ───────────────────────────────────────────────────────────────────
 * La pieza **no trae superficie**: sus hijos suelen ser cartas, y una lista
 * cuyos ítems ya son cartas no se anida. El rótulo declara el grupo; la
 * separación la dan las cartas de adentro.
 *
 * El layout es del padre. Sin animación (Ley 6/13).
 */
import { View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'

export type BloqueConCriterioProps = {
  /** El nombre del grupo. Ej.: «Llevan más tiempo esperando». */
  titulo: string
  /**
   * 🔴 OBLIGATORIA — **por qué estos van acá.** Una línea, en voz de la casa.
   * Es lo único que separa a este bloque de un ranking, y por eso no es
   * opcional. Ej.: «Son los que más tiempo llevan esperando un hogar».
   */
  porque: string
  /** Lo que va adentro — normalmente las cartas, ya ordenadas y filtradas. */
  children: React.ReactNode
}

export function BloqueConCriterio({ titulo, porque, children }: BloqueConCriterioProps) {
  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: spacing[1] }}>
        {/* `seccion` trae `accessibilityRole="header"` de fábrica. */}
        <Texto variante="seccion">{titulo}</Texto>
        {/* El criterio va pegado al título y en el registro de apoyo: se lee
            como parte del encabezado, no como una nota suelta que el ojo saltea. */}
        <Texto variante="apoyo">{porque}</Texto>
      </View>
      {children}
    </View>
  )
}
