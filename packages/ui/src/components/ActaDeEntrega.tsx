/**
 * ActaDeEntrega — EN QUÉ ESTADO SE ENTREGÓ, y en cuál se devolvió (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴🔴 **ESTA PIEZA REGISTRA. NO ADJUDICA. Y LA DIFERENCIA NO ES SEMÁNTICA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `LETRA_GUARDERIA` está **FRENADA** desde el 25-ago-2026 por el memo del
 * abogado, y **su §3 —el reparto de responsabilidad— fue declarado *nulo de
 * pleno derecho frente al consumidor*** (fichas `D-918` y `D-919`). El acta es
 * el instrumento que más cerca pasa de esa cláusula: *el estado de conformidad
 * es, literalmente, lo que alguien va a citar el día que haya una disputa.*
 *
 * ⇒ **Por eso la pieza no trae UNA SOLA PALABRA propia.** Los rótulos, la voz
 * de cada estado de conformidad y hasta el nombre de la dirección entran por
 * prop, y van al lote de strings que el founder lee aparte. **No es prolijidad
 * de i18n: es el mecanismo que hace imposible que esta pieza afirme un reparto
 * de responsabilidad que la letra todavía no puede sostener** (L-222 — el
 * estado malo es inexpresable; el mismo movimiento con el que `FilaEntrega` no
 * tiene prop de mascota).
 *
 * ⚠️ **LO QUE ESTA PIEZA NO DECIDE, y se escribe para que nadie la cite como
 * si lo hubiera decidido:** qué significa legalmente «sin conformidad», qué
 * obliga a quién, y qué pasa después. **Eso es la reescritura de §3, y es de
 * la mesa.** Acá `sin_conformidad` es un HECHO REGISTRADO con su fecha — *la
 * misma naturaleza que un chip de comportamiento*, no una sentencia.
 *
 * ── UNA PIEZA PARA LAS DOS DIRECCIONES, y por qué no dos ─────────────────
 * `direccion: 'recogida' | 'devolucion'`. **El acta de salida y la de vuelta
 * tienen la misma anatomía**, y la razón de fondo es que sirven a la misma
 * pregunta: *¿en qué estado estaba el animal cuando cambió de manos?* Si
 * fueran dos piezas, el día que se agregue un ítem al checklist habría que
 * acordarse de agregarlo dos veces — y **el día que alguien se olvide, la
 * comparación entre las dos actas deja de ser posible**, que es justo para lo
 * que el acta existe. *Es la lección 19.9 en su forma más cara: lo que se
 * copia, diverge.*
 *
 * 🔴 La dirección **no cambia el layout**: cambia qué rótulos manda la app y
 * qué se compara contra qué. *Una pieza que se re-dibujara distinta según la
 * dirección volvería a ser dos piezas con un `if` adentro.*
 *
 * ── LOS DOS MODOS, que son dos actores ───────────────────────────────────
 * · **`levantar`** (prestador) — marca el checklist, adjunta fotos, escribe
 *   observaciones. **No firma conformidad**: quien conforma es el dueño.
 * · **`leer`** (dueño) — lo ve todo en solo-lectura y **es el único que puede
 *   dejar su conformidad**.
 *
 * 🔴 **Y ESO VIVE EN EL TIPO, no en la disciplina de la pantalla:**
 * `onConformar` solo existe en el modo `leer`, y los callbacks de edición solo
 * existen en `levantar`. **Un prestador no puede firmar la conformidad del
 * dueño porque la prop no está** — otra vez L-222. *Si fuera un `modo` con
 * todas las props opcionales, alcanzaría con un descuido para que el que
 * entrega firme que estuvo todo bien.*
 *
 * ── LA CONFORMIDAD PENDIENTE NO ES UN ERROR (Ley 22) ─────────────────────
 * `pendiente` se pinta sereno, jamás en `danger`. *Un dueño que todavía no
 * miró el acta no hizo nada malo.* Y `sin_conformidad` va en **`warning`**, no
 * en rojo: es un hecho que hay que atender, no una alarma — el mismo criterio
 * que le prohíbe el rojo al temporizador de la videoconsulta (§1.5) y al
 * faltante de `SemaforoSanitario`.
 *
 * ── LAS FOTOS SON UN SLOT, y es la frontera de la casa ───────────────────
 * `media` entra como nodo. **La captura y su cola viven en la pantalla** —el
 * literal de `EvidenciaFoto`: *«este componente captura y muestra estado. NO
 * sube nada»*—, así que el acta **no reimplementa** ni la cámara ni los
 * reintentos. En `levantar` la pantalla mete `EvidenciaFoto`; en `leer`, sus
 * miniaturas. *Una pieza de acta que subiera archivos sería un motor escondido
 * adentro de un formulario.*
 *
 * ── LEY 11 (protocolo 1c, pregunta 2) ────────────────────────────────────
 * Relevado antes de crear. `Casilla` es una ACEPTACIÓN legal suelta (P23) y se
 * **MONTA** acá para la conformidad — no se reimplementa. `SemaforoSanitario`
 * informa requisitos con su camino, que es otro trabajo. `EscaleraEstados`
 * informa una secuencia. Ninguna arma «un estado registrado en dos momentos
 * comparables», que es lo que el acta es.
 *
 * ── ESCALERA (§4b) · DOSIS · MOVIMIENTO ──────────────────────────────────
 * **Peldaño 0** — el checklist declarado por el lugar (sin él no hay acta y la
 * pieza no se monta). **Peldaño 1** — marcas y observaciones. **Peldaño 2** —
 * las fotos de estado. Muestra estado del animal, nada clínico.
 * Tokens puros; las dos apps y los tres temas sin variante. Sin animación
 * (Ley 6): un acta se lee, no se celebra.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { Boton } from './Boton'
import { Campo } from './Campo'
import { Casilla } from './Casilla'
import { Separador } from './Separador'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

export type DireccionDelActa = 'recogida' | 'devolucion'

/** Registrado, jamás adjudicado — ver el encabezado. */
export type Conformidad = 'pendiente' | 'conforme' | 'sin_conformidad'

