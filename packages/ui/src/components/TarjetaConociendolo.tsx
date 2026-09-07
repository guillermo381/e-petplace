/**
 * CONOCIÉNDOLO — el anillo que avanza y no cuenta (S113-B · 2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL PORCENTAJE NO LLEGA A LA PANTALLA, Y NO PUEDE.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `MODELO_LOYALTY` §3: **nada de scores**. El anillo dibuja el avance y **la
 * voz** dice qué significa —*«Ya conocemos a Thor casi como vos»*—.
 *
 * **Y no alcanza con no dibujarlo: la pieza no lo recibe como texto.** El
 * avance entra **sólo como geometría** (`fraccion`, que va al trazo) y la voz
 * entra **ya redactada**. *Si la pieza recibiera el número y la voz por
 * separado, el día que alguien quiera «ser más claro» lo va a imprimir al
 * lado — y ahí una familia pasa a ser una barra de progreso que puede bajar.*
 *
 * ⚠️ Su gate lo mide así: **cero `%`, cero `toFixed`, cero `Math.round` sobre
 * la fracción**, y la fracción no toca ningún `Texto`.
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
import Svg, { Circle } from 'react-native-svg'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { trazoDeProgreso } from './tablero-metrica'

const ANILLO = { lado: 56, grosor: 5 }

interface ConociendoloBase {
  /**
   * 🔴 **GEOMETRÍA, NO DATO.** Va al trazo del anillo y a ningún otro lado.
   * La pieza no la formatea, no la redondea y no la muestra.
   */
  fraccion: number
  /** *«Ya conocemos a Thor casi como vos»* — ya redactada, **sin número**
   *  (Ley 3 y `MODELO_LOYALTY` §3). Lo que el anillo dibuja, esto lo dice. */
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
  const { fraccion, voz } = props
  const { theme } = useTheme()

  /* ⛔ Un anillo de progreso sobre una vida que terminó mide algo que ya no
     va a cambiar. */
  if (theme.mode === 'memorial') return null

  const completo = props.completo === true

  const r = (ANILLO.lado - ANILLO.grosor) / 2
  const vuelta = 2 * Math.PI * r
  const hecho = trazoDeProgreso(fraccion) * vuelta

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
        <Svg width={ANILLO.lado} height={ANILLO.lado}>
          <Circle
            cx={ANILLO.lado / 2}
            cy={ANILLO.lado / 2}
            r={r}
            stroke={theme.bg.hundido}
            strokeWidth={ANILLO.grosor}
            fill="none"
          />
          <Circle
            cx={ANILLO.lado / 2}
            cy={ANILLO.lado / 2}
            r={r}
            stroke={theme.accent.control}
            strokeWidth={ANILLO.grosor}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${hecho} ${vuelta}`}
            transform={`rotate(-90 ${ANILLO.lado / 2} ${ANILLO.lado / 2})`}
          />
        </Svg>
        {/* 🔴 La voz, y NADA más. Acá no entra un número. */}
        <View style={{ flex: 1 }}>
          <Texto>{voz}</Texto>
        </View>
      </View>

      {/* 🔴 **UNA SOLA COSA DEBAJO DEL ANILLO, EN CUALQUIERA DE LOS DOS
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
