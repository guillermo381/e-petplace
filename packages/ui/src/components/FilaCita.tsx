/**
 * FilaCita — LA FILA DE UNA CITA EN LA JORNADA DEL PRESTADOR
 * (S80-B12 Parte 3: promoción del patrón nacido en el HOY S57→S80;
 * componente de DOMINIO — el molde de "cero genéricos").
 *
 * QUÉ ES: recibe una cita y dibuja su fila — avatar de la mascota,
 * título/voz, metadata de máquina, y **SU CANTO DE CAPA** al borde
 * izquierdo (DIRECCION_ARTE §9.1/§9.2: propiedad del TIPO — toda fila
 * de servicio lo lleva, sola o en fila, viva o plegada).
 *
 * LA VARA DEL PATRÓN (mandato B12): **la pantalla no elige color, no
 * elige posición, no elige alfa** — el canto vive ADENTRO: el tono sale
 * del OFICIO por el mismo mapa que el registry de Icono (cuidado=paseo/
 * adiestramiento · identidad=veterinaria · ocre=grooming), el piso de
 * alfa 33% (B3 de la directiva, firmado en lámina) y la posición al ras
 * son del componente. Cero API que permita romper la ley.
 *
 * LÍMITE DECLARADO (el mismo del canto S80-B10-③): adiestramiento
 * comparte `cuidado` con paseo POR EL REGISTRY; el 4º tono lo firma el
 * founder (censo E de la auditoría B12) — cuando firme, cambia ACÁ y
 * todas las pantallas lo heredan sin tocarse. Eso es el molde.
 *
 * `fin` es slot de DATOS (insignias de estado, chips de origen — la voz
 * la pone la pantalla, Ley 3); no es slot de craft. El contenedor que
 * agrupa filas recorta las esquinas (Tarjeta relleno="ninguno",
 * overflow hidden) — el canto hereda la curva gratis.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useTheme } from '../ThemeProvider'
import { Celda } from './Celda'
import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'

export type FilaCitaOficio = 'paseo' | 'grooming' | 'veterinaria' | 'adiestramiento'

const ANCHO_CANTO = 3

/** B3 de la directiva (lámina aprobada): el degradado del canto tiene
 *  PISO — termina en el 33% del tono, jamás en cero (a cero, la mitad
 *  de abajo desaparecía y la fila perdía contorno — hallazgo founder
 *  S80-B10 en dispositivo). */
const ALFA_PISO = 0.33

/** #RRGGBB → rgba con el piso. Un color no-hex degrada a tira sólida
 *  honesta — jamás se inventa un valor. */
function conAlfaPiso(color: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(color)
  if (m === null) return color
  const n = parseInt(m[1]!, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${ALFA_PISO})`
}

export interface FilaCitaProps {
  oficio: FilaCitaOficio
  /** El nombre de la mascota (voz humana — preside la fila). */
  titulo: string
  /** La voz del servicio (ya resuelta por la pantalla, Ley 3). */
  subtitulo?: string
  /** Voz de máquina: hora · duración. */
  metadataMono?: string
  /** La cara: el avatar se compone ADENTRO (huella digna sin foto). */
  mascota: { nombre: string; fotoUrl?: string; especie?: AvatarMascotaEspecie }
  /** Slot de DATOS (insignias/chips) — jamás de craft. */
  fin?: ReactNode
  onPress: () => void
}

export function FilaCita({ oficio, titulo, subtitulo, metadataMono, mascota, fin, onPress }: FilaCitaProps) {
  const { theme } = useTheme()
  // El mapa del registry de Icono — LA fuente única de capa por oficio.
  const color =
    oficio === 'veterinaria'
      ? theme.capa.identidad
      : oficio === 'grooming'
        ? theme.status.warning
        : theme.capa.cuidado

  return (
    <View style={{ position: 'relative' }}>
      <Celda
        interactiva
        onPress={onPress}
        accessibilityRole="button"
        titulo={titulo}
        subtitulo={subtitulo}
        inicio={
          <AvatarMascota
            nombre={mascota.nombre}
            fotoUrl={mascota.fotoUrl}
            especie={mascota.especie}
            tamano="sm"
          />
        }
        metadataMono={metadataMono}
        fin={fin}
      />
      {/* después de la Celda: la tinta sobrevive al resalte del pressed;
          pointerEvents none — la fila entera sigue siendo el tocable */}
      <View
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: ANCHO_CANTO }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[color, conAlfaPiso(color)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, width: ANCHO_CANTO }}
        />
      </View>
    </View>
  )
}