export type ItemDeActa = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** El ítem en voz de la app: «Carnet a la vista», «Correa». */
  etiqueta: string
  marcado: boolean
}

type Comun = {
  direccion: DireccionDelActa
  /** Los ítems del checklist. Los declara el lugar: son DATOS. */
  items: ItemDeActa[]
  /** Rótulo del checklist, en voz de la app. */
  rotuloItems?: string
  /**
   * Las fotos de estado. **Slot** — la captura es de la pantalla (ver el
   * encabezado). Ausente = no se dibuja la sección.
   */
  media?: ReactNode
  rotuloMedia?: string
  /** Rótulo de las observaciones, en voz de la app. */
  rotuloObservaciones?: string
  /**
   * El estado de conformidad y su voz. **La voz entra por prop**: la pieza no
   * sabe —ni debe— cómo se llama «conforme» en esta letra.
   */
  conformidad: Conformidad
  vozConformidad: string
}

export type ActaDeEntregaProps =
  | (Comun & {
      modo: 'levantar'
      /** Solo en `levantar`. */
      onAlternarItem: (clave: string) => void
      observaciones: string
      onCambiarObservaciones: (texto: string) => void
      /** Etiqueta del campo de observaciones (a11y + label visible). */
      etiquetaObservaciones: string
      /** 🔴 En `levantar` NO existe: quien conforma es el dueño. */
      onConformar?: never
      etiquetaConformar?: never
    })
  | (Comun & {
      modo: 'leer'
      observaciones?: string
      /**
       * 🔴 Solo en `leer`. Deja la conformidad del dueño. Ausente = el acta ya
       * fue conformada (o la pantalla decidió no ofrecerlo todavía).
       */
      onConformar?: () => void
      etiquetaConformar?: string
      onAlternarItem?: never
      onCambiarObservaciones?: never
      etiquetaObservaciones?: never
    })

