/**
 * EntradaDeCruce — LA VENTANA QUE LLEGA, ENTRANDO DEL LADO DEL GESTO
 * (S99-B · consume `cruce.ts`).
 *
 * ═══════════════════════════════════════════════════════════════════
 * Hermana de `Entrada` y con su misma física, pero contesta OTRA
 * pregunta:
 *
 *   · `Entrada` (§5) — **cómo APARECE EL CONTENIDO** de una pantalla:
 *     eje vertical, escalonado, N bloques en orden de lectura.
 *   · `EntradaDeCruce` — **de qué lado LLEGA LA PANTALLA** cuando se
 *     cruzó por una puerta hermana: eje horizontal, UN movimiento, sin
 *     escalón.
 *
 * 🔴 **POR QUÉ NO ES UNA VARIANTE DE `Entrada`, medido y no argumentado:**
 * `Entrada` envuelve CADA bloque. Meterle la dirección haría que **N
 * bloques se desplacen de costado en escalón** — N movimientos donde el
 * gesto fue UNO. *La pantalla cruzó entera; sus partes no cruzaron cada
 * una por su lado.* Y de paso volvería condicional §5, la ley de
 * aparición de toda la casa, por un gesto de navegación.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LA TRAMPA DEL SUSTRATO, Y POR QUÉ ESTA PIEZA NO SE MONTA SOLA ──
 * La tentación era animar **al montar**. **No sirve, y la razón es
 * exactamente la que ya costó dos pérdidas:** D curó el encierro de
 * `/pedidos` moviéndola ADENTRO del navegador de tabs, y **un navegador
 * de tabs CONSERVA sus pantallas montadas**. ⇒ la segunda vez que
 * alguien cruza no hay montaje, y una animación de montaje **no
 * dispararía nunca más**.
 *
 * *Es la misma clase de defecto que la ley del `cruce` vino a matar:
 * apoyarse en un detalle del mecanismo de navegación. Un montaje es un
 * detalle del mecanismo; **volverse visible es un hecho de la pantalla**.*
 *
 * ⇒ **la pieza recibe `activo`** y anima en el flanco `false → true`.
 *
 * **⚠️ Y `activo` NO viola la ley del gesto**, que conviene decirlo
 * porque se parece: la ley prohíbe que **la ventana que llega deduzca LA
 * DIRECCIÓN** —eso depende del sustrato y por eso lo escribe la puerta—.
 * *«¿Soy yo la que se está viendo?»* no es una deducción sobre el
 * sustrato: es un hecho que solo el app puede contestar
 * (`useIsFocused()`), y que se contesta igual con tabs, con stack o con
 * lo que venga.
 *
 * ── LO QUE ANIMA, Y LO QUE DECLARA QUE NO ────────────────────────────
 * **Solo la mitad que LLEGA.** La que se va la reemplaza el navegador y
 * su desmontaje no es nuestro. *Se declara en vez de fingir simetría: lo
 * que el founder perdió fue saber DE QUÉ LADO viene lo nuevo, y eso lo
 * dice entera la mitad que entra.*
 *
 * INTEGRACIÓN (una línea en cada ventana hermana):
 *
 *   import { useIsFocused } from '@react-navigation/native'
 *   <EntradaDeCruce activo={useIsFocused()}>
 *     …el contenido de la pantalla…
 *   </EntradaDeCruce>
 */

import { useEffect, useRef, type ReactNode } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { tomarCruce } from './cruce'

/** Techo de Ley 6 y registro «estándar» de N10. El mismo que `Entrada`:
 *  cruzar no es una ceremonia. */
const DURACION = motion.duration.estandar
/** Cuánto viaja la pantalla. **32 = `spacing[8]`, un escalón de la casa,
 *  no un número elegido.** Es del orden del doble del desplazamiento de
 *  un bloque (`Entrada` viaja 15), y esa proporción es la jerarquía
 *  dicha en píxeles: *la pantalla se mueve más que sus partes.*
 *
 *  ⏪ **Se descartó el barrido de ancho completo**, que era el reflejo:
 *  una pantalla entrando desde el borde deja a la vista el fondo que
 *  vacía —y acá no hay una pantalla saliente que lo tape, porque el
 *  navegador ya la cambió—. *Un barrido a medias se lee como un salto;
 *  un desplazamiento corto con su fundido se lee como dirección.* */
const DESDE_X = spacing[8]
const CURVA = Easing.bezier(...motion.easing.easeOut.bezier)

export interface EntradaDeCruceProps {
  /** ¿Es ésta la ventana que se está viendo? El app lo contesta con
   *  `useIsFocused()`. **Requerida a propósito**: con un default la
   *  pieza tendría que suponer, y suponer acá es volver a colgarse del
   *  sustrato. */
  activo: boolean
  children: ReactNode
}

export function EntradaDeCruce({ activo, children }: EntradaDeCruceProps) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  /** Memorial y reduce-motion comparten brazo, con la doctrina que
   *  `Entrada` ya firmó: **se le quita el VIAJE, no el tiempo.** El
   *  fundido queda; el desplazamiento no. */
  const quieto = theme.mode === 'memorial' || reduceMotion

  const x = useSharedValue(0)
  const opacidad = useSharedValue(1)
  /** El flanco: solo interesa `false → true`. Arranca en el valor de
   *  `activo` para que la ventana que ya estaba visible al abrir la app
   *  **no se anime al montarse** — no hubo cruce. */
  const estabaActivo = useRef(activo)

  useEffect(() => {
    const entra = activo && !estabaActivo.current
    estabaActivo.current = activo
    if (!entra) return

    /* CONSUME la dirección: vale para ESTE cruce y nada más (ver
       `cruce.ts`). `null` = no se llegó por una puerta hermana —un deep
       link, el back del sistema, un cambio de tab a dedo— y entonces
       **no se anima nada**: no hubo gesto que produjera una dirección, y
       inventarle una sería contarle al ojo algo que no pasó. */
    const desde = tomarCruce()
    if (desde === null) return

    opacidad.value = 0
    x.value = quieto ? 0 : desde === 'derecha' ? DESDE_X : -DESDE_X
    opacidad.value = withTiming(1, { duration: DURACION, easing: CURVA })
    if (!quieto) x.value = withTiming(0, { duration: DURACION, easing: CURVA })
  }, [activo, quieto])

  const estilo = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateX: x.value }],
  }))

  return <Animated.View style={[{ flex: 1 }, estilo]}>{children}</Animated.View>
}
