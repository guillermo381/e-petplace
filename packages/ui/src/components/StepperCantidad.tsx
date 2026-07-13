/**
 * StepperCantidad — ajuste de CANTIDAD ACOTADA (S58, Ley 11 + Ley 22;
 * componente 33 — primer consumidor: el cupo "a la vez" por franja del
 * arte del paseo, B1b).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es un input de texto (LA REGLA DEL TECLADO, §15b: lo
 * que se ajusta no se digita), no es slider (el slider elige entre
 * PASOS con recorrido; el stepper suma/resta de a uno), no valida
 * reglas de negocio (min/max son del contrato de la pantalla; el
 * server es el juez). Presentacional puro.
 * EN LOS LÍMITES EL BOTÓN SE APAGA SERENO — voz terciaria, jamás
 * error: el tope es estado, no falla.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía: [−] valor [+] — el VALOR en mono tabular (dato de máquina,
 * Ley 3); los botones −/+ son superficies hundidas (bg.overlay,
 * rectángulo suave — Ley 21) con el glifo en el ACENTO POR REGISTRO
 * ('control' cliente · 'oficio' prestador; memorial degrada a tinta).
 * Target 44 por botón; pressed 0.99 (receta SM de Boton).
 *
 * A11y: adjustable con increment/decrement y el valor anunciado — el
 * lector y el gesto cuentan la misma historia.
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

const BOTON = 44 // target táctil directo

export interface StepperCantidadProps {
  valor: number
  min: number
  max: number
  onCambio: (valor: number) => void
  /** accessibilityLabel del control (el label visible es de la pantalla). */
  etiqueta: string
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador). */
  registro?: 'control' | 'oficio'
}

function BotonPaso({
  signo,
  habilitado,
  color,
  onPress,
  etiqueta,
}: {
  signo: 'menos' | 'mas'
  habilitado: boolean
  color: string
  onPress: () => void
  etiqueta: string
}) {
  const { theme } = useTheme()
  const [presionado, setPresionado] = useState(false)
  return (
    <Pressable
      onPress={() => {
        if (habilitado) onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !habilitado }}
      onPressIn={() => {
        if (habilitado) setPresionado(true)
      }}
      onPressOut={() => setPresionado(false)}
    >
      <Animated.View
        style={{
          width: BOTON,
          height: BOTON,
          borderRadius: radius.suave,
          backgroundColor: theme.bg.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          {signo === 'mas' ? <Path d="M10 4v12" stroke={color} strokeWidth={2} strokeLinecap="round" /> : null}
          <Path d="M4 10h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

export function StepperCantidad({ valor, min, max, onCambio, etiqueta, registro = 'control' }: StepperCantidadProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  if (__DEV__ && min >= max) {
    console.warn(`StepperCantidad: min ${min} ≥ max ${max} — un rango sin recorrido no es un stepper.`)
  }

  const v = Math.min(Math.max(valor, min), max)
  const acento = esMemorial
    ? theme.accent.control // memorial: tinta (la marca no celebra ahí)
    : registro === 'oficio'
      ? theme.accent.primary
      : theme.accent.control

  const irA = (destino: number) => {
    const d = Math.min(Math.max(destino, min), max)
    if (d !== v) onCambio(d)
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min, max, now: v, text: String(v) }}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') irA(v + 1)
        if (e.nativeEvent.actionName === 'decrement') irA(v - 1)
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
    >
      <BotonPaso
        signo="menos"
        habilitado={v > min}
        // en el límite se apaga SERENO (voz terciaria) — jamás error
        color={v > min ? acento : theme.text.tertiary}
        onPress={() => irA(v - 1)}
        etiqueta="Menos"
      />
      <Text
        style={{
          minWidth: spacing[8],
          textAlign: 'center',
          // dato de máquina: mono tabular (Ley 3)
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.md,
          fontVariant: ['tabular-nums'],
          letterSpacing: typography.tracking.mono,
          color: theme.text.primary,
        }}
      >
        {v}
      </Text>
      <BotonPaso
        signo="mas"
        habilitado={v < max}
        color={v < max ? acento : theme.text.tertiary}
        onPress={() => irA(v + 1)}
        etiqueta="Más"
      />
    </View>
  )
}