export function ActaDeEntrega(props: ActaDeEntregaProps) {
  const { items, rotuloItems, media, rotuloMedia, rotuloObservaciones, conformidad, vozConformidad } =
    props

  /* REGLA DE EXISTENCIA: sin ítems no hay acta que levantar ni que leer. */
  if (items.length === 0) return null

  const editable = props.modo === 'levantar'

  /* LA VOZ DE LA CONFORMIDAD, por estado. `pendiente` sereno y
     `sin_conformidad` en `warning` — jamás `danger` (Ley 22, ver encabezado).
     Se usa `Texto` con su color semántico: `warning` SÍ es miembro de
     `TextoColor`, así que no hace falta bajar al primitivo. */
  const colorConformidad =
    conformidad === 'conforme' ? 'success' : conformidad === 'sin_conformidad' ? 'warning' : 'tertiary'

  return (
    <Tarjeta elevacion="reposo" relleno="amplio">
      <View style={{ gap: spacing[4] }}>
        {/* EL CHECKLIST */}
        <View style={{ gap: spacing[2] }}>
          {rotuloItems === undefined ? null : <Texto variante="seccion">{rotuloItems}</Texto>}

          <View style={{ gap: spacing[1] }}>
            {items.map((it) =>
              editable ? (
                /* `Casilla` es el checkbox de verdad de la casa (`role=
                   "checkbox"`), y se MONTA — no se reimplementa. */
                <Casilla
                  key={it.clave}
                  marcada={it.marcado}
                  onCambio={() => props.onAlternarItem(it.clave)}
                  etiquetaAccesible={it.etiqueta}
                >
                  <Texto variante="cuerpo">{it.etiqueta}</Texto>
                </Casilla>
              ) : (
                /* En `leer` el ítem NO es un control: es un hecho registrado.
                   Un checkbox deshabilitado se lee como «esto se podría tocar
                   y no te dejan» — y acá no hay nada que tocar. */
                <View
                  key={it.clave}
                  accessibilityRole="text"
                  accessibilityLabel={it.etiqueta}
                  style={{ flexDirection: 'row', gap: spacing[2], paddingVertical: spacing[1] }}
                >
                  <Texto variante="cuerpo" color={it.marcado ? undefined : 'tertiary'}>
                    {it.marcado ? '✓' : '—'}
                  </Texto>
                  <Texto variante="cuerpo" color={it.marcado ? undefined : 'tertiary'}>
                    {it.etiqueta}
                  </Texto>
                </View>
              ),
            )}
          </View>
        </View>

        {/* LAS FOTOS DE ESTADO — slot; la captura es de la pantalla. */}
        {media === undefined ? null : (
          <>
            <Separador />
            <View style={{ gap: spacing[2] }}>
              {rotuloMedia === undefined ? null : <Texto variante="seccion">{rotuloMedia}</Texto>}
              {media}
            </View>
          </>
        )}

        {/* LAS OBSERVACIONES */}
        <Separador />
        <View style={{ gap: spacing[2] }}>
          {rotuloObservaciones === undefined ? null : (
            <Texto variante="seccion">{rotuloObservaciones}</Texto>
          )}

          {props.modo === 'levantar' ? (
            <Campo
              label={props.etiquetaObservaciones}
              value={props.observaciones}
              onChangeText={props.onCambiarObservaciones}
              /* `multilinea` es el nombre de la casa (el `multiline` de RN está
                 omitido del contrato a propósito): alto FIJO de n líneas, sin
                 auto-grow que empuje el layout mientras alguien escribe. */
              multilinea={3}
            />
          ) : props.observaciones === undefined || props.observaciones.length === 0 ? (
            /* Sin observaciones NO se dibuja un campo vacío ni un «—» con cara
               de dato: no se dibuja nada (Ley 13). *Un acta sin observaciones
               es lo normal, no un hueco.* */
            null
          ) : (
            <Texto variante="cuerpo">{props.observaciones}</Texto>
          )}
        </View>

        {/* LA CONFORMIDAD — el hecho registrado, con su voz por prop. */}
        <Separador />
        <View style={{ gap: spacing[3] }}>
          <Texto variante="cuerpo" color={colorConformidad}>
            {vozConformidad}
          </Texto>

          {/* El acto de conformar SOLO existe en `leer` — y el tipo lo
             garantiza, no este `if`. */}
          {props.modo === 'leer' &&
          props.onConformar !== undefined &&
          props.etiquetaConformar !== undefined ? (
            <Boton
              variante="primario"
              etiqueta={props.etiquetaConformar}
              onPress={props.onConformar}
            />
          ) : null}
        </View>
      </View>
    </Tarjeta>
  )
}
