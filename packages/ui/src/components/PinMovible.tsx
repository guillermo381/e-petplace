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
 * ── LA CRUZ, y por qué no es un glifo ──────────────────────────────────
 * Punto relleno + anillo, el mismo lenguaje con que `MapaRecorrido` marca
 * su posición viva. **No se dibuja un pin-gota**: el "pin placeholder"
 * murió en S58 y no se resucita, y un glifo nuevo exigiría hoja de
 * contacto y gate por ícono (§6b) para un elemento que no lo necesita —
 * el punto ya dice "acá", que es todo lo que tiene que decir.
 *
 * POR OTA, SIN BUILD: `react-native-maps` ya es dependencia de las dos
 * apps y de este paquete, y su módulo nativo está horneado desde la
 * 1.0.3 — el mismo argumento con el que entró `MapaZona`. L-134 pide
 * build para un módulo NUEVO; éste no lo es.
 *
 * WEB: variante `.web.tsx` con placeholder digno — el patrón de la casa
 * (`MapaRecorrido`, `MapaZona`), no un mecanismo nuevo.
 */

import { useRef } from 'react'
import { View } from 'react-native'
import MapView from 'react-native-maps'

import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

/** Encuadre de calle: suficiente para reconocer la cuadra. */
const DELTA = 0.0025
const PUNTO = 16
const ANILLO = 3

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
  // El centro que la pieza YA reportó: evita devolverle a la pantalla el
  // mismo par que acaba de pasarnos (un ciclo de escritura por cada
  // re-render del padre).
  const ultimo = useRef({ lat, lon })

  return (
    <View
      accessible
      accessibilityLabel={etiqueta}
      style={{ height: alto, borderRadius: radius.suave, overflow: 'hidden' }}
    >
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: lat, longitude: lon, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        onRegionChangeComplete={(r) => {
          if (r.latitude === ultimo.current.lat && r.longitude === ultimo.current.lon) return
          ultimo.current = { lat: r.latitude, lon: r.longitude }
          onMover(r.latitude, r.longitude)
        }}
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
        <View
          style={{
            width: PUNTO,
            height: PUNTO,
            borderRadius: radius.full,
            backgroundColor: theme.accent.control,
            borderWidth: ANILLO,
            borderColor: theme.text.inverse,
            boxShadow: theme.elevacion.reposo,
          }}
        />
      </View>
    </View>
  )
}
