/**
 * PRESENCIA COACH — el cuerpo de la IA de la casa, siempre a mano (S113-B).
 *
 * **En reposo:** una esfera de 48 abajo a la derecha que respira, con un
 * resplandor violeta detrás y un barrido de luz cada ocho segundos — la única
 * señal de «esto es IA». **Al tocarla NO SE MUEVE:** se enciende violeta,
 * crece 4 px, y sobre su eje sube una fila.
 *
 * ⏪ **ACÁ HUBO UNA HUELLA Y MURIÓ EN EL TELÉFONO (lote 0.1).** El orbe
 * viajaba al centro inferior y abría cuatro dedos en posiciones de pata. Lo
 * que la reemplaza es esta fila. *Se declara porque el aparato es el único
 * juez: la huella se leía bien en la cabeza y no en la mano.*
 *
 * ── EL ORDEN DE LA FILA, de abajo hacia arriba ──────────────────────────
 * Las pastillas de pendiente que tengan algo (pegadas al orbe, en su color) y
 * después los cuatro dedos. Cada nodo lleva **su etiqueta a la izquierda**,
 * alineada a la derecha contra él. La del orbe es *«Preguntale a …»*, y
 * **tocar el orbe abierto abre la Hoja**.
 *
 * ── LO QUE ESTA PIEZA **NO** HACE ───────────────────────────────────────
 * **No sabe el nombre de nada.** El nombre llega por prop y ninguna cadena de
 * este archivo lo contiene.
 * **No compone voz (Ley 3).** Recibe las frases armadas. ⚠️ `nombre` existe
 * igual: la cabecera lo dibuja TAL CUAL, y ahí el nombre es el nombre.
 * **No decide dónde vive ni cuándo se abre** — es del SHELL por N28, y **el
 * montaje en el shell es una decisión de producto que se firma**.
 * **No inventa actividad.** Nada de «está escribiendo» (N13).
 *
 * ── 🔴 LA COLISIÓN QUE HAY QUE SABER ANTES DE MONTARLA ──────────────────
 * **`BurbujaPendientes` ocupa EXACTAMENTE este píxel** — mismo ancla, medido
 * en su fuente. Es a propósito: **es la misma puerta, no una segunda** (N25).
 * ⇒ **El shell monta UNA de las dos, nunca las dos.** En memorial esta
 * presencia devuelve `null` y ahí manda la burbuja, que sigue exportada.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15, al nacer) ──────────────────────
 * · **claro / oscuro:** el cuerpo y el violeta no cambian —es una presencia,
 *   no una superficie— y **su separación del papel la produce el borde lila
 *   más el resplandor**, que funcionan contra los dos.
 * · **memorial: NO SE DIBUJA.** *Una presencia que propone cosas no tiene
 *   lugar en un duelo* (`MODELO_LOYALTY` §7.1 apaga el motor entero en M6).
 * · **reduce-motion: sin respiración ni barrido; la fila abre de una.** El
 *   movimiento adorna, no produce.
 *
 * ── RENDIMIENTO (§2.8) ──────────────────────────────────────────────────
 * Ni estado de React ni temporizadores de JS: todo el movimiento son shared
 * values en el hilo de UI ⇒ **no re-renderiza mientras respira**, y la
 * pantalla que la monta no se entera. *Es la condición para vivir en el
 * shell, donde el costo lo paga cada pantalla.*
 */

import React, { useEffect } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, G, LinearGradient as LinearGradientSvg, Path, RadialGradient, Rect, Stop } from 'react-native-svg'

import { Icono, type IconoNombre } from './Icono'
import { usePresionado } from './usePresionado'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import {
  ARCO_GROSOR,
  BRASA,
  DEDO,
  ANILLO,
  LIENZO,
  LILA_ALFA,
  ORBE,
  ORBE_ABIERTO,
  ORBE_MINI,
  RESPLANDOR_ALFA,
  RESPLANDOR_RADIO,
  PASTILLA,
  alturasDeLaFila,
  anclaOrbe,
  arcosDe,
  ejeDeLaFila,
  ejeDesdeDerecha,
  movimientoCoach,
  nodosDeLaFila,
  violetaEncendido,
  type ClaseCoach,
  type PendientesCoach,
} from './coach-geometria'

