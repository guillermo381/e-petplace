/**
 * CitaEnVivo — el tratamiento "en vivo/en curso" del sistema (S44-B2.1).
 *
 * ═══════════════════════════════════════════════════════════════════
 * UN CitaEnVivo por pantalla (Ley 7). No suma accent.active (Ley 5) —
 * su tratamiento es del hex de capa, no del accent.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Wrapper NO interactivo. El glow es SEMÁNTICO, no decorativo
 * (decisión S43-B3.5): reservado a una cita ejecutándose AHORA.
 * Comportamiento por tema:
 *   dark     → glow real del color de capa (theme.shadow.glow).
 *   claro    → anillo nítido 1.5px del hex PURO (registro gráfico,
 *              fuera del gate AA por espec firmada de B2) + pill
 *              "● vivo" (punto ESTÁTICO — Ley 6 prohíbe animar
 *              sombras y pulsos; nada acá se anima, nunca).
 *   memorial → degrada (Ley 8): anillo en text.secondary, pill
 *              "en curso" sin punto. Sin glow, sin color de capa.
 *
 * Accesibilidad: el pill porta el canal textual en claro/memorial.
 * En dark el glow NO es canal accesible — la pantalla consumidora
 * comunica "en curso" también por texto (Celda/Insignia).
 *
 * El pill sobresale ~11px por encima del borde superior: el layout
 * padre deja ese aire (la galería muestra el patrón).
 */

import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type CitaEnVivoCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

export interface CitaEnVivoProps {
  capa: CitaEnVivoCapa
  children: ReactNode
}

/** Mismo vocabulario público que Insignia; claves internas del tema. */
const CAPA_A_KEY = {
  vida: 'identidad',
  cuidado: 'cuidado',
  comunidad: 'comunidad',
  comunidadAmplia: 'comunidadAmplia',
} as const

const CAPA_A_GLOW = {
  vida: 'verde',
  cuidado: 'teal',
  comunidad: 'pink',
  comunidadAmplia: 'violet',
} as const

// Geometría idéntica en los 3 temas: anillo 1.5 + aire 2 alrededor del
// children (radius.xl envuelve limpio una Tarjeta radius.lg).
const ANILLO = 1.5
const AIRE = 2
const PILL_ALTO = 22 // = Insignia sm: coherente, pero NO es Insignia

export function CitaEnVivo({ capa, children }: CitaEnVivoProps) {
  const { theme } = useTheme()
  const k = CAPA_A_KEY[capa]

  if (theme.mode === 'dark') {
    return (
      <View
        style={{
          borderRadius: radius.xl,
          borderWidth: ANILLO,
          borderColor: 'transparent',
          padding: AIRE,
          backgroundColor: theme.bg.card,
          ...theme.shadow.glow[CAPA_A_GLOW[capa]],
        }}
      >
        {children}
      </View>
    )
  }

  const esMemorial = theme.mode === 'memorial'
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa

  return (
    <View
      style={{
        borderRadius: radius.xl,
        borderWidth: ANILLO,
        borderColor: esMemorial ? theme.text.secondary : theme.capa[k],
        padding: AIRE,
      }}
    >
      {children}
      <View
        accessibilityRole="text"
        accessibilityLabel="Cita en curso"
        style={{
          position: 'absolute',
          top: -(PILL_ALTO / 2),
          right: spacing[3],
          zIndex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1.5],
          height: PILL_ALTO,
          paddingHorizontal: spacing[2.5],
          borderRadius: radius.full,
          backgroundColor: theme.bg.card,
          borderWidth: theme.border.width,
          borderColor: theme.border.subtle,
        }}
      >
        {!esMemorial && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: radius.full,
              backgroundColor: theme.capa[k],
            }}
          />
        )}
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.xs,
            color: esMemorial ? theme.text.secondary : capaTexto[k],
          }}
        >
          {esMemorial ? 'en curso' : 'vivo'}
        </Text>
      </View>
    </View>
  )
}
