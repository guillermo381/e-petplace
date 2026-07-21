/**
 * Boton — primer componente del design system (S43-B3.1).
 *
 * Variantes:
 *   primario    → el botón por defecto de TODO el producto. Fondo tinta
 *                 (text.primary), texto bg.base. Dosis prestador solo conoce este.
 *   marca       → gradientFirmaUI. SOLO dosis alta, contextos cerrados de
 *                 marca (hero onboarding, CTA principal del dueño, momento
 *                 adopción). En memorial el gradiente no existe: degrada a primario.
 *   secundario  → tonal: bg.overlay + texto primario + borde sutil.
 *   ghost       → solo texto, sin fondo. Acciones terciarias.
 *   destructivo → tonal danger (dangerBg + dangerText). NUNCA coral sólido:
 *                 la destrucción no grita, confirma (alma del portal).
 *
 * Motion (receta Software Mansion — CSS transitions de Reanimated, sin
 * worklets): pressed escala a 0.97 con el spring de motion.ts (fast 150).
 * Nada más se anima. Ni color, ni sombra, ni entrada.
 */

import { useEffect, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'
import { LinearGradient } from 'expo-linear-gradient'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

// 'compacto' (S58, Ley 22c): la ACCIÓN SECUNDARIA vestida — borde
// border.default + radius suave + texto tinta + target 44. Jamás
// texto pelado, jamás Celda: comando con consecuencias viste de botón.
// S73 (enmienda 19.7 angosta): PROHIBIDO como acción DENTRO de una fila
// (ahí baja a label con la anatomía de CeldaNavegacion); ghost ídem.
// La caja del compacto migra al tocarse (D-483).
export type BotonVariante = 'primario' | 'marca' | 'secundario' | 'ghost' | 'destructivo' | 'compacto'
export type BotonTamaño = 'sm' | 'md' | 'lg'

// md 48 = default: target táctil. sm 36 compensa con hitSlop (target efectivo 44).
const TAMAÑOS: Record<BotonTamaño, { alto: number; padX: number; fontSize: number }> = {
  sm: { alto: 36, padX: spacing[4], fontSize: typography.size.sm },
  md: { alto: 48, padX: spacing[5], fontSize: typography.size.base },
  lg: { alto: 56, padX: spacing[6], fontSize: typography.size.md },
}

export interface BotonProps {
  /** Obligatoria: un botón sin etiqueta no existe (a11y). */
  etiqueta: string
  onPress?: () => void
  variante?: BotonVariante
  tamaño?: BotonTamaño
  /** Full-width. */
  bloque?: boolean
  cargando?: boolean
  deshabilitado?: boolean
  /** Slot de ícono — ReactNode, sin librería acoplada. */
  iconoIzq?: ReactNode
}

export function Boton({
  etiqueta,
  onPress,
  variante = 'primario',
  tamaño = 'md',
  bloque = false,
  cargando = false,
  deshabilitado = false,
  iconoIzq,
}: BotonProps) {
  const { theme } = useTheme()
  // S63 (D-401, cura en la fuente): el hundimiento vive en LA primitiva
  // usePresionado — la física del mock firmado, memorial-aware adentro.
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const [enfocado, setEnfocado] = useState(false)

  const t = TAMAÑOS[tamaño]
  const inactivo = deshabilitado || cargando

  // Regla emil: "loading solo se muestra si la operación supera 150ms;
  // debajo de eso, nada". El spinner aparece recién pasado el umbral
  // (motion.duration.fast); si la operación termina antes, jamás se vio.
  // accessibilityState.busy sí es inmediato — a la a11y no se le miente.
  const [mostrarSpinner, setMostrarSpinner] = useState(false)
  useEffect(() => {
    if (!cargando) {
      setMostrarSpinner(false)
      return
    }
    const timer = setTimeout(() => setMostrarSpinner(true), motion.duration.fast)
    return () => clearTimeout(timer)
  }, [cargando])

  // En memorial el gradiente firma es transparent (B2): marca degrada a primario.
  const esMarca =
    variante === 'marca' && theme.accent.gradient.colors[0] !== 'transparent'
  const varianteEfectiva: BotonVariante =
    variante === 'marca' && !esMarca ? 'primario' : variante

  const colores: Record<BotonVariante, { fondo: string; texto: string; borde?: string }> = {
    // S63 — enmienda Ley 21 FIRMADA: el primario ancla al SLOT accent.cta
    // (default tinta = idéntico al de siempre; el raíz del prestador lo
    // resuelve a tealDark con ThemeProvider cta="oficio"; memorial
    // SIEMPRE tinta — el slot lo garantiza en la fuente).
    primario:    { fondo: theme.accent.cta, texto: theme.accent.ctaTexto },
    marca:       { fondo: 'transparent', texto: theme.text.onGradient },
    secundario:  { fondo: theme.bg.overlay, texto: theme.text.primary, borde: theme.border.subtle },
    ghost:       { fondo: 'transparent', texto: theme.text.primary },
    destructivo: { fondo: theme.status.dangerBg, texto: theme.status.dangerText },
    compacto:    { fondo: 'transparent', texto: theme.text.primary, borde: theme.border.default },
  }
  const c = colores[varianteEfectiva]

  // B3.1c — constraint del gradiente v2: la exención WCAG de la cola del
  // gradiente (location 1, teal) vale SOLO si el texto nunca la alcanza.
  // marca garantiza paddingHorizontal ≥ 24 (spacing[6]) en todo tamaño.
  const padX = esMarca ? Math.max(t.padX, spacing[6]) : t.padX

  const esCompacto = varianteEfectiva === 'compacto'
  const cuerpo: ViewStyle = {
    height: esCompacto ? 44 : t.alto,
    paddingHorizontal: padX,
    borderRadius: esCompacto ? radius.suave : radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: esMarca ? undefined : c.fondo,
    ...(c.borde ? { borderWidth: theme.border.width, borderColor: c.borde } : null),
    ...(bloque ? { alignSelf: 'stretch' as const } : { alignSelf: 'flex-start' as const }),
  }

  const contenido = (
    <>
      {iconoIzq ? <View style={mostrarSpinner ? { opacity: 0 } : null}>{iconoIzq}</View> : null}
      {/* El label queda montado invisible durante loading: preserva el ancho
          exacto — cero layout shift (equivale a medir y fijar minWidth). */}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: t.fontSize,
          color: c.texto,
          opacity: mostrarSpinner ? 0 : 1,
        }}
      >
        {etiqueta}
      </Text>
      {mostrarSpinner ? (
        <View style={{ position: 'absolute', alignSelf: 'center' }}>
          <ActivityIndicator size="small" color={c.texto} />
        </View>
      ) : null}
    </>
  )

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      disabled={inactivo}
      hitSlop={tamaño === 'sm' ? (44 - TAMAÑOS.sm.alto) / 2 : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      accessibilityLabel={etiqueta}
      style={bloque ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }}
    >
      <Animated.View
        style={[
          estiloPresionado,
          {
            opacity: deshabilitado ? opacity.disabled : 1,
            borderRadius: radius.md,
            ...(bloque ? { alignSelf: 'stretch' as const } : null),
          },
          // Focus visible en web (RN-web lo exige): outline accent.active
          Platform.OS === 'web' && enfocado
            ? ({
                outlineWidth: 2,
                outlineColor: 'active' in theme.accent ? theme.accent.active : theme.accent.primary,
                outlineStyle: 'solid',
                outlineOffset: 2,
              } as unknown as ViewStyle)
            : null,
        ]}
      >
        {esMarca ? (
          <LinearGradient
            colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
            locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
            start={{ x: 0.13, y: 0 }}
            end={{ x: 0.87, y: 1 }}
            style={cuerpo}
          >
            {contenido}
          </LinearGradient>
        ) : (
          <View style={cuerpo}>{contenido}</View>
        )}
      </Animated.View>
    </Pressable>
  )
}
