/**
 * HeroMarca — la superficie de cabecera con la marca (S45-B3.4,
 * onboarding dueño — dosis alta, contexto cerrado del gradiente firma).
 *
 * ═══════════════════════════════════════════════════════════════════
 * Gradiente: SIEMPRE theme.accent.gradient (v2: 3 stops, violeta
 * central, texto BLANCO — B3.1c). JAMÁS construir un gradiente propio.
 * El Isotipo (blanco) de acá CUENTA como el UNO por pantalla (Ley 4).
 * Los CTAs NO viven adentro: marca sobre marca está prohibido — el
 * slot children es para subtítulo/contenido en voz humana.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Variantes: alto (hero de bienvenida) · compacto (techo de paso).
 * Sin interacción propia; sin animación de entrada (Ley 6).
 *
 * Memorial (Ley 8, patrón Boton marca→primario): el gradiente
 * desaparece → bg.card plano, Isotipo blanco sobre la superficie
 * del tema, título en text.primary. La marca habla bajito.
 *
 * Contraste: text.onGradient contra los stops ≤0.7 del gradiente ya
 * gatea en verify-contrast (regla de peor punto, S43-B3.1c); memorial
 * cae en los pares text.primary/bg.card. Sin pares nuevos.
 */

import { type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'

export type HeroMarcaVariante = 'alto' | 'compacto'

export interface HeroMarcaProps {
  titulo: string
  /** alto = hero de bienvenida (default) · compacto = techo de paso. */
  variante?: HeroMarcaVariante
  /** Subtítulo/contenido en voz humana. CTAs afuera, siempre. */
  children?: ReactNode
}

const MEDIDAS: Record<HeroMarcaVariante, { isotipo: number; fontSize: number; padY: number }> = {
  alto:     { isotipo: 44, fontSize: typography.size['2xl'], padY: spacing[10] },
  compacto: { isotipo: 28, fontSize: typography.size.lg,     padY: spacing[5] },
}

export function HeroMarca({ titulo, variante = 'alto', children }: HeroMarcaProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  const m = MEDIDAS[variante]

  const contenido = (
    <>
      <Isotipo size={m.isotipo} variant="blanco" />
      <Text
        accessibilityRole="header"
        style={{
          // voz humana: DM Sans 300 en tamaño generoso (Ley 3)
          fontFamily: typography.family.sans.light,
          fontSize: m.fontSize,
          lineHeight: Math.round(m.fontSize * typography.leading.snug),
          color: esMemorial ? theme.text.primary : theme.text.onGradient,
          marginTop: spacing[3],
        }}
      >
        {titulo}
      </Text>
      {children}
    </>
  )

  const relleno = {
    paddingVertical: m.padY,
    paddingHorizontal: spacing[5],
  }

  if (esMemorial) {
    // Ley 8: sin gradiente — superficie plana del tema.
    return <View style={[relleno, { backgroundColor: theme.bg.card }]}>{contenido}</View>
  }

  return (
    <LinearGradient
      colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
      locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
      start={{ x: 0.13, y: 0 }}
      end={{ x: 0.87, y: 1 }}
      style={relleno}
    >
      {contenido}
    </LinearGradient>
  )
}
