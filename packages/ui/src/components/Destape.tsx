/**
 * Destape — LA CEREMONIA DE CIERRE DEL WIZARD DE ALTA (S97+-B).
 *
 * Corre UNA SOLA VEZ, al cerrar el alta del prestador: el momento en que
 * el negocio termina de nacer y la casa se le abre. No es un toast ni una
 * pantalla de éxito. Pedido de C con contrato firmado de mesa
 * (`docs/relevamientos/2026-08-13-s97c-pedido-a-B-destape-del-wizard.md`);
 * la FORMA es de B, el contrato es de la mesa.
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA SECUENCIA FIRMADA (los cinco pasos, en orden y sin pasos de más):
 *   ① isotipo → ② la rampa de 6 stops se enciende → ③ la tarjeta del
 *   negocio → ④ las tabs se materializan escalonadas → ⑤ la luz de la
 *   esquina barre.
 * ═══════════════════════════════════════════════════════════════════
 *
 * 🔴 EL CHOQUE QUE ESTA PIEZA DECLARA EN VEZ DE RESOLVER EN SILENCIO
 * (precedente S63 y la enmienda A4 de §9bis.2: un choque contra letra
 * firmada SE DECLARA):
 *
 *   El contrato de C —y el Norte N6— dicen que las tabs entran
 *   **escalonadas 45/300**. El 45 está DEROGADO: `DIRECCION_ARTE` §5.4
 *   registra la enmienda FIRMADA de S81 que lo pasó a **120**
 *   (`motion.stagger.slow`), con su porqué medido: *«con 45, tres
 *   bloques resolvían en ~390 ms y el escalonado no se PERCIBÍA como
 *   orden de lectura»*.
 *
 *   ⇒ Esta pieza NO teclea ningún escalón: monta `Entrada`, que es el
 *   portador único de §5 y ya lleva el 120 firmado adentro con los
 *   números privados por condición de mesa. **Cumplir la letra vigente y
 *   no re-decidir el escalón son, acá, la misma acción.**
 *
 *   *(El 45 viajó dentro del contrato de C porque el propio header de
 *   `Entrada` seguía diciéndolo mientras su constante decía 120 — la
 *   pieza se contradecía a sí misma. Curado en la misma tanda. Un número
 *   derogado que sobrevive en una prosa derivada no se queda quieto: se
 *   propaga al siguiente contrato que lo cite.)*
 *
 * 🔴 EL SEGUNDO CHOQUE, sobre la DURACIÓN TOTAL — declarado con número:
 *
 *   El contrato pide «duración total: banda de 520». Tomado literal son
 *   **cinco fases más N tabs en medio segundo**: ~104 ms por fase, por
 *   debajo del umbral en que el ojo separa secuencia de simultaneidad —
 *   no se leería como destape sino como un parpadeo.
 *
 *   Y no es opinión: **la propia casa ya midió ese umbral**. La enmienda
 *   S81 del escalón dice que ~390 ms para TRES bloques era demasiado
 *   rápido para percibirse como orden. Si 390/3 no alcanza, 520/5+N
 *   tampoco.
 *
 *   ⇒ Se leyó «520» como lo que N10 dice que es: **el registro GRANDE de
 *   un GESTO**, no la suma de las partes. Cada fase usa el vocabulario
 *   cerrado (300 estándar · 520 grande) y el total sale de la suma.
 *
 *   ✅ **RESUELTO POR FIRMA EN DISPOSITIVO (14-ago): ~3000 ms.** El
 *   founder lo vio y dictó: *«es un ritual de única vez — hay que
 *   disfrutarlo.»* Se declaró ~1620 en vez de entregar medio segundo
 *   diciendo que se cumplía el contrato, y la firma subió el número.
 *   **El GESTO grande sigue en 520; lo que dura ~3000 es la CEREMONIA.**
 *
 * REDUCE-MOTION Y MEMORIAL: **crossfade corto** (~300 ms), nada se
 * mueve, no se salta contenido. Con el ritual firmado en ~3000 ms, el
 * criterio es de la mesa y es de respeto: *el ritual es para quien puede
 * disfrutarlo, no una imposición* — tres segundos de ceremonia a quien
 * pidió menos animación es hacerle esperar un espectáculo que pidió no
 * ver. (El detalle de por qué esto revierte una cura anterior, y con qué
 * argumento distinto, vive en la rama misma.)
 *
 * UN SOLO RELOJ (orden de mesa, y es lo que hace correcto a `alTerminar`):
 * no hay temporizador paralelo. Los offsets viven en UNA tabla, cada
 * gesto sale de ella, y **el aviso de fin lo dispara el callback del
 * último `withTiming` real**. Si alguien cambia una duración —o el
 * reduce-motion colapsa la secuencia— el aviso se mueve con ella, porque
 * es el mismo reloj. *Dos relojes contando lo mismo divergen la primera
 * vez que alguien toca uno.*
 *
 * LO QUE LA PIEZA NO HACE: no lee motor, no navega, no decide qué tabs
 * existen. Recibe `tabsHabilitadas` ya resuelta y avisa cuando terminó.
 * Presentación pura.
 */

