/**
 * PRESENCIA COACH — el cuerpo de la IA de la casa, siempre a mano (S113-B).
 *
 * **Encargo del founder (lote 0 · la presencia del Coach):** una esfera de material
 * vivo que respira dormida, se pone atenta cuando hay algo, y al tocarla se
 * abre como una HUELLA — la almohadilla abajo y cuatro dedos subiendo.
 *
 * ── LO QUE ESTA PIEZA **NO** HACE ───────────────────────────────────────
 * **No sabe el nombre de nada.** En el código el Coach se dice `coach`; el
 * nombre llega por prop y ninguna cadena de este archivo lo contiene. *Un
 * nombre provisional tecleado en una pieza sobrevive al día que se decida
 * el definitivo.*
 *
 * **No compone voz (Ley 3).** Recibe `voz.preguntar`, `voz.chat` y
 * `voz.pedidos` ya armadas. ⚠️ **`nombre` existe igual y no es una
 * contradicción:** la cabecera lo dibuja TAL CUAL —ahí el nombre es el
 * nombre, no una frase— mientras que *«Preguntale a …»* es una oración con
 * plural, artículo y orden que sólo i18n sabe armar.
 *
 * **No decide dónde vive ni cuándo se abre.** `abierta` · `onAbrir` ·
 * `onCerrar` son de la pantalla: es del SHELL por N28 —su condición de
 * existencia es un DATO, no una ruta— y **el montaje en el shell es una
 * decisión de producto que se firma**, no un detalle de esta pieza.
 *
 * **No inventa actividad.** No hay *«está escribiendo»*, ni puntitos, ni
 * progreso: *lo que el motor no sabe no se dibuja* (N13 — la IA de la casa
 * aparece como competencia callada, nunca como chatbot).
 *
 * ── 🔴 LA COLISIÓN QUE HAY QUE SABER ANTES DE MONTARLA ──────────────────
 * **`BurbujaPendientes` ocupa EXACTAMENTE este píxel** — `right: spacing[5]`,
 * `bottom: spacing[5] + aireInferior`, medido en su fuente. Esta pieza usa el
 * MISMO ancla a propósito: es la misma puerta, no una segunda.
 *
 * ⇒ **El shell monta UNA de las dos, nunca las dos.** *Dos discos peleando el
 * mismo píxel es el defecto que `L-395` dejó escrito cuando el carrito y la
 * burbuja se cruzaron.* La regla del reparto, que es de la pantalla y no de
 * acá: **en memorial esta presencia no se dibuja** (§2.6) y ahí manda
 * `BurbujaPendientes`, que sigue exportada intacta para ese caso.
 *
 * ── LA CUENTA DEL SCROLL ────────────────────────────────────────────────
 * `COLA_PRESENCIA_COACH` es la cola que la pantalla le debe al scroll, por lo
 * mismo que la de la burbuja: el orbe flota ENCIMA y sin reserva el último
 * ítem queda debajo.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15, al nacer) ──────────────────────
 * · **claro / oscuro:** la perla y el violeta no cambian — es una presencia,
 *   no una superficie, y **su contraste lo produce el resplandor**, que
 *   funciona contra los dos papeles. Lo que sí cambia es la letra del nombre
 *   en la cabecera (`coachProfundo` sobre papel · `coachClaro` sobre oscuro).
 * · **memorial: NO SE DIBUJA.** Devuelve `null`. *No es que se apague el
 *   movimiento: es que una presencia que propone cosas no tiene lugar en un
 *   duelo* (`MODELO_LOYALTY` §7.1 apaga el motor entero en M6).
 * · **reduce-motion: sin respiración y sin barrido; la huella abre de una.**
 *   El movimiento adorna, no produce — sin él la pieza dice lo mismo.
 *
 * ── RENDIMIENTO (§2.8) ──────────────────────────────────────────────────
 * **Ni estado de React ni temporizadores de JS.** Todo el
 * movimiento son shared values de Reanimated corriendo en el hilo de UI ⇒
 * **esta pieza no re-renderiza ni una vez mientras respira**, y la pantalla
 * que la monta no se entera. *Es la condición para vivir en el shell, donde
 * el costo lo paga cada pantalla — incluidas las que no saben que existe.*
 */

