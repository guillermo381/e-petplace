/**
 * Entrada — EL PORTADOR de §5 LA ENTRADA (S81-B; la firmada del
 * REGISTRO S80: 45 ms de escalón · 300 ms · translateY desde 15 ·
 * la física de la casa).
 *
 * LA CONDICIÓN DE LA MESA (patrón FilaCita): la pantalla declara QUE
 * entra y su ORDEN DE LECTURA — **JAMÁS los números**. Duración,
 * escalón, desplazamiento y curva viven ACÁ y ninguna pantalla puede
 * romper la ley: si este componente expusiera `duracion` o `delay`,
 * estaría mal hecho.
 *
 * L-c MANDA (el criterio de uso, en el JSDoc porque es exigible): la
 * entrada escalonada existe para que el ojo sepa POR DÓNDE EMPEZAR A
 * LEER. **Si al quitarla la pantalla dice lo mismo, sobraba** — no se
 * monta por decoración. `orden` es posición en la LECTURA (0 = lo
 * primero que el ojo debe encontrar), no un slot libre.
 *
 * Memorial degrada (Ley 8: nada se mueve, solo fades): fade puro, sin
 * desplazamiento, mismo tempo. Ley 6 intacta: 300 ms ≤ el techo de UI,
 * curva easeOut de la casa (entradas), jamás rebote.
 *
 * Uso:
 *   <Entrada><Titulo/></Entrada>
 *   <Entrada orden={1}><Cuerpo/></Entrada>
 *   <Entrada orden={2}><Cta/></Entrada>
 */

import type { ReactNode } from 'react'
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

// Los números de la ley — PRIVADOS a propósito (la condición de la mesa).
const DURACION = 300 // techo de Ley 6 — NO SE TOCA
const DESDE_Y = 15
const CURVA = Easing.bezier(...motion.easing.easeOut.bezier)
/** ESCALÓN 120 — FIRMADO (S81, orden de mesa "sin gate"): §5 pasa de
 *  45 a 120 (motion.stagger.slow, token de la casa). El porqué quedó
 *  medido: con 45, tres bloques resuelven en ~390 ms — por debajo del
 *  umbral en que el ojo separa secuencia de simultaneidad ("hay un
 *  orden pero no lo cacho", founder). La LETRA de §5 la enmienda A con
 *  la firma. La duración 300 es techo de Ley 6: INTOCABLE. */
const ESCALON = motion.stagger.slow

export interface EntradaProps {
  /** Posición en el ORDEN DE LECTURA (0 = lo primero). Semántica, no física. */
  orden?: number
  children: ReactNode
}

export function Entrada({ orden = 0, children }: EntradaProps) {
  const { theme } = useTheme()

  const entering =
    theme.mode === 'memorial'
      ? FadeIn.duration(DURACION).delay(orden * ESCALON).easing(CURVA)
      : FadeInDown.duration(DURACION)
          .delay(orden * ESCALON)
          .easing(CURVA)
          .withInitialValues({ opacity: 0, transform: [{ translateY: DESDE_Y }] })

  return <Animated.View entering={entering}>{children}</Animated.View>
}
