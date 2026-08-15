/**
 * EsperaDeMarca — la ÚNICA animación de espera legal de la casa
 * (S53-B2d, DIRECCION_ARTE §5.3 / enmienda Ley 13): la Huella
 * respirando en loop SERENO, para esperas de PROCESO >2s (lectura de
 * carnet, pagos futuros) — SIEMPRE acompañada de la voz honesta que
 * pone la pantalla ("puede tardar un minuto"). Los skeletons de
 * CONTENIDO quedan intactos en toda la app.
 *
 * Respiración: escala 0.96↔1.05 + opacidad 0.75↔1, ~1.9s por ciclo,
 * easeInOut — jamás spinner disfrazado, jamás ansiedad (la curva no
 * "gira", respira). Color: magenta puro (marca) en claro/dark.
 * Memorial: QUIETA, en tinta secundaria (§2.8 — nada respira en
 * memorial). Escalera (protocolo Ley 11): no muestra datos del
 * expediente — la escalera no aplica.
 */

import { useEffect } from 'react'
import Svg from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Huella } from './Huella'

const CICLO_MS = 1900

export function EsperaDeMarca({ tamano = 64 }: { tamano?: number }) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  const color = esMemorial ? theme.text.secondary : theme.capa.comunidad

  /** 🔴 S98-B · REDUCE-MOTION — ÉSTA ERA LA PIEZA DE MÁS VALOR DE TODO EL
   *  CENSO, y por una razón que se puede medir: **es el único `withRepeat`
   *  de la casa.** Todo lo demás que se mueve arranca, llega y termina;
   *  esto respira SIN PARAR mientras dura la espera — que además son las
   *  esperas LARGAS (>2s por espec), o sea justo cuando el usuario no
   *  puede mirar a otro lado porque está esperando. *El movimiento
   *  continuo y no solicitado es exactamente lo que la preferencia del
   *  sistema pide apagar.*
   *
   *  ⚠️ SON DOS VARIABLES Y NO UNA, y ésa es la parte delicada:
   *  `esMemorial` gobierna el COLOR (tinta secundaria — §2.8) y `quieta`
   *  gobierna el MOVIMIENTO. Colgar reduce-motion de `esMemorial` habría
   *  sido más corto y habría pintado la huella en gris a quien solo pidió
   *  menos movimiento: *reducir movimiento no es entrar en duelo.* La
   *  marca conserva su magenta; lo único que se apaga es el gesto.
   *
   *  ⚠️ EL HOOK SE LLAMA SUELTO Y RECIÉN DESPUÉS SE COMBINA — no
   *  `esMemorial || useReducedMotion()`, que es más corto y es una
   *  llamada CONDICIONAL a un hook: en memorial el hook no correría y el
   *  orden de hooks cambiaría entre renders. Es el patrón exacto de
   *  `Entrada`, y queda escrito porque la forma corta se ve bien. */
  const reduceMotion = useReducedMotion()
  const quieta = esMemorial || reduceMotion

  const fase = useSharedValue(0)

  useEffect(() => {
    if (quieta) return // memorial y reduce-motion: quieta — nada respira
    fase.value = withRepeat(
      withTiming(1, { duration: CICLO_MS, easing: Easing.bezier(...motion.easing.easeInOut.bezier) }),
      -1,
      true, // ida y vuelta: inhala / exhala
    )
    return () => {
      fase.value = 0
    }
  }, [quieta, fase])

  // Quieta = la huella ENTERA y opaca, no un fotograma a media respiración:
  // la pieza sigue diciendo «esperá», que es su trabajo. La voz honesta que
  // la acompaña (espec) es la que carga el sentido, y ésa no se mueve nunca.
  const estilo = useAnimatedStyle(() => ({
    opacity: quieta ? 1 : 0.75 + fase.value * 0.25,
    transform: [{ scale: quieta ? 1 : 0.96 + fase.value * 0.09 }],
  }))

  return (
    <Animated.View style={[{ width: tamano, height: tamano }, estilo]}>
      <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
        <Huella color={color} />
      </Svg>
    </Animated.View>
  )
}
