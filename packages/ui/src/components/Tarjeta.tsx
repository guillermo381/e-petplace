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
  /** S81 (aplicación masiva del censo B — A6 SIN CAJA + §7 presencia por
   *  sombra, ambas FIRMADAS): el default pasa de 'plana' a 'reposo' — la
   *  superficie nace apoyada (elevación de la casa, Chanel del marco:
   *  sin hairline) en vez de en-caja. 'plana' QUEDA para quien lo
   *  DECLARE a propósito (verify:diseno lo censa). El borde de TINTE se
   *  conserva (semántico). La sombra JAMÁS se anima (jank nativo). */
  elevacion?: TarjetaElevacion
  /** LA LUZ DE LA ATMÓSFERA (S83-B16, firma founder). La superficie que
   *  flota dentro de una `Atmosfera` recibe su luz: `elevacion.luz`, un
   *  glow difuso sin desplazamiento. NO es un nivel de elevación —es otro
   *  CANAL, como el halo— y por eso es prop y no valor de `elevacion`.
   *  Se resuelve a `null` en claro y en memorial, así que pasarlo ahí no
   *  hace nada: la degradación vive en el token, no en la pantalla.
   *  Su caso: las Tarjetas PLANAS del prestador en oscuro (D-589, par
   *  1.009) — la cura por la vía de la LUZ y no la del fondo. */
  luz?: boolean
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
  const { children, tinte = 'ninguno', elevacion = 'reposo', relleno = 'normal', luz = false } = props
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

  const superficieSombra = nivel !== null ? theme.elevacion[nivel] : ''
  const superficie: ViewStyle = {
    backgroundColor: tt.fondo,
    borderRadius: radius.lg,  // 16 fijo — decisión B1: cards 16
    padding: RELLENO[relleno],
    overflow: relleno === 'ninguno' ? 'hidden' : undefined,  // la imagen respeta el radius
    // REGLA CHANEL DEL MARCO (D-358): la superficie que gana elevación
    // PIERDE el hairline — borde + sombra = decir lo mismo dos veces.
    // El borde de TINTE no es hairline (es semántico de capa/status): se conserva.
    //
    // ⚖️ ENMIENDA S86 (firma de mesa): la regla rige **CUANDO LA SOMBRA
    // LO DICE**. En CLARO, sobre papel algodón, no lo dice — medido:
    //
    //     card #FFFFFF vs base #FAF9F7  →  1.052
    //     (dark 1.037 · memorial 1.100, las dos ya documentadas acá abajo
    //      y las dos CURADAS con el halo. Claro quedó SIN cura porque se
    //      dio por hecho que la sombra separaba, y es el peor de los tres
    //      después de memorial.)
    //
    // ⇒ en claro la superficie en reposo RECUPERA su hairline. La regla
    // no muere: gana su condición — **el límite lo pone el CONTRASTE, no
    // el catálogo de recursos.** En oscuro y memorial no cambia nada: ahí
    // el tercer canal ya es el halo.
    //
    // Y usa `border.default` (#E3E0EF → 1.234 vs base), NO `subtle`:
    // `subtle` es rgba(0,0,0,.05) y sobre blanco da **1.064** — un
    // hairline que no se ve no es un hairline, es una línea en el código.
    ...(nivel === null || tinte !== 'ninguno'
      ? { borderWidth: theme.border.width, borderColor: tt.borde }
      : theme.mode === 'light'
      ? { borderWidth: theme.border.width, borderColor: theme.border.default }
      : null),
    // Ley 6 intacta: la sombra JAMÁS se anima
    ...(nivel !== null ? { boxShadow: theme.elevacion[nivel] } : null),
    // EL HALO (S82, gate ③ FIRMADO): en los temas OSCUROS la sombra no
    // puede separar —negro sobre negro, es física— y el paso de
    // luminancia está cerrado por los dos lados (medido: card/base 1.037
    // en dark, 1.100 en memorial). El canto de luz es el tercer canal, y
    // es DIRECCIONAL: solo arriba, donde pegaría la luz. Por eso A6 no
    // aplica y NO hace falta enmienda — una caja necesita cuatro lados.
    //
    // DOS CONDICIONES, las dos por Chanel y no por capricho:
    //  · solo con elevación (una superficie PLANA no está apoyada: no
    //    tiene canto donde la luz pegue).
    //  · solo SIN borde de tinte. Si el tinte ya dibujó un contorno
    //    semántico, la superficie YA está separada y el halo repetiría
    //    el trabajo — además de pisarle el color a su lado de arriba,
    //    que es lo que volvería ilegible al tinte.
    ...(nivel !== null && tinte === 'ninguno' && theme.elevacion.halo !== null
      ? { borderTopWidth: 1, borderTopColor: theme.elevacion.halo }
      : null),
    // LA LUZ (S83-B16): explícita por prop —a diferencia del halo, que va
    // con la elevación— porque no toda superficie vive dentro de una
    // Atmosfera. Convive con el nivel: una PLANA con luz es exactamente
    // el caso de D-589, y por eso no exige `nivel !== null`.
    ...(luz && theme.elevacion.luz !== null
      ? { boxShadow: [superficieSombra, theme.elevacion.luz].filter(Boolean).join(', ') }
      : null),
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
