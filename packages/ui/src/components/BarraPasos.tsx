import { View } from 'react-native'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **BARRA DE PASOS (S116-B lote 2)** — punto 16 del encargo.
 * *«Los tres tramos que van bajo la cabecera, como pieza propia para que C
 * no la dibuje.»*
 *
 * **PIEZA NUEVA.** Nace porque el encargo la pide como pieza y no como
 * dibujo de pantalla — *un tramo de progreso dibujado por cada flujo son
 * cuatro progresos que divergen.*
 *
 * Vive bajo la cabecera ciruela, así que sus dos colores son los de ESE
 * fondo: el hecho en `rosaSobreCiruela`, el resto apagado.
 *
 * 🔴 **NO ES UNA BARRA DE CARGA Y NO SE ANIMA.** Dice en qué paso estás,
 * y eso no cambia solo: cambia cuando la persona avanza, y ahí la pantalla
 * ya se rehizo entera. *Animar el tramo sería mover algo que no se está
 * moviendo* (Ley 6 · L-c: si al quitar la animación dice lo mismo, sobraba).
 *
 * ⚠️ **No lleva número ni porcentaje.** LOYALTY §3 sigue: nada de
 * contadores de progreso en pantalla. Tres tramos dicen «de tres», y el
 * lector de pantalla lo dice con palabras.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type BarraPasosProps = {
  total: number
  /** 1-based: el paso en el que estás, no el índice. */
  actual: number
  /** La voz del lector. Sin default (Ley 3): «Paso 2 de 3» se arma en el riel. */
  etiqueta: string
}

export function BarraPasos({ total, actual, etiqueta }: BarraPasosProps) {
  /* Con un solo paso no hay progreso que mostrar: la barra no se dibuja.
     Es la regla de existencia de la casa — el mismo criterio con el que
     `PieRevelar` no se monta con n=0. */
  if (total <= 1) return null

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      style={{ flexDirection: 'row', gap: spacing[2] }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: radius.chipV5,
            backgroundColor:
              i < actual ? palette.rosaSobreCiruela : `${palette.rosaSobreCiruela}40`,
          }}
        />
      ))}
    </View>
  )
}
