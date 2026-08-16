/**
 * LienzoMapa — UN MAPA DE VERDAD PARA GATEAR PIEZAS DE MAPA (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ EXISTE, y es la ley de método firmada por el founder:
 * **LA PIEZA SE GATEA DONDE VIVE, no en una lámina.** Un pin se juzga
 * sobre un mapa real; un campo, dentro de su formulario.
 *
 * Es la SEGUNDA muestra de la misma causa: el primer gate del ícono de
 * moto falló porque **se juzgaba la lámina y el destino era el mapa**.
 * Su costo lo midió el founder: *«estamos tardando más poniéndolo en la
 * galería y después acomodándolo, y llenando la galería de cosas que no
 * usamos»*.
 *
 * ⇒ **Cuando montar cuesta menos que ensayar, se monta.** Este archivo
 * ES ese cálculo: dos archivos chicos contra una lámina de rectángulos
 * de colores que ya falló una vez.
 * ═══════════════════════════════════════════════════════════════════
 *
 * NO ES UNA PIEZA DEL SISTEMA — vive en `gallery/` y no se exporta:
 * es instrumento de verificación, como el volcador de tokens. Ninguna
 * pantalla lo monta.
 *
 * ⚠️ SIN INTERACCIÓN, a propósito: acá se mira una marca sobre tiles
 * reales, no se explora un mapa. Un mapa que se arrastra invita a jugar
 * con el mapa en vez de mirar la pieza que se está gateando.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'
import MapView from 'react-native-maps'

import { radius } from '../tokens/radius'

export interface LienzoMapaProps {
  /** Lo que se monta ENCIMA de los tiles, centrado. */
  children: ReactNode
  alto?: number
}

/** Quito centro — el mapa del producto. La región es fija y el zoom
 *  elegido para que en el encuadre convivan **calle, manzana y verde**:
 *  los tonos contra los que una marca tiene que sobrevivir no se
 *  simulan, se buscan en el mapa de verdad. */
const REGION = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
}

export function LienzoMapa({ children, alto = 200 }: LienzoMapaProps) {
  return (
    <View style={{ height: alto, borderRadius: radius.md, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={REGION}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      />
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  )
}
