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
 * ── SE ESCONDE CON EL CHROME ───────────────────────────────────────────────
 * Es de los que desaparecen a los 4 s (OBRA 4). **Y el temporizador sigue
 * corriendo por dentro**: no se pausa porque no se vea. *Un reloj que se
 * reinicia al reaparecer mentiría sobre algo que se cobra.*
 */

import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { sobreVideo } from '../tokens/sobreVideo'
import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'
import { EstadoConexion, type EstadoConexionProps } from './EstadoConexion'
import { TemporizadorLlamada } from './TemporizadorLlamada'

export interface EncabezadoLlamadaProps {
  /** Con quién estoy hablando. */
  nombre: string
  estado: EstadoConexionProps['estado']
  vozEstado: EstadoConexionProps['voz']
  /** Epoch ms del inicio. `null` = todavía no empezó a contar. */
  inicioTs: number | null
  /** Inset superior del aparato. */
  insetTop?: number
}

export function EncabezadoLlamada({ nombre, estado, vozEstado, inicioTs, insetTop = 0 }: EncabezadoLlamadaProps) {
  const reconectando = estado === 'reconectando'
  return (
    <LinearGradient
      colors={sobreVideo.velo}
      style={{ paddingTop: insetTop + spacing[3], paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        {/* El punto va PEGADO al nombre: modifica al nombre, no flota solo. */}
        {!reconectando && <EstadoConexion estado={estado} voz={vozEstado} />}
        <View style={{ flex: 1 }}>
          <Texto variante="seccion" color="sobreVideo">
            {nombre}
          </Texto>
        </View>
        <TemporizadorLlamada inicioTs={inicioTs} />
      </View>

      {/* Reconectando ocupa su propia línea: es el único que lleva palabras y
          no puede pelear el ancho con el nombre. */}
      {reconectando && (
        <View style={{ marginTop: spacing[2] }}>
          <EstadoConexion estado={estado} voz={vozEstado} />
        </View>
      )}
    </LinearGradient>
  )
}
