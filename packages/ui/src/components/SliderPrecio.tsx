/**
 * SliderPrecio — selector de PASOS DISCRETOS para precio (S58, Ley 11;
 * componente 31 — pedido de depósito, la B lo consume en "el arte del
 * paseo"). La pantalla es dueña del valor: acá vive el riel, los pasos
 * y la física del thumb.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es un slider continuo (los pasos son DISCRETOS — el
 * precio del oficio se elige entre valores reales, jamás interpolado),
 * no porta el display del valor (voz de la pantalla), no valida rangos
 * (el server es el juez). Presentacional puro.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía: riel hundido (bg.overlay) con puntos por paso + tramo
 * recorrido en el ACENTO POR REGISTRO (patrón Icono §2.7: 'capa' hex
 * puro dueño · 'aa' funcional · 'tinta' cuando la vista ya porta su
 * acento) + THUMB apoyado (bg.card + elevacion.reposo — regla Chanel:
 * sombra, jamás borde). El thumb se desliza y la sombra viaja con él
 * (Ley 6); memorial: reemplazo directo y acento degradado adentro.
 *
 * `onStep`: hook de CADA cruce de paso — v1 VACÍO en los consumidores
 * (la háptica futura entra sin refactor; SIN expo-haptics en v1,
 * sujeto a decisión founder — L-134: cero deps nativas nuevas).
 *
 * A11y: adjustable con increment/decrement y accessibilityValue con la
 * etiqueta del paso — el gesto y el lector cuentan la misma historia.
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { useState } from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { cubicBezier } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import type { IconoRegistro } from './Icono'

const ALTO_RIEL = 4
const THUMB = 28      // target táctil real: el detector cubre alto 44
const PUNTO = 6

export interface SliderPrecioProps {
  /** Los pasos DISCRETOS ya formateados en voz de la pantalla
   *  (ej. "$5.00" · "$7.50" · "$10.00"). Mínimo 2. */
  pasos: string[]
  /** Índice del paso elegido. La pantalla es dueña del valor. */
  indice: number
  onCambio: (indice: number) => void
  /** Se dispara en CADA cruce de paso durante el arrastre — hook de la
   *  háptica futura. v1: dejarlo vacío. */
  onStep?: (indice: number) => void
  /** accessibilityLabel del control (el label visible es de la pantalla). */
  etiqueta: string
  /** Acento del tramo recorrido (§2.7): 'capa' (default dueño) ·
   *  'aa' · 'tinta' (la vista ya porta su acento). */
  registro?: IconoRegistro
}

export function SliderPrecio({ pasos, indice, onCambio, onStep, etiqueta, registro = 'capa' }: SliderPrecioProps) {
  const { theme } = useTheme()
  const [ancho, setAncho] = useState(0)

  if (__DEV__ && pasos.length < 2) {
    console.warn(`SliderPrecio: ${pasos.length} paso(s) — un slider de menos de 2 pasos no es un slider.`)
  }

  const n = Math.max(pasos.length, 2)
  const idx = Math.min(Math.max(indice, 0), n - 1)
  const esMemorial = theme.mode === 'memorial'

  // Acento por registro — memorial degrada adentro (patrón Icono §2.8).
  // Capturado ANTES del branch: el narrowing de `in` no sobrevive closures.
  const capaAA = 'capaText' in theme ? theme.capaText.cuidado : theme.capa.cuidado
  const acento = esMemorial
    ? theme.text.secondary
    : registro === 'tinta'
      ? theme.text.primary
      : registro === 'aa'
        ? capaAA
        : theme.capa.cuidado

  const util = Math.max(ancho - THUMB, 0)
  const paso = n > 1 ? util / (n - 1) : 0
  const x = idx * paso

  const irA = (i: number) => {
    const destino = Math.min(Math.max(i, 0), n - 1)
    if (destino !== idx) {
      onCambio(destino)
      onStep?.(destino)
    }
  }

  // Índice desde la posición del toque (centro del thumb = x - THUMB/2)
  const indiceDesdeX = (px: number) => (paso > 0 ? Math.round((px - THUMB / 2) / paso) : 0)

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      scheduleOnRN(irA, indiceDesdeX(e.x))
    })
    .onUpdate((e) => {
      scheduleOnRN(irA, indiceDesdeX(e.x))
    })

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={etiqueta}
        accessibilityValue={{ min: 0, max: n - 1, now: idx, text: pasos[idx] ?? '' }}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') irA(idx + 1)
          if (e.nativeEvent.actionName === 'decrement') irA(idx - 1)
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        style={{ height: 44, justifyContent: 'center' }}
      >
        {/* riel hundido con el tramo recorrido en el acento */}
        <View style={{ height: ALTO_RIEL, borderRadius: radius.full, backgroundColor: theme.bg.overlay, marginHorizontal: THUMB / 2 }}>
          <View style={{ height: ALTO_RIEL, borderRadius: radius.full, backgroundColor: acento, width: paso > 0 ? x : 0 }} />
          {/* puntos de paso — el control DICE que es discreto */}
          {pasos.map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: i * paso - PUNTO / 2,
                top: (ALTO_RIEL - PUNTO) / 2,
                width: PUNTO,
                height: PUNTO,
                borderRadius: radius.full,
                backgroundColor: i <= idx ? acento : theme.bg.border,
              }}
            />
          ))}
        </View>

        {/* thumb apoyado — elevacion.reposo, sin borde (Chanel); se
            desliza la superficie y la sombra viaja (Ley 6); memorial:
            reemplazo directo */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: radius.full,
              backgroundColor: theme.bg.card,
              boxShadow: theme.elevacion.reposo,
              transform: [{ translateX: x }],
            },
            esMemorial
              ? null
              : {
                  transitionProperty: 'transform',
                  transitionDuration: motion.duration.fast,
                  transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
                },
          ]}
        />
      </View>
    </GestureDetector>
  )
}
