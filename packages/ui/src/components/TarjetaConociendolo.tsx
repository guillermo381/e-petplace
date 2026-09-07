/**
 * CONOCIÉNDOLO — la huella que dice QUÉ SABEMOS (S113-B · 2.2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SE FUE EL ANILLO, Y CON ÉL EL ÚLTIMO NÚMERO.** (Decisión del founder.)
 * ═══════════════════════════════════════════════════════════════════════════
 * Hasta el 2.2 esto era un anillo que avanzaba, con la fracción entrando
 * «sólo como geometría». Era mejor que un porcentaje y **seguía siendo un
 * número**: *un arco que se llena se lee «voy por la mitad», y el día que
 * retroceda —porque una dimensión deja de tener dato— la familia va a sentir
 * que perdió algo.*
 *
 * Hoy la marca es `HuellaDelVinculo`: **cinco almohadillas, una por
 * dimensión**, pintadas o en contorno. Una huella con tres llenas no es
 * «60 %»: es una huella a la que le faltan dos cosas, **y cuáles**.
 *
 * 🔴 **Y LO QUE LO VUELVE EXIGIBLE ES QUE LA TARJETA YA NO RECIBE UN NÚMERO.**
 * ⏪ Mientras entrara `fraccion: number`, la regla dependía de que nadie lo
 * imprimiera. *Una regla que depende de que el que llama se acuerde no es una
 * regla: es una costumbre.* Ahora entran cinco booleanos y **no hay ninguna
 * cantidad que imprimir**. (`MODELO_LOYALTY` §3.)
 *
 * ── 🔴 DOS ESTADOS, Y **UNA SOLA INVITACIÓN** (S113-B · 2.2.1) ──────────
 * · **Incompleto** — el anillo, la voz, y **UNA** invitación.
 * · **Completo** (no queda nada por resolver) — **felicita en una línea** y
 *   ofrece *«Cuéntanos más de Thor»* **sin urgencia**.
 *
 * 🔴 **NUNCA DOS INVITACIONES PEGADAS**, y no es de estética: *dos pedidos
 * juntos no se leen como dos oportunidades, se leen como una lista de
 * deberes* — y en una tarjeta que celebra lo que ya sabemos, eso la convierte
 * en un reclamo. El tipo lo vuelve **inexpresable**: el estado completo no
 * admite `contanos` ni `raza`, y el incompleto pide **exactamente una**.
 *
 * 🔴 **Y EL COMPLETO NO PIDE LO QUE YA ESTÁ.** *Volver a ofrecer «contanos de
 * su raza» cuando la familia ya lo contó le enseña que lo que cuenta no se
 * registra.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Un anillo de progreso sobre una vida que terminó mide algo que ya no va a
 * cambiar.* (`MODELO_LOYALTY` §7.1.)
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). **Entregada y no montada** — medido.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { HuellaDelVinculo, type DimensionesDelVinculo } from './HuellaDelVinculo'

const HUELLA = 56

interface ConociendoloBase {
  /**
   * 🔴 **CINCO BOOLEANOS, CERO NÚMEROS.** Van a las cinco almohadillas y a
   * ningún otro lado. La pieza no los cuenta, no los suma y no los muestra.
   */
  dimensiones: DimensionesDelVinculo
  /**
   * *«Sabemos quién es y cómo está de salud; nos falta conocer su carácter»* —
   * **narrativa**, ya redactada por la pantalla (Ley 3), diciendo **qué
   * sabemos y qué falta**. *La huella muestra la forma; la voz es la que
   * nombra las piezas — y es también lo que lee quien no ve la pantalla.*
   */
  voz: string
}

/**
 * 🔴 **LOS DOS ESTADOS, Y LA UNIÓN ES LA QUE IMPIDE EL DEFECTO.**
 *
 * Con `contanos?` y `raza?` opcionales se podían mandar **las dos**, y ahí
 * alguien tenía que acordarse de no hacerlo. *Una regla que depende de que el
 * que llama se acuerde no es una regla: es una costumbre.* Acá el tipo sólo
 * deja escribir una.
 */
export type { DimensionesDelVinculo }

export type TarjetaConociendoloProps =
  | (ConociendoloBase & {
      completo?: false
      /** **La única invitación.** O el «Contanos», o la de la raza — jamás las
       *  dos. La pantalla elige cuál toca según lo que falte. */
      invitacion: ReactNode
      vozFelicitacion?: never
      masSobre?: never
    })
  | (ConociendoloBase & {
      /** No queda nada por resolver. */
      completo: true
      /** *«Ya sabemos todo lo importante de Thor»* — **una línea**, ya
       *  redactada, y **sin pedir nada**. */
      vozFelicitacion: string
      /** *«Cuéntanos más de Thor»* — **sin urgencia**: la puerta queda
       *  abierta, no se golpea. Opcional: si no hay más que contar, no va. */
      masSobre?: ReactNode
      invitacion?: never
    })

export function TarjetaConociendolo(props: TarjetaConociendoloProps) {
  const { dimensiones, voz } = props
  const { theme } = useTheme()

  /* ⛔ Un anillo de progreso sobre una vida que terminó mide algo que ya no
     va a cambiar. */
  if (theme.mode === 'memorial') return null

  const completo = props.completo === true

  return (
    <View
      style={{
        gap: spacing[4],
        padding: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: theme.bg.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <HuellaDelVinculo dimensiones={dimensiones} tamano={HUELLA} />
        {/* 🔴 La voz, y NADA más — y acá ya no HAY un número que entrar.
            Dice **qué sabemos y qué falta**, en narrativa: la huella muestra
            la forma, la voz nombra las piezas. */}
        <View style={{ flex: 1 }}>
          <Texto>{voz}</Texto>
        </View>
      </View>

      {/* 🔴 **UNA SOLA COSA DEBAJO DE LA HUELLA, EN CUALQUIERA DE LOS DOS
          ESTADOS.** Completo: la felicitación en una línea y, si hay algo más
          que contar, su puerta sin urgencia. Incompleto: la invitación, y una
          sola. */}
      {completo ? (
        <>
          <Texto variante="apoyo">{props.vozFelicitacion}</Texto>
          {props.masSobre}
        </>
      ) : (
        props.invitacion
      )}
    </View>
  )
}