import { useEffect } from 'react'
import { View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

import { gradients } from '../tokens/palette'
import { motion } from '../tokens/motion'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'
import { Entrada } from './Entrada'
import { LogoNegocio } from './LogoNegocio'
import { Texto } from './Texto'

export type DestapeTab = {
  /** = nombre de ruta; la pieza no lo usa para navegar, solo como key. */
  key: string
  etiqueta: string
}

export type DestapeProps = {
  /** El nombre tal como quedó en el alta. */
  nombreNegocio: string
  /** `null` cae al monograma — la escalera honesta de `LogoNegocio` (S74). */
  logo: { uri: string } | null
  /** Ya resuelta por quien la monta, en orden de barra. La pieza no lee motor. */
  tabsHabilitadas: DestapeTab[]
  /** OBLIGATORIO (firma de mesa): sale del final REAL de la animación,
   *  jamás de un temporizador paralelo. Ver «UN SOLO RELOJ» arriba. */
  alTerminar: () => void
}

/* ── EL TIMELINE, EN UNA SOLA TABLA ────────────────────────────────────
   Un único origen de verdad de los tiempos. Las fases SOLAPAN a
   propósito: una secuencia de gestos que esperan a que el anterior
   termine del todo se lee como una lista, no como una ceremonia. */
const CURVA = Easing.bezier(...motion.marca.aperturaBezier) // (.32,.72,0,1)
/** El alfa FIRMADO de la luz de la esquina (§9bis.2, 7 %). Se captura acá,
 *  fuera del worklet, y se aplica DENTRO del estilo animado — ver D-801. */
const ALFA_LUZ = opacity.luzDeEsquina
/* ⏪ EL RITUAL DURA ~3000 ms — FIRMA DEL FOUNDER EN DISPOSITIVO
   (14-ago). Su literal: **«es un ritual de única vez — hay que
   disfrutarlo.»** Venía de ~1620.

   🔴 CÓMO SE ESTIRÓ, y es la decisión de forma: **se abren las PAUSAS, no
   los GESTOS.** Cada acto sigue durando lo que N10 declara (300 estándar ·
   520 grande) y lo que crece es el silencio entre uno y otro.

   Escalar las duraciones × 1,85 habría dado gestos de 555 y 962 ms —
   números que **no existen en el vocabulario cerrado** y que además
   arrastran el gesto: un fade de casi un segundo no se lee como
   ceremonia, se lee como lentitud. *Lo que hace un ritual no es que cada
   cosa tarde más: es que haya un beat entre una cosa y la siguiente.*

   El freno de la mesa se cumple por construcción: el ORDEN DE LECTURA se
   conserva —más lento jamás rompe la percepción de secuencia (S81), más
   rápido sí—, y los `at` solo crecen.

       ①  isotipo   0 →  300      ·  pausa 100
       ②  rampa   400 →  920      ·  pausa 130
       ③  tarjeta 1050 → 1350     ·  pausa 150
       ④  tabs    1500 → 2160     ·  pausa 320   (4 tabs; el escalón es de `Entrada`)
       ⑤  luz     2480 → 3000

   Con 5 tabs el acto ④ cierra en 2280 y la luz sigue siendo el último
   gesto — `inicioLuz()` lo garantiza y no se supone. */
const T = {
  isotipo: { at: 0, dur: motion.duration.estandar },    // ①     0 →  300
  rampa:   { at: 400, dur: motion.duration.grande },    // ②   400 →  920
  tarjeta: { at: 1050, dur: motion.duration.estandar }, // ③  1050 → 1350
  tabs:    { at: 1500 },                                // ④  el escalón lo pone `Entrada` (120, firmado)
  luz:     { at: 2480, dur: motion.duration.grande },   // ⑤  2480 → 3000
} as const

/** El fin de la materialización de tabs, derivado y no supuesto: la
 *  barra tiene 3 a 5 (contrato de `BarraTabs`), y con 5 termina en 1530
 *  — antes que la luz. Se CALCULA igual, para que la luz siga siendo el
 *  último gesto aunque mañana entre una tab más: si el aviso de fin
 *  saliera antes de que la última tab aparezca, C navegaría sobre una
 *  ceremonia a medias. */
function finTabs(n: number) {
  return T.tabs.at + motion.stagger.slow * Math.max(0, n - 1) + motion.duration.estandar
}
function inicioLuz(n: number) {
  return Math.max(T.luz.at, finTabs(n) - motion.duration.estandar)
}

export function Destape({ nombreNegocio, logo, tabsHabilitadas, alTerminar }: DestapeProps) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const reduceMotion = useReducedMotion()
  /** Memorial JAMÁS se mueve (Ley 8) y reduce-motion tampoco: el mismo
   *  par que `PuertaDeOficio` ya usa. C declara que el alta no ocurre en
   *  memorial — la pieza igual no se rompe si lo alcanza. */
  const quieto = theme.mode === 'memorial' || reduceMotion

  const vIsotipo = useSharedValue(0)
  const vRampa = useSharedValue(0)
  const vTarjeta = useSharedValue(0)
  const vTabs = useSharedValue(0)
  const vLuz = useSharedValue(0)

  useEffect(() => {
    const avisar = (fin?: boolean) => {
      'worklet'
      if (fin === true) runOnJS(alTerminar)()
    }

    const luzAt = inicioLuz(tabsHabilitadas.length)

    if (quieto) {
      /* ⏪ CROSSFADE CORTO — Y ESTO REVIERTE MI PROPIA CURA ANTERIOR, con
         una razón DISTINTA, no con la misma dada vuelta. Se escribe así
         porque un cambio que parece un ida y vuelta merece decir cuál de
         los dos argumentos ganó y por qué.

         MI ARGUMENTO ERA: *«reduce-motion quita el movimiento, no el
         tiempo de lectura»* — y con la rama larga en 1630 ms era bueno:
         300 ms colapsaba el momento 5×, que fue lo que el founder reportó
         como «pasó demasiado rápido».

         EL DE LA MESA GANA CON LA FIRMA DE LOS 3000: **el ritual es para
         quien puede disfrutarlo, no una imposición.** Tres segundos de
         ceremonia a alguien que pidió menos animación no es respetarle la
         lectura: es hacerle esperar un espectáculo que pidió no ver.
         *Mi argumento era correcto contra 1630 y se vuelve falso contra
         3000* — no cambió la doctrina, cambió la magnitud.

         Lo que NO se toca: nada se mueve (sin `translateY` ni `scale`,
         los estilos ya resuelven `quieto`), no se salta contenido, y el
         aviso sale del último gesto REAL de ESTA rama — un solo reloj por
         rama, la firma de mesa intacta. */
      const aparecer = motion.duration.estandar
      vIsotipo.value = withTiming(1, { duration: aparecer, easing: CURVA })
      vRampa.value = withTiming(1, { duration: aparecer, easing: CURVA })
      vTarjeta.value = withTiming(1, { duration: aparecer, easing: CURVA })
      vTabs.value = withTiming(1, { duration: 0 })
      vLuz.value = withTiming(1, { duration: aparecer, easing: CURVA }, avisar)
      return
    }

    vIsotipo.value = withDelay(T.isotipo.at, withTiming(1, { duration: T.isotipo.dur, easing: CURVA }))
    vRampa.value = withDelay(T.rampa.at, withTiming(1, { duration: T.rampa.dur, easing: CURVA }))
    vTarjeta.value = withDelay(T.tarjeta.at, withTiming(1, { duration: T.tarjeta.dur, easing: CURVA }))
    // Interruptor de montaje de las tabs: al pasar a 1, `Entrada` las
    // escalona con el 120 firmado. Duración 0 — no anima nada por su
    // cuenta, solo abre la puerta en el instante correcto.
    vTabs.value = withDelay(T.tabs.at, withTiming(1, { duration: 0 }))
    // ⑤ EL ÚLTIMO GESTO ES EL QUE AVISA.
    vLuz.value = withDelay(luzAt, withTiming(1, { duration: T.luz.dur, easing: CURVA }, avisar))
    // El disparo es de MONTAJE: la pieza corre una sola vez (contrato §3).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sIsotipo = useAnimatedStyle(() => ({
    opacity: vIsotipo.value,
    transform: [{ scale: quieto ? 1 : 0.92 + vIsotipo.value * 0.08 }],
  }))
  const sRampa = useAnimatedStyle(() => ({ opacity: vRampa.value }))
  const sTarjeta = useAnimatedStyle(() => ({
    opacity: vTarjeta.value,
    transform: [{ translateY: quieto ? 0 : (1 - vTarjeta.value) * 15 }],
  }))
  /** LA LUZ DE LA ESQUINA (§9bis.2, FIRMADA): círculo al 7%, diámetro
   *  ~60% del ancho, centro FUERA del lienzo por la esquina superior
   *  derecha. Acá además BARRE — el gesto que pide el Norte; su
   *  geometría y su alfa no se tocan.
   *  El REGISTRO del color es POR CONTEXTO (enmienda S82): sale del
   *  token del tema, jamás de un literal. */
  const diametroLuz = width * 0.6
  /* 🔴 D-801 — LA LUZ SE DIBUJABA A OPACIDAD PLENA, y el token del 7%
     estaba puesto SIN HACER NADA.

     EL MECANISMO, y es el mismo defecto que el `flexShrink` decorativo de
     `Celda` un piso más abajo: el estilo base declaraba
     `opacity: opacity.luzDeEsquina` (el **7% FIRMADO** de §9bis.2) y este
     `useAnimatedStyle` **viene DESPUÉS en el array de estilos**, así que
     su propia `opacity` lo PISA. La parábola del barrido
     —`v·(1−v)·4`— tiene **máximo 1.0** en v=0.5 ⇒ en el pico la luz se
     dibujaba al **100 %**.

     *Tinta al 7 % es un velo; al 100 % es un agujero negro.* El adorno
     más discreto que la casa permite se estaba comiendo la pantalla en el
     medio de la celebración.

     ⇒ El alfa firmado **entra al worklet multiplicando**, que es el único
     lugar donde nadie lo puede pisar, y se retira del estilo base para
     que haya UNA fuente. `ALFA_LUZ` se captura fuera del worklet (un
     worklet no debe cerrar sobre el objeto de tokens).

     ⚠️ VERIFICADO Y NO SUPUESTO — las otras tres NO tienen el defecto:
     `sIsotipo`, `sRampa` y `sTarjeta` van de 0 a 1 y **eso es correcto**:
     el isotipo, la rampa de marca y la tarjeta del negocio aparecen
     PLENOS por diseño. La rampa en particular se enciende a full porque
     es el momento de marca — ahí el 100 % es la intención, no un
     descuido. La luz era la única con un alfa firmado que respetar. */
  const sLuz = useAnimatedStyle(() => ({
    // barre (entra y se va) × el alfa firmado — el 7 % vive ACÁ, no en el
    // estilo base, porque este objeto se aplica último y gana.
    opacity: vLuz.value * (1 - vLuz.value) * 4 * ALFA_LUZ,
    transform: [{ translateX: quieto ? 0 : -vLuz.value * width * 0.25 }],
  }))

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${nombreNegocio} ya tiene su lugar`}
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[6],
        overflow: 'hidden',
      }}
    >
      {/* ⑤ LA LUZ — pintada primero para que quede DEBAJO del contenido */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -diametroLuz / 2,
            right: -diametroLuz / 3,
            width: diametroLuz,
            height: diametroLuz,
            borderRadius: radius.full,
            backgroundColor: theme.text.primary,
            // el alfa NO va acá: lo aplica `sLuz` (D-801 — este objeto se
            // pisaba con el estilo animado, que se aplica último).
          },
          sLuz,
        ]}
      />

      {/* ① EL ISOTIPO */}
      <Animated.View style={sIsotipo}>
        <Isotipo size={64} variant="gradiente" />
      </Animated.View>

      {/* ② LA RAMPA DE 6 STOPS — solo-marca, legal acá por §9bis.3.
          Fuera del destape sigue prohibida en el prestador. */}
      <Animated.View style={[{ width: width * 0.5, height: 3, borderRadius: radius.full, overflow: 'hidden' }, sRampa]}>
        <LinearGradient
          colors={gradients.logo.colors}
          locations={gradients.logo.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* ③ LA TARJETA DEL NEGOCIO */}
      <Animated.View style={[{ alignItems: 'center', gap: spacing[3] }, sTarjeta]}>
        <LogoNegocio nombre={nombreNegocio} logoUrl={logo?.uri ?? null} tamano={72} />
        <Texto variante="titulo" centrado>
          {nombreNegocio}
        </Texto>
      </Animated.View>

      {/* ④ LAS TABS SE MATERIALIZAN — el escalón lo pone `Entrada` (120
          firmado, números privados). Esta pieza no teclea ningún tiempo
          de escalonado: abre la puerta y la ley hace el resto. */}
      <TabsDelDestape tabs={tabsHabilitadas} abierto={vTabs} />
    </View>
  )
}

/** Separado para que el montaje condicional de las tabs no re-monte el
 *  resto de la ceremonia en cada frame del reloj. */
function TabsDelDestape({ tabs, abierto }: { tabs: DestapeTab[]; abierto: { value: number } }) {
  const { theme } = useTheme()
  const sPuerta = useAnimatedStyle(() => ({ opacity: abierto.value }))
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          /* 🔴 ENVUELVE Y SE CENTRA — con las CINCO tabs reales la tira
             se desbordaba: «Hoy» cortada contra el borde izquierdo y
             «Cuenta» contra el derecho.

             MEDIDO con las etiquetas reales a `apoyo` (14 px):
                 chips + gaps = 428 px  vs ~380 útiles  ⇒ 48 px de más

             POR QUÉ ENVOLVER Y NO SOLO COMPRIMIR, que era la salida
             obvia: comprimir el paso da 316 px y entra **por 64 px de
             margen** — y **las etiquetas las pone el consumidor**
             (`etiqueta` es prop, y viaja por el riel de idioma). Un
             margen que hoy sobra se lo come una traducción más larga, y
             el defecto vuelve sin que nadie toque esta pieza. *Es el
             mismo margen que ya me mordió dos veces hoy: 7 px en el
             patrón de grilla y 0,8 px en su reemplazo.*

             ⇒ `flexWrap` + `justifyContent: 'center'` cierra por
             construcción: **sea cual sea el ancho o el largo de las
             etiquetas, la tira no puede desbordar.** Y el paso se
             comprime IGUAL, para que con cinco normalmente entre en una
             línea — pero **sin depender de que entre**.

             LOS DOS FRENOS DE LA MESA, cumplidos: el ORDEN DE LECTURA se
             conserva (el escalonado lo pone `Entrada` por índice, y
             envolver no lo reordena), y **la ceremonia sigue siendo
             ceremonia** — dos líneas centradas de tabs materializándose
             es tan ceremonial como una. */
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: spacing[2],
        },
        sPuerta,
      ]}
    >
      {tabs.map((t, i) => (
        <Entrada key={t.key} orden={i}>
          <View
            style={{
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: radius.suave,
              backgroundColor: theme.bg.overlay,
            }}
          >
            <Texto variante="apoyo">{t.etiqueta}</Texto>
          </View>
        </Entrada>
      ))}
    </Animated.View>
  )
}
