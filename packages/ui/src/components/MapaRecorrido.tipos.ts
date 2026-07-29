/**
 * Tipos compartidos de MapaRecorrido — los importan la implementación
 * nativa (MapaRecorrido.tsx) y la web (MapaRecorrido.web.tsx) para que
 * el contrato no derive entre plataformas.
 */

/** Una coordenada del MUNDO — un lugar, sin tiempo (el centro de
 *  encuadre). S81 (junta A+B): el tipo se PARTIÓ en dos — antes un solo
 *  tipo con `t?` servía a centro y track, y la opcionalidad dejó mudo
 *  un rename (`ts`) que compiló verde. */
export interface PuntoLatLng {
  lat: number
  lng: number
}

/** Un punto de TRACK — una MEDICIÓN, con su instante. `t` es REQUERIDO:
 *  el dato lo banca (12/12 tracks, 100% de puntos con `t`, medido) — la
 *  tolerancia protegía un fantasma. El parser de api lo GARANTIZA por
 *  la frontera jsonb (assert de datos); este tipo caza los renames. */
export interface PuntoTrackMapa extends PuntoLatLng {
  /** ISO timestamp de la lectura — habilita orden y filtro del dibujo. */
  t: string
}

export type MapaRecorridoModo = 'vivo' | 'recorrido'

export type MapaRecorridoCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

export interface MapaRecorridoProps {
  puntos: PuntoTrackMapa[]
  modo: MapaRecorridoModo
  /** Color del trazo/marker. Default: cuidado (el paseo es Capa 2). */
  capa?: MapaRecorridoCapa
  /** Centro cuando NO hay puntos. Default: Quito (soft launch EC). */
  centroInicial?: PuntoLatLng
  /** Alto del bloque. El ancho es 100% del padre. */
  alto?: number
  /** S82-B (promoción del override probado en pantalla real — regla 80):
   *  el mapa A SANGRE (A6 §9bis.1, M1 §9 "se ensancha, no se duplica").
   *  Mata la caja propia del componente (radius.md + hairline implícito):
   *  el mapa pinta hasta el borde del viewport — el FONDO de la pantalla,
   *  no una tarjeta. Origen: el override LOCAL declarado de la cara MAPA
   *  del cliente (`paseo/[atencionId]` S81-A), que lo lograba empujando
   *  las esquinas curvas fuera del viewport con desborde negativo; con
   *  este modo esa gimnasia MUERE — el consumidor migra al tocarse
   *  (D-318, lo ejecuta A). Default false: la caja sigue siendo el
   *  reposo de los consumidores en flujo. */
  aSangre?: boolean
}
