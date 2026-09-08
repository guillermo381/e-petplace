/**
 * EL AVISO QUE SE ADELANTA — «Thor entra a senior en marzo…» (S113-B · 2.1 · B5).
 *
 * Dos formas y una sola pieza: **fila** en el HOY y **tarjeta** en la Hoja de
 * Nexo. *Dos piezas para el mismo aviso divergirían, y la que se cure primero
 * dejaría a la otra diciendo otra cosa.*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NUNCA ES UNA ALARMA, Y ESO NO ES UNA PREFERENCIA DE COLOR.**
 * ═══════════════════════════════════════════════════════════════════════════
 * No pasó nada malo: **todavía no pasó nada.** Un aviso que se adelanta
 * pintado de rojo le dice a una familia que su perro está enfermo cuando lo
 * que dice es que dentro de unos meses conviene preguntar algo. *Y el costo no
 * es el susto: es que la próxima alarma —la que sí importa— ya no se
 * distingue.* Vive en el **tinte de atención**, y `R20` lo pide igual: la
 * familia de alerta vive como tinte, nunca como relleno.
 *
 * ── 🔴 JAMÁS DIAGNOSTICA, Y LA PIEZA LO HACE ESTRUCTURAL ────────────────
 * El acto es **«Hablarlo con mi vet»** y es OBLIGATORIO: sin `onVerVet` no
 * compila. *Un aviso que nombra una predisposición y no ofrece a quién
 * preguntarle deja a la familia con una palabra médica y sin nadie.* La
 * conclusión la pone el veterinario; esto sólo se acuerda a tiempo.
 *
 * ── LA VOZ VIENE HECHA, Y ES DE OTRO (Ley 3) ────────────────────────────
 * Nexo la redacta y la pantalla la pasa: **contexto** (*«Thor entra a senior
 * en marzo»*), **sugerencia** (*«los Bulldog inglés suelen tener displasia de
 * cadera: vale la pena un estudio en su próximo chequeo»*). La pieza no arma
 * ninguna de las dos — *si compusiera, tendría que saber de razas, y una
 * pieza de dibujo que sabe de medicina es donde nace el diagnóstico
 * accidental.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Adelantarle a una familia lo que le habría pasado a su mascota el año que
 * viene es la peor cosa que puede hacer un producto que se adelanta.*
 * (`MODELO_LOYALTY` §7.1.)
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La fila «Hoy» y la Hoja de Nexo (C). **Entregada y no montada** — medido:
 * `git grep AvisoAnticipacion -- apps/` da cero.
 */

import { Pressable, View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

interface Comun {
  /** *«Thor entra a senior en marzo»* — ya redactada. */
  contexto: string
  /** *«Los Bulldog inglés suelen tener displasia de cadera: vale la pena
   *  hablarlo en su próximo chequeo»* — ya redactada. */
  sugerencia: string
}

/**
 * 🔴 **CADA FORMA EXIGE LO SUYO Y NADA MÁS, y es una unión por eso.**
 * ⏪ Primero fueron una interfaz sola con `onVerVet` obligatorio en las dos —y
 * la **fila no lo dibuja**: era una prop que había que pasar para que no
 * hiciera nada. *Una prop obligatoria que en la mitad de los casos se ignora
 * enseña a pasar cualquier cosa con tal de que compile.*
 *
 * · **fila** — en el HOY, tocable entera: lleva a la Hoja, **donde está el
 *   acto**. *En una lista de la jornada, un botón por fila convierte el día en
 *   un formulario.* Exige su destino: una fila que no lleva a la Hoja deja el
 *   aviso sin ningún lugar donde resolverse.
 * · **tarjeta** — en la Hoja, **con el acto a la vista**: ahí ya se entró a
 *   leer, y esconder el paso siguiente detrás de otro toque es hacer que la
 *   familia lo busque. Exige el acto y su palabra.
 */
export type AvisoAnticipacionProps =
  | (Comun & { forma: 'fila'; onAbrir: () => void; onVerVet?: never; vozVerVet?: never })
  | (Comun & { forma: 'tarjeta'; onVerVet: () => void; vozVerVet: string; onAbrir?: never })

export function AvisoAnticipacion(props: AvisoAnticipacionProps) {
  const { theme } = useTheme()
  const { contexto, sugerencia } = props

  /* ⛔ Nada que adelantar cuando ya no hay mañana. Ver la cabecera. */
  if (theme.mode === 'memorial') return null

  /* 🔴 TINTE, NO RELLENO. El borde ocre y el fondo de la casa: se distingue
     sin gritar, y no compite con el CTA (`R20`). */
  const piel = {
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: theme.bg.card,
    borderWidth: theme.border.width,
    borderColor: theme.status.warningText,
  }

  /* El contexto va primero y en apoyo; la sugerencia es la que se lee. *El
     cuándo sitúa, el qué hacer es el mensaje.* */
  const cuerpo = (
    <>
      <Texto variante="apoyo">{contexto}</Texto>
      <Texto>{sugerencia}</Texto>
    </>
  )

  if (props.forma === 'fila') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${contexto} · ${sugerencia}`}
        onPress={props.onAbrir}
        style={{ ...piel, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
      >
        <View style={{ flex: 1, gap: spacing[1] }}>{cuerpo}</View>
        <Chevron color={theme.text.tertiary} direccion="derecha" />
      </Pressable>
    )
  }

  return (
    <View style={piel}>
      {cuerpo}
      {/* El acto, a la vista. Secundario y no primario: *el aviso no pide que
          se haga algo AHORA — pide que se hable con alguien cuando toque.* */}
      <View style={{ alignItems: 'flex-start', paddingTop: spacing[1] }}>
        <Boton variante="secundario" tamaño="sm" etiqueta={props.vozVerVet} onPress={props.onVerVet} />
      </View>
    </View>
  )
}
