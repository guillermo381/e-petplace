/**
 * HiloDelDia — LO QUE PASÓ HOY, en el orden en que pasó (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **La media entra al hilo COMO LLEGA.** No hay álbum, no hay galería, no hay
 * un momento en que alguien «publica el resumen»: hay un día que avanza y un
 * hilo que lo sigue.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 LA TARJETA DE ESTADÍA NO ES UNA PIEZA NUEVA, Y ESO SE MIDIÓ ───────
 * El pedido nombraba dos cosas —«el hilo del día / la tarjeta de estadía»— y
 * el censo (protocolo 1c, pregunta 2) devolvió que **la segunda ya se puede
 * armar con lo que existe**:
 *
 *   `Tarjeta` (superficie) + `EscaleraEstados` (los estados de la estadía, en
 *   voz humana y **por prop**) + `HiloDelDia` (esta pieza)
 *
 * `EscaleraEstados` es exactamente la pieza correcta para los escalones de una
 * estadía —*«informar el progreso de un proceso multi-paso»*, con su desvío
 * aparte para lo que interrumpe— y su cabecera ya declara *«CERO DICCIONARIO
 * DE ESTADOS ADENTRO: las etiquetas llegan por prop»*, que es la condición que
 * el perímetro de esta tanda exige. **Envolver las tres en una cuarta pieza
 * habría sido una pieza que no hace nada** salvo fijar un layout que cada
 * superficie quiere distinto. *Reusar > adaptar > crear: acá alcanzó con
 * reusar, y se declara para que nadie la construya de nuevo.*
 *
 * ── LO QUE SÍ FALTABA: EL HILO ───────────────────────────────────────────
 * · `LineaDeVida` es el timeline del EXPEDIENTE: nodos de tipos distintos a lo
 *   largo de años, con su diccionario cerrado adentro. Acá es **un solo día**,
 *   entradas del mismo tipo, y **la voz llega por prop** — montarla obligaría
 *   a meterle al diccionario de la vida entera los eventos de una jornada.
 * · `EscaleraEstados` informa una SECUENCIA CON ORDEN CONOCIDO. El hilo no
 *   tiene pasos previstos: tiene lo que pasó.
 * · `EvidenciaFoto` captura y porta estado de subida — es del lado de quien
 *   sube, no de quien lee.
 *
 * ── EL ORDEN ES CRONOLÓGICO Y LA PIEZA NO LO TOCA ────────────────────────
 * Se dibuja `entradas` **tal como llega**. *No se ordena acá y no se invierte
 * acá:* si el prestador ve el día hacia abajo y la familia lo ve al revés, eso
 * es una decisión de cada superficie sobre el mismo hecho
 * (`METODO_TRES_PISTAS` §6: se comparte la FORMA, la VOZ es de cada lado), y
 * una pieza que ordenara por su cuenta le sacaría esa decisión a las dos.
 *
 * ── LEY 3 — LA HORA ES MÁQUINA, EL RESTO ES HUMANO ───────────────────────
 * La hora va en `dato` (mono tabular): **queda alineada en columna y el ojo
 * barre el día sin leerlo**. El texto de la entrada lo escribió una persona ⇒
 * DM Sans.
 *
 * ── LEY 13 · ESCALERA (§4b) ──────────────────────────────────────────────
 * **Peldaño 0** — sin entradas la pieza **no se monta**: el vacío del día lo
 * dice la pantalla con `EstadoVacio`, que sabe si es «todavía no pasó nada» o
 * «no pudimos cargarlo». *Un hilo vacío dibujado acá se leería como que el día
 * no tuvo nada, y eso puede ser falso.*
 * **Peldaño 1** — las entradas con su hora. **Peldaño 2** — la media real.
 *
 * ── DOSIS · TEMAS · MOVIMIENTO ───────────────────────────────────────────
 * Tokens puros, cero color propio: las dos apps y los tres temas sin variante.
 * **Sin animación de entrada** (Ley 6): las listas no se animan, y una entrada
 * que aparece con un gesto en medio de un scroll mueve lo que se está leyendo.
 */

