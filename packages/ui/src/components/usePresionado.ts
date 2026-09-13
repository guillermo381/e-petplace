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
import { cubicBezier, useReducedMotion } from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

export function usePresionado(escala: 0.97 | 0.99 = 0.97) {
  const [presionado, setPresionado] = useState(false)
  const { theme } = useTheme()
  // S63 (letra existente, enmienda de la fuente): en MEMORIAL la física
  // no celebra — el estado pressed se VE (feedback funcional, escala
  // mínima) pero el cambio es REEMPLAZO DIRECTO, sin transición.
  const esMemorial = theme.mode === 'memorial'

  /* 🔴 **S116-B lote 2 · LA PREFERENCIA DEL SISTEMA APAGA LA TRANSICIÓN
   * (firma de la mesa, 13-sep-2026).**
   *
   * Lo señaló la crítica de Impeccable: *«reduced motion is not optional»*.
   * Esta primitiva ya apagaba la transición en **memorial** —un momento del
   * producto— y **nunca miraba la preferencia de la persona**, que es la que
   * de verdad importa: alguien con vestibular disorder no elige el tema, y
   * su sistema ya dijo que no quiere movimiento.
   *
   * **La escala SE CONSERVA en los dos casos.** Reduced motion no es «sin
   * respuesta al toque»: es **sin transición**. El botón sigue hundiéndose;
   * lo que desaparece es la interpolación. *Quitar también la escala dejaría
   * un control que no contesta, que es peor que uno que se mueve.*
   *
   * ⚠️ **Se lee con `useReducedMotion()` de Reanimated y no con el
   * `AccessibilityInfo` de RN**: es el mismo que ya usan `BarraTabs` y las
   * 19 piezas que `R41` vigila — una segunda fuente para la misma
   * preferencia son dos respuestas que pueden diferir. */
  const prefiereMenosMovimiento = useReducedMotion()
  const sinTransicion = esMemorial || prefiereMenosMovimiento

  return {
    presionado,
    handlers: {
      onPressIn: () => setPresionado(true),
      onPressOut: () => setPresionado(false),
    },
    estiloPresionado: {
      transform: [{ scale: presionado ? escala : 1 }],
      ...(sinTransicion
        ? null
        : {
            transitionProperty: 'transform' as const,
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
          }),
    },
  }
}
