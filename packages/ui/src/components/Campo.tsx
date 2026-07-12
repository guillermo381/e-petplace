/**
 * Campo — el input de texto del sistema (S43-B3.3).
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA EMIL RECTORA: nada se anima mientras el usuario tipea —
 * jamás labels flotantes, jamás layout shift al enfocar o errar.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Consecuencias de diseño:
 *   · Label SIEMPRE visible arriba (nada de placeholder-como-label;
 *     el placeholder es solo formato, ej: "ej: Zeus").
 *   · Borde 1.5px SIEMPRE — el foco/error cambia COLOR, no grosor.
 *   · El slot de ayuda/error tiene altura reservada: el mensaje no
 *     empuja el layout al aparecer (error reemplaza a ayuda).
 *   · Única animación permitida: transición de color del borde
 *     (fast, receta SM). Nada más.
 *   · multilinea crece a alto FIJO (n líneas) — auto-grow mientras
 *     tipeás = layout shift = prohibido.
 */

import { useState, type ReactNode } from 'react'
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

const BORDE = 1.5
const ALTO = 48                                  // md — target táctil
const LINEA_MENSAJE = typography.size.sm * typography.leading.normal  // slot reservado

export interface CampoProps
  extends Omit<
    TextInputProps,
    | 'style'
    | 'placeholderTextColor'
    | 'secureTextEntry'
    | 'multiline'
    | 'numberOfLines'
    | 'editable'
    | 'accessibilityLabel'
    | 'accessibilityHint'
  > {
  /** Obligatorio: es el label visible Y el accessibilityLabel. */
  label: string
  /** Helper bajo el campo (text.tertiary). `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
  deshabilitado?: boolean
  /** Password con toggle ver/ocultar integrado (ocupa el slot iconoDer). */
  secure?: boolean
  /** Líneas visibles — alto FIJO, no auto-grow. */
  multilinea?: number
  iconoIzq?: ReactNode
  iconoDer?: ReactNode
}

export function Campo({
  label,
  ayuda,
  error,
  deshabilitado = false,
  secure = false,
  multilinea,
  iconoIzq,
  iconoDer,
  ...inputProps
}: CampoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [enfocado, setEnfocado] = useState(false)
  const [oculto, setOculto] = useState(true)

  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary
  // registro gráfico: el borde de error es coral puro; el texto del mensaje es dangerText AA
  const colorBorde = error
    ? theme.status.danger
    : enfocado
      ? accentActive  // el campo enfocado ES el elemento activo de la vista
      : theme.bg.border

  const altoCampo = multilinea
    ? multilinea * Math.round(typography.size.base * typography.leading.normal) + spacing[3] * 2
    : ALTO

  const mensaje = error ?? ayuda

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[1.5],
        }}
      >
        {label}
      </Text>

      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: multilinea ? 'flex-start' : 'center',
          height: altoCampo,
          borderRadius: radius.md,
          borderWidth: BORDE,               // SIEMPRE 1.5 — el estado cambia color, no grosor
          borderColor: colorBorde,
          backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
          paddingHorizontal: spacing[3],
          gap: spacing[2],
          // única animación permitida: color del borde
          transitionProperty: 'borderColor',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        {iconoIzq ? <View style={multilinea ? { paddingTop: spacing[3] } : null}>{iconoIzq}</View> : null}

        <TextInput
          {...inputProps}
          editable={!deshabilitado}
          secureTextEntry={secure && oculto}
          multiline={!!multilinea}
          numberOfLines={multilinea}
          placeholderTextColor={theme.text.tertiary}
          accessibilityLabel={label}
          accessibilityHint={ayuda}
          onFocus={(e) => {
            setEnfocado(true)
            inputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setEnfocado(false)
            inputProps.onBlur?.(e)
          }}
          style={{
            flex: 1,
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            color: theme.text.primary,
            height: '100%',
            paddingVertical: multilinea ? spacing[3] : 0,
            textAlignVertical: multilinea ? 'top' : 'center',
          }}
        />

        {secure ? (
          <Pressable
            onPress={() => setOculto((x) => !x)}
            accessibilityRole="button"
            accessibilityLabel={oculto ? t('campo.mostrarContrasena') : t('campo.ocultarContrasena')}
            hitSlop={8}
          >
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {oculto ? t('campo.ver') : t('campo.ocultar')}
            </Text>
          </Pressable>
        ) : iconoDer ? (
          <View style={multilinea ? { paddingTop: spacing[3] } : null}>{iconoDer}</View>
        ) : null}
      </Animated.View>

      {/* Slot de altura RESERVADA: error reemplaza a ayuda, nada empuja el layout */}
      <View style={{ minHeight: LINEA_MENSAJE + spacing[1], justifyContent: 'flex-end' }}>
        {mensaje ? (
          <Text
            accessibilityLiveRegion={error ? 'polite' : 'none'}
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: LINEA_MENSAJE,
              color: error ? theme.status.dangerText : theme.text.tertiary,
              marginTop: spacing[1],
            }}
          >
            {mensaje}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
