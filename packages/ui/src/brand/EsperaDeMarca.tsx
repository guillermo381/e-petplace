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

  const fase = useSharedValue(0)

  useEffect(() => {
    if (esMemorial) return // memorial: quieta — nada respira
    fase.value = withRepeat(
      withTiming(1, { duration: CICLO_MS, easing: Easing.bezier(...motion.easing.easeInOut.bezier) }),
      -1,
      true, // ida y vuelta: inhala / exhala
    )
    return () => {
      fase.value = 0
    }
  }, [esMemorial, fase])

  const estilo = useAnimatedStyle(() => ({
    opacity: esMemorial ? 1 : 0.75 + fase.value * 0.25,
    transform: [{ scale: esMemorial ? 1 : 0.96 + fase.value * 0.09 }],
  }))

  return (
    <Animated.View style={[{ width: tamano, height: tamano }, estilo]}>
      <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
        <Huella color={color} />
      </Svg>
    </Animated.View>
  )
}