import { useEffect } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'

import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import {
  ALMOHADILLA,
  ARCO_GROSOR,
  BRILLO,
  DEDO,
  HALO,
  HALO_GROSOR,
  ORBE,
  POSICIONES_DEDOS,
  RESPLANDOR,
  ALTO_VOZ,
  anclaOrbe,
  arcosDe,
  ascensoAlDespertar,
  centroAlmohadilla,
  desplazamientoAlCentro,
  movimientoCoach,
  pastillasDe,
  type ClaseCoach,
  type PendientesCoach,
} from './coach-geometria'

export type { PendientesCoach, ClaseCoach } from './coach-geometria'

/** La cola que la pantalla le debe al scroll. Derivada, jamás tecleada. */
export const COLA_PRESENCIA_COACH = ORBE + spacing[5] + spacing[4]

/** 🔴 **`13` NO EXISTE EN LA ESCALA DE LA CASA** — es 11 · 14 · 16 · 20…
 *  El encargo pide *«13 px»* para la voz y *«12–13»* para las pastillas.
 *  **Se usa la escala** (`sm` = 14 y `xs` = 11): un píxel de diferencia es
 *  invisible; *un tamaño fuera de escala tecleado en una pieza nueva es
 *  permanente, porque el siguiente lo copia creyendo que es el estándar* —
 *  el defecto exacto que le costó el nombre a `motion.duration.normal`. */
const VOZ = typography.size.sm
const ETIQUETA = typography.size.xs

/**
 * 🔴 **POR QUÉ ACÁ SE BAJA A `Text` Y NO SE USA `Texto`.**
 * `Texto` resuelve su color contra `theme.text.*`, **calibrado sobre las
 * superficies que la casa pinta**. El velo no es una de ellas: es tinta al
 * 42 % sobre CUALQUIER pantalla que haya debajo. El slot correcto existe
 * —`theme.text.inverse`— pero `TextoColor` no lo expone, y **ampliar el
 * contrato de la pieza más usada de la casa para tres cadenas de un lote
 * nuevo es el orden equivocado**: primero se ve en el teléfono, después se
 * decide si el sistema gana una entrada.
 *
 * ⚠️ **`sobreVideo` NO es la respuesta**, aunque se le parezca: su propia
 * nota dice *«se usa SOLO sobre video»* y está medido contra blanco y negro
 * PUROS. Acá el fondo lo pone la casa, no la cámara de otra persona.
 */
const sobreVelo = (fontSize: number, color: string) => ({
  fontFamily: typography.family.sans.regular,
  fontSize,
  color,
})

export type EstadoCoach = 'dormida' | 'atenta' | 'despierta' | 'hablando'

interface AtajoBase {
  id: string
  icono: IconoNombre
  /** Corto: lo que se lee en la pastilla del dedo. */
  etiqueta: string
}

/**
 * 🔴 **UN BOTÓN APAGADO SIN RAZÓN A LA VISTA ES EL DEFECTO, y acá es
 * INEXPRESABLE.** El atajo o tiene `onPress` (vivo) o tiene `razonApagado`
 * (atenuado, y al tocarlo la dice). **Los dos a la vez tampoco compilan.**
 *
 * *No es un chequeo en runtime que alguien puede olvidar correr: un atajo
 * apagado y mudo no se puede escribir.*
 */
export type AtajoCoach =
  | (AtajoBase & { onPress: () => void; razonApagado?: never })
  | (AtajoBase & { onPress?: never; razonApagado: string })

/** 🔴 **EXACTAMENTE CUATRO.** Es una tupla y no un arreglo: *la pieza no
 *  inventa el quinto dedo, y el compilador no la deja inventarlo.* El día que
 *  el founder quiera cinco, esto rompe donde se monta — que es donde tiene
 *  que romper. */
export type AtajosCoach = readonly [AtajoCoach, AtajoCoach, AtajoCoach, AtajoCoach]

