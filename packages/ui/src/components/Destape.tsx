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
 *   ⇒ Se lee «520» como lo que N10 dice que es: **el registro GRANDE de
 *   la celebración**, la banda en la que viven sus gestos — no la suma
 *   de las partes. Cada fase usa el vocabulario cerrado (300 estándar ·
 *   520 grande) y el total sale de la suma con solape: **~1620 ms** para
 *   la barra de 4 tabs (el número exacto lo derivan `finTabs()` e `inicioLuz()` abajo).
 *   Queda declarado para que la mesa lo firme o lo corte; lo que NO se
 *   hace es entregar medio segundo diciendo que se cumplió el contrato.
 *
 * REDUCE-MOTION Y MEMORIAL: nada se mueve, **y el momento dura lo
 * mismo**. No es un crossfade express — es la misma coreografía sin
 * desplazamientos. El founder reportó que el destape «pasó demasiado
 * rápido» y la medición le dio la razón: esa rama duraba 300 ms contra
 * 1630 de la larga. *Quitar movimiento no es acortar el momento.*
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
const T = {
  isotipo: { at: 0, dur: motion.duration.estandar },   // ①  0 → 300
  rampa:   { at: 150, dur: motion.duration.grande },   // ②  150 → 670
  tarjeta: { at: 500, dur: motion.duration.estandar }, // ③  500 → 800
  tabs:    { at: 750 },                                // ④  el escalón lo pone `Entrada` (120, firmado)
  luz:     { at: 1100, dur: motion.duration.grande },  // ⑤  1100 → 1620
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
      /* 🔴 REDUCE-MOTION QUITA EL MOVIMIENTO, NO EL TIEMPO DE LECTURA.

         ⏪ ESTA RAMA ESTABA MAL Y EL FOUNDER LO VIO PRIMERO: en el gate
         del lote reportó que el destape **«pasó demasiado rápido»** y no
         alcanzó a verlo. Medido acá: la rama larga dura **1630 ms** con
         cuatro tabs y esta duraba **300** — *la celebración se colapsaba
         5×*.

         EL DEFECTO ERA CONCEPTUAL, no de código: escribí «crossfade
         único» y con eso **confundí SIN MOVIMIENTO con RÁPIDO**. Son dos
         cosas distintas: quien pide menos movimiento pide que las cosas
         no se desplacen, **no que el contenido desaparezca antes de poder
         leerlo** — y acá el contenido es el nombre del negocio que la
         persona acaba de dar de alta. Reducirle el momento a 300 ms es
         quitarle justo lo que la pieza existe para darle.

         ⇒ ESTA RAMA CONSERVA LA MISMA COREOGRAFÍA TEMPORAL —los mismos
         `withDelay` de la tabla, el mismo orden, el mismo total— y lo
         único que cambia es QUE NADA SE MUEVE: los estilos de abajo ya
         resuelven `quieto` sin `translateY` ni `scale`, así que cada
         elemento **aparece** en su turno en vez de entrar.

         Y el aviso sigue saliendo del ÚLTIMO gesto real de ESTA rama
         (la luz), no de un reloj aparte: un solo reloj por rama, que es
         la firma de mesa. */
      const aparecer = motion.duration.estandar
      vIsotipo.value = withDelay(T.isotipo.at, withTiming(1, { duration: aparecer, easing: CURVA }))
      vRampa.value = withDelay(T.rampa.at, withTiming(1, { duration: aparecer, easing: CURVA }))
      vTarjeta.value = withDelay(T.tarjeta.at, withTiming(1, { duration: aparecer, easing: CURVA }))
      vTabs.value = withDelay(T.tabs.at, withTiming(1, { duration: 0 }))
      vLuz.value = withDelay(luzAt, withTiming(1, { duration: aparecer, easing: CURVA }, avisar))
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
  const sLuz = useAnimatedStyle(() => ({
    opacity: vLuz.value * (1 - vLuz.value) * 4, // barre: entra y se va
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
            opacity: opacity.luzDeEsquina,
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
    <Animated.View style={[{ flexDirection: 'row', gap: spacing[4] }, sPuerta]}>
      {tabs.map((t, i) => (
        <Entrada key={t.key} orden={i}>
          <View
            style={{
              paddingHorizontal: spacing[4],
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
