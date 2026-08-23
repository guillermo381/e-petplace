/**
 * RitualDeEntrada — LOS DOS GESTOS DE LA LLEGADA (S104-B, orden del
 * founder).
 *
 * ⚠️ **FRENO DECLARADO (L-142):** `RITUAL_DE_ENTRADA.md` **no existe en el
 * repo** — buscado por nombre en todo el árbol, cero resultados. Estas dos
 * piezas se construyeron contra el literal de la orden, que alcanza para
 * la FÍSICA (1.0→1.03→1.0 · 520 ms · ~400 ms · el motivo de espera de marca
 * usado una vez como celebración). **Lo que NO se construyó, porque no
 * viajó: DÓNDE se montan y EN QUÉ ORDEN.** Esa es composición y la dice la
 * letra. *Se entregan armadas y sin cablear, en vez de inventarles un
 * lugar.*
 *
 * ── POR QUÉ SON DOS PIEZAS Y NO UNA CEREMONIA ─────────────────────────
 * `Destape` ya es la ceremonia de la casa y tiene UN SOLO RELOJ por orden
 * de mesa. Meter estos dos gestos adentro de una tercera pieza con su
 * propio reloj sería fabricar el segundo orquestador. Nacen como gestos
 * SUELTOS que un consumidor compone — y cuando la letra diga cómo, la
 * composición es de la pantalla, no de acá.
 *
 * ── 60 FPS ────────────────────────────────────────────────────────────
 * Las dos animan **`transform: scale` y `opacity` y nada más**, sobre
 * `Animated.View`, en el hilo de UI. Cero layout, cero re-render por
 * cuadro, cero medición. *Si el gate mide caída de cuadros la pieza cede:
 * primero se acorta el gesto, jamás se pasa a JS.*
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * Ninguna muestra datos del expediente ⇒ **§4b no aplica.** Declarado.
 */

import { useEffect, type ReactNode } from 'react'
import Svg from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { Huella } from './Huella'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

/* ═══════════════════════════════════════════════════════════════════
 * ① EL RESPIRO — el isotipo toma aire UNA vez.
 * ═══════════════════════════════════════════════════════════════════ */

/** 1.0 → 1.03 → 1.0. **El 1.03 es de la orden y conviene defenderlo:** es
 *  deliberadamente chico. Un isotipo que crece 10 % se lee como «rebote de
 *  botón»; uno que crece 3 % se lee como que **respira**, que es la palabra
 *  que la orden usa. El gesto tiene que notarse sin poder señalarse. */
const PICO = 1.03

/** 520 ms el gesto ENTERO — `motion.duration.grande`, el único registro
 *  «grande» del vocabulario cerrado de N10, el mismo que `Destape` usa para
 *  la celebración. **No se tecleó 520: se importó.** Se reparte mitad y
 *  mitad (260 subiendo, 260 bajando): un respiro es simétrico — si la
 *  vuelta fuera más rápida, sería un rebote. */
const MEDIO = motion.duration.grande / 2

export function RespiroDeMarca({
  children,
  /** Retraso antes de empezar, para componer con otros gestos. */
  retraso = 0,
}: {
  children: ReactNode
  retraso?: number
}) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const escala = useSharedValue(1)

  /* ⚠️ DOS VARIABLES Y NO UNA (patrón `EsperaDeMarca`): memorial gobierna
   *  si la pieza CELEBRA y reduce-motion si se MUEVE. Colgar una de la
   *  otra es más corto y confunde duelo con preferencia de accesibilidad. */
  const esMemorial = theme.mode === 'memorial'
  const quieta = reduceMotion || esMemorial

  useEffect(() => {
    if (quieta) {
      escala.value = 1
      return
    }
    const curva = Easing.bezier(...motion.easing.easeInOut.bezier)
    const correr = () => {
      escala.value = withSequence(
        withTiming(PICO, { duration: MEDIO, easing: curva }),
        withTiming(1, { duration: MEDIO, easing: curva }),
      )
    }
    if (retraso <= 0) {
      correr()
      return
    }
    const id = setTimeout(correr, retraso)
    return () => clearTimeout(id)
  }, [quieta, retraso, escala])

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))

  /* MEMORIAL Y REDUCE-MOTION: **el isotipo se monta igual, quieto.** No se
   * devuelve `null` — a diferencia de `MarcaDeAgua`, acá el hijo ES el
   * contenido, no el ornamento: apagarlo dejaría un hueco donde va la
   * marca. Lo que se apaga es el GESTO, no la identidad. */
  return <Animated.View style={estilo}>{children}</Animated.View>
}

