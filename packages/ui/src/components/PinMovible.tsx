/**
 * PinMovible — EL PUNTO SE PONE A MANO, Y ES OBLIGATORIO.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §7, y es de las decisiones que la letra
 * marca como caras después:
 *
 *   > *"El punto se puede mover a mano, **y es obligatorio**. Places
 *   > falla en Quito más de lo que uno espera —urbanizaciones nuevas,
 *   > casas sin numeración—. **Si Places no encuentra la casa, el punto
 *   > igual existe.**"*
 *
 * ── EL CHECK DEL MOTOR TIENE SU ESPEJO EN EL TIPO ──────────────────────
 * A confirmó `chk_direccion_con_punto`: lat/lon **obligatorios** en
 * `direcciones_guardadas`. Acá `lat`, `lon` y `onMover` son **requeridos
 * y no admiten `null`** — "dirección sin punto" no es expresable en la
 * pieza, igual que no lo es en la tabla. Sin punto todavía, la pantalla
 * pasa el centro de la ciudad como semilla y el usuario lo mueve; **el
 * estado "no hay punto" no existe en ningún lado del camino.**
 *
 * ── SE MUEVE EL MAPA, NO EL PIN — y es la decisión de forma ────────────
 * El pin está FIJO en el centro de la pieza y lo que se arrastra es el
 * MAPA debajo. **No es capricho de estilo: es el patrón de la industria
 * para ajustar una ubicación** (Uber, Rappi, Glovo) y la razón es
 * física — **arrastrando un marcador, el dedo tapa exactamente el punto
 * que hay que colocar con precisión**, y la mano se levanta sin haber
 * visto nunca dónde quedó. Con el mapa moviéndose debajo, el punto está
 * siempre a la vista y el dedo trabaja lejos de él.
 *
 * Consecuencia técnica declarada: el pin **no es un `Marker`** — es una
 * capa dibujada encima. Por eso no participa de los gestos del mapa y no
 * puede quedar desincronizado del centro: *es* el centro.
 *
 * ── EL VALOR SE CONFIRMA AL SOLTAR, NO MIENTRAS ARRASTRA ───────────────
 * `onMover` sale de `onRegionChangeComplete`, jamás del evento continuo:
 * avisar en cada cuadro haría que la pantalla escriba decenas de estados
 * intermedios que nadie pidió, y en un formulario eso se paga en
 * re-renders y en un valor que "tiembla" mientras el dedo está apoyado.
 *
 * ── ⏪ LA CRUZ, y por qué no es un glifo ───────────────────────────────
 * 🔴 ═══ DEROGADA POR F-PIN — S100d-B ═══ Firma del founder, **pedida TRES
 * veces** (puntos 16, 23 y 26 del gate): *«sigue sin pin, pone un punto:
 * quiero un pin como el de Uber»*. **La cláusula de abajo NO SE BORRA** —
 * se tacha con fecha y razón, porque su argumento era defendible y hay que
 * poder ver contra qué se decidió.
 *
 * **Qué de aquel argumento resultó falso, y no es «el gusto del founder»:**
 * decía que *el punto ya dice «acá»*. **No lo dice.** La propia voz de la
 * pantalla lo desmiente: `direccion.puntoAyuda` reza *«Ajustá el mapa hasta
 * que **el pin** quede sobre tu puerta»* ⇒ **la palabra y el dibujo salían
 * de dos lugares distintos y no coincidían** — el defecto que esta casa
 * lleva un mes cazando, acá entre una voz y una silueta. *Un punto no dice
 * «acá»: dice «algo». La punta de una gota sí señala.*
 *
 * **Y el costo que frenaba —«un glifo nuevo exige §6b»— desapareció:** la
 * gota **ya existe firmada en el registry** (`Icono` `ubicacion`), así que
 * no nace un dibujo: se **reusa el que la casa ya tenía**, por `gota.ts`.
 *
 * ⏪ *(letra derogada, conservada:)* «Punto relleno + anillo, el mismo
 * lenguaje con que `MapaRecorrido` marca su posición viva. **No se dibuja
 * un pin-gota**: el "pin placeholder" murió en S58 y no se resucita, y un
 * glifo nuevo exigiría hoja de contacto y gate por ícono (§6b) para un
 * elemento que no lo necesita — el punto ya dice "acá", que es todo lo que
 * tiene que decir.»
 *
 * ── 🔴 LOS DOS DEFECTOS QUE CURA ESTA TANDA (punto 27 · causa raíz de A) ──
 * **①  «no hay zoom in/out».** No era un olvido: es una trampa de la
 * librería. `react-native-maps` declara en su nativo de Android
 * `@ReactProp(name = "zoomEnabled", defaultBoolean = false)`
 * (`MapManager.java:266` → `setZoomGesturesEnabled`), mientras su propia
 * doc dice `@default true` **y deja escrito el `TODO: Why is the Android
 * reactprop defaultvalue set to false?`** (`dist/src/MapView.d.ts:592-601`).
 * ⇒ **no pasar la prop deja el pinch APAGADO.** `MapaZona` y `MapaRecorrido`
 * la setean explícita y por eso nunca lo pisaron: *el único mapa de la casa
 * donde hacer zoom ES el trabajo era justo el único que no la declaraba.*
 *
 * ⚠️ **EL LÍMITE DE ESTA CURA, declarado por A y conservado tal cual:**
 * `zoomControlEnabled` sí nace en `true`, así que los botones +/− de Android
 * **deberían** estar. El founder dice que no hay zoom. O pellizcó y no pasó
 * nada —lo explica ①— o los botones tampoco aparecen —**eso ① no lo
 * explica**—. **Sin aparato no se puede distinguir.** La cura es correcta
 * bajo las dos lecturas; **si al verificar los botones tampoco están, hay un
 * SEGUNDO defecto y no es éste.**
 *
 * **② «al cambiar la dirección no la ajusta en el mapa».** `initialRegion`
 * es **NO CONTROLADO**: se lee una vez, al montar. Cuando el dueño elige una
 * predicción de Places la pantalla actualiza `lat`/`lon` **y el mapa las
 * ignoraba**. Y el borde que lo volvía intermitente —por eso «a veces sí»—:
 * la pieza solo se monta con punto, así que **sin punto previo MONTA y el
 * `initialRegion` toma bien; con punto previo ya está montada y no se
 * mueve.** *El defecto se ve solo EDITANDO, jamás creando.*
 *
 * 🔴 **LA PREDICCIÓN FALSABLE DE A, que se corre ANTES de creerle a esta
 * cura:** con una dirección que YA tiene punto, elegir una predicción lejana
 * **no** debe mover el mapa (defecto reproducido); con una dirección SIN
 * punto, **sí** debe moverlo. **Si las dos se comportan igual, el mecanismo
 * está mal y se vuelve a empezar.** *No se corrió: no hay aparato.*
 *
 * POR OTA, SIN BUILD: `react-native-maps` ya es dependencia de las dos
 * apps y de este paquete, y su módulo nativo está horneado desde la
 * 1.0.3 — el mismo argumento con el que entró `MapaZona`. L-134 pide
 * build para un módulo NUEVO; éste no lo es.
 *
 * WEB: variante `.web.tsx` con placeholder digno — el patrón de la casa
 * (`MapaRecorrido`, `MapaZona`), no un mecanismo nuevo.
 */

