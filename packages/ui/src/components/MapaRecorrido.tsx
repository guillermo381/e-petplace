/**
 * MapaRecorrido — el track GPS del paseo sobre mapa real (S44-B2.6).
 * Implementación NATIVA (react-native-maps; la web ve
 * MapaRecorrido.web.tsx, un placeholder digno — Metro resuelve por
 * extensión de plataforma).
 *
 * Proveedor default (Google en Android / Apple en iOS) — corre en
 * Expo Go con la key de Expo. API key propia para dev builds: nota
 * de config registrada para B5/EAS (D-289).
 *
 * Dos registros sobre cartografía: el TRAZO va en capaText (la
 * variante AA rinde más sobre mapa claro); el punto de posición en
 * vivo va en el hex PURO (registro gráfico del indicador) con anillo
 * blanco para despegarlo del mapa.
 *
 * modo 'vivo': sigue el último punto con animateToRegion CORTO
 * (motion.duration.normal, ease del SDK — sin rebotes, Ley 6);
 * gestos apagados (el paseador no navega el mapa, camina).
 * modo 'recorrido': fitToCoordinates con aire al montar; zoom y
 * pan HABILITADOS (decisión B2.6: acercarse a una esquina del paseo
 * aporta al parte), rotate/pitch apagados (desorientan).
 *
 * SIN puntos: mapa centrado en centroInicial (default Quito), sin
 * trazo y SIN cartel — el estado del GPS lo comunica la pantalla,
 * no el mapa.
 *
 * TEMAS (decisión registrada B2.6): mapa CLARO en los 3 temas en F1
 * — es una foto del mundo, no una superficie del sistema. El dark
 * style de cartografía queda evaluable post-F1 si el gate físico lo
 * pide.
 */

import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import type { MapaRecorridoProps } from './MapaRecorrido.tipos'

export type {
  MapaRecorridoProps,
  MapaRecorridoModo,
  MapaRecorridoCapa,
  PuntoLatLng,
} from './MapaRecorrido.tipos'

const CAPA_A_KEY = {
  vida: 'identidad',
  cuidado: 'cuidado',
  comunidad: 'comunidad',
  comunidadAmplia: 'comunidadAmplia',
} as const

// Quito (soft launch EC) — solo como centro sin puntos.
const CENTRO_DEFAULT = { lat: -0.1807, lng: -78.4678 }
// ~4 cuadras de encuadre en modo vivo.
const DELTA_VIVO = 0.004
const ALTO_DEFAULT = 220
const AIRE_ENCUADRE = 36

export function MapaRecorrido({
  puntos,
  modo,
  capa = 'cuidado',
  centroInicial,
  alto = ALTO_DEFAULT,
}: MapaRecorridoProps) {
  const { theme } = useTheme()
  const mapRef = useRef<MapView>(null)

  const k = CAPA_A_KEY[capa]
  const colorTrazo = 'capaText' in theme ? theme.capaText[k] : theme.capa[k]
  const colorPunto = theme.capa[k]

  const coords = puntos.map((p) => ({ latitude: p.lat, longitude: p.lng }))
  const ultimo = coords.length > 0 ? coords[coords.length - 1] : null
  const esVivo = modo === 'vivo'

  const centro = ultimo ?? {
    latitude: (centroInicial ?? CENTRO_DEFAULT).lat,
    longitude: (centroInicial ?? CENTRO_DEFAULT).lng,
  }

  // vivo: seguir el último punto — corto y sobrio, jamás rebote (Ley 6).
  useEffect(() => {
    if (!esVivo || ultimo === null) return
    mapRef.current?.animateToRegion(
      { ...ultimo, latitudeDelta: DELTA_VIVO, longitudeDelta: DELTA_VIVO },
      motion.duration.normal,
    )
  }, [esVivo, ultimo?.latitude, ultimo?.longitude])

  function encuadrarRecorrido() {
    if (esVivo || coords.length === 0) return
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: AIRE_ENCUADRE, right: AIRE_ENCUADRE, bottom: AIRE_ENCUADRE, left: AIRE_ENCUADRE },
      animated: false,
    })
  }

  return (
    <View style={{ height: alto, borderRadius: radius.md, overflow: 'hidden' }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{ ...centro, latitudeDelta: DELTA_VIVO, longitudeDelta: DELTA_VIVO }}
        onMapReady={encuadrarRecorrido}
        scrollEnabled={!esVivo}
        zoomEnabled={!esVivo}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {coords.length > 1 && (
          <Polyline
            coordinates={coords}
            strokeColor={colorTrazo}
            strokeWidth={4.5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {esVivo && ultimo !== null && (
          <Marker coordinate={ultimo} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: radius.full,
                backgroundColor: colorPunto,
                borderWidth: 2.5,
                borderColor: palette.white,
              }}
            />
          </Marker>
        )}
      </MapView>
    </View>
  )
}