import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { Separador } from './Separador'
import { Texto } from './Texto'
import { MiniaturaClip } from './MiniaturaClip'

export type MediaDelHilo =
  | {
      tipo: 'foto'
      /** Ya resuelta por la pantalla (URL firmada). */
      url: string
      /** Qué es, para quien no ve la pantalla. Por prop (perímetro §0). */
      accesibilidadEtiqueta: string
    }
  | {
      tipo: 'clip'
      /** El póster. Ausente = la marca sobre superficie neutra (Ley 13). */
      posterUrl?: string
      /** Ya formateada: «0:12». */
      duracion?: string
      accesibilidadEtiqueta: string
    }

export type EntradaDelHilo = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** La hora **ya formateada por el riel**: «09:14». */
  hora: string
  /**
   * Lo que pasó, en voz de la app. Opcional: una foto sola es una entrada
   * legítima — *no se inventa un texto para acompañarla.*
   */
  texto?: string
  /** La media de esta entrada. Puede haber varias (una ráfaga de fotos). */
  media?: MediaDelHilo[]
}

export type HiloDelDiaProps = {
  entradas: EntradaDelHilo[]
  /** Rótulo del grupo, en voz de la app. */
  rotulo?: string
  /**
   * Abre una media. La pieza **no reproduce ni amplía**: lleva.
   * `indice` es la posición dentro de `entrada.media`, para que la pantalla
   * pueda abrir el visor en la que se tocó.
   */
  onAbrirMedia?: (entrada: EntradaDelHilo, indice: number) => void
}

const LADO_MEDIA = 88

function Media({
  media,
  onPress,
}: {
  media: MediaDelHilo
  onPress?: () => void
}) {
  if (media.tipo === 'clip') {
    /* El clip lo dibuja `MiniaturaClip`, que ya resuelve la marca y la
       duración **con la clase «control sobre video»** (§6septies). No se
       redibuja acá: un póster es fondo no controlado y esa física vive en
       UNA pieza. */
    return (
      <MiniaturaClip
        posterUrl={media.posterUrl}
        duracion={media.duracion}
        onPress={onPress ?? (() => {})}
        accesibilidadEtiqueta={media.accesibilidadEtiqueta}
        lado={LADO_MEDIA}
      />
    )
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={media.accesibilidadEtiqueta}
      style={{
        width: LADO_MEDIA,
        height: LADO_MEDIA,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
    >
      {/* Sin `transition` — Ley 13, el mismo criterio de EvidenciaFoto. */}
      <Image source={{ uri: media.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </Pressable>
  )
}

export function HiloDelDia({ entradas, rotulo, onAbrirMedia }: HiloDelDiaProps) {
  /* REGLA DE EXISTENCIA — ver la escalera del encabezado: el vacío es de la
     pantalla, que sabe distinguirlo de un fallo (Ley 13). */
  if (entradas.length === 0) return null

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View>
        {entradas.map((e, i) => (
          <View key={e.clave}>
            {i === 0 ? null : <Separador />}

            <View style={{ flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[3] }}>
              {/* La hora, en columna fija: el día se barre sin leerlo. */}
              <View style={{ width: spacing[12] }}>
                <Texto variante="dato" color="tertiary">
                  {e.hora}
                </Texto>
              </View>

              <View style={{ flex: 1, gap: spacing[2] }}>
                {e.texto === undefined ? null : <Texto variante="cuerpo">{e.texto}</Texto>}

                {e.media === undefined || e.media.length === 0 ? null : (
                  /* `flexWrap` y no un scroll horizontal: el hilo ya scrollea
                     en vertical, y un scroller anidado se pelea con el padre
                     por el arrastre — la clase que esta casa ya cobró en
                     `SelectorOpcion`. */
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                    {e.media.map((m, j) => (
                      <Media
                        key={j}
                        media={m}
                        onPress={onAbrirMedia === undefined ? undefined : () => onAbrirMedia(e, j)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
