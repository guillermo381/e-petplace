/**
 * Encabezado — la estructura superior de pantalla (S43-B3.6).
 *
 * ═══════════════════════════════════════════════════════════════════
 * NADA SE ANIMA en el Encabezado — ni el título, ni colapso al
 * scroll. Si algún día se quiere colapso, es una decisión de motion
 * propia, no un default. (Única excepción: el resalte pressed del
 * chevron, que es feedback obligatorio — resalta, no escala.)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Variantes:
 *   navegacion → header compacto de pantallas internas. Título con
 *     centrado ÓPTICO: ambas zonas laterales reservan 44 SIEMPRE,
 *     así el título no baila entre pantallas con/sin atrás/acción.
 *   portada → el header de las raíces de tab, donde vive la VOZ
 *     HUMANA (saludo en DM Sans 300 2xl). Isotipo tinta = dosis baja
 *     (prestador); gradiente (el del SVG oficial de marca, via
 *     <Isotipo/>) = dosis alta (dueño). La portada respira.
 */

import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'

const ZONA_LATERAL = 44  // reservada SIEMPRE — centrado óptico del título

type Navegacion = {
  variante: 'navegacion'
  titulo: string
  accionDer?: ReactNode
  divisor?: boolean
  saludo?: never
  subtitulo?: never
  isotipo?: never
} & ({ atras: true; onAtras: () => void } | { atras?: false; onAtras?: never })

type Portada = {
  variante: 'portada'
  /** VOZ HUMANA — DM Sans 300 2xl. El lugar del registro humano en la estructura. */
  saludo: string
  subtitulo?: string
  isotipo?: 'tinta' | 'gradiente' | 'ninguno'
  accionDer?: ReactNode
  titulo?: never
  atras?: never
  onAtras?: never
  divisor?: never
}

export type EncabezadoProps = Navegacion | Portada

function ChevronAtras({ onAtras }: { onAtras: () => void }) {
  const { theme } = useTheme()
  const [presionado, setPresionado] = useState(false)
  return (
    <Pressable
      onPress={onAtras}
      onPressIn={() => setPresionado(true)}
      onPressOut={() => setPresionado(false)}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={(44 - ZONA_LATERAL) / 2 + 4}
    >
      <Animated.View
        style={{
          width: ZONA_LATERAL,
          height: ZONA_LATERAL,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          // regla de fila: el pressed resalta, no escala
          backgroundColor: presionado ? theme.bg.overlay : 'transparent',
          transitionProperty: 'backgroundColor',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={theme.text.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

export function Encabezado(props: EncabezadoProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  if (props.variante === 'navegacion') {
    return (
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: theme.bg.base,
          ...(props.divisor
            ? { borderBottomWidth: 1, borderBottomColor: theme.bg.border }
            : null),
        }}
      >
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[2],
          }}
        >
          <View style={{ width: ZONA_LATERAL, alignItems: 'flex-start' }}>
            {props.atras ? <ChevronAtras onAtras={props.onAtras} /> : null}
          </View>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.md,
              color: theme.text.primary,
            }}
          >
            {props.titulo}
          </Text>
          <View style={{ width: ZONA_LATERAL, alignItems: 'flex-end', justifyContent: 'center' }}>
            {props.accionDer ?? null}
          </View>
        </View>
      </View>
    )
  }

  // Default GRADIENTE OFICIAL en claro y dark, ambos lados (founder, B3.7):
  // el logo es identidad, no acento — queda fuera de la contabilidad de dosis
  // (sigue siendo UNO por pantalla). 'tinta' queda para contextos especiales.
  // En memorial degrada automáticamente (patrón Boton marca): la marca habla
  // bajito — y sobre bosque nocturno la tinta se traduce a blanco.
  const { saludo, subtitulo, isotipo = 'gradiente', accionDer } = props
  const varianteIsotipo =
    theme.mode === 'memorial' ? 'blanco' : isotipo === 'tinta' && theme.mode === 'dark' ? 'blanco' : isotipo
  return (
    <View
      style={{
        paddingTop: insets.top + spacing[4],
        paddingBottom: spacing[6],       // la portada respira, no comprime
        paddingHorizontal: spacing[4],
        backgroundColor: theme.bg.base,
        gap: spacing[4],
      }}
    >
      {isotipo !== 'ninguno' || accionDer ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
          {isotipo !== 'ninguno' && varianteIsotipo !== 'ninguno' ? (
            <Isotipo size={28} variant={varianteIsotipo} />
          ) : (
            <View />
          )}
          {accionDer ?? null}
        </View>
      ) : null}
      <View style={{ gap: spacing[1] }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: typography.family.sans.light,
            fontSize: typography.size['2xl'],
            lineHeight: typography.size['2xl'] * typography.leading.snug,
            color: theme.text.primary,
          }}
        >
          {saludo}
        </Text>
        {subtitulo ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
