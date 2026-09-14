import { useEffect } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { palette } from '../tokens/palette'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **Confeti — LOS PAPELITOS DEL «¡LISTO!» (S116-B lote 10).**
 * Firma de la mesa: *«caen desde el borde superior, una sola vez al entrar…
 * se desvanecen antes de llegar al botón. Un segundo y medio, sin loop.»*
 *
 * ── 🔴 SE DESVANECEN ANTES DEL BOTÓN, Y ESO ES LO QUE LO HACE LEGAL ──
 * Un confeti que cruza la pantalla entera **pasa por encima del CTA** —el
 * control que la persona vino a tocar— y durante ese segundo el botón se ve
 * tapado por papelitos. *Celebrar no puede costar el acto que se está
 * celebrando.* Por eso la caída **muere arriba**: el brillo pasa por la
 * mitad de arriba y el botón nunca lo ve.
 *
 * ── UNA VEZ, Y NO ES UNA PREFERENCIA ─────────────────────────────────
 * **Sin `withRepeat`.** Una celebración que se repite deja de ser una
 * celebración y pasa a ser un fondo animado — *y además dejaría la ventana
 * permanentemente no-idle*, que es la deuda que esta casa ya se cobró con el
 * halo del asistente. **Un segundo y medio y se terminó.**
 *
 * ── LOS CUATRO COLORES ───────────────────────────────────────────────
 * Magenta, ciruela, rosa y blanco — **de la paleta, nunca sueltos**. El
 * blanco entra a propósito: *sin él, cuatro papeles de la misma familia se
 * leen como una mancha; el blanco es el que separa.*
 *
 * ── REDUCIR MOVIMIENTO ───────────────────────────────────────────────
 * **No cae nada, y no se reemplaza por nada.** *Un confeti quieto sería
 * basura colgada del techo* — lo que la pieza aporta es el movimiento, así
 * que sin movimiento no aporta y se retira entera.
 * ═══════════════════════════════════════════════════════════════════════
 */

/** Cuánto dura la caída. Firma de la mesa: un segundo y medio. */
const DURACION = 1500
/** Cuántos papelitos. **Doce y no cincuenta**: *el confeti de una app no es
 *  el de un estadio — con demasiados, el «¡Listo!» deja de leerse.* */
const CUANTOS = 12
/** Dónde muere la caída, como fracción del alto de la pantalla. Antes del
 *  botón, que vive abajo (ver la cabecera). */
const FIN = 0.42

const COLORES = [palette.magentaAccion, palette.ciruela, palette.rosaSobreCiruela, palette.white]

/** Un papelito. **Su recorrido se decide UNA vez, al montar**, y no en cada
 *  render: *si se recalculara, un re-render de la pantalla lo haría saltar a
 *  otra posición a mitad de la caída.* */
function Papelito({ indice, ancho, alto }: { indice: number; ancho: number; alto: number }) {
  const avance = useSharedValue(0)

  /* Distribución determinística y no aleatoria: **el mismo `¡Listo!` se ve
     igual dos veces**, y eso se puede capturar y comparar. *Un confeti
     sorteado hace que ninguna captura sirva de referencia.* */
  const x = ((indice * 7.3) % 10) / 10
  const lado = 6 + (indice % 3) * 2
  const giro = indice % 2 === 0 ? 1 : -1
  const demora = (indice % 5) * 90

  useEffect(() => {
    avance.value = withDelay(
      demora,
      withTiming(1, {
        duration: DURACION - demora,
        /* Cae acelerando: es lo único que hace que se lea como algo que
           CAE y no como algo que se desplaza. */
        easing: Easing.bezier(0.3, 0, 0.7, 1),
      }),
    )
  }, [avance, demora])

  const estilo = useAnimatedStyle(() => ({
    transform: [
      { translateY: avance.value * alto * FIN },
      { rotate: `${avance.value * giro * 220}deg` },
    ],
    /* Se apaga sobre el final del recorrido, no al terminar: así **nunca se
       ve un papelito desaparecer de golpe**. */
    opacity: avance.value < 0.6 ? 1 : (1 - avance.value) / 0.4,
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -lado * 2,
          left: x * (ancho - lado),
          width: lado,
          height: lado * 1.6,
          borderRadius: 1,
          backgroundColor: COLORES[indice % COLORES.length],
        },
        estilo,
      ]}
    />
  )
}

export function Confeti() {
  const { width, height } = useWindowDimensions()
  const sinMovimiento = useReducedMotion()
  if (sinMovimiento) return null

  return (
    /* `pointerEvents="none"`: **el confeti no puede robarle un toque al
       botón que está celebrando.** */
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: CUANTOS }, (_, i) => (
        <Papelito key={i} indice={i} ancho={width} alto={height} />
      ))}
    </View>
  )
}