export interface PresenciaCoachProps {
  estado: EstadoCoach
  pendientes: PendientesCoach
  atajos: AtajosCoach
  /** El nombre, tal cual. **Sólo se DIBUJA** (cabecera) — nunca se concatena. */
  nombre: string
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  onPreguntar: () => void
  onPendiente: (clase: 'chat' | 'pedidos') => void
  /** Todo el texto, compuesto por la pantalla (Ley 3). */
  voz: {
    /** *«Preguntale a …»* — debajo de la almohadilla. */
    preguntar: string
    /** La etiqueta accesible del orbe, con nombre y estado. */
    orbe: string
    /** *«Chat · 2»* — **obligatoria aunque `chat` sea 0**: así una cuenta no
     *  puede existir sin su voz, y la pieza nunca tiene que inventar plural. */
    chat: string
    /** *«Pedido · 1»*. Mismo criterio. */
    pedidos: string
    /** Lo que se lee al tocar afuera, para lectores de pantalla. */
    cerrar: string
  }
  /** Cuánto levantarlo del borde inferior. **Existe porque la pieza no sabe
   *  qué hay debajo** — montada en el shell, eso es la barra de tabs, y su
   *  alto lo mide el shell. Mismo contrato que `BurbujaPendientes`. */
  aireInferior?: number
  /** Qué hacer cuando se toca un atajo apagado: la pantalla muestra la razón
   *  **en una línea**. La pieza no elige el vehículo (toast, aviso, pie). */
  onRazonApagado?: (razon: string) => void
}

/* ── EL ORBE ──────────────────────────────────────────────────────────────
 * Perla con una brasa adentro, halo fino y resplandor. **El material es un
 * degradé RADIAL DESCENTRADO**, no un relleno con borde: un disco plano con
 * un aro alrededor se lee como un botón; esto se lee como una esfera. */
function Orbe({
  tamano,
  violeta,
  arcos,
  respira,
  barre,
  colorDe,
}: {
  tamano: number
  violeta: boolean
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
    /* Cruza en `barridoMs`, se queda quieto el resto del ciclo y vuelve al
       principio de golpe. **La espera es parte de la animación**, no un
       temporizador de JS: así el barrido nunca despierta al hilo principal. */
    barrido.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.coach.barridoMs, easing: Easing.linear }),
        withDelay(
          motion.coach.barridoCadaMs - motion.coach.barridoMs,
          withTiming(0, { duration: 0 }),
        ),
      ),
      -1,
      false,
    )
    return () => {
      barrido.value = 0
    }
  }, [barre, barrido])

  const estiloRespiro = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }))
  /* El barrido viaja de un borde al otro por la diagonal. Fuera de su
     recorrido queda invisible: no hay una banda quieta encima de la perla. */
  const estiloBarrido = useAnimatedStyle(() => ({
    opacity: barrido.value > 0 && barrido.value < 1 ? 1 : 0,
    transform: [
      { rotate: `${motion.coach.barridoAngulo}deg` },
      { translateY: (barrido.value * 2 - 1) * tamano },
    ],
  }))

  const halo = (HALO / ORBE) * tamano
  const r = tamano / 2

  return (
    <Animated.View
      style={[
        { width: halo, height: halo, alignItems: 'center', justifyContent: 'center' },
        estiloRespiro,
      ]}
    >
      {/* El halo: fino cuando duerme, arcos cuando hay algo. */}
      <Svg width={halo} height={halo} style={{ position: 'absolute' }}>
        {arcos.length === 0 ? (
          <Circle
            cx={halo / 2}
            cy={halo / 2}
            r={halo / 2 - HALO_GROSOR}
            stroke={palette.coachHalo}
            strokeWidth={HALO_GROSOR}
            fill="none"
          />
        ) : (
          arcos.map((a) => (
            <Path
              key={a.clase}
              d={arcoAPath(halo / 2, halo / 2, halo / 2 - ARCO_GROSOR / 2, a.desde, a.hasta)}
              stroke={colorDe(a.clase)}
              strokeWidth={ARCO_GROSOR}
              strokeLinecap="round"
              fill="none"
            />
          ))
        )}
      </Svg>

      {/* El cuerpo. `overflow:'hidden'` recorta el barrido al círculo. */}
      <View
        style={{
          width: tamano,
          height: tamano,
          borderRadius: radius.full,
          overflow: 'hidden',
          shadowColor: palette.coachResplandor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: RESPLANDOR,
          elevation: 10,
        }}
      >
        <Svg width={tamano} height={tamano}>
          <Defs>
            <RadialGradient
              id="cuerpoCoach"
              cx={`${BRILLO.cx * 100}%`}
              cy={`${BRILLO.cy * 100}%`}
              r={`${BRILLO.r * 100}%`}
            >
              <Stop offset="0" stopColor={violeta ? palette.coachClaro : palette.coachBrasa} />
              <Stop offset="1" stopColor={violeta ? palette.coachMedio : palette.coachPerla} />
            </RadialGradient>
          </Defs>
          <Circle cx={r} cy={r} r={r} fill="url(#cuerpoCoach)" />
        </Svg>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -tamano / 2, width: tamano * 2, height: tamano / 3 },
            estiloBarrido,
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,.85)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

