/**
 * BarrasSemana — la tira de 7 días de los Vitales (S53-B2c.1, Ley 11;
 * composición firmada por founder en el brief del bloque).
 *
 * QUÉ ES: 7 barras, una por día (índice 0 = hace 6 días, 6 = hoy),
 * altura PROPORCIONAL al valor REAL del día contra el máximo de la
 * ventana. Un día sin salida = barra base mínima en bg.overlay — la
 * verdad tal cual (L-139): si hubo 2 salidas en 7 días, se ven 2
 * llenas y 5 en base. Presentacional puro: recibe los valores ya
 * calculados (domain), no sabe de paseos.
 *
 * QUÉ NO ES: no es un chart genérico (7 valores, un color); sin ejes,
 * sin labels, sin tooltips; ESTÁTICA (Ley 6 — sin animación de carga).
 *
 * Color: el hex puro de su capa (registro gráfica). Memorial degrada:
 * barras llenas a text.secondary, base se conserva.
 * A11y: resumen en el contenedor (la pantalla pasa la etiqueta).
 */

import { View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type BarrasSemanaCapa = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

const ALTO_BASE = 6

export function BarrasSemana({
  valores,
  capa = 'cuidado',
  alto = 56,
  etiqueta,
}: {
  /** 7 valores reales (0 = sin salida ese día). */
  valores: number[]
  capa?: BarrasSemanaCapa
  alto?: number
  /** a11y — ej: "2 de 7 días con salida esta semana". */
  etiqueta: string
}) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  const colorLleno = esMemorial ? theme.text.secondary : theme.capa[capa]
  const max = Math.max(...valores, 0)

  return (
    <View
      accessible
      accessibilityLabel={etiqueta}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], height: alto }}
    >
      {valores.slice(0, 7).map((v, i) => {
        const conDato = v > 0 && max > 0
        const altoBarra = conDato ? Math.max(ALTO_BASE + 4, Math.round((v / max) * alto)) : ALTO_BASE
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: altoBarra,
              borderRadius: radius.sm,
              backgroundColor: conDato ? colorLleno : theme.bg.overlay,
            }}
          />
        )
      })}
    </View>
  )
}