export type { PendientesCoach, ClaseCoach } from './coach-geometria'

/** La cola que la pantalla le debe al scroll. Derivada, jamás tecleada. */
export const COLA_PRESENCIA_COACH = ORBE + spacing[5] + spacing[4]

export type EstadoCoach = 'dormida' | 'atenta' | 'despierta' | 'hablando'

interface AtajoBase {
  id: string
  icono: IconoNombre
  /** Corto: lo que se lee en la pastilla, a la izquierda del círculo. */
  etiqueta: string
}

/**
 * 🔴 **UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO, y acá es
 * INEXPRESABLE.** El atajo o tiene `onPress` (vivo) o tiene `razonApagado`
 * (atenuado, y al tocarlo la dice). **Los dos a la vez tampoco compilan.**
 * *No es un chequeo en runtime que alguien puede olvidar correr: un atajo
 * apagado y mudo no se puede escribir.*
 */
export type AtajoCoach =
  | (AtajoBase & { onPress: () => void; razonApagado?: never })
  | (AtajoBase & { onPress?: never; razonApagado: string })

/** 🔴 **EXACTAMENTE CUATRO.** Es una tupla y no un arreglo: *la pieza no
 *  inventa el quinto, y el compilador no la deja inventarlo.* */
export type AtajosCoach = readonly [AtajoCoach, AtajoCoach, AtajoCoach, AtajoCoach]

export interface PresenciaCoachProps {
  estado: EstadoCoach
  pendientes: PendientesCoach
  /** De abajo hacia arriba, en el orden en que se pasan. */
  atajos: AtajosCoach
  /** El nombre, tal cual. **Sólo se DIBUJA** — nunca se concatena. */
  nombre: string
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  /** Tocar el orbe **ya abierto**: abre la Hoja. */
  onPreguntar: () => void
  onPendiente: (clase: 'chat' | 'pedidos') => void
  /** Todo el texto, compuesto por la pantalla (Ley 3). */
  voz: {
    /** *«Preguntale a …»* — la etiqueta del orbe abierto. */
    preguntar: string
    /** La etiqueta accesible del orbe, con nombre y estado. */
    orbe: string
    /** *«Chat · 2»* — **obligatoria aunque `chat` sea 0**: así una cuenta no
     *  puede existir sin su voz, y la pieza nunca compone plural. */
    chat: string
    /** *«Carrito · 1»*. Mismo criterio. */
    pedidos: string
    /** Lo que se lee al tocar afuera, para lectores de pantalla. */
    cerrar: string
  }
  /** Cuánto levantarlo del borde inferior. **Existe porque la pieza no sabe
   *  qué hay debajo** — montada en el shell eso es la barra de tabs. Mismo
   *  contrato que `BurbujaPendientes`. */
  aireInferior?: number
  /** Qué hacer al tocar un atajo apagado: la pantalla muestra la razón **en
   *  una línea**. La pieza no elige el vehículo. */
  onRazonApagado?: (razon: string) => void
}

/* ── LA ETIQUETA ──────────────────────────────────────────────────────────
 * Pastilla blanca con tinta, a la izquierda de su nodo.
 *
 * 🔴 **JAMÁS SE TRUNCA, y por eso no hay `numberOfLines` ni `flex`.** Su caja
 * se abraza al texto y crece hacia la izquierda, que es donde hay pantalla.
 * *Un `flex: 1` acá la haría «entrar» siempre — y entrar cortada es no
 * entrar.* La fuente es la de los CONTROLES de la casa (`sans.medium`, la
 * misma de la barra de pestañas): **el peso 500 viene del archivo de fuente,
 * no de `fontWeight`**, que en RN no aplica a fuentes propias. */
function Etiqueta({ children }: { children: string }) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: radius.full,
        backgroundColor: theme.bg.card,
      }}
    >
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.control,
          color: theme.text.primary,
        }}
      >
        {children}
      </Text>
    </View>
  )
}

