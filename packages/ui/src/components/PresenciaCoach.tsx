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
import Svg, { Circle, ClipPath, Defs, G, LinearGradient as LinearGradientSvg, Path, Rect, Stop } from 'react-native-svg'

import { Icono, type IconoNombre } from './Icono'
import { OrbeCoach } from './OrbeCoach'
import { usePresionado } from './usePresionado'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import {
  ARCO_GROSOR,
  DEDO,
  LIENZO,
  ORBE,
  ORBE_ABIERTO,
  ORBE_MINI,
  PASTILLA,
  alturasDeLaFila,
  anclaOrbe,
  arcosDe,
  ejeDeLaFila,
  ejeDesdeDerecha,
  movimientoCoach,
  nodosDeLaFila,
  vozDelOrbe,
  violetaEncendido,
  type ClaseCoach,
  type ClasePastilla,
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
  /** 🔴 **`false` = LA PRESENCIA SIN COACH.** Es la MISMA pieza haciendo el
   *  otro trabajo —la puerta a lo que te espera— y así es como el prestador
   *  y el cliente en memorial tienen su puerta sin que exista una segunda.
   *  *Ofrecer atajos de una IA que esa app no tiene sería prometer.*
   *
   *  ⚠️ **El compilador impide la mezcla:** con `coach: false` no se pueden
   *  pasar `atajos` ni `onPreguntar` ni `voz.preguntar` — el rojo no es un
   *  chequeo que alguien corre, es que no se puede escribir. */
  coach?: boolean
  estado: EstadoCoach
  pendientes: PendientesCoach
  /** De abajo hacia arriba, en el orden en que se pasan. */
  /** **Sin Coach no van** — y el compilador lo impide (ver `coach`). */
  atajos?: AtajosCoach
  /** El nombre, tal cual. **Sólo se DIBUJA** — nunca se concatena. */
  nombre: string
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  /** Tocar el orbe **ya abierto**: abre la Hoja. */
  onPreguntar?: () => void
  onPendiente: (clase: ClasePastilla) => void
  /** Todo el texto, compuesto por la pantalla (Ley 3). */
  voz: {
    /** *«Preguntale a …»* — la primera fila. **Sin Coach no se usa.** */
    preguntar?: string
    /** 🔴 **D-1019 · el orbe se llama distinto según lo que va a hacer.**
     *  ⏪ Acá había UNA sola `orbe: string`, y era el defecto: el mismo
     *  nombre para abrir y para cerrar. **En web `accessibilityState` no
     *  llega**, así que quien usa un lector de pantalla no tenía forma de
     *  saber si la fila estaba desplegada.
     *  *«Abrir a Nexo»* — cerrado. */
    abrir: string
    /** *«Chat · 2»* — **obligatoria aunque `chat` sea 0**: así una cuenta no
     *  puede existir sin su voz, y la pieza nunca compone plural. */
    chat: string
    /** *«Carrito · 1»*. Mismo criterio. */
    pedidos: string
    /** *«Solicitudes · 4»* — del refugio. Obligatoria por el mismo motivo. */
    solicitudes?: string
    /** *«Cerrar»* — abierto. **Lo comparten el orbe y el velo**, que hacen
     *  exactamente lo mismo: *dos nombres para el mismo acto serían dos actos
     *  para quien sólo los oye.* */
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

/* ☠️ **ACÁ VIVÍA `CuerpoOrbe`, Y SE FUE CON SU GEMELO `OrbeMini`.**
 * Los dos se mudaron a `OrbeCoach`, que es **el único dibujo del orbe de la
 * casa**. No fue una limpieza: fue una cura. Había TRES copias del mismo
 * objeto —éstas dos y la de `CabeceraCoach`— y **la tercera se quedó con el
 * defecto que el lote 0.2 curó en las otras dos** (`rgba` en `stopColor`, que
 * en Android pierde el alpha): la cabecera se veía un disco durazno plano.
 * *Una cura aplicada en dos de tres copias no es una cura, es una
 * coincidencia.* */

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
  color,
}: {
  tamano: number
  /** El color de la identidad encendida. `undefined` = el violeta del Coach. */
  color?: string
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

      <OrbeCoach tamano={tamano} encendido={encendido} conResplandor color={color} />

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
  coach = true,
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

  /* ⛔ **MEMORIAL: el COACH no existe — la PUERTA sí.**
     ⏪ Acá la pieza devolvía `null` y punto, con su razón: *una presencia que
     propone cosas no tiene lugar en un duelo* (`MODELO_LOYALTY` §7.1). **Esa
     razón sigue entera y por eso el Coach sigue apagado.** Lo que cambió es
     que la pieza aprendió a existir SIN él: en memorial el cliente la monta
     con `coach: false` y conserva su puerta a los pendientes, que no propone
     nada — sólo dice lo que ya está esperando. */
  if (esMemorial && coach) return null

  /* 🔴 **EL COLOR DE LA PRESENCIA SIN COACH SALE DE `accent.cta`, y no lo
     elegí yo.** `DISEÑO_EXPERIENCIA` §15b.1: *«UN acento de oficio: tealDark
     #0A7268 para TODO estado y control funcional»*, y F-OCRE (18-ago) dice
     con todas las letras que **«la mitad del PRESTADOR queda INTACTA»**.
     Ese slot **ya resuelve por casa**: tealDark en el prestador, el de la
     casa en el cliente, y memorial tiene el suyo.
     ⇒ **Nunca el violeta, que es del Coach; nunca el verde del header.**
     *Tomarlo del tema en vez de teclear el hex es lo que hace que memorial
     no tenga que acordarse de nada.* */
  const identidad = coach ? palette.coachMedio : theme.accent.cta

  const colorDe = (c: ClaseCoach): string =>
    c === 'chat'
      ? theme.capa.comunidad
      : c === 'pedidos'
        ? theme.status.warning
        : c === 'solicitudes'
          ? theme.capa.comunidad
          : identidad

  /* 🔴 **LA PASTILLA NO PUEDE USAR EL COLOR DEL ARCO, Y ESO LO DIJO EL GATE.**
     Con relleno pleno y letra blanca: magenta puro **3,58** · ocre **1,89**,
     contra un piso de 4,5. *Un arco de 3 px y una pastilla con texto adentro
     no son el mismo trabajo, y el mismo hex no sirve para los dos.*
     Cada color trae su par legible **de la casa**: `magentaSerie` es el
     registro trabajador del magenta (blanco encima = 5,70) y el ocre va con
     letra TINTA (8,98), el par que `R56` ya tiene firmado. */
  const ROPA: Record<ClasePastilla, { fondo: string; letra: string; glifo: IconoNombre }> = {
    chat: { fondo: palette.magentaSerie, letra: theme.text.inverse, glifo: 'burbujas' },
    pedidos: { fondo: theme.status.warning, letra: theme.text.primary, glifo: 'carrito' },
    /* El sobre de la escalera de adopción, visto desde el otro lado. */
    solicitudes: { fondo: palette.magentaSerie, letra: theme.text.inverse, glifo: 'sobre' },
  }
  const pastilla = (c: ClasePastilla) => ROPA[c]
  const vozDe = (c: ClasePastilla): string =>
    c === 'chat' ? voz.chat : c === 'pedidos' ? voz.pedidos : (voz.solicitudes ?? voz.chat)

  /* Los arcos son del estado ATENTO y de ningún otro: dormida no los tiene
     (§3) y abierta ya dice sus números en las pastillas. */
  const movimiento = movimientoCoach({ quieta, abierta })
  const arcos = estado === 'atenta' ? arcosDe(pendientes) : []
  const nodos = nodosDeLaFila(pendientes, atajos?.length ?? 0, coach)
  const alturas = alturasDeLaFila(pendientes, width, aireInferior, atajos?.length ?? 0, coach)
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
              key={n.tipo === 'preguntar' ? 'preguntar' : n.tipo === 'pastilla' ? `p-${n.clase}` : atajos![n.indice].id}
              indice={i}
              abierta={abierta}
              escalona={movimiento.escalona}
              centro={alturas[i]}
              ejeX={origenDerecha - n.alto / 2}
            >
              {n.tipo === 'preguntar' ? (
                <>
                  <Etiqueta>{voz.preguntar ?? ''}</Etiqueta>
                  {/* El orbe chico: **ya violeta y con su brasa**, para que se
                      lea como el mismo cuerpo en chico y no como otro botón. */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={voz.preguntar}
                    onPress={() => {
                      onCerrar()
                      onPreguntar?.()
                    }}
                    style={{ width: ORBE_MINI, height: ORBE_MINI }}
                  >
                    {/* Sin resplandor: dentro de la fila ensuciaría a su vecino. */}
                    <OrbeCoach tamano={ORBE_MINI} encendido={1} />
                  </Pressable>
                </>
              ) : n.tipo === 'pastilla' ? (
                <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={vozDe(n.clase)}
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
                    {vozDe(n.clase)}
                  </Text>
                </Pressable>
                {/* 🔴 **SIN COACH la pastilla gana su círculo con glifo.** Con
                    Coach no lo lleva: ahí el eje ya está ocupado por los dedos
                    y un círculo más sería una fila de seis objetos iguales
                    donde dos hacen otra cosa. *Sin Coach la fila son SÓLO
                    pendientes, y ahí el círculo es lo que le da su forma.* */}
                {coach ? null : (
                  <View
                    style={{
                      width: PASTILLA,
                      height: PASTILLA,
                      borderRadius: radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.bg.card,
                    }}
                  >
                    <Icono nombre={pastilla(n.clase).glifo} tamano={22} registro="tinta" montaje="control" />
                  </View>
                )}
                </>
              ) : (
                <>
                  <Etiqueta>{atajos![n.indice].etiqueta}</Etiqueta>
                  <DedoDeLaFila atajo={atajos![n.indice]} onCerrar={onCerrar} onRazonApagado={onRazonApagado} />
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
            accessibilityLabel={vozDelOrbe(abierta, voz)}
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
              color={coach ? undefined : identidad}
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
