/**
 * usePresionado — LA receta única del pressed físico (D-401, S62).
 *
 * Infra compartida (como HojaScroll/capturaFoto — no cuenta como
 * componente): el estado + los handlers + el estilo de escala que ya
 * vivían clonados en Boton (0.97), Tarjeta (0.99) y SelectorOpcion.
 * Todo tocable que NO sea un componente con pressed propio responde
 * al dedo por esta vía — jamás una receta artesanal por pantalla.
 *
 * Calibres de la casa (S43/S58, receta Software Mansion — CSS
 * transitions de Reanimated, sin worklets):
 *   0.97 → controles (botones, links de acción, íconos tocables)
 *   0.99 → superficies (tarjetas, celdas grandes)
 *
 * Ley 6: <300ms (motion.duration.fast) y spring SOLO como
 * confirmación física — exactamente este caso.
 *
 * Uso (el estilo va en un Animated.View de Reanimated):
 *   const { handlers, estiloPresionado } = usePresionado(0.97)
 *   <Pressable {...handlers} onPress={...}>
 *     <Animated.View style={[estiloPresionado, ...]}>…</Animated.View>
 *   </Pressable>
 */

import { useState } from 'react'
import { cubicBezier } from 'react-native-reanimated'

import { motion } from '../tokens/motion'

export function usePresionado(escala: 0.97 | 0.99 = 0.97) {
  const [presionado, setPresionado] = useState(false)

  return {
    presionado,
    handlers: {
      onPressIn: () => setPresionado(true),
      onPressOut: () => setPresionado(false),
    },
    estiloPresionado: {
      transform: [{ scale: presionado ? escala : 1 }],
      transitionProperty: 'transform' as const,
      transitionDuration: motion.duration.fast,
      transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
    },
  }
}
