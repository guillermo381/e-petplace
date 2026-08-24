/**
 * PaseoDeHuellas — LA SENDA QUE SE TRAZA Y SE QUEDA (S104-B, orden del
 * founder dentro de la tanda del ritual de entrada).
 *
 * ⚠️ **FRENO DECLARADO (L-142, la norma del corchete):** la orden dice que
 * esta pieza pertenece a `RITUAL_DE_ENTRADA.md`. **Ese archivo NO existe en
 * el repo** — se buscó por nombre en todo el árbol y en las carpetas
 * hermanas, cero resultados. ⇒ **esta pieza se construyó contra el literal
 * de la orden, que es autocontenido** (senda de huellas · tinta 8-10 % ·
 * escalón 120 · queda como textura · familia `MarcaDeAgua` · solo opacity ·
 * hilo de UI · reduce-motion aparece trazada). **Nada de lo que la letra
 * diga de más está incorporado**, y si contradice algo de acá, gana la letra
 * y esto se rehace. *Se declara en vez de inventar la mitad que falta.*
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ ES: la Huella canónica —la de la regla madre, la misma primitiva
 * que usan los 52 glifos— repetida a lo largo de una senda, en tinta al
 * 9 %. **Se traza una vez y se queda.** No respira, no cicla, no vuelve.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ ES FAMILIA DE `MarcaDeAgua` Y NO DE `Entrada` ─────────────
 * Las dos animan una llegada, y ahí se parecen. Pero `Entrada` ordena la
 * LECTURA (L-c: *«si al quitarla la pantalla dice lo mismo, sobraba»*) y
 * esto es **fondo**: `pointerEvents="none"`, absoluto sobre el padre,
 * fuera del árbol de accesibilidad, memorial lo apaga en la fuente. Si se
 * quita, la pantalla dice exactamente lo mismo — y **está bien que así
 * sea**, porque no es contenido. Poner un fondo bajo la ley de `Entrada`
 * habría obligado a justificar su orden de lectura, y no tiene ninguno.
 *
 * ── LOS TRES TEMAS ────────────────────────────────────────────────────
 * · **claro** — tinta (`text.primary`) al 9 %. El mismo criterio que la
 *   marca de agua: material del papel, no marca.
 * · **oscuro** — la MISMA tinta del tema (que en oscuro es clara) al mismo
 *   9 %. No se sube el alfa «porque el oscuro traga»: el token de cada
 *   tema ya trae su tinta resuelta, y subirlo acá sería la divergencia por
 *   pantalla que `MarcaDeAgua` nació para matar (0.06 contra 0.04, r8).
 * · **memorial** — **NO SE MONTA** (`return null`). Ley 8: memorial no se
 *   decora. Degrada en la FUENTE, igual que `MarcaDeAgua` — *una condición
 *   que cada consumidor repite es una que un consumidor va a olvidar.*
 *
 * ── REDUCE-MOTION ─────────────────────────────────────────────────────
 * **Aparece TRAZADA**, entera y quieta, sin ningún fade. No es «lo mismo
 * más rápido»: es el resultado sin el gesto. La senda es textura y la
 * textura no tiene por qué llegar animada — quien pidió menos movimiento
 * recibe el estado final, que es lo único que la pieza deja.
 * ⚠️ El hook se llama SUELTO y se combina después (patrón `Entrada` /
 * `EsperaDeMarca`): `esMemorial || useReducedMotion()` sería más corto y
 * es una llamada CONDICIONAL a un hook.
 *
 * ── 60 FPS, Y POR QUÉ ESTA PIEZA NO PUEDE BAJAR DE AHÍ ────────────────
 * **Se anima UNA sola propiedad: `opacity`**, sobre `Animated.View`, con
 * `withDelay(i·120, withTiming(...))`. `opacity` es de las que Reanimated
 * resuelve **en el hilo de UI sin tocar el layout** — no hay reflow, no
 * hay medición, no hay render de React por cuadro. El SVG de cada huella
 * se monta UNA vez y no se vuelve a tocar: lo que cambia es el alfa de su
 * contenedor.
 * ⛔ **Lo que se descartó a propósito:** `scale` sobre cada huella (obliga
 * a componer transform por cuadro y en Android sobre SVG cuesta), y
 * cualquier `strokeDashoffset` de trazado real (eso sí es re-pintado de
 * path por cuadro — es la clase de efecto que se ve barato en la demo y
 * tira cuadros en un teléfono medio).
 * *Si en el gate se mide caída de cuadros, la pieza cede: baja `HUELLAS`
 * antes que perder los 60.*
 *
 * ── LA ESCALERA (protocolo Ley 11) ────────────────────────────────────
 * No muestra datos del expediente ⇒ **§4b no aplica**. Se declara.
 */

import { useEffect } from 'react'
import { useWindowDimensions, View } from 'react-native'
import Svg from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { Huella } from './Huella'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

/** Cuántas pisadas. **Es el número que cede si el gate mide caída de
 *  cuadros** — antes que tocar la física. Siete alcanza para leer «senda»
 *  y deja la última llegando cerca de los 900 ms (7 × 120), que es el
 *  techo de lo que alguien espera mirando una pantalla de entrada. */
const HUELLAS = 7

/** El alfa. La orden pide 8-10 % y se toma el centro: **9 %**. No sale de
 *  `opacity.marcaDeAgua` (0.045) a propósito — aquélla porta una silueta
 *  de 200 px de lado y ésta, siluetas de ~26: la misma tinta en una figura
 *  quince veces más chica desaparece. *Dos alfas distintos porque son dos
 *  áreas distintas, no por descuido.* */
