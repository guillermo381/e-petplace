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
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

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

/* ☠️ `LLEGADA` murió con `HuellaDeLlegada` (Ley 37): era su única lectora, y
   con ella se va el arbitraje pendiente sobre el tercer valor de N10 — *un
   número en discusión para una pieza que ya no existe no es una decisión
   abierta: es basura que alguien va a creer viva.* */



/**
 * ☠️ **`HuellaDeLlegada` — MUERTA (`D-1121`, S116-B lote 14).**
 *
 * **Era** el motivo de `EsperaDeMarca` usado UNA vez, como celebración de
 * llegada: la huella aparecía con un `withTiming` de 300 y se quedaba.
 *
 * **Murió porque se quedó sin nadie que entre.** C reemplazó la pata por la
 * nariz en las tres pantallas de acceso (03 · 04 · 05) y la dejó **con cero
 * consumidores**; no la borró porque `packages/ui` no es su territorio, y lo
 * declaró en el código y en su parte. *Hizo lo correcto.*
 *
 * > **Es `L-318` con el signo dado vuelta: no es un motor sin puerta — es una
 * > puerta sin nadie que entre.** Una pieza viva sin consumidores no falla:
 * > se queda ahí, **entra a los censos, suma a los contadores y alguien la
 * > lee como parte del sistema**.
 *
 * 🔴 **LO QUE MUERE ES ESTE USO, NO EL MOTIVO — y hay que leerlo antes de
 * concluir que la huella se retiró.** El gesto sigue **vivo y en uso** en
 * `EsperaDeMarca`, que es la espera corta de la casa. *Una lápida que no
 * distingue las dos cosas hace que el próximo no reuse el motivo por creerlo
 * enterrado* — y acá el motivo no sólo está permitido: está montado.
 *
 * **Si vuelve a hacer falta una celebración de llegada**, se decide de nuevo
 * con su caso: hoy esa celebración la hace `Confeti` en «¡Listo!», que nació
 * después y con otra letra.
 */

// (el cuerpo de HuellaDeLlegada vivía acá)
