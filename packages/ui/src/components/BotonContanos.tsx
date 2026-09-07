/**
 * «Contanos lo que hace único a Thor ›» — el acceso (S113-B · 2.1 · B2).
 *
 * La puerta a `HojaContanos`, y **una de cuatro**: la misma Hoja se abre desde
 * el pie de la ficha de raza, la pastilla del perfil, un chip en la Hoja de
 * Nexo y las celdas vacías de HOY. *Por eso el acceso está aparte de la Hoja:
 * si viniera adentro, cada lugar tendría que montar el botón entero o clonar
 * la Hoja.*
 *
 * ── 🔴 NO SE TRUNCA, Y POR ESO NO HAY `numberOfLines` ───────────────────
 * Lleva el nombre de la mascota adentro, y **un nombre largo cortado es peor
 * que un botón alto**: *«Contanos lo que hace único a Constan… ›» le dice a la
 * familia que la app no supo con quién estaba hablando.* Su caja crece; el
 * chevron se queda quieto a la derecha.
 *
 * ── LA FORMA ES LA DE LA CASA (19.7) ────────────────────────────────────
 * Label + **la primitiva de chevron** + target 44. No es un `Boton` sólido:
 * *por superficie hay UN sólido, y en el perfil ése no es éste.* Es la misma
 * anatomía de `AccionQueLleva`, y **no se reusó a propósito**: aquélla centra
 * y ésta vive al pie de una tarjeta, con el texto pudiendo ocupar dos líneas.
 * ⚠️ Si algún día `AccionQueLleva` acepta texto multilínea alineado al inicio,
 * **esta pieza se retira y consume aquélla** — la condición queda escrita.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * Misma razón que la Hoja que abre.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El pie de `FichaRaza` (por su slot `cierre`), el perfil, la Hoja de Nexo y
 * el HOY (C). **Entregada y no montada** — medido.
 */

import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { Chevron } from './chevron'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface BotonContanosProps {
  /** *«Contanos lo que hace único a Thor»* — con el nombre adentro, ya
   *  compuesto (Ley 3). **Se dibuja entero.** */
  etiqueta: string
  onPress: () => void
}

export function BotonContanos({ etiqueta, onPress }: BotonContanosProps) {
  const { theme } = useTheme()

  if (theme.mode === 'memorial') return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        minHeight: 44,
        paddingVertical: spacing[2],
      }}
    >
      {/* `flex: 1` para que crezca hacia abajo en vez de empujar al chevron
          fuera de la caja. Sin `numberOfLines`: ver la cabecera. */}
      <View style={{ flex: 1 }}>
        <Texto color="primary">{etiqueta}</Texto>
      </View>
      <Chevron color={theme.text.tertiary} direccion="derecha" />
    </Pressable>
  )
}