/* ═══════════════════════════════════════════════════════════════════
 * ② LA HUELLA DE LLEGADA — el motivo de la espera, usado UNA vez como
 *    celebración.
 * ═══════════════════════════════════════════════════════════════════ */

/** 🔴 LA ORDEN PIDIÓ «~400 ms» Y ACÁ VALE **300** — y el que decidió no
 *  fui yo: fue `R51`.
 *
 *  Escribí `legacy_slow` (que vale exactamente 400) y lo declaré como
 *  excepción razonada en este mismo comentario. **`verify:diseno` lo
 *  rechazó en la primera corrida**: el vocabulario del movimiento es
 *  CERRADO por N10 —150 `fast` · 300 `estandar` · 520 `grande`— y los
 *  `legacy_` no pertenecen. *Una excepción fundada en prosa no le gana a
 *  una regla mecanizada, y está bien que no le gane: para eso se
 *  mecanizó.*
 *
 *  ⇒ El **`~`** de la orden es lo que lo vuelve compatible: ~400 pedía un
 *  registro, no un número, y el registro es el ESTÁNDAR. `estandar` (300)
 *  es además el que usan las entradas de toda la casa, que es exactamente
 *  lo que este gesto es: algo que llega.
 *
 *  ⚠️ **Si el founder mira el gate y le resulta corto, la salida NO es
 *  volver a `legacy_slow`: es que la mesa suba el gesto a `grande` (520) o
 *  enmiende N10.** Queda escrito para que nadie lo "arregle" tecleando 400.
 *
 *  🔴 **Y LA LETRA LLEGÓ DESPUÉS Y DICE ~400 — el choque se declara acá y
 *  NO se resuelve solo.** `RITUAL_DE_ENTRADA` §5 pide *«~400ms»*, y su §7
 *  afirma que *«no inventa física nueva: cada número de este documento ya
 *  estaba firmado en el canon»*. **Esa afirmación es falsa para este
 *  número: 400 NO pertenece al vocabulario cerrado de N10** (150 · 300 ·
 *  520) — es un `legacy_` que R51 congeló.
 *
 *  ⇒ **Se conserva 300 y se reporta**, porque bajar un juez mecanizado
 *  para acomodar un número que la propia letra cree canónico y no lo es
 *  sería exactamente al revés: *el instrumento está bien y la letra tiene
 *  un dato que nadie verificó.* **Lo arbitra la mesa: o N10 se enmienda
 *  con su cuarto valor, o §5 baja a 300 (o sube a 520).** */
const LLEGADA = motion.duration.estandar

export function HuellaDeLlegada({
  tamano = 48,
  retraso = 0,
}: {
  tamano?: number
  retraso?: number
}) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const alfa = useSharedValue(0)
  const escala = useSharedValue(0.92)

  const esMemorial = theme.mode === 'memorial'
  const quieta = reduceMotion || esMemorial

  useEffect(() => {
    if (quieta) {
      alfa.value = 1
      escala.value = 1
      return
    }
    const curva = Easing.bezier(...motion.easing.easeOut.bezier)
    const correr = () => {
      alfa.value = withTiming(1, { duration: LLEGADA, easing: curva })
      escala.value = withTiming(1, { duration: LLEGADA, easing: curva })
    }
    if (retraso <= 0) {
      correr()
      return
    }
    const id = setTimeout(correr, retraso)
    return () => clearTimeout(id)
  }, [quieta, retraso, alfa, escala])

  const estilo = useAnimatedStyle(() => ({
    opacity: alfa.value,
    transform: [{ scale: escala.value }],
  }))

  /* EL COLOR: magenta de marca — el MISMO que `EsperaDeMarca`
   * (`capa.comunidad`), porque es literalmente su motivo reusado. En
   * memorial baja a tinta secundaria, igual que su hermana (§2.8):
   * **el motivo sobrevive, la celebración no.** */
  const color = esMemorial ? theme.text.secondary : theme.capa.comunidad

  return (
    <Animated.View style={[{ width: tamano, height: tamano }, estilo]}>
      <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
        <Huella color={color} escala={1} />
      </Svg>
    </Animated.View>
  )
}
