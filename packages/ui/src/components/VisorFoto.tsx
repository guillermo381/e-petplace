/**
 * VisorFoto — lightbox de fotos, una a la vez (S45-B5.3; primer
 * consumidor: las fotos del paseo en el timeline del dueño).
 *
 * ═══════════════════════════════════════════════════════════════════
 * SOLO FADES (Ley 6 — y Ley 8 gratis: en memorial no hay nada que
 * degradar porque nada rebota). La foto se muestra ENTERA: letterbox
 * digno con contentFit="contain", jamás recorte. Fondo pleno
 * oscurecido (scrim del token sobre negro de la paleta).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Cierre: X (target 44) · tap en el fondo · back de Android por
 * DOBLE VÍA (patrón Hoja B4: onRequestClose + BackHandler explícito).
 * Navegación: swipe horizontal simple si hay varias — el cambio de
 * foto es reemplazo directo (sin slide; Ley 13/6), el contador es
 * voz de máquina ("2 de 5", mono minúsculas).
 *
 * Sin librerías nuevas: Modal de RN + RNGH (peer existente) para el
 * swipe + reanimated para los fades.
 */

import { useEffect, useMemo, useState } from 'react'
import { BackHandler, Modal, Pressable, Text, View } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import Svg, { Path } from 'react-native-svg'
import { Image, type ImageSource } from 'expo-image'

import { palette } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTraduccionUi } from '../i18n'

const UMBRAL_SWIPE = 48

export interface VisorFotoProps {
  visible: boolean
  onCerrar: () => void
  /** string en producto (signed URL); require() solo galería/tests. */
  fotos: Array<string | number | ImageSource>
  indiceInicial?: number
  /** Contexto para el lector — ej: "Fotos del paseo". */
  etiqueta?: string
}

export function VisorFoto({
  visible,
  onCerrar,
  fotos,
  indiceInicial = 0,
  etiqueta,
}: VisorFotoProps) {
  const { t } = useTraduccionUi()
  etiqueta = etiqueta ?? t('visorFoto.fotos')
  const [indice, setIndice] = useState(indiceInicial)
  const opacidad = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setIndice(Math.min(Math.max(indiceInicial, 0), Math.max(fotos.length - 1, 0)))
      opacidad.value = withTiming(1, { duration: motion.duration.normal })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, indiceInicial])

  const cerrarConFade = () => {
    opacidad.value = withTiming(0, { duration: motion.duration.fast }, (fin) => {
      if (fin) scheduleOnRN(onCerrar)
    })
  }

  // Back de Android — doble vía (patrón Hoja).
  useEffect(() => {
    if (!visible) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cerrarConFade()
      return true
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const siguiente = () => setIndice((i) => Math.min(i + 1, fotos.length - 1))
  const anterior = () => setIndice((i) => Math.max(i - 1, 0))

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-16, 16])
        .onEnd((e) => {
          if (e.translationX < -UMBRAL_SWIPE) {
            scheduleOnRN(siguiente)
          } else if (e.translationX > UMBRAL_SWIPE) {
            scheduleOnRN(anterior)
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fotos.length],
  )

  const estiloFade = useAnimatedStyle(() => ({ opacity: opacidad.value }))

  if (!visible || fotos.length === 0) return null
  const foto = fotos[indice]

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={cerrarConFade}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[
            // fondo pleno: negro de la tinta + scrim del token encima
            { flex: 1, backgroundColor: palette.textLight0 },
            estiloFade,
          ]}
          accessibilityViewIsModal
          accessibilityLabel={etiqueta}
        >
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: palette.scrim }} />
          {/* tap en el fondo cierra */}
          <Pressable accessibilityLabel={t('visorFoto.cerrar')} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={cerrarConFade} />

          <GestureDetector gesture={swipe}>
            <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
              <Image
                source={typeof foto === 'string' ? { uri: foto } : foto}
                contentFit="contain"
                transition={0}
                style={{ width: '100%', height: '80%' }}
                accessibilityLabel={t('visorFoto.fotoNdeM', { i: indice + 1, total: fotos.length })}
              />
            </View>
          </GestureDetector>

          {/* X — target 44, arriba a la derecha */}
          <Pressable
            onPress={cerrarConFade}
            accessibilityRole="button"
            accessibilityLabel={t('visorFoto.cerrar')}
            hitSlop={10}
            style={{
              position: 'absolute',
              top: spacing[12],
              right: spacing[4],
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M18 6L6 18" stroke={palette.white} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>

          {fotos.length > 1 ? (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                // voz de máquina: contador en mono minúsculas
                position: 'absolute',
                bottom: spacing[10],
                alignSelf: 'center',
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: palette.white,
              }}
            >
              {t('visorFoto.conteo', { i: indice + 1, total: fotos.length })}
            </Text>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}