/** Un arco entre dos ángulos, **0 = las 12 en punto**. La conversión del
 *  sistema de la geometría (horario desde arriba) al de SVG vive acá y en un
 *  solo lugar: *si viviera en cada llamador, el día que un arco se dibuje al
 *  revés habría cuatro sitios donde buscarlo.* */
function arcoAPath(cx: number, cy: number, r: number, desde: number, hasta: number): string {
  const punto = (grados: number) => {
    const rad = ((grados - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const a = punto(desde)
  const b = punto(hasta)
  const largo = hasta - desde > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largo} 1 ${b.x} ${b.y}`
}

/* ── UN DEDO ──────────────────────────────────────────────────────────────
 * Componente propio para que **cada uno tenga su propio shared value** y
 * pueda entrar escalonado sin que la pieza guarde estado. */
function Dedo({
  atajo,
  indice,
  abierta,
  escalona,
  onRazonApagado,
  onCerrar,
}: {
  atajo: AtajoCoach
  indice: number
  abierta: boolean
  escalona: boolean
  onRazonApagado?: (razon: string) => void
  onCerrar: () => void
}) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()
  const entrada = useSharedValue(0)
  const pos = POSICIONES_DEDOS[indice]
  const apagado = atajo.razonApagado !== undefined

  useEffect(() => {
    if (!escalona) {
      /* Sin escalonado la huella **abre igual**: el movimiento adorna, no
         produce. *Una huella que no se dibuja con reduce-motion sería una
         función perdida, no una animación apagada.* */
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
    transform: [
      /* `-dy` porque en la geometría `y` sube y en el layout baja. La
         traducción vive acá, una sola vez. */
      { translateY: -pos.dy * entrada.value },
      { scale: 0.7 + entrada.value * 0.3 },
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          alignItems: 'center',
          left: pos.dx - DEDO / 2,
          /* 🔴 **`-DEDO/2` para que el CENTRO del círculo caiga en el punto
             que `centroDedo` promete.** Con `bottom: 0` el que caía ahí era
             su BORDE, y el arnés habría medido una geometría que la pantalla
             no dibuja — *el instrumento diciendo la verdad sobre otra cosa.* */
          bottom: -DEDO / 2,
        },
        estilo,
      ]}
    >
      {/* La pastilla va ENCIMA del dedo. **Arriba y no abajo** porque debajo
          está la almohadilla: una etiqueta ahí se pisaría con la voz. */}
      <View
        style={{
          marginBottom: spacing[1],
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[0.5],
          borderRadius: radius.full,
          backgroundColor: theme.bg.card,
        }}
      >
        {/* Sobre una superficie de la casa ⇒ la pieza del sistema, con su
            receta intacta: acá no hace falta forzar nada. */}
        <Texto variante="dato">{atajo.etiqueta}</Texto>
      </View>
      <Animated.View style={estiloPresionado}>
        <Pressable
          {...handlers}
          accessibilityRole="button"
          accessibilityLabel={atajo.etiqueta}
          accessibilityState={{ disabled: apagado }}
          accessibilityHint={atajo.razonApagado}
          onPress={() => {
            /* 🔴 **El apagado NO es mudo.** Dice su razón y NO cierra la
               huella: *cerrar sería castigar el toque con la desaparición de
               lo que se acaba de explicar.* */
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
          {/* 🔴 **`montaje="control"` VA SIEMPRE Y NO ES PROP DE NADIE.**
              Los cuatro dedos son ACTOS, y `N27` es sobre el contexto: un
              glifo adentro de un botón no lleva huella. Lo decide la pieza,
              no la pantalla — *si el consumidor pudiera elegirlo, la ley
              sería una sugerencia* (Ley 8).
              ⚠️ Y esto **no toca cómo se dibuja el glifo en el resto de la
              app**: `vacuna` sigue llevando su huella en el carnet, en la
              línea de vida y en donde viva. Acá pierde la marca de mascota
              porque acá es un acto, no un hecho. */}
          <Icono nombre={atajo.icono} tamano={24} registro="tinta" montaje="control" />
        </Pressable>
      </Animated.View>
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
  const viaje = useSharedValue(0)

  useEffect(() => {
    const d = quieta ? 0 : abierta ? motion.coach.viajeMs : motion.coach.cierreMs
    velo.value = withTiming(abierta ? 1 : 0, { duration: quieta ? 0 : motion.coach.fundidoMs })
    viaje.value = withTiming(abierta ? 1 : 0, {
      duration: d,
      easing: Easing.bezier(...motion.coach.viajeBezier),
    })
  }, [abierta, quieta, velo, viaje])

  const estiloVelo = useAnimatedStyle(() => ({ opacity: velo.value }))
  /* El orbe viaja de su esquina al centro inferior, y crece. La distancia
     depende del ancho real de la pantalla: **se calcula, no se teclea.** */
  const desplazamiento = desplazamientoAlCentro(width)
  const ascenso = ascensoAlDespertar(aireInferior)
  const estiloOrbe = useAnimatedStyle(() => ({
    transform: [
      { translateX: -desplazamiento * viaje.value },
      { translateY: -ascenso * viaje.value },
      { scale: 1 + (ALMOHADILLA / ORBE - 1) * viaje.value },
    ],
  }))

  /* ⛔ MEMORIAL: la presencia no existe. Ver la cabecera del archivo. */
  if (esMemorial) return null

  /* El ARCO es gráfica fina sobre el papel ⇒ hex puro de capa, como todo
     glifo de la casa. */
  const colorDe = (c: ClaseCoach): string =>
    c === 'chat' ? theme.capa.comunidad : c === 'pedidos' ? theme.status.warning : palette.coachMedio

  /* 🔴 **LA PASTILLA NO PUEDE USAR EL COLOR DEL ARCO, Y ESO LO DIJO EL GATE.**
     Con relleno pleno y letra blanca: magenta puro **3,58** · ocre **1,89**,
     contra un piso de 4,5. *Un arco de 3 px y una pastilla con texto adentro
     no son el mismo trabajo, y el mismo hex no sirve para los dos.*

     Cada color trae su par legible **de la casa, no inventado acá**:
     · chat → `magentaSerie`, que es el REGISTRO TRABAJADOR del magenta y
       nació justo para esto (blanco encima = **5,70**). El puro `#FF00AF`
       queda intacto en su reserva de marca, que es lo que su token pide.
     · pedidos → ocre pleno con letra TINTA (**8,98**) — el par exacto que
       `R56` ya tiene medido y firmado para el ocre del cliente.

     ⚠️ **Que las dos letras no sean del mismo color no es una incoherencia:**
     es la casa diciendo que cada relleno tiene su letra. Uniformarlas habría
     dejado una de las dos por debajo del piso. */
  const pastilla = (c: 'chat' | 'pedidos'): { fondo: string; letra: string } =>
    c === 'chat'
      ? { fondo: palette.magentaSerie, letra: theme.text.inverse }
      : { fondo: theme.status.warning, letra: theme.text.primary }

  /* Los arcos son del estado ATENTO y de ningún otro: dormida no los tiene
     (§2.1) y abierta ya dice sus números en las pastillas. */
  const movimiento = movimientoCoach({ quieta, abierta })
  const arcos = estado === 'atenta' ? arcosDe(pendientes) : []
  const pastillas = pastillasDe(pendientes)

  const ancla = anclaOrbe(width, aireInferior)
  const centro = centroAlmohadilla(width, aireInferior)

  return (
    <View
      /* Cerrada, **no intercepta nada**: `box-none` deja pasar todo lo que no
         toque un hijo. Abierta, el captador de abajo toma la pantalla. */
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

          {/* Los dedos y la voz, anclados al centro de la almohadilla. */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: centro.x,
              bottom: centro.abajo,
              width: 0,
              alignItems: 'center',
            }}
          >
            {atajos.map((a, i) => (
              <Dedo
                key={a.id}
                atajo={a}
                indice={i}
                abierta={abierta}
                escalona={movimiento.escalona}
                onRazonApagado={onRazonApagado}
                onCerrar={onCerrar}
              />
            ))}

            {pastillas.map((p) => (
              <Pressable
                key={p.clase}
                accessibilityRole="button"
                accessibilityLabel={p.clase === 'chat' ? voz.chat : voz.pedidos}
                onPress={() => {
                  onCerrar()
                  onPendiente(p.clase)
                }}
                style={{
                  position: 'absolute',
                  [p.lado === 'izquierda' ? 'right' : 'left']: ALMOHADILLA / 2 + spacing[3],
                  bottom: 0,
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: spacing[3],
                  borderRadius: radius.full,
                  backgroundColor: pastilla(p.clase).fondo,
                }}
              >
                <Text style={sobreVelo(ETIQUETA, pastilla(p.clase).letra)}>
                  {p.clase === 'chat' ? voz.chat : voz.pedidos}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voz.preguntar}
            onPress={onPreguntar}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: spacing[5] + aireInferior + (ALTO_VOZ - 44) / 2,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            {/* 🔴 **LA VOZ NO VA SOBRE EL VELO DESNUDO — MEDIDO, no supuesto.**
                Blanco sobre el velo al 42 % da **3,15:1 con papel claro
                debajo**, contra un piso de 4,5 para texto. Sobre papel oscuro
                da 19,58 ⇒ *el defecto sólo existe en la casa del cliente, que
                es justamente donde vive esta pieza.*

                **No se subió el velo** —el 42 % lo dictó el founder y es lo
                que se va a mirar en el teléfono— **y no se dejó el texto
                flojo**: se le da superficie, que además es lo que la casa ya
                hace. *La Hoja corre su scrim al 40 % desde S53 y nunca puso
                texto encima: el contenido va sobre la Hoja.* Acá la pastilla
                de tinta es esa Hoja en chico. */}
            <View
              style={{
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1.5],
                borderRadius: radius.full,
                backgroundColor: theme.bg.tinta,
              }}
            >
              <Text style={sobreVelo(VOZ, theme.text.inverse)}>{voz.preguntar}</Text>
            </View>
          </Pressable>
        </>
      ) : null}

      {/* El orbe. Es el MISMO cuerpo abierto y cerrado: viaja y crece, no
          desaparece para que nazca otro. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            /* 🔴 **`anclaOrbe` promete dónde queda el ORBE; la caja mide el
               HALO.** Sin restar la diferencia, el aro tenue empujaría al
               cuerpo hacia adentro y el orbe quedaría a 29 del borde en vez
               de a 20 — *el arnés seguiría verde midiendo una promesa que la
               pantalla no cumple.* El halo desborda parejo para los dos
               lados, que es lo que un resplandor hace. */
            left: ancla.izquierda - (HALO - ORBE) / 2,
            bottom: ancla.abajo - (HALO - ORBE) / 2,
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
            onPress={abierta ? onCerrar : onAbrir}
            style={{ width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center' }}
          >
            <Orbe
              tamano={ORBE}
              violeta={abierta || estado === 'despierta' || estado === 'hablando'}
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
