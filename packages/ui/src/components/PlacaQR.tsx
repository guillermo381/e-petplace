/**
 * PLACA QR — la previsualización de lo que se va a imprimir (S113-B · 1.3).
 *
 * 🔴 **Muestra EXACTAMENTE el SVG que se descarga**, no una versión bonita de
 * él: *una vista previa que se dibuja distinto del archivo es peor que ninguna,
 * porque el error aparece cuando la placa ya está grabada.* Por eso monta el
 * mismo string que devuelve `svgDeLaPlaca`.
 *
 * ⚠️ **Convertir a PNG y bajarlo es de la pantalla**: exige capturar una vista,
 * y esa capacidad nativa no está en este grafo. La pieza compone y previsualiza.
 */

import { View } from 'react-native'
import { SvgXml } from 'react-native-svg'

import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { svgDeLaPlaca, type PlacaQrDatos } from './placa-qr'

export interface PlacaQRProps extends PlacaQrDatos {
  /** El lado de la previsualización en pantalla. La placa real son 30 mm. */
  lado?: number
  /** *«Así se va a ver la placa»* — el rótulo, en la voz de la pantalla. */
  vozPrevia?: string
}

export function PlacaQR({ svgQr, nombre, marca, lado = 132, vozPrevia }: PlacaQRProps) {
  const svg = svgDeLaPlaca({ svgQr, nombre, marca })
  return (
    <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
      <View accessibilityLabel={vozPrevia ?? nombre} style={{ width: lado, height: lado }}>
        <SvgXml xml={svg} width={lado} height={lado} />
      </View>
      {vozPrevia !== undefined ? <Texto variante="apoyo">{vozPrevia}</Texto> : null}
    </View>
  )
}
