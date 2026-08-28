/**
 * FichaFranja — LAS DOS VENTANAS DEL DÍA, legibles de un vistazo (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Una franja no es una hora: son DOS ventanas y un intervalo entre ellas.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * «Recoge 7:00–9:00 · Devuelve 16:30–18:30». La misma pieza se monta en la
 * configuración del prestador (donde la franja se declara) y en el perfil del
 * lugar (donde la familia la lee) — **y esa simetría es el punto**: si fueran
 * dos piezas, el día que el prestador cambie su ventana el perfil seguiría
 * contando la vieja, y nadie lo notaría hasta que alguien llegue a una puerta
 * cerrada.
 *
 * ── 🔴 POR QUÉ NO TRAE NI UNA PALABRA ADENTRO ──────────────────────────────
 * `LETRA_GUARDERIA` está **FRENADA** (memo del abogado, 25-ago-2026: su §3 —el
 * reparto de responsabilidad— es *nula de pleno derecho*, fichas `D-918` y
 * `D-919`). El perímetro de esta tanda lo dice con todas las letras: *ninguna
 * pieza escribe texto que reparta responsabilidad; los strings van al lote que
 * el founder lee aparte.*
 *
 * ⇒ **`recogida.rotulo` y `devolucion.rotulo` son PROPS, no constantes.** No es
 * prolijidad de i18n: es el mecanismo que hace *estructuralmente imposible* que
 * esta pieza afirme algo que la letra todavía no puede sostener. **El estado
 * malo es inexpresable** (L-222), igual que `FilaEntrega` no tiene prop de
 * mascota. *Es el mismo movimiento de `EscaleraEstados`: «cero diccionario
 * adentro — las etiquetas llegan por prop».*
 *
 * ── LEY 11: POR QUÉ NACE Y NO SE REUSA ALGO (protocolo 1c, pregunta 2) ─────
 * Relevado contra `packages/ui` antes de crear:
 * · `SelectorVentana` **ELIGE** una ventana entre varias (control, con estado
 *   y cupo). Acá no se elige nada: **se informa la franja que rige.** Montarlo
 *   con una sola opción sería un control que no controla.
 * · `FilaDato` es etiqueta-sobre-valor de UN dato. La franja son **dos rangos
 *   emparejados**, y lo que se lee no es cada uno: es la relación entre ellos.
 * · `Celda`/`CeldaNavegacion` prometen navegar (19.1). Una franja no lleva a
 *   ningún lado.
 * El trabajo «declarar un par de ventanas emparejadas» no estaba en el
 * diccionario (Ley 19). Entra con esta pieza.
 *
 * ── LEY 3 — QUIÉN HABLA EN CADA MITAD ──────────────────────────────────────
 * El **rótulo** lo escribió un humano ⇒ DM Sans (`cuerpo`). El **rango** es
 * dato de máquina ⇒ `dato` (JetBrains Mono, tabular). *No es decoración: los
 * dos rangos quedan alineados en columna y el ojo los compara sin leerlos.*
 *
 * ── LA SEPARACIÓN ES ESTRUCTURA, NO ADORNO (Ley 18) ────────────────────────
 * Las dos ventanas se apilan con un `Separador` **solo cuando hay dos**. Con
 * una sola (`devolucion` ausente) no se dibuja: un divisor que no separa nada
 * es exactamente la estructura decorativa que la Ley 18 corta.
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────────
 * No muestra datos del expediente. Peldaño 0: la franja declarada, que es el
 * dato mínimo con el que un lugar puede ofrecer el servicio — sin ella no hay
 * qué informar y la pieza **no se monta** (regla de existencia).
 *
 * ── DOSIS Y TEMAS ─────────────────────────────────────────────────────────
 * Tokens puros, cero color propio: sirve a las dos apps y a los tres temas sin
 * variante. Memorial degrada solo (no hay acento que degradar). Sin animación
 * — informar no se anima (Ley 6).
 */

import { View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { Separador } from './Separador'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

export type VentanaDeFranja = {
  /**
   * La voz de la casa para esta ventana: «Recoge», «Devuelve».
   *
   * 🔴 **Viene por prop A PROPÓSITO** — ver el encabezado. Ninguna palabra de
   * esta pieza se decide acá adentro.
   */
  rotulo: string
  /** Ya formateado por el riel de la app (`fechaCortaMono` y familia): «7:00». */
  desde: string
  /** «9:00». */
  hasta: string
}

export type FichaFranjaProps = {
  recogida: VentanaDeFranja
  /**
   * La segunda ventana. **Opcional, y su ausencia es un caso real:** un lugar
   * puede declarar solo la recogida mientras todavía no fijó la devolución.
   * Ausente = no se dibuja ni ella ni el separador — jamás un rango vacío ni
   * un «—» que se lea como dato (Ley 13: el hueco no se disfraza de valor).
   */
  devolucion?: VentanaDeFranja
  /** Rótulo del grupo, si la pantalla lo necesita. Voz de la app. */
  rotulo?: string
  /**
   * `true` = la pieza se dibuja sobre su propia superficie (perfil del lugar,
   * donde vive suelta). `false` (default) = sin superficie, porque la pantalla
   * ya la puso — el caso de la configuración del prestador, donde la franja
   * vive dentro de una carta que la pantalla dibuja. *La pieza no decide su
   * fondo: lo hace `SelectorVentana` en `apilada` y se hace igual acá.*
   */
  conSuperficie?: boolean
}

function Ventana({ ventana }: { ventana: VentanaDeFranja }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      {/* Rótulo: lo escribió un humano (Ley 3). */}
      <Texto variante="cuerpo">{ventana.rotulo}</Texto>

      {/* Rango: voz de máquina. El guion va con espacios finos alrededor para
          que «7:00 – 9:00» no se lea como un número partido. */}
      <Texto variante="dato">{`${ventana.desde} – ${ventana.hasta}`}</Texto>
    </View>
  )
}

export function FichaFranja({
  recogida,
  devolucion,
  rotulo,
  conSuperficie = false,
}: FichaFranjaProps) {
  const cuerpo = (
    <View style={{ gap: spacing[3] }}>
      <Ventana ventana={recogida} />

      {/* El separador SOLO existe si hay dos ventanas que separar (Ley 18). */}
      {devolucion === undefined ? null : (
        <>
          <Separador />
          <Ventana ventana={devolucion} />
        </>
      )}
    </View>
  )

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {/* La superficie la pone `Tarjeta`, jamás un `View` con sombra a mano
          (Ley 1: cero Views donde exista componente — y la Ley 20 vive dentro
          de `Tarjeta`, que es la que sabe que elevación y hairline no
          conviven: la regla Chanel del marco). */}
      {conSuperficie ? (
        <Tarjeta elevacion="reposo" relleno="amplio">
          {cuerpo}
        </Tarjeta>
      ) : (
        cuerpo
      )}
    </View>
  )
}
