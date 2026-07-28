/**
 * FilaCita — LA TARJETA DE UNA CITA EN LA JORNADA DEL PRESTADOR
 * (S80-B12 Parte 3, re-anatomizada S80-B14/B15 — componente de DOMINIO,
 * el molde de "cero genéricos").
 *
 * UNA TARJETA = UNA CITA (B14 ①, vigente por B15): dos citas jamás
 * comparten tarjeta — el bug del canto era que las filas compartían
 * Tarjeta y el canto de la fila moría en el medio, donde no hay curva
 * que lo justifique. Las acciones de la cita ("Conocer a {mascota}")
 * viven ADENTRO de la suya, por el slot `acciones`.
 *
 * EL CANTO (§9.1/§9.2, FIRMAS B15):
 *  · **SÓLIDO** — firmado: en lista contigua el degradado repetido da
 *    serrucho; B3 (el piso 33%) queda RE-ACOTADA a la tarjeta suelta
 *    de la lámina, no derogada — si esa superficie nace, trae su
 *    degradado consigo.
 *  · **ES EL BORDE IZQUIERDO del elemento portador del radio** — no un
 *    View absoluto recortado: un borde con borderRadius SIGUE LA CURVA
 *    por construcción (RN lo dibuja entre el rounded-rect exterior y el
 *    interior: se adelgaza acompañando el radio en vez de ser mordido
 *    por él — la mordida de 7-16px del clipping muere). Por eso esta
 *    superficie NO es `Tarjeta`: el borde debe vivir en el elemento del
 *    radio, y darle a Tarjeta una prop de borde de color sería API
 *    genérica para romper leyes desde cualquier pantalla. La
 *    superficie replica los TOKENS EXACTOS de Tarjeta reposo
 *    (bg.card · radius.lg · elevacion.reposo · sin hairline — regla
 *    Chanel del marco), duplicación ACOTADA a este archivo y declarada.
 *
 * LA VARA DEL PATRÓN: la pantalla no elige color, ni posición, ni
 * ancho, ni alfa — **EL CANTO DICE CATEGORÍA, EL GLIFO DICE SERVICIO**
 * (DIRECCION_ARTE Ley 10, S80-B16 — la ley del reparto): SALUD =
 * `capa.identidad` (veterinaria) · CUIDADO = `capa.cuidado` (paseo,
 * grooming y adiestramiento COMPARTEN teal A PROPÓSITO — los separa el
 * glifo, no el canto). Cero API que permita romper la ley; si la
 * taxonomía crece, cambia ACÁ y todas las pantallas heredan.
 *
 * `fin` y `acciones` son slots de DATOS/navegación (la voz es de la
 * pantalla, Ley 3) — jamás de craft.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { useTheme } from '../ThemeProvider'
import { radius } from '../tokens/radius'
import { Celda } from './Celda'
import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'

export type FilaCitaOficio = 'paseo' | 'grooming' | 'veterinaria' | 'adiestramiento'

const ANCHO_CANTO = 3

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
  /** Las acciones DE ESTA cita — viven adentro de SU tarjeta (B14 ①).
   *  Filas/Separador los pone el consumidor. */
  acciones?: ReactNode
  onPress: () => void
}

export function FilaCita({ oficio, titulo, subtitulo, metadataMono, mascota, fin, acciones, onPress }: FilaCitaProps) {
  const { theme } = useTheme()
  // Ley 10 (DIRECCION_ARTE v1.3): el canto dice CATEGORÍA — SALUD =
  // identidad (vet) · CUIDADO = cuidado (paseo/grooming/adiestramiento).
  const color = oficio === 'veterinaria' ? theme.capa.identidad : theme.capa.cuidado

  return (
    <View
      style={{
        // Los tokens EXACTOS de Tarjeta reposo (ver el encabezado):
        backgroundColor: theme.bg.card,
        borderRadius: radius.lg,
        boxShadow: theme.elevacion.reposo,
        // EL CANTO: borde del portador del radio — sigue la curva solo.
        borderLeftWidth: ANCHO_CANTO,
        borderLeftColor: color,
        // el contenido (pressed de la Celda incluido) respeta el radio
        overflow: 'hidden',
      }}
    >
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
      {acciones}
    </View>
  )
}
