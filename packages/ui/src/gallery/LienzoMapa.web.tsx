/**
 * LienzoMapa (web) — placeholder HONESTO, y su honestidad es el punto.
 *
 * Mismo mecanismo que `MapaZona.web.tsx`: Metro resuelve esta variante en
 * RN-web, donde `react-native-maps` no renderiza.
 *
 * 🔴 PERO ACÁ EL PLACEHOLDER TIENE QUE **DECIR QUE NO SIRVE PARA JUZGAR**,
 * y no es cortesía: este lienzo existe para gatear una marca CONTRA TILES
 * REALES. Un fondo gris de mentira devolvería exactamente el error que la
 * ley de método vino a matar —juzgar la lámina cuando el destino es el
 * mapa— con el agravante de parecer que se gateó.
 *
 * *Un instrumento que no puede medir tiene que decirlo más fuerte que uno
 * que mide.*
 */

import { View } from 'react-native'

import { Texto } from '../components/Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { LienzoMapaProps } from './LienzoMapa'

export type { LienzoMapaProps }

export function LienzoMapa({ children, alto = 200 }: LienzoMapaProps) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        height: alto,
        borderRadius: radius.md,
        backgroundColor: theme.bg.overlay,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.bg.border,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[3],
        gap: spacing[2],
      }}
    >
      <Texto variante="apoyo" centrado>
        Acá van tiles REALES — en web no hay mapa, y sobre este fondo la marca NO se puede juzgar.
      </Texto>
      <View pointerEvents="box-none">{children}</View>
    </View>
  )
}
