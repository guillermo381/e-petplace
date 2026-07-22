/**
 * PieRevelar — revelar el resto de una sección (S71-A3, componente 60).
 *
 * D-454 DISPARADA: el trabajo "revelar lo que ya está en memoria" vivía
 * TRES veces con tres vestidos — `citas/[mascotaId]` (Boton secundario
 * bloque), `hogar/paseos` (Boton compacto sm) y los dos pies de la jornada
 * del prestador (B1). El Hogar v2 era el cuarto consumidor: tercera copia
 * prohibida, el componente nace (entrada 19.6 del diccionario, firmada en
 * gate S71-B1; el componente esperaba su disparo).
 *
 * S73 — LA ANATOMÍA 19.7 (reacción de campo del founder sobre Momentos:
 * "el botón que no me gusta" = la caja del compacto, la misma del gate
 * S72). El compacto MUERE acá: la forma pasa a la anatomía nombrada de
 * la 19.7 — SIN caja, texto + CHEVRON DIRECCIONAL (⌄ revela · ⌃ pliega,
 * el caso revela puro de la variante d — pendiente de firma founder en
 * dispositivo; el fallback es una constante), SIN glifo (pie de sección:
 * no tiene hermanos, Ley 12), target 44, texto en tinta (lo que lo
 * vuelve control es ESTRUCTURAL, no cromático). Los tres consumidores
 * (Ponte al día · Momentos · hub paseos) la heredan gratis.
 *
 * QUÉ ES: el control canónico al PIE de una sección truncada o plegada,
 * cuya etiqueta DICE EL NÚMERO ("Ver 5 más"), jamás un "Ver más" mudo.
 * Con `revelado`, pasa a "Ocultar" (el pliegue de vuelta es el mismo
 * control, mismo lugar).
 *
 * QUÉ NO ES:
 *  · Paginación (traer datos que NO están): eso es el pie de `LineaDeVida`
 *    con su cursor. PieRevelar jamás carga — solo muestra lo ya cargado.
 *  · Abrir un compuesto en sus partes (`FilaSalida`): otro trabajo.
 *
 * Con n === 0 y sin `revelado` NO SE DIBUJA (nada que revelar = nada
 * apagado — regla de existencia). La voz vive en el namespace ui
 * ("Ver {{n}} más": forma neutra a propósito — la etiqueta con artículo
 * obligaría a un género por consumidor).
 *
 * ESCALERA (§4b): no aplica — no muestra datos del expediente; es el
 * control de una sección que ya los mostró.
 */

import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import Animated from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import { usePresionado } from './usePresionado'

export type PieRevelarProps = {
  /** Cuántos ítems quedan por revelar. 0 sin `revelado` = no se dibuja. */
  n: number
  onPress: () => void
  /** La sección ya está revelada: la etiqueta pasa a "Ocultar". */
  revelado?: boolean
}

export function PieRevelar({ n, onPress, revelado = false }: PieRevelarProps) {
  const { t } = useTraduccionUi()
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)

  if (n <= 0 && !revelado) return null

  const etiqueta = revelado ? t('pieRevelar.ocultar') : t('pieRevelar.ver', { n })
  // el chevron canónico de CeldaNavegacion, girado: ⌄ revela · ⌃ pliega
  const d = revelado ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlers.onPressIn}
        onPressOut={handlers.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Animated.View
          style={[estiloPresionado, { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }]}
        >
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.base,
              color: theme.text.primary,
            }}
          >
            {etiqueta}
          </Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Path d={d} stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  )
}
