/**
 * MapaPunto (web) — placeholder digno. Mismo mecanismo que
 * `MapaZona.web.tsx` y `MapaRecorrido.web.tsx`: Metro resuelve esta
 * variante en RN-web, donde `react-native-maps` no renderiza. Existe para
 * que la GALERÍA (que corre en web) pueda montar la pieza sin romperse —
 * un import que explota en la herramienta de verificación deja la pieza sin
 * poder mirarse, que es justo lo que R17 existe para evitar.
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { MapaPuntoProps } from './MapaPunto'

export type { MapaPuntoProps }

export function MapaPunto({ alto = 160 }: MapaPuntoProps) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        height: alto,
        borderRadius: radius.md,
        backgroundColor: theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[3],
      }}
    >
      <Texto variante="apoyo">El mapa del destino se ve en el teléfono</Texto>
    </View>
  )
}
