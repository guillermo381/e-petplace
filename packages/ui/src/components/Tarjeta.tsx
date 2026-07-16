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

import { type ReactNode } from 'react'
import { Pressable, View, type AccessibilityRole, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type TarjetaTinte =
  | 'ninguno'
  | 'warning'
  | 'danger'
  | 'success'
  | 'vida'
  | 'cuidado'
  | 'comunidad'

/**
 * Niveles de elevación (Ley 20, D-358 S58): plana (hairline, sin sombra) ·
 * reposo (apoyada sobre el fondo) · elevada (flota). 'sm'/'md' quedan como
 * ALIAS DEPRECADOS (sm→reposo, md→elevada) hasta que las pantallas vivas
 * migren en su pasada de craft — no usar en código nuevo.
 */
export type TarjetaElevacion = 'plana' | 'reposo' | 'elevada' | 'sm' | 'md'
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
  // S63 (D-401): el clon muere — la física vive en LA primitiva
  const { handlers, estiloPresionado } = usePresionado(0.99)

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

  // Alias deprecados de shadows v4 → niveles de la Ley 20
  const nivel =
    elevacion === 'plana' ? null
    : elevacion === 'sm' ? 'reposo'
    : elevacion === 'md' ? 'elevada'
    : elevacion

  const superficie: ViewStyle = {
    backgroundColor: tt.fondo,
    borderRadius: radius.lg,  // 16 fijo — decisión B1: cards 16
    padding: RELLENO[relleno],
    overflow: relleno === 'ninguno' ? 'hidden' : undefined,  // la imagen respeta el radius
    // REGLA CHANEL DEL MARCO (D-358): la superficie que gana elevación
    // PIERDE el hairline — borde + sombra = decir lo mismo dos veces.
    // El borde de TINTE no es hairline (es semántico de capa/status): se conserva.
    ...(nivel === null || tinte !== 'ninguno'
      ? { borderWidth: theme.border.width, borderColor: tt.borde }
      : null),
    // Ley 6 intacta: la sombra JAMÁS se anima
    ...(nivel !== null ? { boxShadow: theme.elevacion[nivel] } : null),
  }

  if (!props.interactiva) {
    // View plana: cero costo Pressable
    return <View style={superficie}>{children}</View>
  }

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={props.etiqueta}
    >
      <Animated.View
        style={[
          superficie,
          estiloPresionado,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
