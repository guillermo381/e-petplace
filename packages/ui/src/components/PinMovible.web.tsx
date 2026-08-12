/**
 * PinMovible (web) — placeholder digno. Mismo mecanismo que
 * `MapaZona.web.tsx` y `MapaRecorrido.web.tsx`: Metro resuelve esta
 * variante en RN-web, donde `react-native-maps` no renderiza. Existe para
 * que la GALERÍA (que corre en web) pueda montar la pieza sin romperse.
 *
 * **Muestra las coordenadas vigentes en mono**, y no es decoración de
 * relleno: es lo único verificable de esta pieza fuera del teléfono —
 * deja ver que el valor que la pantalla sostiene es el que la pieza
 * reporta. *Lo que NO se puede verificar acá es el gesto, y ése es
 * justamente el gate en dispositivo.*
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { PinMovibleProps } from './PinMovible'

export type { PinMovibleProps }

export function PinMovible({ lat, lon, alto = 220, etiqueta }: PinMovibleProps) {
  const { theme } = useTheme()
  return (
    <View
      accessible
      accessibilityLabel={etiqueta}
      style={{
        height: alto,
        borderRadius: radius.suave,
        backgroundColor: theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        padding: spacing[3],
      }}
    >
      <Texto variante="apoyo">El mapa se mueve en el teléfono</Texto>
      <Texto variante="dato">
        {lat.toFixed(5)}, {lon.toFixed(5)}
      </Texto>
    </View>
  )
}
