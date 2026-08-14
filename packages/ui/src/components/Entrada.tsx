/**
 * Entrada — EL PORTADOR de §5 LA ENTRADA (S81-B; la firmada del
 * REGISTRO S80: **120 ms** de escalón · 300 ms · translateY desde 15 ·
 * la física de la casa).
 *
 * ⏪ S97+-B — ESTE HEADER DECÍA «45 ms de escalón» Y LA CONSTANTE DE
 * ABAJO DICE 120 DESDE S81. La enmienda del founder (45 → 120, con su
 * porqué medido) se aplicó en el código y no en la primera línea del
 * archivo, así que **la pieza se contradecía a sí misma**: quien leyera
 * el header —que es lo que se lee— se llevaba el número derogado. Y no
 * se quedó adentro: el 45 volvió a viajar en un contrato de pedido de
 * S97. *La prosa derivada decae mientras el objeto no (L-141), y acá el
 * objeto y su rótulo vivían en el mismo archivo.*
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
/** ⏪ S97+-B · el 300 DEJA DE SER UN LITERAL ACÁ y pasa a salir del token
 *  (`motion.duration.estandar`). MISMO VALOR, cero cambio visual: lo que
 *  cambia es que deja de haber dos lugares donde vive el mismo número.
 *  El porqué: N10 (Norte, 13-ago) declara el vocabulario del movimiento
 *  CERRADO en tres duraciones, y el 300 —que esta pieza llamaba «techo
 *  de Ley 6: INTOCABLE»— era una ley escrita en una constante local. Un
 *  vocabulario cerrado cuyos valores no son tokens lo vuelve a teclear
 *  cada pieza. La condición de la mesa se mantiene INTACTA: el número
 *  sigue siendo PRIVADO para el consumidor (`Entrada` no expone
 *  `duracion` ni `delay`); lo único que cambia es de dónde lo lee. */
const DURACION = motion.duration.estandar // techo de Ley 6 — NO SE TOCA
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