/* ── EL ORBE, ENTERO EN SVG ───────────────────────────────────────────────
 * 🔴 **ESTA PIEZA SE REESCRIBIÓ CONTRA EL EMULADOR, NO CONTRA LA CABEZA.** La
 * versión anterior se veía **un disco naranja plano** en Android: sin borde,
 * sin resplandor y sin violeta al abrir. Medido capa por capa, eran DOS causas
 * distintas y ninguna se veía leyendo el código:
 *
 * **① `stopColor` CON `rgba()` PIERDE EL ALPHA EN ANDROID.** Los dos stops de
 * la brasa —`rgba(255,214,150,.72)` y `rgba(255,214,150,0)`— colapsaban al
 * MISMO naranja opaco ⇒ **un círculo naranja pleno tapando el cuerpo entero**.
 * *El degradé no fallaba: el que fallaba era el color de sus paradas.* Y el
 * borde lila caía por lo mismo: `.35` se ignoraba y el orbe en reposo se veía
 * violeta saturado en vez de blanco.
 * ⚠️ **La casa ya tenía la forma correcta y no la usé:** `stopColor` y
 * `stopOpacity` POR SEPARADO, que es como lo hace la elevación oscura.
 *
 * **② `shadowColor` / `shadowRadius` / `shadowOpacity` NO EXISTEN EN
 * ANDROID.** Ahí sólo manda `elevation`, que dibuja una sombra GRIS del
 * sistema — no un resplandor de color. *El resplandor no estaba tenue: no
 * estaba.* Ahora es un círculo con su propio radial, adentro del SVG.
 *
 * ⇒ **Y de ahí sale el lienzo de 2,2×:** un resplandor que se disuelve
 * necesita lugar donde disolverse. Con el lienzo pegado al cuerpo, el
 * degradé se recorta justo donde empieza a existir.
 *
 * ── LAS CAPAS, de atrás hacia adelante ─────────────────────────────────
 * resplandor · cuerpo (perla, con su anillo) · brasa · cuerpo violeta.
 * El violeta es una CAPA APARTE con opacidad animada, no un cambio de
 * paradas: *cambiar los stops salta de un color al otro; el encargo pide un
 * fundido de 250 ms, y un fundido necesita dos cosas encimadas.* */
function CuerpoOrbe({ lado, encendido }: { lado: number; encendido: SharedValue<number> }) {
  const c = lado / 2
  const r = lado / (2 * LIENZO)
  const estiloVioleta = useAnimatedStyle(() => ({ opacity: encendido.value }))
  return (
    <>
      <Svg width={lado} height={lado} style={{ position: 'absolute' }}>
        <Defs>
          {/* El resplandor: violeta al 42 % en el centro que MUERE en el
              borde. `stopOpacity` y no un rgba: ver ① arriba. */}
          <RadialGradient id="coachGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={palette.coachMedio} stopOpacity={RESPLANDOR_ALFA} />
            <Stop offset="1" stopColor={palette.coachMedio} stopOpacity={0} />
          </RadialGradient>
          {/* El cuerpo en reposo: blanco al centro, lila al borde. */}
          <RadialGradient id="coachPerlaG" cx="38%" cy="34%" r="62%">
            <Stop offset="0" stopColor={palette.coachPerla} stopOpacity={1} />
            <Stop offset="1" stopColor={palette.coachClaro} stopOpacity={LILA_ALFA} />
          </RadialGradient>
          {/* La brasa: cálida, chica y descentrada. */}
          <RadialGradient
            id="coachBrasaG"
            cx={`${BRASA.cx * 100}%`}
            cy={`${BRASA.cy * 100}%`}
            r={`${(BRASA.diametro / 2) * 100}%`}
          >
            <Stop offset="0" stopColor={palette.coachBrasa} stopOpacity={0.9} />
            <Stop offset="1" stopColor={palette.coachBrasa} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r * RESPLANDOR_RADIO} fill="url(#coachGlow)" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill="url(#coachPerlaG)"
          /* El contorno: sin él, una esfera casi blanca sobre papel blanco
             no tiene dónde terminar. */
          stroke={palette.coachClaro}
          strokeOpacity={LILA_ALFA}
          strokeWidth={ANILLO}
        />
        <Circle cx={c} cy={c} r={r} fill="url(#coachBrasaG)" />
      </Svg>
      {/* La capa violeta, encimada y con su propio fundido. */}
      <Animated.View style={[{ position: 'absolute', width: lado, height: lado }, estiloVioleta]}>
        <Svg width={lado} height={lado}>
          <Defs>
            <RadialGradient id="coachVioG" cx="38%" cy="34%" r="62%">
              <Stop offset="0" stopColor={palette.coachClaro} stopOpacity={1} />
              <Stop offset="0.56" stopColor={palette.coachMedio} stopOpacity={1} />
              <Stop offset="1" stopColor={palette.coachProfundo} stopOpacity={1} />
            </RadialGradient>
            <RadialGradient
              id="coachBrasaVioG"
              cx={`${BRASA.cx * 100}%`}
              cy={`${BRASA.cy * 100}%`}
              r={`${(BRASA.diametro / 2) * 100}%`}
            >
              <Stop offset="0" stopColor={palette.coachBrasa} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.coachBrasa} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={r} fill="url(#coachVioG)" />
          <Circle cx={c} cy={c} r={r} fill="url(#coachBrasaVioG)" />
        </Svg>
      </Animated.View>
    </>
  )
}

