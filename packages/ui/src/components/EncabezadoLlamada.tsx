/**
 * EncabezadoLlamada — quién, cómo anda y hace cuánto (S106-B, OBRA 2).
 *
 * Tres datos y **nada más**: el nombre de la otra persona, el estado de la
 * conexión y el tiempo transcurrido. *Todo lo que se agregue acá compite con la
 * cara que el veterinario está mirando para decidir algo clínico.*
 *
 * ── EL ORDEN NO ES CASUAL ──────────────────────────────────────────────────
 * **nombre · estado · tiempo.** El nombre preside porque es lo único que
 * responde «¿estoy hablando con quien creo?»; el estado va pegado al nombre
 * porque **modifica al nombre** («Aurora, y el cable anda mal»); el tiempo va
 * al final porque es el que menos se mira — y así debe ser (OBRA 3).
 *
 * ── SOBRE VELO, NO SOBRE EL VIDEO PELADO ───────────────────────────────────
 * Lleva el degradado de la clase (`sobreVideo.velo`): sin él, texto blanco
 * sobre una pared blanca desaparece. **El velo se desvanece hacia abajo** para
 * no cortar la imagen con una línea recta — *un borde duro sobre video se lee
 * como un defecto de render.*
 *
 * ── SE ESCONDE CON EL CHROME — **pero el reloj YA NO VIVE ACÁ** ────────────
 * El nombre y el estado se desvanecen a los 4 s (OBRA 4). **El temporizador
 * salió de esta pieza** por firma del founder (26-ago): se esconde lo que
 * compite con el video, y el reloj no compite — *le dice al vet cuánto lleva
 * una consulta que §4 cobra por su duración*.
 *
 * 🔴 **Por qué SALIÓ en vez de quedarse con una excepción adentro:** este
 * bloque entero es lo que se desvanece. Para exceptuar UNA parte había que
 * sacarla del bloque, y entonces **la composición pasa a decir la ley**: lo que
 * se esconde y lo que no son dos piezas distintas, y ninguna futura pasada
 * puede volver a esconderlo por descuido.
 */

import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { sobreVideo } from '../tokens/sobreVideo'
import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'
import { EstadoConexion, type EstadoConexionProps } from './EstadoConexion'

export interface EncabezadoLlamadaProps {
  /** Con quién estoy hablando. */
  nombre: string
  estado: EstadoConexionProps['estado']
  vozEstado: EstadoConexionProps['voz']
  /** ⏪ Epoch ms del inicio. **Ya NO lo dibuja esta pieza** (firma founder
   *  26-ago: el temporizador no se esconde) — se conserva en el contrato
   *  porque `SuperficieLlamada` lo recibe acá y lo pasa al reloj hermano.
   *  *No se saca para no romper a los dos consumidores por un dato que igual
   *  hay que transportar.* */
  inicioTs: number | null
  /** Inset superior del aparato. */
  insetTop?: number
}

export function EncabezadoLlamada({ nombre, estado, vozEstado, insetTop = 0 }: EncabezadoLlamadaProps) {
  return (
    <LinearGradient
      colors={sobreVideo.velo}
      style={{ paddingTop: insetTop + spacing[3], paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        {/* El reloj ocupaba la derecha de esta fila; su hueco queda para que el
            nombre respire y NO se rellena con nada (Chanel). */}
        <View style={{ flex: 1 }}>
          <Texto variante="seccion" color="sobreVideo">
            {nombre}
          </Texto>
        </View>
      </View>

      {/* §1.6 de la dirección: **«Bajo el nombre, una línea discreta»**. Va
          DEBAJO y no al lado — al lado competía con el nombre por el ancho, y
          con «Reconectando…» lo habría empujado. Los tres estados usan el
          mismo lugar: el que crece no se muda, crece donde ya estaba. */}
      <View style={{ marginTop: spacing[1.5] }}>
        <EstadoConexion estado={estado} voz={vozEstado} />
      </View>
    </LinearGradient>
  )
}