const ALFA = 0.09

/** El escalón, de la orden y del token: `motion.stagger.slow` **= 120**.
 *  Es el mismo que `Entrada` lleva firmado desde S81 (45 → 120, con su
 *  medición: *«con 45, tres bloques resolvían en ~390 ms y el escalonado
 *  no se PERCIBÍA como orden»*). No se teclea el número: se importa. */
const ESCALON = motion.stagger.slow

/** Cuánto tarda cada pisada en aparecer. `fast` (150) — la pisada no
 *  «entra»: se posa. El gesto lento vive en el ESCALÓN, no en el fade. */
const APARICION = motion.duration.fast

/** La caja de diseño de una huella a escala 1 (ver `Huella`). */
const BOX = 24

function Pisada({
  indice,
  lado,
  quieta,
  color,
}: {
  indice: number
  lado: number
  quieta: boolean
  color: string
}) {
  const alfa = useSharedValue(quieta ? 1 : 0)

  useEffect(() => {
    if (quieta) {
      alfa.value = 1
      return
    }
    alfa.value = withDelay(
      indice * ESCALON,
      withTiming(1, { duration: APARICION, easing: Easing.bezier(...motion.easing.easeOut.bezier) }),
    )
  }, [quieta, indice, alfa])

  const estilo = useAnimatedStyle(() => ({ opacity: alfa.value }))

  return (
    <Animated.View style={[{ width: lado, height: lado }, estilo]}>
      <Svg width={lado} height={lado} viewBox={`0 0 ${BOX} ${BOX}`}>
        {/* La pata alterna de lado, como camina un animal: la senda se lee
            como recorrido y no como lista. El giro es chico a propósito —
            ±14° basta para dar el bamboleo sin que la huella se lea torcida. */}
        <Huella color={color} escala={1} />
      </Svg>
    </Animated.View>
  )
}

export function PaseoDeHuellas({
  /** Override del alfa, para el gate en galería. Default: `ALFA` (0.09). */
  alfa,
  /** Tamaño de cada pisada en px. Default: derivado del ancho (≈26 a 390). */
  tamano,
  /**
   * **La senda YA TRAZADA, sin gesto** — pedido de C para el prestador
   * (§7). Aparece entera y quieta: mismo dibujo, mismo alfa, cero
   * animación.
   *
   * 🔴 **POR QUÉ ES UNA PROP Y NO OTRA PIEZA, que es la decisión:** el
   * estado final ya existía adentro —es exactamente lo que produce
   * `reduce-motion`— así que una pieza hermana sería **un clon cuyo
   * único aporte es no llamar a un hook**. Y el precedente de esta casa
   * es duro con eso: `MarcaDeAgua` nació justamente porque la misma
   * pieza copiada en dos pantallas se había desincronizado (0.06 contra
   * 0.04, hallazgo r8). *Dos piezas que deben verse igual y salen de dos
   * archivos se separan; la pregunta no es si, es cuándo.*
   *
   * ⚠️ **Y NO SE REUSÓ `reduceMotion` COMO SI FUERA LO MISMO.** Son dos
   * variables y se combinan, no se cuelgan una de la otra — el patrón
   * de `EsperaDeMarca`: *reducir movimiento es una preferencia de
   * accesibilidad; una senda deliberadamente quieta es una decisión de
   * diseño.* Que hoy produzcan el mismo píxel no las vuelve la misma
   * cosa, y colgarlas juntas haría que cambiar una cambiara la otra.
   *
   * ⚠️ **§7 DEL RITUAL DICE QUE NO TOCA PRESTADOR EN v1** (*«hereda el
   * lenguaje en su propia mesa»*). Esta prop **habilita** el uso, no lo
   * autoriza: montarla en el prestador es decisión de esa mesa, no de
   * esta pieza.
   */
  estatica = false,
}: { alfa?: number; tamano?: number; estatica?: boolean } = {}) {
  const { theme } = useTheme()
  const { width, height } = useWindowDimensions()
  const reduceMotion = useReducedMotion()

  // Memorial: la pieza no se monta (Ley 8 — degrada en la fuente, igual
  // que `MarcaDeAgua`).
  const esMemorial = theme.mode === 'memorial'
  /* Las DOS razones para no moverse, combinadas y no colgadas una de la
     otra (ver el JSDoc de `estatica`): una es preferencia del sistema, la
     otra es decisión de la pantalla. */
  const quieta = reduceMotion || estatica
  if (esMemorial) return null

  const lado = tamano ?? Math.round(width * 0.067)
  // La senda cruza en diagonal de abajo-izquierda a arriba-derecha. Los
  // números son proporción de la pantalla, jamás px tecleados: el mismo
  // recorrido en cualquier aparato.
  const paso = { x: width * 0.11, y: -height * 0.085 }
  const origen = { x: width * 0.1, y: height * 0.78 }

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
      {Array.from({ length: HUELLAS }, (_, i) => {
        const izquierda = i % 2 === 0
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: origen.x + paso.x * i + (izquierda ? 0 : lado * 0.9),
              top: origen.y + paso.y * i,
              opacity: alfa ?? ALFA,
              transform: [{ rotate: `${izquierda ? -14 : 14}deg` }],
            }}
          >
            <Pisada indice={i} lado={lado} quieta={quieta} color={theme.text.primary} />
          </View>
        )
      })}
    </View>
  )
}
