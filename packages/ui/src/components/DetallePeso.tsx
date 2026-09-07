/**
 * DETALLE DEL PESO — la serie, y quién la midió (S113-B · 2.2 · B5).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **QUIÉN PESÓ NO ES UN ADORNO: CAMBIA LO QUE EL PUNTO VALE.**
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Lo pesó la clínica» y «lo pesaste vos» no son la misma medición* — una
 * salió de una balanza calibrada y la otra de alzarlo en brazos. Dibujarlos
 * iguales convierte una serie de dos fuentes en una sola curva, y una caída de
 * dos kilos entre un punto propio y uno clínico se lee como que adelgazó.
 * ⇒ **punto lleno = clínica · punto hueco = casa**, y la leyenda lo dice con
 * palabras. Misma doctrina que la procedencia del expediente.
 *
 * ── 🔴 SIN DATO NO SE DIBUJA EL GRÁFICO ─────────────────────────────────
 * Con menos de dos puntos **no hay línea** —una recta de un punto dice
 * «estable», que nadie afirmó— y la pantalla se queda con su dato grande y su
 * tabla, que siguen siendo ciertos. Con CERO puntos tampoco hay tabla: se
 * dibuja la voz del hueco.
 *
 * ── EL ÚLTIMO SE RESALTA, Y ES EL QUE LA GENTE VINO A VER ───────────────
 * Punto más grande y su fecha en el eje. *El resto del eje son referencias; el
 * último es el dato.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)**: las fechas llegan redactadas por el riel y las
 * unidades vienen en el valor. **No ordena la serie** — el orden lo trae quien
 * tiene las fechas; ordenar acá escondería un criterio.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El detalle desde la tarjeta de peso (C). **Entregada y no montada** —
 * medido.
 */

import { View } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'

import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { hayLineaQueDibujar, puntosDeLinea } from './tablero-metrica'

const LIENZO = { ancho: 300, alto: 120 }

export interface PuntoDePeso {
  id: string
  /** El número, para el dibujo. */
  kg: number
  /** *«24 kg»* — ya redactado con su unidad. */
  valor: string
  /** *«04 sept 2026»* — ya redactada por el riel. */
  fecha: string
  /** 🔴 **Cambia el dibujo del punto.** Ver la cabecera. */
  origen: 'clinica' | 'casa'
}

export interface DetallePesoProps {
  /** En orden, del más viejo al más nuevo. **La pieza no la ordena.** */
  serie: readonly PuntoDePeso[]
  /** *«Todavía no le tomaste el peso»* — para cuando no hay ni un punto. */
  vozSinDatos: string
  /** *«lo pesó la clínica»* / *«lo pesaste vos»* — la leyenda, ya redactada. */
  vozClinica: string
  vozCasa: string
}

export function DetallePeso({ serie, vozSinDatos, vozClinica, vozCasa }: DetallePesoProps) {
  const { theme } = useTheme()

  /* 🔴 Cero puntos: ni gráfico ni tabla, y se dice. */
  if (serie.length === 0) {
    return <Texto variante="apoyo">{vozSinDatos}</Texto>
  }

  const ultimo = serie[serie.length - 1]!
  const puntos = puntosDeLinea(serie.map((p) => p.kg), LIENZO.ancho, LIENZO.alto)
  const hayLinea = hayLineaQueDibujar(serie.map((p) => p.kg))

  return (
    <View style={{ gap: spacing[5] }}>
      {/* El dato grande arriba: es lo que se vino a ver. */}
      <View style={{ gap: spacing[0.5] }}>
        <Texto variante="seccion">{ultimo.valor}</Texto>
        <Texto variante="apoyo">{ultimo.fecha}</Texto>
      </View>

      {/* 🔴 El gráfico SÓLO con dos puntos o más. Ver la cabecera. */}
      {hayLinea ? (
        <View style={{ gap: spacing[2] }}>
          <Svg width={LIENZO.ancho} height={LIENZO.alto}>
            <Polyline
              points={puntos.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={theme.accent.control}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {puntos.map((p, i) => {
              const dato = serie[i]!
              const esUltimo = i === serie.length - 1
              return (
                <Circle
                  key={dato.id}
                  cx={p.x}
                  cy={p.y}
                  r={esUltimo ? 5 : 3.5}
                  stroke={theme.accent.control}
                  strokeWidth={2}
                  /* Lleno = clínica · hueco = casa. Ver la cabecera. */
                  fill={dato.origen === 'clinica' ? theme.accent.control : theme.bg.base}
                />
              )
            })}
          </Svg>
          {/* La leyenda con palabras: *un punto lleno y uno hueco no explican
              solos qué los separa.* */}
          <View style={{ flexDirection: 'row', gap: spacing[4] }}>
            <Texto variante="apoyo">{vozClinica}</Texto>
            <Texto variante="apoyo">{vozCasa}</Texto>
          </View>
        </View>
      ) : null}

      {/* La tabla: existe con UN punto, porque un punto sí es un dato. */}
      <View style={{ gap: spacing[1] }}>
        {[...serie].reverse().map((p) => (
          <View
            key={p.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: spacing[3],
              paddingVertical: spacing[2],
              borderBottomWidth: theme.border.width,
              borderBottomColor: theme.border.subtle,
            }}
          >
            <Texto variante="apoyo">{p.fecha}</Texto>
            <Texto>{p.valor}</Texto>
          </View>
        ))}
      </View>
    </View>
  )
}
