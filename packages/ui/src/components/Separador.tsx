/**
 * Separador — divisor hairline entre Celdas (S43-B3.4).
 * Pensado para ItemSeparatorComponent de FlatList; la Celda no trae
 * divisor propio. `indentacion` alinea el divisor con el contenido
 * cuando las celdas llevan slot inicio (px desde la izquierda).
 */

import { StyleSheet, View } from 'react-native'

import { useTheme } from '../ThemeProvider'

export function Separador({ indentacion = 0 }: { indentacion?: number }) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.bg.border,
        marginLeft: indentacion,
      }}
    />
  )
}
