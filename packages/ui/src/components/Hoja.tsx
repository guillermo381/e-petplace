/**
 * Hoja — el modal del sistema (S43-B3.8): confirmaciones, formularios
 * cortos, detalle rápido.
 *
 * BOTTOM SHEET SIEMPRE — móvil-first: nada de modales centrados
 * flotantes. Sube desde abajo con spring normal(250) — la hoja es
 * frecuente, no ceremonial. En memorial NADA rebota (regla B1): el
 * spring se reemplaza por slide+fade suave easeOut.
 *
 * Cierre: swipe down (umbral 25% o velocity >800 — receta SM), tap en
 * backdrop, X opcional, y back de Android por DOBLE VÍA (B4):
 * onRequestClose del Modal + BackHandler explícito mientras está abierta.
 *
 * Scroll interno sin pelear con el gesto (receta SM, gesture-composition):
 * Gesture.Native() en el ScrollView + Pan simultáneo; el pan solo arrastra
 * la hoja cuando el scroll está en top.
 *
 * FOCO — patrón de retorno al disparador (el consumidor lo cablea):
 *   const disparadorRef = useRef<View>(null)
 *   <Boton ref?… onPress={() => setAbierta(true)} />
 *   <Hoja visible={abierta} onCerrar={() => {
 *     setAbierta(false)
 *     disparadorRef.current?.focus?.()   // web; en nativo, setFocus via
 *   }} … />                              // AccessibilityInfo si aplica
 * Al abrir: accessibilityViewIsModal + anuncio del título.
 */

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AccessibilityInfo,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView as GHScrollView,
} from 'react-native-gesture-handler'
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import Svg, { Path } from 'react-native-svg'

import { palette } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

const AnimatedGHScrollView = Animated.createAnimatedComponent(GHScrollView)

// El pan del swipe-to-close, expuesto a los descendientes para que un
// scrollable interno pueda bloquearlo en su área (ver HojaScroll).
type PanDeHoja = ReturnType<typeof Gesture.Pan>
const HojaPanContext = createContext<PanDeHoja | null>(null)

export type HojaAltura = 'contenido' | 'media' | 'completa'

export interface HojaProps {
  visible: boolean
  /** Se llama cuando la hoja terminó de salir (swipe/backdrop/X/back). */
  onCerrar: () => void
  children: ReactNode
  titulo?: string
  /** contenido = auto hasta 60% (default) · media = 50% · completa = 90% (formularios). */
  altura?: HojaAltura
  /** Botón X (target 44). El swipe/backdrop/back existen siempre. */
  conCerrar?: boolean
}

export interface HojaScrollProps {
  children: ReactNode
  style?: object
  contentContainerStyle?: object
}

/**
 * HojaScroll — scrollable interno que GANA dentro del área de la Hoja
 * (S45-B3.2, gate en dispositivo: el pan del swipe-to-close capturaba
 * el arrastre de listas anidadas en Android — L-132: web no lo delata).
 *
 * Patrón SM (gesture-composition · block): cada scrollable lleva SU
 * PROPIA Gesture.Native() (prohibido reusar instancias entre detectores)
 * con .blocksExternalGesture(pan de la Hoja) — el pan no puede activarse
 * mientras el toque nace acá; el swipe-to-close sigue vivo en el agarre,
 * header y todo lo que no sea este scroll. Fuera de una Hoja degrada a
 * ScrollView normal.
 */
export const HojaScroll = forwardRef<GHScrollView, HojaScrollProps>(function HojaScroll(
  { children, style, contentContainerStyle },
  ref,
) {
  const pan = useContext(HojaPanContext)
  const nativo = useMemo(() => {
    const g = Gesture.Native()
    if (pan) g.blocksExternalGesture(pan)
    return g
  }, [pan])

  const scroll = (
    <GHScrollView
      ref={ref}
      nestedScrollEnabled
      style={style}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </GHScrollView>
  )

  if (!pan) return scroll
  return <GestureDetector gesture={nativo}>{scroll}</GestureDetector>
})

