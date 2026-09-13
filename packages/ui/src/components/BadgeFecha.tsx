import { View, type ViewStyle } from 'react-native'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **BADGE DE FECHA (S116-B lote 2)** — punto 16 del encargo.
 * *«Un cuadrado ciruela con esquinas redondeadas, el mes en letras
 * chiquitas arriba y el día en Baloo grande abajo, en blanco. Vive a la
 * izquierda de una cita.»*
 *
 * **PIEZA NUEVA.** No reemplaza a nadie.
 *
 * ⚠️ **RECIBE EL MES YA ESCRITO, no una fecha.** La pieza no formatea: el
 * formateo de fechas vive en el riel (`fechaCortaMono` y sus hermanas), una
 * función por idioma para todos los módulos. *Si la pieza aceptara un
 * `Date` tendría que elegir idioma, y una pieza que elige idioma es una
 * pieza que va a decir «SEP» en una app en inglés.*
 * ═══════════════════════════════════════════════════════════════════════
 */
export type BadgeFechaProps = {
  /** Ya abreviado y en el idioma de quien mira: «sep», «sep». */
  mes: string
  /** Ya como string: «13». La pieza no rellena con cero ni decide formato. */
  dia: string
}

export function BadgeFecha({ mes, dia }: BadgeFechaProps) {
  const { theme } = useTheme()
  const caja: ViewStyle = {
    /* Cuadrado: el lado sale del avatar de fila, que es con lo que convive
       a la izquierda de una cita — así las dos columnas alinean solas. */
    width: 52,
    height: 52,
    borderRadius: radius.campoV5,
    backgroundColor: theme.accent.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[0],
  }
  return (
    <View style={caja} accessible accessibilityRole="text" accessibilityLabel={`${dia} de ${mes}`}>
      <Texto variante="apoyo" color="inverso">
        {mes}
      </Texto>
      {/* El día en Baloo, que es la cifra de la casa (letra §2). */}
      <View>
        <Texto variante="seccion" color="inverso">
          {dia}
        </Texto>
      </View>
    </View>
  )
}
