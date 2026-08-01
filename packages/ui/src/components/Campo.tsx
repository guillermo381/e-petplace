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
  /** Helper bajo el campo (`text.secondary` desde S83-B26 — ver la nota
   *  en su render). `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
  deshabilitado?: boolean
  /** FIRMADA S81 (el arbitraje ⚖️ se contestó por orden de mesa, sin
   *  gate: A6 ALCANZA a Campo — el borde de reposo era caja, no
   *  affordance): DEFAULT true — reposo SIN borde, la affordance la da
   *  el RELLENO (bg.overlay, §7). El borde INFORMATIVO queda: foco
   *  (accent.active) y error (danger) siguen pintando — semántico,
   *  sobrevive a A6 (patrón del borde de tinte de Tarjeta). Grosor
   *  intacto (transparent en reposo: cero layout shift). `sinCaja=
   *  {false}` queda para la excepción DECLARADA con dueño (patrón del
   *  flip de Tarjeta). */
  sinCaja?: boolean
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
  sinCaja = true,
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
      : sinCaja
        ? 'transparent' // CANDIDATA A6: el reposo sin caja — foco/error siguen
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
          backgroundColor: sinCaja
            ? theme.bg.overlay // CANDIDATA A6: la affordance es el relleno
            : theme.mode === 'light'
              ? theme.bg.card
              : theme.bg.elevated,
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
                            // S83-B26 (D-605, salida ②): el helper migra de
              // `text.tertiary` a `text.secondary`. EL PORQUÉ, que es el
              // que decidió la ficha: la exención de `tertiary` se firmó
              // para un ROL —el tab inactivo, espec B3.7— y un helper NO
              // es placeholder ni está apagado: **es la instrucción de
              // cómo llenar el campo, el texto que uno lee justo cuando
              // no sabe qué poner**. Medido contra el theme resuelto, no
              // a mano: `tertiary` da 2.18 en LIGHT (el tema por defecto
              // del producto) contra un mínimo de 3:1 — dos de los tres
              // temas por debajo. `secondary` YA vive en el corpus del
              // gate (`verify-contrast.ts:97`) y pasa en los tres.
              // MÁXIMO ALCANCE POR SITIO: no es una pantalla — lo hereda
              // CADA `Campo` de la casa, en las dos apps.
              color: error ? theme.status.dangerText : theme.text.secondary,
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
