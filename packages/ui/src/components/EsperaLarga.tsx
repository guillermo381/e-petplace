import { useEffect, type ReactNode } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useRuedaDeCaras } from '../lib/rueda-de-caras'
import { medidas } from '../tokens/medidas'
import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Personaje } from './Personaje'
import { Texto } from './Texto'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **EsperaLarga — LA ESPERA LARGA DE TODA LA CASA (S116-B lote 8).**
 * Firmada por la mesa como pieza única: *«Procesando tu pago»*, *«Leyendo el
 * carné»* y todo lo que dure de verdad.
 *
 * ── 🔴 POR QUÉ UNA SOLA PIEZA, y no una espera por pantalla ──────────
 * Porque **una espera larga es el momento en que la app tiene que sostener
 * a alguien que no puede hacer nada**, y eso no se improvisa dos veces. *Si
 * cada pantalla arma la suya, el pago y el carné esperan distinto — y la
 * persona no lee «dos pantallas»: lee «esto no es el mismo producto».*
 *
 * ── LO QUE NO SABE, Y ES DELIBERADO ──────────────────────────────────
 * **No sabe cuánto falta, y no lo finge.** Por eso muere la línea de
 * progreso: *una barra que avanza sin saber hacia dónde es una promesa que
 * nadie puede cumplir* — y cuando se queda quieta al 80 %, lo que comunica
 * es que algo se rompió. **Lo que esta pieza comunica es otra cosa: que hay
 * alguien acá.** La rueda de caras gira, el halo respira, y el tiempo pasa
 * sin mentir sobre cuánto queda.
 *
 * ── DE DÓNDE SALE CADA PARTE (nada se redibuja) ──────────────────────
 * · **la rueda** — `lib/rueda-de-caras`, la MISMA de 00, 02 y la onda.
 *   *Cuatro ruedas escritas aparte giran a cuatro ritmos el día que alguien
 *   ajuste una.*
 * · **el halo** — el mismo mecanismo del asistente: escala y opacidad
 *   derivadas de **un solo valor**, así crecer y atenuarse no se pueden
 *   desfasar.
 *
 * 🔴 **ACÁ EL HALO NO TIENE LÍMITE DE CICLOS, y es firma de la mesa:** en el
 * asistente respira tres veces y descansa **porque una animación infinita
 * deja la ventana no-idle y apaga el instrumental de toda la casa**. Acá esa
 * razón no aplica: *la espera es lo que dura, y una pantalla de espera con
 * el movimiento detenido a los 24 segundos dice exactamente lo contrario de
 * lo que vino a decir.* **Es la única pieza con movimiento sin fin.**
 *
 * ⚠️ **Consecuencia declarada:** mientras esta pantalla esté, `uiautomator`
 * no va a reportar `idle`. *Se sabe, y es el precio elegido.*
 *
 * ── REDUCIR MOVIMIENTO ───────────────────────────────────────────────
 * La rueda **no arranca** (queda una cara, quieta) y el halo **se queda
 * puesto** en su punto más visible. *Lo que descansa es el movimiento, no la
 * presencia* — la pantalla sigue diciendo «hay alguien acá».
 * ═══════════════════════════════════════════════════════════════════════
 */

/** El círculo grande del centro. Es `avatarHogar × 2` — el mismo derivado
 *  que usa el tamaño `grande` de `Personaje`, para no teclear un número. */
const CIRCULO = medidas.avatarHogar * 2

export interface EsperaLargaProps {
  /** El título, en Baloo. **Llega por prop y ya redactado** (Ley 3): la
   *  pieza no sabe si está esperando un pago o un carné. */
  titulo: string
  /** La línea de apoyo, debajo. También redactada. */
  apoyo: string
  /** El slot del botón secundario — cancelar, volver, lo que la pantalla
   *  ofrezca. **Opcional**: hay esperas de las que no se puede salir, y
   *  dibujar un botón que no existe sería peor que no dibujarlo. */
  pie?: ReactNode
}

export function EsperaLarga({ titulo, apoyo, pie }: EsperaLargaProps) {
  const { theme } = useTheme()
  const sinMovimiento = useReducedMotion()
  const { cara, opacidad } = useRuedaDeCaras()

  const respiro = useSharedValue(0)
  useEffect(() => {
    if (sinMovimiento) {
      respiro.value = 0
      return
    }
    respiro.value = withRepeat(
      withTiming(1, {
        /* La cadencia del orbe, tomada y no copiada (ver la cabecera del
           asistente): dos respiraciones con el mismo número escrito en dos
           lados se separan el día que alguien ajuste una. */
        duration: motion.coach.respiracionMs,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
      -1, // sin fin — firma de la mesa, ver la cabecera
      true,
    )
  }, [sinMovimiento, respiro])

  const estiloHalo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + respiro.value * (motion.v5.asistenteHaloEscala - 1) }],
    opacity: motion.v5.asistenteHaloOpacidad * (1 - respiro.value),
  }))
  const estiloCara = useAnimatedStyle(() => ({ opacity: opacidad.value }))

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[6],
        gap: spacing[4],
      }}
    >
      <View style={{ gap: spacing[2] }}>
        <Texto variante="titulo">{titulo}</Texto>
        <Texto variante="apoyo" color="secondary">
          {apoyo}
        </Texto>
      </View>

      {/* EL CENTRO. `flex: 1` para que quede centrado en lo que sobre entre
          el título y el pie, sin que la pieza tenga que medir la pantalla. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* El halo va DEBAJO y no recibe toques: es atmósfera. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: CIRCULO,
              height: CIRCULO,
              borderRadius: CIRCULO / 2,
              backgroundColor: theme.accent.cta,
            },
            estiloHalo,
          ]}
        />
        <Animated.View style={estiloCara}>
          <Personaje especie={cara} tamano="grande" forma="circulo" />
        </Animated.View>
      </View>

      {/* El pie, si lo hay. Sin envoltorio propio: la pantalla manda su
          botón ya vestido y la pieza no le pone caja. */}
      {pie}
    </View>
  )
}
