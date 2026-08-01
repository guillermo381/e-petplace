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
import Svg, { Path } from 'react-native-svg'

import { CHEVRON, type DireccionChevron } from './chevron'
import { useTheme } from '../ThemeProvider'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
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
  /** La cara: el avatar se compone ADENTRO (huella digna sin foto).
   *
   *  SIGUE REQUERIDA aun con `cara={false}`, y es a propósito: una fila
   *  de cita ES de una mascota (B14 ①) — hacerla opcional permitiría una
   *  fila sin sujeto, que es otra pieza. Con la cara apagada el dato no
   *  se dibuja pero no es basura: es la identidad de la fila, y el día
   *  que quiera decir la especie o mostrar la foto la tiene. */
  mascota: { nombre: string; fotoUrl?: string; especie?: AvatarMascotaEspecie }
  /**
   * ¿SE DIBUJA LA CARA? Default `true` — cero consumidores existentes
   * cambian.
   *
   * El LOG la apaga, y el porqué es de composición y no de gusto: ahí
   * arriba ya se filtró POR MASCOTA y el título dice su nombre. Repetir
   * el avatar en cada fila es decir tres veces lo mismo en la misma
   * pantalla, y la regla Chanel se lo lleva.
   */
  cara?: boolean
  /**
   * QUÉ PASA AL TOCARLA. **SIN DEFAULT, y esa es la mitad importante
   * del pedido:** una fila que no declara su dirección es exactamente el
   * defecto que el founder reportó — no se sabe qué se puede tocar.
   * Obligarla es lo que hace que el próximo consumidor no pueda
   * olvidarse.
   *
   * Las tres son la letra de la 19.7, firmada en gate de campo
   * (21-jul-2026) y con los MISMOS paths que ya usan CeldaNavegacion y
   * PieRevelar — acá no nace geometría nueva:
   *   · `'derecha'` → `›` NAVEGA (te vas a otra pantalla)
   *   · `'abajo'`   → `⌄` REVELA en el lugar (se abre abajo tuyo)
   *   · `'arriba'`  → `⌃` PLIEGA (ya está abierta)
   *
   * POR QUÉ SON TRES Y NO LAS DOS QUE SE PIDIERON, declarado: con solo
   * `'abajo'`, una fila YA DESPLEGADA seguiría mostrando `⌄` para
   * siempre — el chevron que miente, que es justo lo que 19.7 vino a
   * matar. La tercera no es un agregado mío: es la letra que ya estaba
   * firmada, y sin ella la pieza no podría cumplirla.
   */
  direccion: DireccionChevron
  /** Slot de DATOS (insignias/chips) — jamás de craft. */
  fin?: ReactNode
  /** Las acciones DE ESTA cita — viven adentro de SU tarjeta (B14 ①).
   *  Filas/Separador los pone el consumidor. */
  acciones?: ReactNode
  onPress: () => void
}

/* El mapa que vivía acá SUBIÓ a `./chevron` (S83-B12). Su JSDoc decía
 * "si algún día el trazo cambia, cambia en un lugar" — y no ocurría: el
 * mismo trazo estaba en CUATRO sitios. Ahora la intención es cierta. */

export function FilaCita({
  oficio,
  titulo,
  subtitulo,
  metadataMono,
  mascota,
  cara = true,
  direccion,
  fin,
  acciones,
  onPress,
}: FilaCitaProps) {
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
          cara ? (
            <AvatarMascota
              nombre={mascota.nombre}
              fotoUrl={mascota.fotoUrl}
              especie={mascota.especie}
              tamano="sm"
            />
          ) : undefined
        }
        metadataMono={metadataMono}
        // El chevron va DESPUÉS del slot de datos, no adentro: `fin` es
        // del consumidor (insignias, chips) y el chevron es de la PIEZA
        // — mezclarlos dejaría que una pantalla se lo saltee, que es el
        // defecto que esta variante vino a cerrar.
        fin={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {fin}
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
              <Path
                d={CHEVRON[direccion]}
                stroke={theme.text.tertiary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        }
      />
      {acciones}
    </View>
  )
}