/** El orbe chico de «Preguntale a …»: **el mismo cuerpo despierto en chico**,
 *  con su brasa. No es un botón con un ícono: es la presencia, y por eso se
 *  reconoce sin leer la etiqueta. Sin resplandor —está dentro de la fila, no
 *  flotando sobre contenido— y sin respiración: *lo que respira es el orbe,
 *  no su atajo.* */
function OrbeMini({ lado }: { lado: number }) {
  const c = lado / 2
  return (
    <Svg width={lado} height={lado}>
      <Defs>
        <RadialGradient id="coachMiniG" cx="38%" cy="34%" r="62%">
          <Stop offset="0" stopColor={palette.coachClaro} stopOpacity={1} />
          <Stop offset="0.56" stopColor={palette.coachMedio} stopOpacity={1} />
          <Stop offset="1" stopColor={palette.coachProfundo} stopOpacity={1} />
        </RadialGradient>
        <RadialGradient
          id="coachMiniBrasaG"
          cx={`${BRASA.cx * 100}%`}
          cy={`${BRASA.cy * 100}%`}
          r={`${(BRASA.diametro / 2) * 100}%`}
        >
          <Stop offset="0" stopColor={palette.coachBrasa} stopOpacity={0.9} />
          <Stop offset="1" stopColor={palette.coachBrasa} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c} fill="url(#coachMiniG)" />
      <Circle cx={c} cy={c} r={c} fill="url(#coachMiniBrasaG)" />
    </Svg>
  )
}

/** Un arco entre dos ángulos, **0 = las 12 en punto**. La conversión al
 *  sistema de SVG vive acá y en un solo lugar: *si viviera en cada llamador,
 *  el día que un arco se dibuje al revés habría cuatro sitios donde
 *  buscarlo.* */
