/**
 * CONOCIÉNDOLO — el anillo que avanza y no cuenta (S113-B · 2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL PORCENTAJE NO LLEGA A LA PANTALLA, Y NO PUEDE.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `MODELO_LOYALTY` §3: **nada de scores**. El anillo dibuja el avance y **la
 * voz** dice qué significa —*«Ya conocemos a Thor casi como vos»*—.
 *
 * **Y no alcanza con no dibujarlo: la pieza no lo recibe como texto.** El
 * avance entra **sólo como geometría** (`fraccion`, que va al trazo) y la voz
 * entra **ya redactada**. *Si la pieza recibiera el número y la voz por
 * separado, el día que alguien quiera «ser más claro» lo va a imprimir al
 * lado — y ahí una familia pasa a ser una barra de progreso que puede bajar.*
 *
 * ⚠️ Su gate lo mide así: **cero `%`, cero `toFixed`, cero `Math.round` sobre
 * la fracción**, y la fracción no toca ningún `Texto`.
 *
 * ── LO QUE VIVE ADENTRO ─────────────────────────────────────────────────
 * El anillo con su voz, **el «Contanos…»** y **«¿Querés conocer más sobre la
 * raza?»**. Los dos entran como slots: *la tarjeta agrupa, no decide a dónde
 * lleva cada cosa.* Sin ficha publicada, la pantalla no pasa el segundo y
 * queda sólo el primero — que es la regla del encargo.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Un anillo de progreso sobre una vida que terminó mide algo que ya no va a
 * cambiar.* (`MODELO_LOYALTY` §7.1.)
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). **Entregada y no montada** — medido.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { trazoDeProgreso } from './tablero-metrica'

const ANILLO = { lado: 56, grosor: 5 }

export interface TarjetaConociendoloProps {
  /**
   * 🔴 **GEOMETRÍA, NO DATO.** Va al trazo del anillo y a ningún otro lado.
   * La pieza no la formatea, no la redondea y no la muestra.
   */
  fraccion: number
  /** *«Ya conocemos a Thor casi como vos»* — ya redactada, **sin número**
   *  (Ley 3 y `MODELO_LOYALTY` §3). Lo que el anillo dibuja, esto lo dice. */
  voz: string
  /** El «Contanos lo que lo hace único». */
  contanos: ReactNode
  /** «¿Querés conocer más sobre el Bulldog inglés?». **Ausente sin ficha
   *  publicada** — y entonces queda sólo el «Contanos», que es la regla. */
  raza?: ReactNode
}

export function TarjetaConociendolo({ fraccion, voz, contanos, raza }: TarjetaConociendoloProps) {
  const { theme } = useTheme()

  /* ⛔ Un anillo de progreso sobre una vida que terminó mide algo que ya no
     va a cambiar. */
  if (theme.mode === 'memorial') return null

  const r = (ANILLO.lado - ANILLO.grosor) / 2
  const vuelta = 2 * Math.PI * r
  const hecho = trazoDeProgreso(fraccion) * vuelta

  return (
    <View
      style={{
        gap: spacing[4],
        padding: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: theme.bg.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <Svg width={ANILLO.lado} height={ANILLO.lado}>
          <Circle
            cx={ANILLO.lado / 2}
            cy={ANILLO.lado / 2}
            r={r}
            stroke={theme.bg.hundido}
            strokeWidth={ANILLO.grosor}
            fill="none"
          />
          <Circle
            cx={ANILLO.lado / 2}
            cy={ANILLO.lado / 2}
            r={r}
            stroke={theme.accent.control}
            strokeWidth={ANILLO.grosor}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${hecho} ${vuelta}`}
            transform={`rotate(-90 ${ANILLO.lado / 2} ${ANILLO.lado / 2})`}
          />
        </Svg>
        {/* 🔴 La voz, y NADA más. Acá no entra un número. */}
        <View style={{ flex: 1 }}>
          <Texto>{voz}</Texto>
        </View>
      </View>

      {contanos}
      {raza}
    </View>
  )
}
