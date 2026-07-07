/**
 * Tipos compartidos de MapaRecorrido — los importan la implementación
 * nativa (MapaRecorrido.tsx) y la web (MapaRecorrido.web.tsx) para que
 * el contrato no derive entre plataformas.
 */

export interface PuntoLatLng {
  lat: number
  lng: number
}

export type MapaRecorridoModo = 'vivo' | 'recorrido'

export type MapaRecorridoCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

export interface MapaRecorridoProps {
  puntos: PuntoLatLng[]
  modo: MapaRecorridoModo
  /** Color del trazo/marker. Default: cuidado (el paseo es Capa 2). */
  capa?: MapaRecorridoCapa
  /** Centro cuando NO hay puntos. Default: Quito (soft launch EC). */
  centroInicial?: PuntoLatLng
  /** Alto del bloque. El ancho es 100% del padre. */
  alto?: number
}
