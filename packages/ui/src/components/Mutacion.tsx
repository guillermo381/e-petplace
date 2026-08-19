/**
 * Mutacion — LO QUE CAMBIA DE FORMA SIN IRSE (S100d·bis).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **Firma del founder, sobre el objeto que ya lo resolvía:** *«el botón
 * Agregar tiene una microanimación y se transforma en el selector de
 * cantidad; si eliminás, la microanimación es inversa: se transforma en el
 * botón Agregar»*.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LA QUINTA DE LA FAMILIA DEL MOVIMIENTO ─────────────────────────────
 *   · `Entrada`        — cómo APARECE el contenido de una pantalla.
 *   · `EntradaDeCruce` — de qué lado LLEGA la pantalla.
 *   · `Fundido`        — lo mismo que ya estaba, siendo otra cosa.
 *   · `Salida`         — lo que estaba y ya no está.
 *   · **`Mutacion`**   — **lo que sigue estando y cambió de forma.**
 *
 * **Por qué no la cubría `Fundido`, que es la vecina más cercana:** aquélla
 * funde **el mismo elemento** cuando su contenido cambia (*«nada viajó:
 * CAMBIÓ»*), y su contrato es una `clave` de string sobre un solo hijo. **Acá
 * hay DOS piezas distintas** —un botón y un stepper— que se turnan **la misma
 * caja**. *Meterle dos hijos a `Fundido` habría sido cambiarle la pregunta que
 * contesta.*
 *
 * ── 🔴 LA CONDICIÓN QUE LA HACE POSIBLE, Y ES LO QUE HAY QUE MEDIR ANTES ──
 * **LOS DOS ESTADOS OCUPAN EXACTAMENTE LA MISMA CAJA.** Medido en Laika, en
 * el teléfono del founder:
 * ```
 * botón «Agregar» ………………………… 130,8 × 28,8 dp
 * control [🗑] N [+] ………………… 129,0 × 27,4 dp
 * ```
 * ⇒ **Con cajas distintas no hay transformación: hay reemplazo.** *Y esa es la
 * diferencia entre esta cura y las tres anteriores del mismo control: acá la
 * condición se midió en vez de suponerse.*
 *
 * **Por eso el alto es OBLIGATORIO y no se deriva de los hijos:** si la caja
 * la fijara el hijo activo, cambiaría con el estado — que es exactamente el
 * defecto (N24) que este control lleva cuatro iteraciones intentando matar.
 *
 * ── QUÉ HACE, DICHO SIN ADORNO ─────────────────────────────────────────
 * **Un cruce de opacidad dentro de una caja fija**, `micro` (150) en los dos
 * sentidos. ⚠️ **NO es una interpolación de forma** —el botón no se «estira»
 * hasta ser el stepper—, y se dice acá para que nadie lea de más: *las dos
 * piezas se cruzan en el mismo lugar, y es el lugar compartido el que produce
 * la lectura de transformación.*
 *
 * **La inversa es GRATIS y no es una segunda animación:** la pieza se dibuja
 * desde `estado`, así que volver a `'reposo'` corre el mismo cruce al revés.
 * *Una transformación que necesita que alguien programe su vuelta es una
 * transformación que algún día se va a quedar sin vuelta.*
 *
 * ── `reduce-motion` y temas ────────────────────────────────────────────
 * Las animaciones de layout de Reanimated respetan la preferencia del
 * sistema. **Sin animación el control igual cambia** — el movimiento adorna el
 * cambio, no lo produce (N15). **Cero color propio:** la pieza no pinta nada,
 * solo aloja.
 *
 * ── ⚠️ LO QUE NO TIENE OJO ─────────────────────────────────────────────
 * **La microanimación NO SE PUDO MEDIR.** En el aparato cada `screencap` tarda
 * ~400 ms, la transición dura menos, y **no hay `ffmpeg` en esta máquina**:
 * se dispararon seis cuadros seguidos y los seis salieron en el mismo estado.
 * *Lo que se midió es la GEOMETRÍA que la hace posible, no la animación.*
 * **La juzga el ojo del founder — no se da por buena ni por mala.**
 */

import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { motion } from '../tokens/motion'

export interface MutacionProps {
  /** Cuál de las dos formas rige. **La inversa sale sola de acá.** */
  estado: 'reposo' | 'activo'
  /** La forma de reposo — en la vitrina, el botón «Agregar». */
  reposo: ReactNode
  /** La forma activa — en la vitrina, el stepper. */
  activo: ReactNode
  /**
   * 🔴 **OBLIGATORIO, y por eso no tiene default.** Es la caja que las dos
   * formas comparten. *Si la fijara el hijo activo, la caja cambiaría con el
   * estado — el defecto que este control lleva cuatro iteraciones intentando
   * matar.* **Se DERIVA del alto del control** (por ejemplo
   * `ALTO_STEPPER_ANCHO`), jamás se teclea.
   */
  alto: number
}

export function Mutacion({ estado, reposo, activo, alto }: MutacionProps) {
  return (
    <View style={{ height: alto }}>
      {/* Las dos formas se montan en el MISMO rectángulo (`absoluteFill`), que
          es lo que hace que el cruce se lea como una transformación y no como
          dos cosas apareciendo en lugares distintos. La `key` es lo que le
          dice a Reanimated que hubo relevo: sin ella no habría ni entrada ni
          salida, solo un re-render. */}
      {estado === 'reposo' ? (
        <Animated.View
          key="reposo"
          entering={FadeIn.duration(motion.duration.micro)}
          exiting={FadeOut.duration(motion.duration.micro)}
          style={StyleSheet.absoluteFill}
        >
          {reposo}
        </Animated.View>
      ) : (
        <Animated.View
          key="activo"
          entering={FadeIn.duration(motion.duration.micro)}
          exiting={FadeOut.duration(motion.duration.micro)}
          style={StyleSheet.absoluteFill}
        >
          {activo}
        </Animated.View>
      )}
    </View>
  )
}
