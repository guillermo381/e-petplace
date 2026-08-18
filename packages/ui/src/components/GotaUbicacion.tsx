/**
 * GotaUbicacion — LA MARCA DEL MAPA, FUERA DEL MAPA (S100d·bis).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **Firma del founder, punto 13 del segundo veredicto:** *«el pin con **borde
 * grueso en ocre**»*, **fuera del mapa, junto a la dirección**.
 * **La pidió la pista A con su caso medido y NO la dibujó de su lado** — una
 * gota suelta pintada en la app sería el segundo dibujo de la misma forma,
 * que es justo lo que `gota.ts` vino a impedir.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ ES PIEZA Y NO UNA PROP DE `Icono` ──────────────────────────
 * `Icono` `ubicacion` **ya es esta gota** y sirve para lo que sirve: **un
 * glifo en línea de texto, a 24 px, dentro de una celda.** Lo que el founder
 * pide es otra cosa: **la marca del mapa con presencia**, con su borde grueso,
 * al lado de la dirección de la ficha de entrega.
 *
 * *Meterle un `grosor` a `Icono` habría dado a TODO el registry una perilla
 * que solo un glifo necesita* — y el registry es la pieza más consumida de la
 * casa. **Acá es una pieza chica con un solo trabajo, y el DIBUJO sigue siendo
 * uno: `GOTA_D`.** Si alguien cambia la silueta, cambian las tres a la vez
 * (glifo · mapa · ésta).
 *
 * ── 🔴 EL ANCLA: ACÁ SE ALINEA POR EL CENTRO, NO POR LA PUNTA ──────────
 * **La pregunta la hizo A y es la correcta.** En el mapa, la punta ES el dato:
 * marca una coordenada, y por eso `PinMovible` la sube con
 * `desplazamientoDePunta`. **Fuera del mapa la punta no marca nada** — al lado
 * de una línea de texto, alinear por la punta deja la gota visualmente alta.
 *
 * ⇒ **Acá se centra como cualquier glifo de fila.** *El mismo dibujo, dos
 * anclas, porque son dos trabajos: en el mapa señala un punto; en una ficha
 * dice «esto es una ubicación».* **Y se escribe para que nadie lo «arregle»
 * aplicando el desplazamiento del mapa por simetría.**
 *
 * ── EL COLOR: N26 v2, Y NO ES UNA EXCEPCIÓN ────────────────────────────
 * Ocre (`accent.cta`). **La primera redacción de N26 decía *«ocre = acción de
 * compra»* y con esa letra esta gota quedaba afuera** — A frenó su montaje y
 * lo devolvió en vez de resolverlo sola. **El founder ensanchó la frontera el
 * mismo día: TODO LO ACCIONABLE ES OCRE**, y la gota **marca aquello sobre lo
 * que se acciona** (la fila de dirección se toca para cambiarla).
 *
 * **Memorial y prestador degradan solos** por el slot: tinta en memorial,
 * tealDark en el prestador. *Ningún color escrito acá.*
 *
 * ── `reduce-motion` y temas ────────────────────────────────────────────
 * **No anima nada** — aparece con su dato y se va con él; no hay qué degradar,
 * y se declara en vez de omitirse (N15). Los tres temas salen de slots.
 */

import Svg, { Circle, Path } from 'react-native-svg'

import { GOTA_D, GOTA_OJO } from './gota'
import { useTheme } from '../ThemeProvider'

/** 28 — la gota al lado de una línea de texto de ficha. Más grande que el
 *  glifo de celda (24) porque acá **es una marca, no una viñeta**, y más chica
 *  que la del mapa (34) porque no tiene que competir con un lienzo. */
const LADO = 28
/** El borde. **Grueso es el pedido literal**, y es lo que la despega del papel
 *  cuando no hay mapa debajo que la contraste. */
const BORDE = 2.5

export interface GotaUbicacionProps {
  /** Default 28. Se pasa solo cuando el renglón obliga. */
  lado?: number
  /**
   * Override del relleno. **Default: el ocre de la acción** (N26 v2). *Se
   * expone porque el día que la gota marque algo que NO se acciona —un
   * histórico, un lugar ya entregado— el ocre mentiría; el resto del tiempo
   * no se pasa.*
   */
  color?: string
}

export function GotaUbicacion({ lado = LADO, color }: GotaUbicacionProps) {
  const { theme } = useTheme()
  const relleno = color ?? theme.accent.cta

  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24">
      {/* EL BORDE GRUESO — el pedido literal. Se dibuja como un trazo del
          MISMO path por debajo del relleno: una sola silueta, jamás dos
          caminos que puedan desalinearse. */}
      <Path d={GOTA_D} fill={relleno} stroke={relleno} strokeWidth={BORDE} strokeLinejoin="round" />
      {/* EL OJO — el hueco claro. Es lo que impide que la gota se lea como una
          mancha: el contorno interno le devuelve la silueta a la forma. */}
      <Circle cx={GOTA_OJO.cx} cy={GOTA_OJO.cy} r={GOTA_OJO.r} fill={theme.bg.card} />
    </Svg>
  )
}