export function Hoja({
  visible,
  onCerrar,
  children,
  titulo,
  altura = 'contenido',
  conCerrar = false,
}: HojaProps) {
  const { theme } = useTheme()
  const { height: altoVentana } = useWindowDimensions()
  const [montada, setMontada] = useState(visible)

  const esMemorial = theme.mode === 'memorial'
  const altoHoja =
    altura === 'media' ? altoVentana * 0.5 : altura === 'completa' ? altoVentana * 0.9 : undefined
  const altoMax = altura === 'contenido' ? altoVentana * 0.6 : undefined

  const translateY = useSharedValue(altoVentana)
  const backdrop = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const altoReal = useSharedValue(altoVentana)

  // entrada: spring normal(250) — memorial: slide+fade easeOut, nada rebota
  const animarEntrada = () => {
    backdrop.value = withTiming(1, { duration: motion.duration.normal })
    translateY.value = esMemorial
      ? withTiming(0, {
          duration: motion.duration.normal,
          easing: Easing.bezier(...motion.easing.easeOut.bezier),
        })
      : withSpring(0, { duration: motion.duration.normal, dampingRatio: 0.85 })
  }

  const cerrarAnimado = () => {
    backdrop.value = withTiming(0, { duration: motion.duration.fast })
    translateY.value = withTiming(
      altoReal.value,
      { duration: motion.duration.normal, easing: Easing.bezier(...motion.easing.easeIn.bezier) },
      (fin) => {
        if (fin) {
          scheduleOnRN(setMontada, false)
          scheduleOnRN(onCerrar)
        }
      },
    )
  }

  useEffect(() => {
    if (visible) {
      setMontada(true)
      translateY.value = altoVentana
      requestAnimationFrame(animarEntrada)
      if (titulo) AccessibilityInfo.announceForAccessibility(titulo)
    } else if (montada) {
      cerrarAnimado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // BACK DE ANDROID — doble vía (B4). onRequestClose del Modal cubre el
  // camino legacy (KeyEvent al Dialog); este listener explícito cubre los
  // dispositivos donde el evento llega a nivel actividad. Registrado SOLO
  // mientras la hoja está montada y desregistrado al salir (leak = bug).
  // Si el dispositivo tiene predictive back (OnBackInvokedDispatcher) y RN
  // no registra callback en la ventana del Dialog, NINGUNA de las dos vías
  // recibe el evento — esa causa raíz se confirma o descarta en teléfono.
  useEffect(() => {
    if (!montada) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cerrarAnimado()
      return true   // consumimos el evento: el back no navega detrás de la hoja
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montada])

  const nativeScroll = useMemo(() => Gesture.Native(), [])
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .simultaneousWithExternalGesture(nativeScroll)
        .onUpdate((e) => {
          // el swipe-down solo arrastra la hoja si el scroll está en top
          if (scrollY.value > 0) return
          translateY.value = Math.max(0, e.translationY)
        })
        .onEnd((e) => {
          if (scrollY.value > 0) return
          const pasaUmbral = translateY.value > altoReal.value * 0.25 || e.velocityY > 800
          if (pasaUmbral) {
            scheduleOnRN(cerrarAnimado)
          } else {
            translateY.value = withSpring(0, {
              duration: motion.duration.normal,
              dampingRatio: 0.85,
            })
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nativeScroll, esMemorial],
  )

  const alScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })

  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const estiloBackdrop = useAnimatedStyle(() => ({ opacity: backdrop.value }))

  if (!montada) return null

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={cerrarAnimado}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: palette.scrim }, estiloBackdrop]}
        >
          <Pressable accessibilityLabel="Cerrar" style={{ flex: 1 }} onPress={cerrarAnimado} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          pointerEvents="box-none"
        >
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityViewIsModal
              onLayout={(e) => {
                altoReal.value = e.nativeEvent.layout.height
              }}
              style={[
                {
                  backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
                  borderTopLeftRadius: radius['2xl'],  // sheets 24 (B1)
                  borderTopRightRadius: radius['2xl'],
                  height: altoHoja,
                  maxHeight: altoMax,
                  paddingBottom: spacing[6],
                },
                estiloHoja,
              ]}
            >
              {/* agarre — señal de swipeable */}
              <View style={{ alignItems: 'center', paddingTop: spacing[2], paddingBottom: spacing[1] }}>
                <View style={{ width: 36, height: 4, borderRadius: radius.full, backgroundColor: theme.bg.border }} />
              </View>

              {titulo || conCerrar ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingBottom: spacing[2] }}>
                  <Text
                    accessibilityRole="header"
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: typography.family.sans.medium, fontSize: typography.size.lg, color: theme.text.primary }}
                  >
                    {titulo ?? ''}
                  </Text>
                  {conCerrar ? (
                    <Pressable
                      onPress={cerrarAnimado}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar"
                      hitSlop={10}
                      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -spacing[2] }}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M6 6l12 12M18 6L6 18" stroke={theme.text.secondary} strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <GestureDetector gesture={nativeScroll}>
                <AnimatedGHScrollView
                  onScroll={alScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingHorizontal: spacing[4], paddingTop: spacing[1] }}
                  keyboardShouldPersistTaps="handled"
                >
                  <HojaPanContext.Provider value={pan}>{children}</HojaPanContext.Provider>
                </AnimatedGHScrollView>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  )
}
