import type { ReactNode } from 'react'

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
  /**
   * 🔴 **LA IDENTIDAD DEL MARCADOR VIVO — SLOT, jamás diccionario**
   * (S100-B · pedido de D con su caso: la pantalla EN CAMINO).
   *
   * **N14 es explícita: `paseo = la cara de la mascota · entrega = la
   * moto`**, y *«el mapa de e-PetPlace se reconoce como de
   * e-PetPlace»*. Hasta hoy el marcador vivo era **un punto de color
   * fijo** ⇒ **una entrega se dibujaba con la identidad de un paseo.**
   *
   * **Es SLOT y no una unión de tipos** por la misma razón que el ícono
   * de `EscaleraEstados`: **el mapa sabe DÓNDE va la marca; QUÉ marca
   * es, lo sabe quien lo monta.** Un diccionario acá adentro obligaría
   * a esta pieza a conocer `PinEnMapa`, la moto y la mascota — y a
   * crecer con cada oficio nuevo.
   *
   * Ausente = el punto de color de siempre (el paseo no cambia).
   */
  marcadorVivo?: ReactNode
  /**
   * **EL DESTINO — el otro extremo, y no es decoración.**
   *
   * *Sin él, una moto moviéndose no dice «tu pedido se acerca»: dice
   * «algo se mueve»* (D, y es el argumento que decide esta prop). Con
   * destino, **el encuadre deja de seguir al último punto y abarca LOS
   * DOS EXTREMOS** — que es lo que convierte el movimiento en una
   * distancia que se acorta.
   *
   * Fijo: no se anima ni se sigue. Sin él, el modo `vivo` se comporta
   * exactamente como antes.
   */
  destino?: PuntoLatLng
  /** La marca del destino. Mismo criterio de slot que `marcadorVivo`;
   *  sin ella el destino existe para el encuadre pero no se dibuja. */
  marcadorDestino?: ReactNode
  /**
   * ── ⚠️ LO QUE ESTE ENSANCHE **NO** TRAE: LA INTERPOLACIÓN ──────────
   * D la pidió con razón —*«el GPS llega cada ~60 s; sin interpolación
   * el pin salta y parece roto»*, y la receta ⑤ ya decidió su forma:
   * bezier de la casa, lado entrada, **jamás spring**— y **NO se
   * construyó acá, con su motivo:**
   *
   * **Es MOVIMIENTO NATIVO** (`AnimatedRegion`/`MarkerAnimated` de
   * `react-native-maps`, que es `Animated` de RN y no Reanimated), y
   * **su modo de falla solo se ve en un aparato.** Hoy hay **0 envíos
   * con track** (medido por A): construirla ahora sería escribir una
   * animación que nadie puede mirar, sobre un dato que todavía no
   * existe.
   *
   * ⇒ **La forma queda decidida y el trabajo declarado**, no fingido.
   * *Entregar el slot y el encuadre —que sí se verifican— y frenar lo
   * que no se puede ver, es la mitad honesta del pedido.* Su disparo:
   * el primer envío con track y un teléfono a mano.
   */
}
