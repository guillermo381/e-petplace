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
 * ── EL PIE FIJO (S99-B) — por qué la Hoja lo necesitaba ─────────────
 * La Hoja envuelve a sus `children` en SU PROPIO scroll, así que **todo
 * CTA de formulario nacía debajo del pliegue**: medido por C, el
 * «Ajustar stock» no entraba al abrir. Y como el scroll ya es de la
 * pieza, cualquier `HojaScroll` adentro quedaba ANIDADO.
 *
 * **Los dos atajos se descartaron CON medición, no por gusto** (censo de
 * C): `altura="contenido"` puede colapsar el scroll —ninguna Hoja de la
 * casa convive hoy con `HojaScroll`, o sea que ese camino no está
 * probado— y sacar el scroll interno toca la composición de gestos de
 * Android, **que RN-web no delata** (L-132, la cicatriz que parió
 * `HojaScroll`).
 *
 * ⇒ El slot `pie` deja el scroll intacto y saca el compromiso afuera.
 * *No es una comodidad: es la gramática canónica —«un CTA al pie»— que
 * dentro de una Hoja era inexpresable.*
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
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  /** S53 (DIRECCION_ARTE §5.2): 'marca' = la física del Coach —
   *  translateY con la curva del prototipo (.32,.72,0,1), ~340ms,
   *  scrim efectivo .4. Memorial la ignora (fades suaves siempre). */
  apertura?: 'default' | 'marca'
  /** EL PIE FIJO (S99-B · pedido de C con medición) — vive FUERA del
   *  scroll: el contenido corre por debajo y esto no se mueve.
   *
   *  🔴 QUÉ VA ACÁ: **el compromiso**, y nada más — el CTA que cierra la
   *  decisión de la Hoja. Es la gramática canónica hecha slot: *«un CTA
   *  al pie, `bloque`, apagado hasta que haya cambios»*, donde **el botón
   *  apagado ES la promesa de que nada se guardó todavía**.
   *
   *  ⛔ QUÉ **NO** VA, para que el slot no se vuelva un cajón:
   *   · **contenido.** Si necesita más de una línea sobre el CTA, no es
   *     un pie: es contenido, y el contenido scrollea.
   *   · **dos botones compitiendo.** Rige 19.7: por superficie UN sólido;
   *     lo secundario baja a label. *Un pie con dos cajas llenas obliga a
   *     elegir dos veces.*
   *
   *  ✅ SÍ ADMITE **UNA línea de voz sobre el CTA**, y es decisión con
   *  razón: el precedente S73 manda que **el CTA apagado diga QUÉ FALTA,
   *  siempre**, y esa frase adentro del scroll queda fuera de vista justo
   *  cuando el botón gris está a la vista. *Un botón apagado cuya razón
   *  no se ve es peor que uno sin razón: manda a adivinar.* */
  pie?: ReactNode
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
  apertura = 'default',
  pie,
}: HojaProps) {
  const { theme } = useTheme()
  const { height: altoVentana } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [montada, setMontada] = useState(visible)
  /** ¿El contenido DESBORDA su caja? De esto —y solo de esto— depende el
   *  filete del pie. **Un filete permanente separaría de nada la mitad de
   *  las veces**; medido, el filete deja de ser decoración y pasa a
   *  significar *hay más arriba*, que es la única razón por la que un pie
   *  necesita despegarse del contenido. */
  const [altoVisible, setAltoVisible] = useState(0)
  const [altoContenido, setAltoContenido] = useState(0)
  const hayDesborde = altoContenido > altoVisible + 1

  const esMemorial = theme.mode === 'memorial'
  /** 🔴 S98-B · REDUCE-MOTION — la Hoja entra al brazo QUIETO de memorial.
   *  Es la pieza de más TRÁFICO del censo: toda hoja de las dos apps pasa
   *  por acá, así que una línea cubre decenas de superficies (el mismo
   *  argumento que hizo valiosa la cura de `Entrada`).
   *
   *  QUÉ APAGA, exactamente: el `withSpring` — el REBOTE. Es la parte
   *  vestibularmente cara del gesto y la rama de memorial ya tiene escrita
   *  su alternativa firmada (`withTiming` easeOut, «nada rebota»), así que
   *  esto no inventa un comportamiento: reusa uno que ya pasó por gate.
   *
   *  ⚠️ LO QUE **NO** HACE, declarado en vez de omitido: la hoja SIGUE
   *  DESLIZANDO. Cambiar el deslizamiento por un fundido es lo que hacen
   *  iOS y Android con la preferencia activada, y probablemente sea lo
   *  correcto — pero toca la anatomía de apertura Y de cierre de la pieza
   *  (el `onCerrar` cuelga del callback del deslizamiento), es un cambio
   *  de arte que pide firma, y **no lo puede gatear RN-web**. Queda en la
   *  cola con este porqué escrito, no absorbido en silencio. */
  const reduceMotion = useReducedMotion()
  const sinRebote = esMemorial || reduceMotion
  /** 🔴 S98-B · FIRMA DEL FOUNDER — CON REDUCE-MOTION LA HOJA **FUNDE**.
   *  Es la firma del destape aplicada a la pieza más frecuente de la
   *  casa: *quien pidió menos movimiento no ve deslizar*. Con la
   *  preferencia activada no hay viaje — la hoja aparece y desaparece por
   *  opacidad, que es lo que hacen iOS y Android con esa preferencia.
   *
   *  ⚠️ `funde` NO es `sinRebote`, y la diferencia importa: **memorial
   *  SIGUE DESLIZANDO.** Su receta está firmada desde B1 —«slide+fade
   *  suave easeOut»— y lo que memorial pide es SERENIDAD, no ausencia de
   *  movimiento. Reduce-motion pide otra cosa. Colgar las dos del mismo
   *  booleano habría cambiado memorial sin firma. */
  const funde = reduceMotion
  const altoHoja =
    altura === 'media' ? altoVentana * 0.5 : altura === 'completa' ? altoVentana * 0.9 : undefined
  const altoMax = altura === 'contenido' ? altoVentana * 0.6 : undefined

  const translateY = useSharedValue(altoVentana)
  const backdrop = useSharedValue(0)
  /** La opacidad de la HOJA (no del scrim, que ya tenía la suya). Solo se
   *  anima en el camino `funde`; en los otros dos queda en 1 y el estilo
   *  la aplica igual — un valor constante no cuesta nada y evita una rama
   *  en el `useAnimatedStyle`. */
  const opacidadHoja = useSharedValue(1)
  const scrollY = useSharedValue(0)
  const altoReal = useSharedValue(altoVentana)

  // entrada: spring normal(250) — memorial: slide+fade easeOut, nada rebota
  const animarEntrada = () => {
    // scrim efectivo: palette.scrim ya trae .52 de alpha — el preset
    // marca apunta a .4 en pantalla (§5.2), el default queda como estaba.
    // La apertura CEREMONIAL tampoco corre con la preferencia activada:
    // es la más larga y la más gestual de las tres, o sea la que más pide
    // apagarse. Con `sinRebote` cae al slide sereno, igual que memorial.
    const esMarca = apertura === 'marca' && !sinRebote
    backdrop.value = withTiming(esMarca ? motion.marca.scrimEfectivo / 0.52 : 1, {
      duration: esMarca ? motion.marca.aperturaMs : motion.duration.normal,
    })
    // 🔴 EL CAMINO QUE FUNDE: la hoja YA ESTÁ en su sitio y lo único que
    // corre es la opacidad. `translateY` se planta en 0 sin animar — no
    // «se anima a 0 muy rápido»: no viaja.
    if (funde) {
      translateY.value = 0
      opacidadHoja.value = withTiming(1, {
        duration: motion.duration.normal,
        easing: Easing.bezier(...motion.easing.easeOut.bezier),
      })
      return
    }
    translateY.value = sinRebote
      ? withTiming(0, {
          duration: motion.duration.normal,
          easing: Easing.bezier(...motion.easing.easeOut.bezier),
        })
      : esMarca
        ? withTiming(0, {
            duration: motion.marca.aperturaMs,
            easing: Easing.bezier(...motion.marca.aperturaBezier),
          })
        : withSpring(0, { duration: motion.duration.normal, dampingRatio: 0.85 })
  }

  const cerrarAnimado = () => {
    backdrop.value = withTiming(0, { duration: motion.duration.fast })
    /** 🔴 EL PUNTO DELICADO DE ESTA FIRMA, y por eso va escrito: **el
     *  cierre FUNCIONAL colgaba del callback del deslizamiento.** Ese
     *  callback es el que desmonta la hoja (`setMontada(false)`) y avisa
     *  al consumidor (`onCerrar`) — o sea que si el gesto cambia y el
     *  callback se queda en la animación vieja, la hoja **se vuelve
     *  invisible pero nunca se cierra**: el Modal sigue montado, el back
     *  de Android lo sigue consumiendo y el consumidor nunca se entera.
     *  Un modo de falla mudo: no lanza, no se ve, y deja la app trabada.
     *
     *  Por eso el remate viaja CON el gesto, y se declara UNA sola vez
     *  para que no puedan divergir. */
    const remate = (fin?: boolean) => {
      if (fin) {
        scheduleOnRN(setMontada, false)
        scheduleOnRN(onCerrar)
      }
    }
    if (funde) {
      // La hoja se apaga donde está (si venía de un arrastre, ahí mismo).
      // `translateY` NO se anima: animarlo sería devolverle el viaje que
      // la preferencia pidió sacar.
      opacidadHoja.value = withTiming(
        0,
        { duration: motion.duration.normal, easing: Easing.bezier(...motion.easing.easeIn.bezier) },
        remate,
      )
      return
    }
    translateY.value = withTiming(
      altoReal.value,
      { duration: motion.duration.normal, easing: Easing.bezier(...motion.easing.easeIn.bezier) },
      remate,
    )
  }

  useEffect(() => {
    if (visible) {
      setMontada(true)
      translateY.value = altoVentana
      // El reset de la opacidad viaja con el de la posición: sin él, la
      // segunda apertura del camino `funde` arrancaría desde el 0 que
      // dejó el cierre anterior y la hoja no aparecería nunca.
      opacidadHoja.value = funde ? 0 : 1
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
            // 🔴 S98-B — ESTE REBOTE NO HONRABA MEMORIAL, y el archivo lo
            // decía en su propia primera pantalla: *«En memorial NADA
            // rebota (regla B1)»*. La entrada sí lo cumplía; el
            // SNAP-BACK del arrastre —cuando soltás sin pasar el umbral y
            // la hoja vuelve a su sitio— corría `withSpring` sin mirar
            // nada. **La huella estaba a la vista: `esMemorial` figuraba
            // en las dependencias de este `useMemo` y el cuerpo no lo
            // consumía** — una dependencia sin consumidor es una
            // intención que no llegó al cuerpo.
            // *Una regla escrita en el header y desobedecida 260 líneas
            // más abajo, en el mismo archivo.*
            //
            // ⚠️ ESTE RETORNO **NO** ENTRA AL CAMINO `funde`, y la
            // distinción no es de comodidad: el imán de `SelectorDia` sí
            // se volvió instantáneo con la preferencia, y acá no. La
            // diferencia es a DÓNDE lleva cada uno. El imán de la rueda
            // viaja a un ítem al que el usuario NO llegó —recorrido
            // autónomo—; esto devuelve la hoja a donde ella ya estaba,
            // deshaciendo el arrastre del propio usuario. *Completar un
            // gesto que alguien empezó con el dedo es manipulación
            // directa; un salto seco acá se leería como una falla del
            // arrastre, no como serenidad.* Lo que sí rige es
            // `sinRebote`: vuelve sereno, sin rebotar.
            translateY.value = sinRebote
              ? withTiming(0, {
                  duration: motion.duration.normal,
                  easing: Easing.bezier(...motion.easing.easeOut.bezier),
                })
              : withSpring(0, {
                  duration: motion.duration.normal,
                  dampingRatio: 0.85,
                })
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nativeScroll, sinRebote],
  )

  const alScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })

  const estiloHoja = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacidadHoja.value,
  }))
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
          // S83-B36 — `padding` EN LAS DOS PLATAFORMAS. `height` encoge el
          // CONTENEDOR contando con que la ventana se achique, y bajo
          // edge-to-edge (SDK 57) la ventana YA NO SE ACHICA: el contenedor
          // se encoge contra nada y el campo enfocado queda debajo del
          // teclado. Es la misma familia de L-193 (la premisa heredada que
          // nadie fechó — `adjustResize` es letra muerta bajo edge-to-edge).
          // `padding` no depende de eso: empuja el contenido con el inset del
          // teclado, que sí llega.
          behavior="padding"
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
                  // Ley 20 (D-358): la Hoja FLOTA → elevacion.elevada. La sombra
                  // no se anima (Ley 6): viaja con la superficie en el translateY.
                  boxShadow: theme.elevacion.elevada,
                  borderTopLeftRadius: radius['2xl'],  // sheets 24 (B1)
                  borderTopRightRadius: radius['2xl'],
                  height: altoHoja,
                  maxHeight: altoMax,
                  // S65 (hallazgo founder, ambas apps): la Hoja es una
                  // superficie ANCLADA AL FONDO — sin el inset, su última
                  // fila (el Guardar/Continuar de turno) queda bajo la
                  // barra de navegación del sistema en Android edge-to-
                  // edge. Patrón de la casa (barras de CTA fijas):
                  // Math.max — donde el inset ya cabía en el respiro,
                  // nada cambia.
                  paddingBottom: Math.max(insets.bottom, spacing[6]),
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
                  /** 🔴 `flexShrink: 1` — SIN esto el pie no existe: el
                   *  scroll se dimensiona a su contenido y **empuja al pie
                   *  fuera de la hoja**, que es el mismo defecto que este
                   *  slot vino a curar, un piso más abajo. Con pie o sin
                   *  él, es además lo correcto bajo `maxHeight`: la caja
                   *  que puede desbordar es la que tiene que ceder. */
                  style={{ flexShrink: 1 }}
                  onLayout={(e) => setAltoVisible(e.nativeEvent.layout.height)}
                  onContentSizeChange={(_a, alto) => setAltoContenido(alto)}
                  contentContainerStyle={{ paddingHorizontal: spacing[4], paddingTop: spacing[1] }}
                  keyboardShouldPersistTaps="handled"
                >
                  <HojaPanContext.Provider value={pan}>{children}</HojaPanContext.Provider>
                </AnimatedGHScrollView>
              </GestureDetector>

              {/* EL PIE — fuera del scroll, y por eso siempre a la vista.
                  Queda DENTRO del `GestureDetector` del pan: arrastrar
                  desde acá cierra la hoja, como desde el agarre o el
                  header. No es un supuesto — es el mismo lugar donde la X
                  de `conCerrar` convive con el pan desde S43.

                  El piso de la safe area NO se re-decide acá: ya lo pone
                  el `paddingBottom` de la hoja (S65), y ponerlo dos veces
                  daría el doble de aire en los teléfonos con barra. */}
              {pie ? (
                <View
                  style={{
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                    // El filete SOLO cuando hay algo tapado arriba.
                    borderTopWidth: hayDesborde ? 1 : 0,
                    borderTopColor: theme.bg.border,
                  }}
                >
                  {pie}
                </View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  )
}
