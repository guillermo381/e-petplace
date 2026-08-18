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
   * 🔴 **QUIÉN ESTÁ MIRANDO — y es el eje que decide los gestos** (S100d-B ·
   * punto 24① del gate, pedido por la pista D **con la causa medida en la
   * fuente**).
   *
   * **El literal del founder:** *«el mapa NO es navegable»*. **Y la causa
   * estaba escrita en esta misma pieza sin que nadie la releyera:**
   * `scrollEnabled={!esVivo}` / `zoomEnabled={!esVivo}`, con su comentario
   * *«gestos apagados (el paseador no navega el mapa, camina)»*.
   *
   * ⇒ **La decisión se tomó para el PASEO y la heredó la ENTREGA, que es
   * otro acto.** *El paseador camina con el perro en la mano y no navega
   * nada; la familia mira dónde viene su pedido y quiere acercarse a su
   * cuadra.* Mismo `modo="vivo"`, dos personas distintas.
   *
   * ── POR QUÉ ES UNA PROP Y NO SE DERIVA DE `destino` ─────────────────
   * Derivarlo de *«hay destino ⇒ es una entrega»* funcionaría **hoy** —D es
   * el único `vivo` con destino— y **se rompería sin síntoma** el día que un
   * paseo lleve destino. *Es la familia de D-806: un acoplamiento entre dos
   * valores que casualmente coinciden no tiene síntoma hasta que dejan de
   * coincidir.*
   *
   * **Default `'operador'` ⇒ cero regresión para el paseo.**
   *
   * **`'espectador'` enciende TRES cosas juntas, y ninguna sirve sola:**
   * ① pan y zoom · ② **el gesto SUSPENDE el auto-encuadre** —si no, el
   * próximo fix del GPS le arranca el mapa de la mano— · ③ **el control de
   * RECENTRAR**, que es lo que devuelve el encuadre después de ②. *Sin ③, ②
   * deja al usuario perdido sin camino de vuelta; sin ②, ① es una promesa
   * que el próximo fix rompe.*
   *
   * ⚠️ **`MapaRecorrido.web.tsx` no implementa esto** (ni `destino`, ni los
   * marcadores): **solo se gatea en aparato.**
   */
  mirada?: 'operador' | 'espectador'
  /**
   * Cuánto aire dejarle por abajo al control de RECENTRAR, en dp.
   *
   * **Existe porque la pieza no sabe qué la tapa.** En EN CAMINO el borde
   * superior del mapa lo ocupa la carta flotante del rango y el inferior una
   * hoja arrastrable (medido por D) ⇒ un control fijo abajo-derecha queda
   * debajo de la hoja. *Quien monta sabe qué cubre su mapa; la pieza no —
   * y adivinarlo sería la estimación que esta casa ya paga cara.*
   */
  aireInferior?: number
  /** La voz del control de recentrar — *«Volver al recorrido»*. **Obligatoria
   *  en la práctica cuando `mirada='espectador'`:** un botón sin nombre no se
   *  activa a ciegas. Se deja opcional porque con `'operador'` no existe. */
  etiquetaRecentrar?: string
  /**
   * ── ⚠️ LO QUE ESTE ENSANCHE **NO** TRAE: LA INTERPOLACIÓN ──────────
   * D la pidió con razón —*«el GPS llega cada ~60 s; sin interpolación
   * el pin salta y parece roto»*, y la receta ⑤ ya decidió su forma:
   * bezier de la casa, lado entrada, **jamás spring**— y **NO se
   * construyó acá, con su motivo:**
   *
   * 🔴 **Y AL MEDIRLO APARECIÓ ALGO QUE CORRIGE MI PROPIA ENTREGA: LA
   * INTERPOLACIÓN YA ESTÁ CONSTRUIDA — vive en `PinEnMapa`**
   * (`px.value = withTiming(x, conf)`, con el bezier de la casa). *No
   * hay que escribirla: hay que poder alimentarla.*
   *
   * **Y ahí está el costo real, que no es el que yo supuse:**
   * `PinEnMapa` **se posiciona en PÍXELES** porque es él quien anima el
   * viaje. El `Marker` de `react-native-maps` —lo que este ensanche
   * usa— **posiciona por COORDENADA y reubica de golpe**: resuelve la
   * identidad y **deja la interpolación fuera de alcance.**
   *
   * ⇒ **Las dos vías NO son equivalentes, y la elección es de mesa:**
   *   · **`Marker` + slot** (lo entregado): identidad ✅ · interpolación
   *     ❌ · **costo cero, cero riesgo**, ya está.
   *   · **exponer proyección** (`mapRef.pointForCoordinate`) y montar
   *     `PinEnMapa`: identidad ✅ · **interpolación ✅ y ya escrita** ·
   *     costo **acotado** — hay que recalcular píxeles cuando la cámara
   *     se mueve, y en modo `vivo` **la cámara solo la mueve esta
   *     pieza** (`scrollEnabled={!esVivo}`), así que sabe exactamente
   *     cuándo. **Su gate es en aparato.**
   *
   * *Mi primera nota decía «no se construyó porque es movimiento nativo
   * que no puedo probar». Era cierto a medias y llevaba a la conclusión
   * equivocada: lo que no se puede probar sin aparato no es la
   * animación —ya existe y ya se firmó— sino **la proyección que la
   * alimenta**.* Con 0 envíos con track hoy, el freno sigue en pie; lo
   * que cambia es **qué se está frenando y cuánto cuesta destrabarlo**.
   */
}
