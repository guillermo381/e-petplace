/**
 * ⭐ S86-C · BARRAS APILADAS POR SERVICIO — la gráfica del día por día
 * (lámina DATOS, decisión ②).
 *
 * ═══ POR QUÉ NACE ACÁ Y NO EN `packages/ui` ═══════════════════════════
 * **`BarrasSemana` NO sirve, y lo dice ella misma:** su cabecera declara
 * *"no es un chart genérico (7 valores, un color)"*. Apilar por servicio
 * es otra cosa, y ensancharla sería romperle su contrato.
 * Nace LOCAL y DECLARADA, que es el camino de la casa: `SelectorDia`
 * hizo exactamente esto —nació local en el cliente, B la promovió cuando
 * apareció el SEGUNDO consumidor—. **Su condición de promoción es ésa:
 * el segundo consumidor.** Mientras haya uno, vive acá.
 *
 * ═══ LO QUE NO HACE, a propósito ═════════════════════════════════════
 * Sin ejes, sin tooltips, sin animación de carga (Ley 6). Presentacional
 * PURA: recibe los días ya armados y no sabe de citas ni de oficios.
 *
 * ⚠️ EL COLOR SALE DEL REGISTRO GRÁFICA (`theme.capa[...]`), que es el
 * mismo que usa `BarrasSemana`. **La lámina pinta teal · oro · menta, y
 * el oro NO se usa acá**: el único oro de la casa es `ctaOro` — el CTA
 * del CLIENTE— y moverlo a ser acento de DATO en el prestador es una
 * decisión de TOKEN (territorio de B + firma sobre pantalla), no de
 * pantalla. Se nombra para el gate en vez de tomarse sola; el principio
 * de ② —que ningún color de CTA se lea como dato— se cumple igual.
 *
 * MEMORIAL degrada sin rama propia: `theme.capa` ya resuelve por tema.
 */

import { View } from 'react-native'

import { Texto, radius, spacing, useTheme } from '@epetplace/ui'

/** Las capas del registro gráfica — mismo vocabulario que `BarrasSemana`. */
export type CapaGrafica = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

export interface TramoBarra {
  /** Clave estable para el `key` de React (el código de motor sirve acá:
   *  NO se pinta, solo identifica — Ley 3 intacta). */
  clave: string
  capa: CapaGrafica
  valor: number
}

export interface DiaBarra {
  /** La etiqueta YA resuelta por la pantalla (L · M · X…). */
  etiqueta: string
  tramos: TramoBarra[]
  /** Días > `hasta`: el motor trae la semana ISO entera, así que puede
   *  haber futuro con citas firmes. Se dibuja MÁS TENUE — es agenda, no
   *  jornada cumplida, y pintarlo igual afirmaría que ya pasó. */
  futuro: boolean
}

const ALTO_BASE = 4

export function BarrasApiladas({
  dias,
  alto = 132,
  etiqueta,
}: {
  dias: DiaBarra[]
  alto?: number
  /** a11y — la pantalla arma el resumen; el lector no ve colores. */
  etiqueta: string
}) {
  const { theme } = useTheme()
  const totales = dias.map((d) => d.tramos.reduce((s, t) => s + t.valor, 0))
  const max = Math.max(...totales, 0)

  return (
    <View accessible accessibilityLabel={etiqueta} style={{ gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], height: alto }}>
        {dias.map((d, i) => {
          const total = totales[i] ?? 0
          /* Un día SIN atenciones no se dibuja vacío: lleva la barra base,
             que es la verdad (hubo día, no hubo trabajo) — la misma receta
             que `BarrasSemana`, copiada al vecino y no reinventada. */
          if (total === 0 || max === 0) {
            return (
              <View key={d.etiqueta + i} style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
                <View
                  style={{
                    width: '100%',
                    height: ALTO_BASE,
                    borderRadius: radius.xs,
                    backgroundColor: theme.bg.overlay,
                  }}
                />
                <Texto variante="dato">{d.etiqueta}</Texto>
              </View>
            )
          }
          const altoTotal = Math.max(ALTO_BASE + 4, Math.round((total / max) * (alto - 18)))
          return (
            <View key={d.etiqueta + i} style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
              {/* La pila se arma de ARRIBA hacia abajo con `column-reverse`
                  para que el primer tramo quede apoyado en la base — el
                  orden de los tramos lo decide la pantalla y acá se
                  respeta tal cual. */}
              <View
                style={{
                  width: '100%',
                  height: altoTotal,
                  borderRadius: radius.xs,
                  overflow: 'hidden',
                  flexDirection: 'column-reverse',
                  opacity: d.futuro ? 0.45 : 1,
                }}
              >
                {d.tramos.map((t) => (
                  <View
                    key={t.clave}
                    style={{
                      width: '100%',
                      height: `${(t.valor / total) * 100}%`,
                      backgroundColor: theme.capa[t.capa],
                    }}
                  />
                ))}
              </View>
              <Texto variante="dato">{d.etiqueta}</Texto>
            </View>
          )
        })}
      </View>
    </View>
  )
}