import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView from 'react-native-maps'
import Svg, { Circle, Path } from 'react-native-svg'

import { desplazamientoDePunta, GOTA_D, GOTA_OJO } from './gota'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

/** Encuadre de calle: suficiente para reconocer la cuadra. */
const DELTA = 0.0025
/** El lado de la gota. **34 y no 16**: el punto viejo medía 16 y el founder
 *  lo leyó como *«un punto»*; una marca que tiene que señalar una puerta en
 *  una cuadra necesita cuerpo. Con 34 de lado, la silueta mide **~20 × 25
 *  dp** (la gota ocupa 14/24 de ancho y 18/24 de alto de su caja). */
const GOTA = 34
/** El halo blanco que la despega del lienzo — medido en la referencia de
 *  Uber: sin él, una gota oscura sobre asfalto oscuro desaparece. */
const HALO = 2.5

export interface PinMovibleProps {
  /** OBLIGATORIAS — ver el espejo del CHECK en el encabezado. */
  lat: number
  lon: number
  /** Se llama al SOLTAR, jamás durante el arrastre. */
  onMover: (lat: number, lon: number) => void
  /** Alto del bloque. Default 220 — un mapa de ajuste necesita cuadra. */
  alto?: number
  /**
   * La voz de la casa para el lector de pantalla: *"Mové el mapa para
   * ajustar el punto de entrega"*. Obligatoria — un mapa sin label es
   * una superficie muda para quien no lo ve.
   */
  etiqueta: string
}

