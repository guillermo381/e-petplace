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
 * Variantes: alto (hero de bienvenida) · compacto (techo de paso) ·
 * techoVivo (S58, patrón Hogar v2 FIRMADO: el techo del Hogar deja la
 * base recta — curva orgánica ASIMÉTRICA abajo, radios 44/26; el
 * gradiente v2, el isotipo del lockup y el saludo por franja quedan
 * INTACTOS). Sin interacción propia; sin animación de entrada (Ley 6).
 *
 * HONESTIDAD (Ley 13, adenda S58): el techo v1 CIERRA EN SU CURVA —
 * ni buscador (slot futuro del intelligent search) ni línea de hito
 * loyalty (slot futuro del motor A0/B4). El patrón dibuja el destino;
 * el código solo lo que es verdad hoy.
 *
 * Memorial (Ley 8, patrón Boton marca→primario): el gradiente
 * desaparece → bg.card plano, Isotipo blanco sobre la superficie
 * del tema, título en text.primary. La marca habla bajito. En
 * techoVivo la CURVA se conserva — el color no.
 *
 * Escalera §4b: no muestra datos del expediente (el saludo es franja
 * horaria) — los peldaños no aplican, declarado explícito.
 *
 * SAFE AREA (S59, cura en la primitiva): el techo ABSORBE el inset
 * superior — el FONDO (gradiente, o bg.card en memorial) pinta
 * edge-to-edge hasta el borde físico; el CONTENIDO (isotipo, saludo)
 * baja por el inset. Mismo lockup, misma curva 44/26: solo el fondo
 * crece hacia arriba. Las pantallas NO agregan paddingTop: insets.top
 * por fuera (eso era la banda blanca del Hogar). `techo={false}` es
 * SOLO para mostrarlo fuera de posición (galería).
 * Barra de estado (wiring en la PANTALLA, patrón BarraTabs — ui no
 * conoce el foco de navegación): sobre el gradiente van íconos CLAROS;
 * en tabs/stacks se setea con useFocusEffect + StatusBar.setBarStyle
 * ('light-content' al foco, restaurar al blur; memorial no lo toca).
 *
 * Contraste: text.onGradient contra los stops ≤0.7 del gradiente ya
 * gatea en verify-contrast (regla de peor punto, S43-B3.1c); memorial
 * cae en los pares text.primary/bg.card. Sin pares nuevos.
 */

import { type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'

export type HeroMarcaVariante = 'alto' | 'compacto' | 'techoVivo'

export interface HeroMarcaProps {
  titulo: string
  /** alto = hero de bienvenida (default) · compacto = techo de paso ·
   *  techoVivo = el techo del Hogar (patrón v2: base curva 44/26). */
  variante?: HeroMarcaVariante
  /** Subtítulo/contenido en voz humana. CTAs afuera, siempre. */
  children?: ReactNode
  /** default true: es el techo real de la pantalla — el fondo absorbe
   *  la safe area superior. false SOLO para muestras fuera de posición
   *  (galería); jamás para "compensar" un padding de pantalla. */
  techo?: boolean
}

const MEDIDAS: Record<HeroMarcaVariante, { isotipo: number; fontSize: number; padY: number }> = {
  alto:      { isotipo: 44, fontSize: typography.size['2xl'], padY: spacing[10] },
  compacto:  { isotipo: 28, fontSize: typography.size.lg,     padY: spacing[5] },
  techoVivo: { isotipo: 28, fontSize: typography.size.lg,     padY: spacing[5] },
}

// Patrón Hogar v2 (boceto firmado S58): curva orgánica asimétrica de la
// base del techo. Métricas del componente, no de la escala de radius —
// la calibración FINAL se sella en el gate sobre dispositivo.
const CURVA_TECHO = { izquierda: 44, derecha: 26 }

export function HeroMarca({ titulo, variante = 'alto', children, techo = true }: HeroMarcaProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
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
    // el fondo crece hacia arriba por el inset; el contenido baja lo
    // mismo — la altura ÚTIL (padY arriba y abajo) no cambia
    paddingTop: (techo ? insets.top : 0) + m.padY,
    paddingBottom: m.padY,
    paddingHorizontal: spacing[5],
    // techo vivo: la base deja de ser recta (memorial conserva la
    // curva — el color es lo que se apaga, no la forma)
    ...(variante === 'techoVivo'
      ? {
          borderBottomLeftRadius: CURVA_TECHO.izquierda,
          borderBottomRightRadius: CURVA_TECHO.derecha,
          overflow: 'hidden' as const,
        }
      : null),
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
