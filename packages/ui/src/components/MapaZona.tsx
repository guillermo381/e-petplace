/**
 * MapaZona — LA ZONA, NO EL PUNTO (S84-B16).
 *
 * Dibuja un círculo sobre el mapa y NADA MÁS: sin pin, sin interacción.
 * Las dos ausencias son la pieza, no recortes:
 *  · SIN PIN — un pin dice "acá está", y eso es exactamente lo que una
 *    zona NO afirma. El centro que A entrega viene DESPLAZADO dentro del
 *    radio y es estable por id (D-624): poner un pin encima convertiría
 *    un dato deliberadamente impreciso en una promesa de precisión.
 *  · SIN INTERACCIÓN — en la ficha el mapa es una VISTA, no un
 *    explorador. Arrastrar o hacer zoom invita a buscar la dirección, y
 *    la dirección exacta no está acá ni tiene que parecer que está.
 *
 * ⚠️ LA REGLA QUE NO SE ROMPE: esta pieza JAMÁS recibe la coordenada
 * exacta. Sus props se llaman `zona*` a propósito — si alguien le pasa
 * `lat`/`lon` de la sede, es defecto, no configuración. La exacta se
 * entrega después del pago y por otro camino.
 *
 * POR OTA, SIN BUILD: `react-native-maps` YA es dependencia de las dos
 * apps y de este paquete (1.27.2, medido S84-B16), y su módulo nativo
 * está horneado en la 1.0.3 — la misma que monta `MapaRecorrido`. L-134
 * pide build para un módulo NUEVO; éste no lo es.
 *
 * WEB: variante `.web.tsx` con placeholder digno, mismo mecanismo que
 * `MapaRecorrido` — se ensancha el patrón de la casa, no se inventa otro.
 */

import { View } from 'react-native'
import MapView, { Circle } from 'react-native-maps'

import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

export interface MapaZonaProps {
  /** Centro DESPLAZADO de la zona (jamás la sede). */
  zonaLat: number
  zonaLon: number
  /** Radio en metros (hoy 500, lo decide el motor). */
  radioM: number
  /** Alto del bloque. Default 160. */
  alto?: number
}

/** Grados de latitud por metro (aprox). El encuadre se deriva del RADIO
 *  para que el círculo entre con aire — así un radio distinto no exige
 *  tocar la pieza. */
const GRADO_POR_METRO = 1 / 111_320
const AIRE = 2.6

/** El relleno se deriva del acento de la casa (`accent.control` resuelve
 *  teal en el prestador y magenta en el cliente por los ocho slots). Se
 *  compone acá y no se recibe: la app jamás pasa un color crudo (Ley 1). */
function conAlfa(hex: string, alfa: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${alfa})`
}

export function MapaZona({ zonaLat, zonaLon, radioM, alto = 160 }: MapaZonaProps) {
  const { theme } = useTheme()
  const acento = theme.accent.control
  const delta = radioM * GRADO_POR_METRO * AIRE

  return (
    <View
      // El mapa no recibe toques: la vista no es un explorador.
      pointerEvents="none"
      style={{ height: alto, borderRadius: radius.md, overflow: 'hidden' }}
      accessibilityRole="image"
      accessibilityLabel={`Zona aproximada de atención, radio de ${Math.round(radioM)} metros`}
    >
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: zonaLat, longitude: zonaLon, latitudeDelta: delta, longitudeDelta: delta }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // El control de zoom nativo de Google se apaga: es un control, y
        // acá no hay nada que controlar (precedente S53, Vitales).
        zoomControlEnabled={false}
      >
        <Circle
          center={{ latitude: zonaLat, longitude: zonaLon }}
          radius={radioM}
          strokeColor={acento}
          strokeWidth={1.5}
          fillColor={conAlfa(acento, 0.14)}
        />
      </MapView>
    </View>
  )
}