export function PinMovible({ lat, lon, onMover, alto = 220, etiqueta }: PinMovibleProps) {
  const { theme } = useTheme()
  const mapa = useRef<MapView>(null)
  // El centro que la pieza YA reportó: evita devolverle a la pantalla el
  // mismo par que acaba de pasarnos (un ciclo de escritura por cada
  // re-render del padre).
  const ultimo = useRef({ lat, lon })

  /* 🔴 ② EL MAPA SIGUE A LAS PROPS — la cura del «no lo ajusta al cambiar
     la dirección» (ver la cabecera).

     **El guard es el que ya estaba escrito y por eso la cura es barata:**
     `ultimo` guarda lo último que la pieza REPORTÓ. Comparar las props
     contra él distingue las dos causas posibles de un cambio:
       · vienen IGUALES a lo reportado ⇒ **lo movió el dedo** ⇒ no se toca
         nada. *Animar acá sería arrancarle el mapa de la mano.*
       · vienen DISTINTAS ⇒ **se lo cambiaron desde afuera** (Places) ⇒ se
         anima hasta ahí.
     *Sin esa distinción, un `animateToRegion` en cada cambio pelea contra el
     arrastre y el mapa tiembla.* El regalo es de la pista A. */
  useEffect(() => {
    if (lat === ultimo.current.lat && lon === ultimo.current.lon) return
    ultimo.current = { lat, lon }
    mapa.current?.animateToRegion(
      { latitude: lat, longitude: lon, latitudeDelta: DELTA, longitudeDelta: DELTA },
      motion.duration.estandar,
    )
  }, [lat, lon])

  return (
    <View
      accessible
      accessibilityLabel={etiqueta}
      style={{ height: alto, borderRadius: radius.suave, overflow: 'hidden' }}
    >
      <MapView
        ref={mapa}
        style={{ flex: 1 }}
        initialRegion={{ latitude: lat, longitude: lon, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        onRegionChangeComplete={(r) => {
          if (r.latitude === ultimo.current.lat && r.longitude === ultimo.current.lon) return
          ultimo.current = { lat: r.latitude, lon: r.longitude }
          onMover(r.latitude, r.longitude)
        }}
        /* 🔴 ① EL PINCH, DECLARADO EXPLÍCITO. **No es redundante: en Android
           el nativo lo apaga si nadie lo pide** (`defaultBoolean = false`,
           contra el `@default true` de su propia doc — ver la cabecera).
           ⛔ **No se borra por «ya viene en true»:** viene en true en la
           documentación y en false en el aparato. */
        zoomEnabled
        scrollEnabled
        // El pin es el CENTRO: rotar o inclinar desalinearía lo que el
        // usuario cree que está marcando.
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      />
      {/* La marca, fija y por encima. `pointerEvents="none"`: los gestos
          son del mapa — si esta capa los capturara, el mapa no se movería
          justo en el punto donde el usuario apoya el dedo. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* 🔴 LA GOTA, SUBIDA HASTA QUE SU PUNTA CAE EN EL CENTRO.
            **Hallazgo de la pista A y es el que salva la cura:** con el disco
            viejo, «lo que el ojo lee» y «el centro que el mapa reporta» eran
            el mismo píxel. Con una gota **el ojo lee la PUNTA**, así que
            dibujarla centrada haría marcar ~medio glifo más arriba de lo que
            la persona cree ⇒ **un sesgo sistemático en cada dirección
            guardada**. El desplazamiento se DERIVA de la silueta
            (`gota.ts`): si la forma cambia, el ancla la sigue sola. */}
        <View style={{ transform: [{ translateY: -desplazamientoDePunta(GOTA) }] }}>
          <Svg width={GOTA} height={GOTA} viewBox="0 0 24 24">
            {/* EL HALO — la gota se dibuja DOS veces: primero engrosada en
                papel, después llena. Es lo que la despega de cualquier
                lienzo (medido en la referencia de Uber: su pin lleva ese
                contorno claro). Sin él, una marca oscura sobre asfalto
                oscuro desaparece justo cuando hay que ubicarla. */}
            <Path
              d={GOTA_D}
              fill={theme.text.inverse}
              stroke={theme.text.inverse}
              strokeWidth={HALO}
              strokeLinejoin="round"
            />
            <Path d={GOTA_D} fill={theme.accent.control} />
            {/* EL OJO — el hueco claro del centro. En la referencia es lo que
                impide que la gota se lea como una mancha: el contorno interno
                le devuelve la silueta a la forma. */}
            <Circle cx={GOTA_OJO.cx} cy={GOTA_OJO.cy} r={GOTA_OJO.r} fill={theme.text.inverse} />
          </Svg>
        </View>
      </View>
    </View>
  )
}
