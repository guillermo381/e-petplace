/**
 * MapaPunto — EL PUNTO EXACTO, ADENTRO DE LA PANTALLA (S109-D).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ ES PIEZA NUEVA Y NO `MapaZona` CON RADIO CHICO
 * ═══════════════════════════════════════════════════════════════════════
 * `MapaZona` lo prohíbe con todas las letras en su propia cabecera: *«esta
 * pieza JAMÁS recibe la coordenada exacta… si alguien le pasa lat/lon de la
 * sede, es defecto, no configuración»*, y su etiqueta de accesibilidad dice
 * **«Zona aproximada de atención»** — un lector de pantalla anunciaría
 * «aproximada» sobre la casa exacta a la que hay que ir.
 *
 * > *Repurposear una pieza cuyo nombre y cuya etiqueta dicen «aproximada»
 * > para mostrar un punto exacto no ahorra una pieza: rompe la que existía.*
 *
 * ── LOS DOS CASOS QUE LA LETRA DE S84 NO CUBRE POR IGUAL ────────────────
 * S84 firmó que **la coordenada exacta no viaja al teléfono**, y esa firma
 * es sobre **la FAMILIA mirando la vitrina de un prestador**: ahí el centro
 * viene desplazado y estable por id (`D-624`), y `MapaZona` es su pieza.
 * **Acá el actor es el PRESTADOR con la dirección de la casa a la que va**,
 * sobre el snapshot que la cita ya le entrega al pagar (`D-339`) — un dato
 * que él necesita para llegar y que la app ya le muestra en texto.
 * *Son dos casos y la letra cubre uno.* Esta pieza es el otro, y por eso
 * nace aparte en vez de ablandar la regla de la primera.
 *
 * ── EL PUNTO, NO UN PIN-GOTA ────────────────────────────────────────────
 * Misma geometría que el marcador vivo de `MapaRecorrido` — **16 px de
 * relleno + anillo blanco de 2.5** — porque `PinMovible` ya fijó la
 * doctrina: *«el pin placeholder murió en S58 y no se resucita… el punto ya
 * dice "acá", que es todo lo que tiene que decir»*. El anillo blanco no es
 * adorno: separa la marca de un mapa cuyo contraste es impredecible.
 *
 * ── ES UNA VISTA, NO UN EXPLORADOR ──────────────────────────────────────
 * Sin scroll, sin zoom, sin toolbar — igual que `MapaZona`. Quien quiera
 * navegar sale a la app de mapas por el botón de su consumidor: **ver dónde
 * es y salir a manejar son dos actos**, y sólo el segundo saca de la app.
 *
 * ⚠️ **EL GUARD ES DEL CONSUMIDOR Y NO ES OPCIONAL.** Sin la meta-data
 * `com.google.android.geo.API_KEY` en el APK, montar un `MapView` **mata la
 * app en hilo nativo** y ninguna `ErrorBoundary` lo atrapa (S80-B19). Esta
 * pieza no puede protegerse sola —el flag vive en la app, que es quien
 * puede sondear su propio manifiesto—, así que **quien la monte la gatea**.
 *
 * POR OTA, SIN BUILD: `react-native-maps` ya es dependencia de las dos apps
 * y de este paquete, y su módulo nativo está horneado desde la 1.0.3 (mismo
 * argumento que `MapaZona`). `L-134` pide build para un módulo NUEVO; éste
 * no lo es.
 *
 * WEB: variante `.web.tsx` con placeholder digno — el patrón de la casa que
 * ya usan `MapaRecorrido` y `MapaZona`, para que la galería pueda montar la
 * pieza sin romperse.
 */

import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'

export interface MapaPuntoProps {
  /** La coordenada EXACTA del destino.
   *
   *  🔴 **EL RIESGO ESPEJO, DECLARADO Y NO CERRADO (S109-D → S109-B).**
   *  Desde S109-B pasarle a `MapaZona` una coordenada exacta **es un error de
   *  tipo** —sus props se llaman `zonaLat`/`zonaLon`—. *La dirección inversa
   *  sigue abierta: nada impide pasarle a ESTA pieza un centro DESPLAZADO*, y
   *  el resultado sería **un punto de aspecto exacto sobre una coordenada
   *  deliberadamente imprecisa** — la promesa de precisión que `MapaZona` existe
   *  para no hacer, hecha por la pieza de al lado.
   *
   *  ⚠️ **NO se cierra hoy, y con su razón:** esta pieza tiene **UN solo
   *  consumidor** (`SeccionDireccion`) y su dato es inequívoco —`direccion.lat`
   *  del snapshot `D-339`—, así que un guard sería *una defensa sin caso*.
   *
   *  🔑 **DISPARO: su SEGUNDO consumidor.** El día que la vitrina de la familia
   *  quiera decir «más o menos por acá» con un punto, entra por acá **y nada va
   *  a frenarlo** — que es exactamente la forma que esta sesión pagó siete
   *  veces. *Una condición escrita lejos del código que la cumple es una
   *  condición que nadie va a leer el día que se cumpla*, y por eso vive acá y
   *  no sólo en el traspaso.
   *
   *  Y por qué NO lleva prefijo, que es la otra mitad de la decisión:
   *  `lat`/`lon` significa en esta pieza exactamente lo que significa en el
   *  resto de la casa. La zona necesitaba prefijo porque su coordenada **no es**
   *  eso — el prefijo marca la EXCEPCIÓN. *Renombrar lo normal para que se
   *  parezca a la excepción invierte cuál de las dos lleva la carga de
   *  explicarse.* */
  lat: number
  lon: number
  /** Alto del bloque. Default 160 — el mismo que `MapaZona`. */
  alto?: number
  /** Qué se anuncia. Lo pone el consumidor porque es EL DATO, no la pieza:
   *  «la casa de Thor» y «la sede» se dicen distinto y esta pieza no sabe
   *  cuál es. Sin él, un rótulo neutro y honesto. */
  etiqueta?: string
}

/** Grados de latitud por metro (aprox) — el mismo de `MapaZona`. */
const GRADO_POR_METRO = 1 / 111_320

/** El encuadre se declara en METROS y no en grados: «la cuadra» es una
 *  distancia, y un delta suelto es un número que nadie puede discutir.
 *  120 m de radio ⇒ se ve la esquina, que es lo que orienta a quien llega. */
const RADIO_VISTA_M = 120

export function MapaPunto({ lat, lon, alto = 160, etiqueta }: MapaPuntoProps) {
  const { theme } = useTheme()
  const delta = RADIO_VISTA_M * 2 * GRADO_POR_METRO

  return (
    <View
      // El mapa no recibe toques: es una vista, no un explorador.
      pointerEvents="none"
      style={{ height: alto, borderRadius: radius.md, overflow: 'hidden' }}
      accessibilityRole="image"
      accessibilityLabel={etiqueta ?? 'Mapa del destino'}
    >
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: lat, longitude: lon, latitudeDelta: delta, longitudeDelta: delta }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // El control de zoom nativo de Google se apaga: es un control, y acá
        // no hay nada que controlar (precedente S53, Vitales).
        zoomControlEnabled={false}
      >
        <Marker coordinate={{ latitude: lat, longitude: lon }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: radius.full,
              backgroundColor: theme.accent.control,
              borderWidth: 2.5,
              borderColor: palette.white,
            }}
          />
        </Marker>
      </MapView>
    </View>
  )
}
