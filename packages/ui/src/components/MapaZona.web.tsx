/**
 * MapaZona (web) — placeholder digno. Mismo mecanismo que
 * `MapaRecorrido.web.tsx`: Metro resuelve esta variante en RN-web, donde
 * `react-native-maps` no renderiza. Existe para que la GALERÍA (que corre
 * en web) pueda montar la ficha entera sin romperse — un import que
 * explota en la herramienta de verificación deja la pieza sin poder
 * mirarse, que es justo lo que R17 existe para evitar.
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { MapaZonaProps } from './MapaZona'

export type { MapaZonaProps }

export function MapaZona({ radioM, alto = 160 }: MapaZonaProps) {
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
      <Texto variante="apoyo">Zona de {Math.round(radioM)} m — el mapa se ve en el teléfono</Texto>
    </View>
  )
}
