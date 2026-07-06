/**
 * Tarjeta — la superficie contenedora del producto (S43-B3.2).
 * Composición por children; sin subcomponentes (se evalúan cuando
 * lista/celda exista).
 *
 * TINTES y su TEXTO (el texto adentro es responsabilidad del consumidor —
 * usar SIEMPRE el token AA correspondiente, regla de dos registros):
 *   warning   → texto con theme.status.warningText
 *   danger    → texto con theme.status.dangerText
 *   success   → texto con theme.status.successText
 *   vida      → texto con theme.capaText.identidad
 *   cuidado   → texto con theme.capaText.cuidado
 *   comunidad → texto con theme.capaText.comunidad
 *   (en memorial no hay capaText: theme.capa cumple ambos registros)
 *
 * QUÉ NO ES: no es botón (acción primaria dentro de una card = Boton),
 * no tiene header/footer, no trae margin propio — el espaciado lo da el
 * layout padre (regla anti-slop: las cards no se auto-separan).
 */

import { useState, type ReactNode } from 'react'
import { Pressable, View, type AccessibilityRole, type ViewStyle } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

export type TarjetaTinte =
  | 'ninguno'
  | 'warning'
  | 'danger'
  | 'success'
  | 'vida'
  | 'cuidado'
  | 'comunidad'

export type TarjetaElevacion = 'plana' | 'sm' | 'md'
export type TarjetaRelleno = 'normal' | 'amplio' | 'ninguno'

type Comun = {
  children: ReactNode
  tinte?: TarjetaTinte
  /** plana = borde sutil sin sombra (default). La sombra JAMÁS se anima (jank nativo). */
  elevacion?: TarjetaElevacion
  /** normal 12 (default) · amplio 16 · ninguno (imagen edge-to-edge). */
  relleno?: TarjetaRelleno
}

// interactiva=true exige onPress + rol + etiqueta (TS lo fuerza, patrón Boton)
export type TarjetaProps =
  | (Comun & { interactiva?: false; onPress?: never; accessibilityRole?: never; etiqueta?: never })
  | (Comun & {
      interactiva: true
      onPress: () => void
      accessibilityRole: AccessibilityRole
      etiqueta: string
    })

const RELLENO: Record<TarjetaRelleno, number> = {
  normal: spacing[3],  // 12
  amplio: spacing[4],  // 16
  ninguno: 0,
}

export function Tarjeta(props: TarjetaProps) {
  const { children, tinte = 'ninguno', elevacion = 'plana', relleno = 'normal' } = props
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  const tintes: Record<TarjetaTinte, { fondo: string; borde: string }> = {
    // claro: card blanca + border · dark: bg.elevated · memorial: sus superficies
    ninguno:   { fondo: theme.mode === 'dark' ? theme.bg.elevated : theme.bg.card, borde: theme.border.subtle },
    warning:   { fondo: theme.status.warningBg, borde: theme.status.warningBorder },
    danger:    { fondo: theme.status.dangerBg,  borde: theme.status.dangerBorder },
    success:   { fondo: theme.status.successBg, borde: theme.status.successBorder },
    vida:      { fondo: theme.status.successBg, borde: theme.status.successBorder },
    cuidado:   { fondo: theme.status.infoBg,    borde: theme.status.infoBorder },
    comunidad: { fondo: theme.accent.brandBg,   borde: theme.accent.brandBorder },
  }
  const tt = tintes[tinte]

  const superficie: ViewStyle = {
    backgroundColor: tt.fondo,
    borderRadius: radius.lg,  // 16 fijo — decisión B1: cards 16
    padding: RELLENO[relleno],
    overflow: relleno === 'ninguno' ? 'hidden' : undefined,  // la imagen respeta el radius
    // plana lleva borde; con sombra (sm/md) el tinte conserva su borde, ninguno lo suelta
    ...(elevacion === 'plana' || tinte !== 'ninguno'
      ? { borderWidth: theme.border.width, borderColor: tt.borde }
      : null),
    ...(elevacion !== 'plana' ? theme.shadow[elevacion] : null),
  }

  if (!props.interactiva) {
    // View plana: cero costo Pressable
    return <View style={superficie}>{children}</View>
  }

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={props.etiqueta}
    >
      <Animated.View
        style={[
          superficie,
          {
            // misma receta que Boton (SM: CSS transition + estado, sin worklets)
            transform: [{ scale: presionada ? 0.99 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
