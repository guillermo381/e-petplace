/**
 * PuertaHermana — LA PUERTA ENTRE DOS VENTANAS HERMANAS (S99-B · pedido
 * de D, contrato acordado sin enmienda).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ ES PIEZA Y NO DOS ARMADOS LOCALES, con el argumento de D
 * porque es el correcto: **si cada pantalla la arma sola, el espejo se
 * rompe la primera vez que alguien cura una sola.**
 *
 * No es hipotético. `FichaPrestador` nació del mismo defecto y su
 * cabecera lo dice medido: la copia *«YA MINTIÓ DOS VECES EN UN MES»*.
 * Dos armados que hoy coinciden **coinciden por copia**, que es la forma
 * más frágil de coincidir — no hay nada que los ate.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── EL ESPEJO ES LA PIEZA, Y POR ESO `direccion` DERIVA TODO ────────
 * La pantalla declara **adónde va**; jamás compone el orden ni elige el
 * chevron. Con `'derecha'` el chevron va después de la etiqueta; con
 * `'izquierda'`, antes — y el trazo sale de la **tabla única**
 * (`chevron.ts`), donde `izquierda` nació como el reflejo exacto de
 * `derecha`, no como un dibujo aparte.
 *
 * *Si el orden fuera del consumidor, «espejo» sería una intención. Acá
 * es una consecuencia: no hay forma de montarla torcida.*
 *
 * ── LO QUE ESTA PIEZA NO TIENE, Y ES DECISIÓN FIRMADA DE D ──────────
 * **① NO lleva contador.** Dos razones, la segunda es la fuerte: un
 *    número tendría que ser verdad **del día que el selector compartido
 *    está mostrando**, y sostener eso obliga a cada ventana a traer los
 *    datos de la otra solo para pintar una cifra — el viaje que N16
 *    existe para eliminar, en la pantalla donde D-738 se midió. Y sobre
 *    todo: **la puerta es un LUGAR, no un aviso.** Un contador la vuelve
 *    badge, y **un badge en 0 es peor que ninguno**: *un cero pintado se
 *    lee como ausencia, y acá la ausencia es del día, no del lugar.*
 *    ☠️ CANDIDATA DECLARADA, no prohibida: el día que las dos ventanas
 *    lean el MISMO rango en un viaje, el contador sale casi gratis y
 *    vuelve a la mesa.
 *
 * **② NO tiene estado deshabilitado ni vacío**, y esto es de ley.
 *    La **Ley 23** prohíbe ofrecer *lo que se va a rechazar*; una ventana
 *    hermana sin trabajo **no rechaza nada** — existe, tiene su vacío
 *    honesto y su propio selector de día. Apagarla **dejaría a alguien
 *    sin poder llegar a su propia ventana justo el día que no tiene
 *    trabajo, que es cuando más quiere mirarla.** Y para saberlo habría
 *    que traer los datos de la otra: el mismo peaje del contador, pagado
 *    para apagar un control.
 *
 * **③ NO decide si se monta.** Que la puerta exista es composición por
 *    CAPACIDAD (quien tiene las dos naturalezas la ve; quien tiene una
 *    sola, no) y vive en el consumidor. La pieza dibuja la puerta; quién
 *    la merece no es asunto suyo.
 *
 * ── LA ALTURA Y EL AIRE VIVEN ACÁ (Ley 8) ──────────────────────────
 * Blanco de 44 y el aire adentro. **Ningún consumidor los re-decide** —
 * si la altura la pusiera cada pantalla, las dos mitades del espejo
 * podrían diferir en píxeles y nadie lo vería hasta cruzar.
 */

import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { CHEVRON } from './chevron'
import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

/** Blanco de 44 — ley de la pieza (N8). */
const ALTURA_MIN = 44
const LADO_CHEVRON = 20

export interface PuertaHermanaProps {
  /** La voz del DESTINO, en palabras del consumidor ("Tus pedidos de
   *  hoy"). La pieza no la compone ni le agrega flechas de texto: el
   *  chevron ya dice la dirección. */
  etiqueta: string
  /** Adónde lleva. De acá derivan el chevron y el orden — ver cabecera. */
  direccion: 'derecha' | 'izquierda'
  onPress: () => void
}

export function PuertaHermana({ etiqueta, direccion, onPress }: PuertaHermanaProps) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  const chevron = (
    <Svg width={LADO_CHEVRON} height={LADO_CHEVRON} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path
        d={CHEVRON[direccion]}
        stroke={theme.text.tertiary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          /** El espejo, en una línea: la puerta se apoya en el borde al
           *  que lleva. La de ida queda a la derecha, la de vuelta a la
           *  izquierda — y **eso no es estética: es lo que hace que el
           *  dedo vuelva al mismo lugar del que salió.** */
          justifyContent: direccion === 'derecha' ? 'flex-end' : 'flex-start',
          gap: spacing[1.5],
          minHeight: ALTURA_MIN,
          paddingHorizontal: spacing[3],
          // pressed 0.99 — la receta única de la casa (diccionario S57)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        {direccion === 'izquierda' ? chevron : null}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: theme.text.secondary,
          }}
        >
          {etiqueta}
        </Text>
        {direccion === 'derecha' ? chevron : null}
      </Animated.View>
    </Pressable>
  )
}

/** El alto que la puerta reserva — quien la monta lo necesita para
 *  calcular el aire de su ventana en vez de estimarlo (mismo criterio
 *  que `ALTO_PIE_CAMPO` y `LADO_PIN`). */
export const ALTO_PUERTA_HERMANA = ALTURA_MIN
