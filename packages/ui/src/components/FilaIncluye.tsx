/**
 * FilaIncluye — QUÉ INCLUYE, en checks.
 *
 * Una lista de líneas con su check en verde. Nada más.
 *
 * ── POR QUÉ EL VERDE ACÁ NO ROMPE LA REGLA DEL SEMÁFORO ───────────────
 * ⚠️ La casa reserva el color de estado para el estado, y un verde regado
 * convierte cualquier lista en un tablero. Acá el verde **no dice «está
 * bien»: dice «esto sí entra»**, y el contraste que carga es contra lo que
 * NO está en la lista. *Es la misma función del check de «Al día»: afirmar,
 * no calificar.* Sale de `status.successText` —el registro de TEXTO del
 * verde, no el de gráfica— porque acompaña a una línea de texto.
 *
 * ── LO QUE NO INCLUYE **NO SE DIBUJA TACHADO** ────────────────────────
 * 🔴 La pieza no tiene estado negativo, y es decisión: *una lista que
 * enumera lo que no entra le enseña a la familia todo lo que le falta a lo
 * que está por comprar.* Lo que no está, no está. Si algún día hace falta
 * decir una exclusión, **es una frase de la pantalla**, no una fila con una
 * cruz.
 */

import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

export interface FilaIncluyeProps {
  /** Las líneas, **ya en voz de familia**. La pieza no traduce códigos. */
  items: string[]
}

export function FilaIncluye({ items }: FilaIncluyeProps) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[2.5] }}>
      {items.map((t) => (
        <View key={t} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5] }}>
          {/* El check es GRÁFICA y no un glifo del registry: no significa
              una acción ni una sección — es el bullet de esta lista.
              `marginTop` de medio renglón para que quede en la primera
              línea cuando el texto envuelve, no centrado en el bloque. */}
          <View style={{ marginTop: 3 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="m5 12.6 4.6 4.6L19 7.8"
                stroke={theme.status.successText}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="cuerpo">{t}</Texto>
          </View>
        </View>
      ))}
    </View>
  )
}
