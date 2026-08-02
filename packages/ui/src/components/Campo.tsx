/**
 * Campo — el input de texto del sistema (S43-B3.3).
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA EMIL RECTORA: nada se anima mientras el usuario tipea —
 * jamás labels flotantes, jamás layout shift al enfocar o errar.
 *
 * ENMIENDA S83-B1 — LA PROTECCIÓN NO SE RETIRA, SUBE UN NIVEL.
 * El pie de altura reservada es el instrumento de esa promesa, y sigue
 * siendo el DEFAULT. Lo que la enmienda reconoce es que el pie pertenece
 * al CONTROL, y un control puede estar compuesto por más de una pieza: en
 * una fila (indicativo + número) el pie de UNO de los hijos corre al otro
 * hacia abajo por su alto exacto. Con `sinPie`, el hijo deja de reservarlo
 * y el pie lo monta el COMPUESTO, para los dos — misma promesa, un piso
 * más arriba. Sin ese pie del compuesto la promesa se pierde, y por eso
 * `sinPie` no viaja solo: viaja con `PieDeCampo` y con su guard (R29).
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

/** El alto EXACTO que el pie reserva: 13 × 1.6 + 4 = **24.8 px**. Es el
 *  delta que un hermano alineado a `flex-end` recibe hacia abajo cuando su
 *  vecino es un `Campo` — medido, no estimado. Se exporta porque un
 *  compuesto puede necesitar el número, y derivarlo a mano en la pantalla
 *  es exactamente cómo se fabrican los márgenes a ojo.
 *  ⚠️ NO es constante universal: si el mensaje ENVUELVE a dos líneas, el
 *  pie crece y el delta con él. Por eso la cura correcta es `sinPie` (que
 *  lo elimina) y no "igualar el alto" en el consumidor — igualar acierta
 *  en reposo y falla justo cuando aparece el error. */
export const ALTO_PIE_CAMPO = LINEA_MENSAJE + spacing[1]

export interface PieDeCampoProps {
  /** Helper. `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
}

/**
 * PieDeCampo — el pie de un control de formulario: altura RESERVADA y el
 * mensaje adentro. Vive acá (no en archivo propio) por el precedente de
 * `HojaScroll` dentro de `Hoja`: es la anatomía DE `Campo`, no una pieza
 * con vida propia.
 *
 * POR QUÉ EXISTE COMO PIEZA (S83-B1): esta anatomía estaba COPIADA byte
 * por byte en `Campo` y `CampoFecha` —comentario de D-605 incluido— y el
 * compuesto que necesita montarla iba a ser la tercera copia. Se ensancha,
 * no se copia (L-175). Precedente medido el mismo día: en B36 la expresión
 * del teclado vivía duplicada en dos archivos y curar uno dejaba el otro
 * roto; acá se cura de raíz antes de que pase.
 */
export function PieDeCampo({ ayuda, error }: PieDeCampoProps) {
  const { theme } = useTheme()
  const mensaje = error ?? ayuda

  return (
    // Slot de altura RESERVADA: error reemplaza a ayuda, nada empuja el layout
    <View style={{ minHeight: ALTO_PIE_CAMPO, justifyContent: 'flex-end' }}>
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
  )
}

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
  /** S83-B1 — NO reserva el pie: lo monta el CONTROL COMPUESTO que lo
   *  contiene, con `PieDeCampo`, para todos sus hijos a la vez.
   *
   *  CUÁNDO: SOLO dentro de una fila donde este `Campo` tiene hermanos
   *  (indicativo + número). Fuera de esa fila, `sinPie` no arregla nada y
   *  rompe la promesa rectora: el mensaje empujaría el layout al aparecer.
   *
   *  ⚠️ EL MODO DE FALLA, dicho porque es silencioso: con `sinPie` este
   *  `Campo` sigue PINTANDO su borde de error —eso no se delega— pero deja
   *  de RENDERIZAR el texto. Si el compuesto no monta `PieDeCampo`, el
   *  usuario ve un borde rojo sin una palabra que explique por qué. Por eso
   *  `verify:diseno` R29 exige que las dos cosas vivan en el mismo archivo:
   *  una verificación cuyo modo de falla es el silencio no es una
   *  verificación (L-192). */
  sinPie?: boolean
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
  sinPie = false,
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

      {sinPie ? null : <PieDeCampo ayuda={ayuda} error={error} />}
    </View>
  )
}
