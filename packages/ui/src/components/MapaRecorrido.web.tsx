/**
 * MapaRecorrido — implementación WEB (react-native-maps no corre en
 * RN-web): placeholder digno, cero crash de import. Metro resuelve
 * esta variante por extensión de plataforma; el contrato de props es
 * el mismo (MapaRecorrido.tipos.ts).
 */

import { Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { MapaRecorridoProps } from './MapaRecorrido.tipos'

export type {
  MapaRecorridoProps,
  MapaRecorridoModo,
  MapaRecorridoCapa,
  PuntoLatLng,
} from './MapaRecorrido.tipos'

const ALTO_DEFAULT = 220

function IconoMapa({ color, tamano }: { color: string; tamano: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path
        d="M14.1 5.55a2 2 0 0 0 1.8 0l3.65-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.56 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.65 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9l4.56-2.27a2 2 0 0 1 1.8 0z"
        {...stroke}
      />
      <Path d="M15 5.76v14.5M9 3.74v14.5" {...stroke} />
    </Svg>
  )
}

export function MapaRecorrido({ alto = ALTO_DEFAULT }: MapaRecorridoProps) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        height: alto,
        borderRadius: radius.md,
        backgroundColor: theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
      }}
    >
      <IconoMapa color={theme.text.secondary} tamano={28} />
      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
        }}
      >
        El mapa se ve en el teléfono
      </Text>
    </View>
  )
}
