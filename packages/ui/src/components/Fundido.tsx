/**
 * Fundido — EL CAMBIO QUE NO SE DESLIZA (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * Nace por un pedido de C, con su literal:
 *
 *   > *«el fundido del cambio de modo NO SE MONTA, Y NO ES UN OLVIDO. La
 *   > receta lo pide —un fundido corto, jamás un deslizamiento
 *   > direccional— y la casa **no tiene su portador**: `Entrada` es la
 *   > entrada escalonada CON desplazamiento, o sea justo lo que esa línea
 *   > prohíbe. Y un `FadeIn` a mano rompe el trinquete de §5.»*
 *
 * **C frenó bien.** Usar `Entrada` habría sido peor que no animar, y
 * animar a mano habría abierto la puerta que §5 existe para tener
 * cerrada. *Lo que faltaba era esta pieza, y era mía.*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LA TERCERA DE LA FAMILIA, y las tres contestan preguntas distintas ─
 *   · `Entrada`         — cómo APARECE el contenido de una pantalla.
 *                         Vertical, escalonado, N bloques.
 *   · `EntradaDeCruce`  — de qué lado LLEGA la pantalla. Horizontal, uno.
 *   · `Fundido`         — **lo mismo que ya estaba, siendo otra cosa.**
 *                         Sin eje: no viene de ningún lado porque no se
 *                         movió — CAMBIÓ.
 *
 * 🔴 **Y por eso NO tiene desplazamiento, ni siquiera chico:** un
 * desplazamiento cuenta un viaje, y acá **nada viajó**. La misma ficha
 * pasa de decir una cosa a decir otra. *Moverla sugeriría que llegó de
 * algún lado, que es exactamente la lectura equivocada.*
 *
 * ── LO QUE REEMPLAZA EN EL CONSUMIDOR ──────────────────────────────
 * El `<View key={modo}>` que hoy fuerza el remonte instantáneo. La pieza
 * hace las dos cosas —remonta y funde— así que el consumidor deja de
 * tener que acordarse de la primera:
 *
 *   <Fundido clave={modo}>
 *     …la ficha entera…
 *   </Fundido>
 *
 * ── DOS COSAS QUE DECLARA ──────────────────────────────────────────
 * ① **No anima al montar.** La primera vez no hubo cambio: hubo llegada,
 *    y de eso se ocupa `Entrada`. *Fundir al abrir haría que toda
 *    pantalla que la use parpadee al entrar.*
 * ② **Es un fundido de ENTRADA, no un cruce.** Lo viejo se va con el
 *    remonte; lo nuevo aparece. Un cruce real exigiría mantener las dos
 *    versiones montadas a la vez —una ficha entera duplicada— y **el
 *    corte duro que se está curando dura 150 ms**: no paga.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { motion } from '../tokens/motion'

/** «Un fundido CORTO», literal de la receta ⇒ el registro `micro` de N10,
 *  que es el que la casa reserva para *«chips, crossfade de estado»* —
 *  y un cambio de modo es, exactamente, un crossfade de estado. */
const DURACION = motion.duration.micro
/** El bezier de la casa. **Nace con la letra vigente y no con `easeOut`**:
 *  es la mitad de D-825 que sí me toca — *una pieza nueva no tiene por qué
 *  heredar la deuda de las viejas.* */
const CURVA = Easing.bezier(...motion.marca.aperturaBezier)

export interface FundidoProps {
  /** Qué está mostrando. **Cuando cambia, funde.** Es `string` y no
   *  `unknown` a propósito: un valor comparable por identidad invita a
   *  pasarle un objeto nuevo en cada render, y la pieza fundiría sola. */
  clave: string
  children: ReactNode
}

export function Fundido({ clave, children }: FundidoProps) {
  const opacidad = useSharedValue(1)
  const primera = useRef(true)

  useEffect(() => {
    if (primera.current) {
      primera.current = false
      return
    }
    opacidad.value = 0
    opacidad.value = withTiming(1, { duration: DURACION, easing: CURVA })
  }, [clave])

  const estilo = useAnimatedStyle(() => ({ opacity: opacidad.value }))

  /* ⚠️ **SIN `useReducedMotion`, y es por MEDICIÓN, no por olvido.** R41
     exime a los fundidos puros con su criterio escrito: esta pieza tiene
     **cero `transform`**, y *un fundido puro ya ES aquello a lo que la
     preferencia degrada*. Meterle el hook para saltear el fundido daría
     un corte duro — le devolvería a quien pidió menos movimiento
     exactamente el defecto que esta pieza vino a curar. */
  return (
    <Animated.View key={clave} style={[{ flex: 1 }, estilo]}>
      {children}
    </Animated.View>
  )
}
