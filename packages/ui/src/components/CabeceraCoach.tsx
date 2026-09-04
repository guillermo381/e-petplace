/**
 * CABECERA COACH — quién está hablando, arriba de la Hoja (S113-B · §2.5).
 *
 * El orbe chico en violeta con el nombre debajo. **Late con cada frase que
 * llega de verdad** — nunca por un temporizador: el pulso lo cuenta la
 * pantalla, que es la única que sabe si llegó texto.
 *
 * 🔴 **POR QUÉ UN CONTADOR Y NO UN `boolean` NI UN `ref`:** un booleano
 * `hablando` no distingue *«llegó otra frase»* de *«sigue hablando»* —dos
 * frases seguidas no producirían dos latidos—. Un `ref` con método `latir()`
 * funcionaría, pero obliga a la pantalla a guardar el ref y a llamarlo desde
 * un efecto: **el contador dice lo mismo declarativamente y no se puede
 * olvidar de limpiar.**
 *
 * **Si no llega texto, no late.** `pulsos` arranca donde arranque y el primer
 * render nunca late: se compara contra el valor anterior, no contra cero.
 * *Latir al montar diría «acabo de decir algo» sobre una Hoja recién abierta
 * que todavía no dijo nada.*
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * · **claro:** nombre en `coachProfundo` (el violeta AA sobre papel).
 * · **oscuro:** nombre en `coachClaro` — el profundo sobre papel oscuro no se
 *   lee, y **el que se lee es el mismo violeta aclarado que la casa ya
 *   calibró** para ese trabajo (`violetText`).
 * · **memorial: no se dibuja**, igual que `PresenciaCoach`.
 * · **reduce-motion: no late.** El nombre y el orbe siguen ahí diciendo quién
 *   habla — que es todo lo que la pieza tiene que decir.
 */

import { useEffect, useRef } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { OrbeCoach } from './OrbeCoach'

import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'


/** El orbe de la cabecera. Más chico que el flotante: acá no es una puerta,
 *  es una firma. */
const ORBE_CABECERA = 36

export interface CabeceraCoachProps {
  /** El nombre, tal cual. **Se dibuja, no se concatena.** */
  nombre: string
  /** Sube de a uno **con cada frase que llega de verdad**. Cada incremento es
   *  un latido; quedarse quieto es no latir. */
  pulsos: number
}

export function CabeceraCoach({ nombre, pulsos }: CabeceraCoachProps) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const esMemorial = theme.mode === 'memorial'
  const quieta = reduceMotion || esMemorial

  const escala = useSharedValue(1)
  const anterior = useRef(pulsos)

  useEffect(() => {
    const hubo = pulsos !== anterior.current
    anterior.current = pulsos
    if (!hubo || quieta) return
    escala.value = withSequence(
      withTiming(motion.coach.latidoEscala, {
        duration: motion.coach.latidoMs / 2,
        easing: Easing.bezier(...motion.easing.easeOut.bezier),
      }),
      withTiming(1, {
        duration: motion.coach.latidoMs / 2,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
    )
  }, [pulsos, quieta, escala])

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))

  if (esMemorial) return null


  return (
    <View accessibilityRole="header" accessibilityLabel={nombre} style={{ alignItems: 'center', gap: spacing[1] }}>
      <Animated.View
        style={[
          {
            width: ORBE_CABECERA,
            height: ORBE_CABECERA,
            borderRadius: radius.full,
            /* ⏪ Acá había `shadowColor` violeta con `shadowRadius`. **En
               Android eso no existe** —sólo `elevation`, que da una sombra
               gris— así que el resplandor no se veía tenue: no se veía. La
               cabecera se queda SIN resplandor a propósito: es una firma
               dentro de una Hoja, no una presencia flotante sobre contenido,
               y ahí el glow no tiene trabajo que hacer. */
            elevation: 0,
          },
          estilo,
        ]}
      >
        {/* ☠️ **ACÁ HABÍA UN TERCER DIBUJO DEL ORBE, Y ERA EL QUE ESTABA
            ROTO.** Sus paradas de brasa usaban `rgba(...)` en el `stopColor`
            —la forma que **en Android pierde el alpha**— así que la cabecera
            se veía un **disco durazno plano** con el violeta tapado debajo.
            El lote 0.2 curó eso en las otras dos copias y ésta se quedó
            atrás: *una cura aplicada en dos de tres copias no es una cura.*
            Ahora las tres apariciones montan `OrbeCoach`. */}
        <OrbeCoach tamano={ORBE_CABECERA} encendido={1} />
      </Animated.View>
      {/* 🔴 **`Texto` no puede decir este color y no debe:** su paleta es
          semántica (primary/secondary/danger…) y esto es la IDENTIDAD de una
          presencia, no un rol del sistema. Meterlo en `TextoColor` sería
          exactamente lo que `R58` prohíbe — un acento adentro de la pieza de
          texto. *El violeta vive donde vive el resto de la presencia.* */}
      <Text
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.sm,
          color: theme.mode === 'dark' ? palette.coachClaro : palette.coachProfundo,
        }}
      >
        {nombre}
      </Text>
    </View>
  )
}
