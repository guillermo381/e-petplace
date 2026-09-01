/**
 * SelectorDestinoDonacion — A QUIÉN LLEGA ESTO (S111-B).
 *
 * `LETRA_ADOPCION` §7: la donación es *«compra puntual del catálogo ENTERO con
 * un campo de destino de tres valores: una mascota en adopción · un refugio ·
 * abierta, y e-PetPlace la cruza con el refugio que mejor haga match»*.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **`abierta` ES UNA ELECCIÓN, NO LA AUSENCIA DE UNA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ésa es la única ley de la pieza, y la letra la escribió como advertencia
 * dirigida a quien construya justo esto (§7, literal): *«Quien implemente el
 * padrinazgo o la donación con destino reusando la donación de la despensa tal
 * cual va a heredar "sin destino elegible", que es precisamente lo que estas
 * figuras no pueden ser.»*
 *
 * ── POR QUÉ NO SE REUSÓ `SelectorDestinoItem` (Ley 11, pregunta 2) ────────
 * **Se relevó y NO sirve, y la razón es medible, no de gusto.** Su tipo es
 * `{ tipo: 'mascota'; mascotaId } | { tipo: 'donacion' }`: la variante de
 * donación **no tiene campo de destino** — estructuralmente *es* el «sin
 * destino elegible» que §7 prohíbe heredar. No es que esté mal: en la despensa
 * la pregunta es *a qué expediente deposito este ítem*, y «a ninguno» es una
 * respuesta correcta. Acá la pregunta es *a quién le llega*, y «a nadie» no
 * existe.
 *
 * Segundo motivo, de territorio y no de diseño: `DestinoItem` lo consume el
 * carrito vivo del cliente (`apps/cliente/.../despensa/carrito.tsx` y su lib).
 * **Ensanchar una unión que otra casa consume no es un hunk aditivo** — su
 * efecto sí cambia allá. La pieza nace hermana; la de la despensa **no se
 * toca.**
 *
 * ── EL ESTADO MALO ES INEXPRESABLE (L-222), EN SUS DOS EJES ───────────────
 * ① **Los destinos con sujeto llevan su id OBLIGATORIO.** `{ tipo: 'mascota' }`
 *    sin `mascotaId` no compila: «se lo mando a una mascota, no sé cuál» no es
 *    un estado que deba poder existir en la pantalla.
 * ② **`abierta` lleva su `voz` OBLIGATORIA** (prop `abierta.voz`). Sin
 *    explicación, «abierta» se lee como «no elegí» — que es exactamente el
 *    estado que §7 dice que estas figuras no pueden tener. *La voz no es
 *    decoración: es lo que la convierte de hueco en elección.*
 *
 * ── 🔴 `null` NO ES `abierta`, Y CONFUNDIRLOS ES EL DEFECTO ───────────────
 * `destino: null` = **todavía no eligió** (estado legítimo de la pantalla,
 * antes de tocar nada). `{ tipo: 'abierta' }` = **eligió que e-PetPlace la
 * cruce**. Son dos hechos distintos con consecuencias distintas: uno no puede
 * confirmar la compra, el otro sí. La despensa los colapsaba en un solo valor
 * porque allá no hacía diferencia; acá la hace.
 *
 * ── LO QUE NO HACE, y es límite duro de LOYALTY §7 ────────────────────────
 * **No muestra precio, descuento, puntos ni recompensa de ninguna clase.**
 * `LETRA_ADOPCION` §1 y §10.5: donar o apadrinar **jamás** otorga beneficio
 * comercial, y §6 lo llama *límite duro, no etapa* — *un descuento convertiría
 * el padrinazgo en compra, con IVA y otro tratamiento contable.* Una pieza que
 * no tiene por dónde recibir un descuento no puede mostrarlo por descuido.
 *
 * ── CERO DICCIONARIO ADENTRO (precedente `EscaleraEstados`) ───────────────
 * Los nombres y la voz de `abierta` llegan por prop. La pieza no sabe decir
 * «Donde más se necesite» en ningún idioma.
 *
 * Reusa `ChipEntidad` — cero chip nuevo. Sin animación (Ley 6/13).
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { ChipEntidad } from './ChipEntidad'
import { Texto } from './Texto'

export type DestinoDonacion =
  | { tipo: 'mascota'; mascotaId: string }
  | { tipo: 'refugio'; refugioId: string }
  /** Eligió que e-PetPlace la cruce. NO es «no eligió» — eso es `null`. */
  | { tipo: 'abierta' }

export type OpcionDestino = { id: string; nombre: string; fotoUrl?: string }

export type SelectorDestinoDonacionProps = {
  /** Adoptables apadrinables. Puede venir vacío. */
  mascotas: OpcionDestino[]
  /** Refugios elegibles. Puede venir vacío. */
  refugios: OpcionDestino[]
  /**
   * 🔴 `voz` OBLIGATORIA: sin explicación, «abierta» se lee como «no elegí».
   * Ej.: «Donde más se necesite».
   */
  abierta: { voz: string }
  /** `null` = todavía no eligió. Distinto de `{ tipo: 'abierta' }`. */
  destino: DestinoDonacion | null
  onCambiar: (destino: DestinoDonacion | null) => void
  rotulo?: string
}

export function SelectorDestinoDonacion({
  mascotas,
  refugios,
  abierta,
  destino,
  onCambiar,
  rotulo,
}: SelectorDestinoDonacionProps) {
  // Volver a tocar lo elegido lo suelta: el usuario puede desdecirse sin
  // tener que elegir otra cosa (precedente `SelectorDestinoItem`).
  const alTocar = (d: DestinoDonacion, yaElegido: boolean) =>
    onCambiar(yaElegido ? null : d)

  return (
    <View style={{ gap: spacing[2] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
      >
        {mascotas.map((m) => {
          const elegido = destino?.tipo === 'mascota' && destino.mascotaId === m.id
          return (
            <ChipEntidad
              key={`m:${m.id}`}
              nombre={m.nombre}
              fotoUrl={m.fotoUrl}
              sujeto="mascota"
              elegido={elegido}
              onPress={() => alTocar({ tipo: 'mascota', mascotaId: m.id }, elegido)}
            />
          )
        })}

        {refugios.map((r) => {
          const elegido = destino?.tipo === 'refugio' && destino.refugioId === r.id
          return (
            <ChipEntidad
              key={`r:${r.id}`}
              nombre={r.nombre}
              fotoUrl={r.fotoUrl}
              // Sin logo, el fallback es el glifo del REFUGIO.
              sujeto="donacion"
              elegido={elegido}
              onPress={() => alTocar({ tipo: 'refugio', refugioId: r.id }, elegido)}
            />
          )
        })}

        {/* `abierta` va en la MISMA hilera, con su voz: es una elección más,
            no un renglón aparte. Separarla la volvería «la opción de los que
            no eligen», que es la lectura que §7 prohíbe. */}
        <ChipEntidad
          nombre={abierta.voz}
          sujeto="donacion"
          elegido={destino?.tipo === 'abierta'}
          onPress={() => alTocar({ tipo: 'abierta' }, destino?.tipo === 'abierta')}
        />
      </View>
    </View>
  )
}