function arcoAPath(cx: number, cy: number, r: number, desde: number, hasta: number): string {
  const punto = (grados: number) => {
    const rad = ((grados - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const a = punto(desde)
  const b = punto(hasta)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
}

/* ── EL ORBE ENTERO: cuerpo + arcos + barrido, con su respiración ───────── */
function Orbe({
  tamano,
  encendido,
  arcos,
  respira,
  barre,
  colorDe,
}: {
  tamano: number
  /** 0 en reposo, 1 despierto. Anima el fundido de la capa violeta. */
  encendido: SharedValue<number>
  arcos: ReturnType<typeof arcosDe>
  respira: boolean
  barre: boolean
  colorDe: (c: ClaseCoach) => string
}) {
  const escala = useSharedValue(1)
  const barrido = useSharedValue(0)

  useEffect(() => {
    if (!respira) {
      escala.value = 1
      return
    }
    escala.value = withRepeat(
      withTiming(motion.coach.respiracionEscala, {
        duration: motion.coach.respiracionMs,
        easing: Easing.bezier(...motion.easing.easeInOut.bezier),
      }),
      -1,
      true, // ida y vuelta: inhala / exhala
    )
    return () => {
      escala.value = 1
    }
  }, [respira, escala])

  useEffect(() => {
    if (!barre) {
      barrido.value = 0
      return
    }
    /* Cruza en `barridoMs`, se queda quieto el resto del ciclo y vuelve de
       golpe. **La espera es parte de la animación**, no un temporizador de
       JS: así el barrido nunca despierta al hilo principal. */
    barrido.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.coach.barridoMs, easing: Easing.linear }),
        withDelay(motion.coach.barridoCadaMs - motion.coach.barridoMs, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    )
    return () => {
      barrido.value = 0
    }
  }, [barre, barrido])

  const estiloRespiro = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))
  /* La banda ya nace rotada DENTRO del SVG; acá sólo VIAJA. Separar las dos
     cosas saca del medio el orden de transforms, que es donde esto se rompía
     antes sin decir nada. */
  const estiloBarrido = useAnimatedStyle(() => ({
    opacity: barrido.value > 0 && barrido.value < 1 ? 1 : 0,
    transform: [{ translateY: (barrido.value * 2 - 1) * tamano * 1.2 }],
  }))

  /* El lienzo es 2,2× el cuerpo: ahí vive el resplandor. */
  const lado = tamano * LIENZO

  return (
    <Animated.View
      style={[{ width: lado, height: lado, alignItems: 'center', justifyContent: 'center' }, estiloRespiro]}
    >
      {/* ⛔ EN REPOSO NO HAY LÍNEA. Sin pendientes esto no se monta: *un aro
          fino permanente convierte una presencia en un widget.* */}
      {arcos.length > 0 ? (
        <Svg width={lado} height={lado} style={{ position: 'absolute' }}>
          {arcos.map((a) => (
            <Path
              key={a.clase}
              d={arcoAPath(lado / 2, lado / 2, tamano / 2 + ARCO_GROSOR * 2, a.desde, a.hasta)}
              stroke={colorDe(a.clase)}
              strokeWidth={ARCO_GROSOR}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
      ) : null}

      <CuerpoOrbe lado={lado} encendido={encendido} />

      {/* ── EL BARRIDO DE LUZ, EN SVG ──────────────────────────────────
          🔴 **ACÁ HABÍA UN `LinearGradient` DE EXPO Y NO DIBUJABA NADA.**
          Tres controles hicieron falta y cada uno descartó una sospecha:
          ① con el barrido **siete veces más largo y lento** el brillo no
          subía ⇒ no era la duración · ② **centrarlo en el lienzo** tampoco lo
          trajo ⇒ no era la posición · ③ **congelado a mitad de recorrido**
          —la banda plantada sobre el centro del cuerpo, opacidad 1— **en el
          emulador no apareció ni una línea** ⇒ era el DIBUJO.
          ⚠️ **Y antes de todo eso el instrumento mintió**, que es lo que más
          conviene dejar escrito: medía el brillo MÁXIMO del cuerpo, y el
          centro de la perla ya es blanco puro ⇒ **el máximo estaba saturado y
          no podía subir aunque el barrido cruzara.** *Un instrumento que mide
          contra un techo no mide nada.* Se pasó a la MEDIA.
          Ahora vive dentro de un SVG con `ClipPath` circular — que además es
          lo que el encargo pedía: todo en SVG, sin capas de RN encimadas. */}
      <Animated.View
        style={[{ position: 'absolute', width: lado, height: lado }, estiloBarrido]}
        pointerEvents="none"
      >
        <Svg width={lado} height={lado}>
          <Defs>
            <ClipPath id="coachClip">
              <Circle cx={lado / 2} cy={lado / 2} r={tamano / 2} />
            </ClipPath>
            <LinearGradientSvg id="coachSweep" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.white} stopOpacity={0} />
              <Stop offset="0.5" stopColor={palette.white} stopOpacity={0.85} />
              <Stop offset="1" stopColor={palette.white} stopOpacity={0} />
            </LinearGradientSvg>
          </Defs>
          <G clipPath="url(#coachClip)">
            <Rect
              x={-lado}
              y={lado / 2 - tamano / 6}
              width={lado * 3}
              height={tamano / 3}
              fill="url(#coachSweep)"
              transform={`rotate(${motion.coach.barridoAngulo} ${lado / 2} ${lado / 2})`}
            />
          </G>
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

/* ── UN NODO DE LA FILA ───────────────────────────────────────────────────
 * Componente propio para que **cada uno tenga su propio shared value** y
 * pueda entrar escalonado sin que la pieza guarde estado. */
function NodoDeFila({
  indice,
  abierta,
  escalona,
  centro,
  ejeX,
  children,
}: {
  indice: number
  abierta: boolean
  escalona: boolean
  /** Altura de su centro, desde el borde inferior. */
  centro: number
  ejeX: number
  children: React.ReactNode
}) {
  const entrada = useSharedValue(0)

  useEffect(() => {
    if (!escalona) {
      /* Sin escalonado la fila **abre igual**: el movimiento adorna, no
         produce. *Una fila que no aparece con reduce-motion sería una función
         perdida, no una animación apagada.* */
      entrada.value = abierta ? 1 : 0
      return
    }
    entrada.value = abierta
      ? withDelay(
          indice * motion.coach.escalonadoMs,
          withTiming(1, {
            duration: motion.coach.viajeMs,
            easing: Easing.bezier(...motion.coach.viajeBezier),
          }),
        )
      : /* El cierre NO se escalona: se abre en orden y se recoge de golpe.
           *Escalonar la salida hace esperar a quien ya decidió irse.* */
        withTiming(0, { duration: motion.coach.cierreMs })
  }, [abierta, escalona, indice, entrada])

  const estilo = useAnimatedStyle(() => ({
    opacity: entrada.value,
    /* Nace pegado al orbe y sube a su lugar: la fila se despliega, no
       aparece. */
    transform: [{ translateY: (1 - entrada.value) * 24 }, { scale: 0.86 + entrada.value * 0.14 }],
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          /* El eje del orbe es el eje de la fila. `right` y no `left`: la
             etiqueta crece hacia la IZQUIERDA sin empujar al círculo. */
          right: ejeX,
          bottom: centro,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
        },
        estilo,
      ]}
    >
      {children}
    </Animated.View>
  )
}

export function PresenciaCoach({
  estado,
  pendientes,
  atajos,
  nombre: _nombre,
  abierta,
  onAbrir,
  onCerrar,
  onPreguntar,
  onPendiente,
  voz,
  aireInferior = 0,
  onRazonApagado,
}: PresenciaCoachProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()
  const { width } = useWindowDimensions()

  /* ⚠️ EL HOOK SE LLAMA SUELTO Y RECIÉN DESPUÉS SE COMBINA — no
     `esMemorial || useReducedMotion()`, que es más corto y es una llamada
     CONDICIONAL a un hook. Patrón exacto de `EsperaDeMarca` y `Entrada`. */
  const reduceMotion = useReducedMotion()
  const esMemorial = theme.mode === 'memorial'
  const quieta = reduceMotion || esMemorial

  const velo = useSharedValue(0)
  const encendido = useSharedValue(0)

  useEffect(() => {
    velo.value = withTiming(abierta ? 1 : 0, { duration: quieta ? 0 : motion.coach.fundidoMs })
    /* La capa violeta se enciende abierta **o** cuando el Coach habla. El
       QUÉ lo decide `violetaEncendido`, que su gate asierta; acá vive sólo
       el CÓMO —el fundido de 250 ms—. */
    encendido.value = withTiming(violetaEncendido({ abierta, estado }), {
      duration: quieta ? 0 : motion.coach.fundidoMs,
    })
  }, [abierta, estado, quieta, velo, encendido])

  const estiloVelo = useAnimatedStyle(() => ({ opacity: velo.value }))
  /* El orbe **NO VIAJA**: sólo crece. Su centro no se mueve un píxel. */
  const estiloOrbe = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (ORBE_ABIERTO / ORBE - 1) * encendido.value }],
  }))

  /* ⛔ MEMORIAL: la presencia no existe. Ver la cabecera del archivo. */
  if (esMemorial) return null

  const colorDe = (c: ClaseCoach): string =>
    c === 'chat' ? theme.capa.comunidad : c === 'pedidos' ? theme.status.warning : palette.coachMedio

  /* 🔴 **LA PASTILLA NO PUEDE USAR EL COLOR DEL ARCO, Y ESO LO DIJO EL GATE.**
     Con relleno pleno y letra blanca: magenta puro **3,58** · ocre **1,89**,
     contra un piso de 4,5. *Un arco de 3 px y una pastilla con texto adentro
     no son el mismo trabajo, y el mismo hex no sirve para los dos.*
     Cada color trae su par legible **de la casa**: `magentaSerie` es el
     registro trabajador del magenta (blanco encima = 5,70) y el ocre va con
     letra TINTA (8,98), el par que `R56` ya tiene firmado. */
  const pastilla = (c: 'chat' | 'pedidos'): { fondo: string; letra: string } =>
    c === 'chat'
      ? { fondo: palette.magentaSerie, letra: theme.text.inverse }
      : { fondo: theme.status.warning, letra: theme.text.primary }

  /* Los arcos son del estado ATENTO y de ningún otro: dormida no los tiene
     (§3) y abierta ya dice sus números en las pastillas. */
  const movimiento = movimientoCoach({ quieta, abierta })
  const arcos = estado === 'atenta' ? arcosDe(pendientes) : []
  const nodos = nodosDeLaFila(pendientes, atajos.length)
  const alturas = alturasDeLaFila(pendientes, width, aireInferior, atajos.length)
  const ancla = anclaOrbe(width, aireInferior)
  const eje = ejeDeLaFila(width, aireInferior)
  /* `right` del eje: **derivado, no tecleado** — si viviera acá, el día que
     el aire del borde cambie la fila y el orbe se separarían sin que ningún
     gate lo vea. */
  const origenDerecha = ejeDesdeDerecha()

  return (
    <View
      /* Cerrada, **no intercepta nada**: `box-none` deja pasar todo lo que no
         toque un hijo. Abierta, el velo de abajo toma la pantalla. */
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {abierta ? (
        <>
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, estiloVelo]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={voz.cerrar}
              onPress={onCerrar}
              style={{ flex: 1, backgroundColor: palette.coachVelo }}
            />
          </Animated.View>

          {nodos.map((n, i) => (
            <NodoDeFila
              key={n.tipo === 'preguntar' ? 'preguntar' : n.tipo === 'pastilla' ? `p-${n.clase}` : atajos[n.indice].id}
              indice={i}
              abierta={abierta}
              escalona={movimiento.escalona}
              centro={alturas[i]}
              ejeX={origenDerecha - n.alto / 2}
            >
              {n.tipo === 'preguntar' ? (
                <>
                  <Etiqueta>{voz.preguntar}</Etiqueta>
                  {/* El orbe chico: **ya violeta y con su brasa**, para que se
                      lea como el mismo cuerpo en chico y no como otro botón. */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={voz.preguntar}
                    onPress={() => {
                      onCerrar()
                      onPreguntar()
                    }}
                    style={{ width: ORBE_MINI, height: ORBE_MINI }}
                  >
                    <OrbeMini lado={ORBE_MINI} />
                  </Pressable>
                </>
              ) : n.tipo === 'pastilla' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={n.clase === 'chat' ? voz.chat : voz.pedidos}
                  onPress={() => {
                    onCerrar()
                    onPendiente(n.clase)
                  }}
                  style={{
                    height: PASTILLA,
                    justifyContent: 'center',
                    paddingHorizontal: spacing[4],
                    borderRadius: radius.full,
                    backgroundColor: pastilla(n.clase).fondo,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.control,
                      color: pastilla(n.clase).letra,
                    }}
                  >
                    {n.clase === 'chat' ? voz.chat : voz.pedidos}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Etiqueta>{atajos[n.indice].etiqueta}</Etiqueta>
                  <DedoDeLaFila atajo={atajos[n.indice]} onCerrar={onCerrar} onRazonApagado={onRazonApagado} />
                </>
              )}
            </NodoDeFila>
          ))}

        </>
      ) : null}

      {/* El orbe. **No se mueve**: se enciende y crece donde vive. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            /* 🔴 **El lienzo mide 2,2× el cuerpo y desborda parejo**, así que
               se resta la mitad de ese desborde para que el CUERPO caiga
               donde `anclaOrbe` promete. Sin esto el orbe se corre 29 px
               hacia adentro — y «un poco corrido» no se lee como error: se
               lee como un diseño flojo. */
            left: ancla.izquierda - (ORBE * (LIENZO - 1)) / 2,
            bottom: eje.abajo - ORBE / 2 - (ORBE * (LIENZO - 1)) / 2,
          },
          estiloOrbe,
        ]}
      >
        <Animated.View style={estiloPresionado}>
          <Pressable
            {...handlers}
            accessibilityRole="button"
            accessibilityLabel={voz.orbe}
            accessibilityState={{ expanded: abierta }}
            /* 🔴 **EL ORBE ABRE Y CIERRA — decisión del founder, y la mesa
               la hace suya (lote 0.2).**
               ⏪ Acá estaba escrito lo contrario: *«un mismo toque que a
               veces abre y a veces cierra enseña a no tocarlo»*. **La premisa
               era que el toque no cambia nada visible, y es falsa:** el orbe
               CAMBIA DE CARA —perla cerrado, violeta abierto— y **ese cambio
               es lo que enseña a tocarlo.** Un interruptor con dos caras no
               es ambiguo: es un interruptor.
               `onPreguntar` vive SÓLO en la fila «Preguntale». */
            onPress={abierta ? onCerrar : onAbrir}
          >
            <Orbe
              tamano={ORBE}
              encendido={encendido}
              arcos={arcos}
              respira={movimiento.respira}
              barre={movimiento.barre}
              colorDe={colorDe}
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

