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
  /**
   * 🔴 LA SEÑAL REAL, OBLIGATORIA SIN DEFAULT: `estado_vida === 'fallecida'`,
   * resuelta por la pantalla contra el perfil que ya tiene cargado.
   *
   * ⏪ **El piso de esta pieza colgaba SÓLO de `theme.mode === 'memorial'`, y
   * ése es un interruptor que nadie aprieta.** Medido en `D-1021`: **nadie
   * monta `<ThemeProvider memorial>` en ninguna de las dos apps** — el único
   * provider vivo es el raíz, con `mode={light|dark}`. *La protección estaba
   * escrita, se leía como protección, y la app igual le pedía algo a quien
   * perdió a su animal.*
   *
   * **`perdida` NO es memorial** (firma del founder, 7-sep): la familia que
   * busca a su mascota conserva la app entera. Por eso la prop se llama por
   * lo que la letra nombra y no por el estado.
   *
   * *No es un default que se pueda omitir: un `false` por omisión sería
   * exactamente el guard apagado que esta prop viene a curar.*
   */
  enMemorial: boolean

  /** *«Contanos lo que hace único a Thor»* — con el nombre adentro, ya
   *  compuesto (Ley 3). **Se dibuja entero.** */
  etiqueta: string
  onPress: () => void
}

export function BotonContanos({ enMemorial, etiqueta, onPress }: BotonContanosProps) {
  const { theme } = useTheme()

    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema y ahí el
     guard tiene que seguir valiendo. *Lo que estaba mal no era mirar el tema:
     era mirar SÓLO el tema.* */
  if (enMemorial || theme.mode === 'memorial') return null

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
