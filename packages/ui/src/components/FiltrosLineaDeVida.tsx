/**
 * FILTROS DE LA LÍNEA DE VIDA — chips por tipo, multi-selección.
 *
 * 🔴 **SIN SCROLL HORIZONTAL: si no entran, van en dos filas.**
 * *Una tira que se desplaza esconde sus últimos chips y no avisa* — el que no
 * sabe que hay más, no arrastra. Con `flexWrap` **todo lo que existe está a la
 * vista**, y el alto que crece es el precio honesto de eso.
 *
 * ⚠️ **Ninguno seleccionado = TODOS**, y no es un atajo: *un timeline vacío
 * porque nadie tocó un chip se lee como «no pasó nada», que es exactamente lo
 * contrario de lo que pasa.* La pieza no lo decide sola — devuelve el conjunto
 * y la pantalla lo interpreta —, pero su voz lo dice.
 */

import { Pressable, Text, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

export type TipoLineaDeVida = 'salud' | 'vacunas' | 'antiparasitario' | 'peso' | 'cuidado' | 'recuerdos'

export interface FiltrosLineaDeVidaProps {
  /** Los tipos que la pantalla ofrece, en su orden. */
  tipos: readonly TipoLineaDeVida[]
  /** Los elegidos. **Vacío = todos** (ver cabecera). */
  elegidos: readonly TipoLineaDeVida[]
  /** La voz de cada chip (Ley 3). */
  voz: (t: TipoLineaDeVida) => string
  onAlternar: (t: TipoLineaDeVida) => void
}

export function FiltrosLineaDeVida({ tipos, elegidos, voz, onAlternar }: FiltrosLineaDeVidaProps) {
  const { theme } = useTheme()
  return (
    /* `flexWrap` y NO un ScrollView horizontal: ver la cabecera. */
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      {tipos.map((t) => {
        const on = elegidos.includes(t)
        return (
          <Pressable
            key={t}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={voz(t)}
            onPress={() => onAlternar(t)}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: spacing[3],
              borderRadius: radius.full,
              backgroundColor: on ? theme.accent.control : theme.bg.card,
            }}
          >
            {/* ⚠️ **`Texto` no puede decir «blanco sobre el acento» y no debe:**
                su paleta es semántica y `sobreVideo` —el único blanco que
                expone— tiene su nota diciendo *«se usa SOLO sobre video»*.
                Acá el fondo lo pinta la casa, así que el par es
                `text.inverse` sobre `accent.control`, **medido en
                `verify:contrast`**. */}
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.control,
                color: on ? theme.text.inverse : theme.text.secondary,
              }}
            >
              {voz(t)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