/** El círculo blanco de un atajo. */
function DedoDeLaFila({
  atajo,
  onCerrar,
  onRazonApagado,
}: {
  atajo: AtajoCoach
  onCerrar: () => void
  onRazonApagado?: (razon: string) => void
}) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()
  const apagado = atajo.razonApagado !== undefined
  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={atajo.etiqueta}
        accessibilityState={{ disabled: apagado }}
        accessibilityHint={atajo.razonApagado}
        onPress={() => {
          /* 🔴 **El apagado NO es mudo.** Dice su razón y NO cierra la fila:
             *cerrar sería castigar el toque con la desaparición de lo que se
             acaba de explicar.* */
          if (atajo.razonApagado !== undefined) {
            onRazonApagado?.(atajo.razonApagado)
            return
          }
          onCerrar()
          atajo.onPress()
        }}
        style={{
          width: DEDO,
          height: DEDO,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.bg.card,
          /* La razón se dibuja: **atenuado, no ausente.** Un dedo que
             desaparece deja a la persona sin saber que existía. */
          opacity: apagado ? 0.45 : 1,
        }}
      >
        {/* 🔴 `montaje="control"` VA SIEMPRE Y NO ES PROP DE NADIE: los nodos
            de la fila son ACTOS, y `N27` es sobre el contexto. Lo decide la
            pieza, no la pantalla — *si el consumidor pudiera elegirlo, la ley
            sería una sugerencia* (Ley 8). ⚠️ **No toca cómo se dibuja el
            glifo en el resto de la app.** */}
        <Icono nombre={atajo.icono} tamano={24} registro="tinta" montaje="control" />
      </Pressable>
    </Animated.View>
  )
}
