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
import { usePresionado } from './usePresionado'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import {
  AIRE_BORDE,
  ARCO_GROSOR,
  BRASA,
  DEDO,
  ORBE,
  ORBE_ABIERTO,
  PASTILLA,
  RESPLANDOR,
  SEPARACION,
  alturasDeLaFila,
  anclaOrbe,
  arcosDe,
  ejeDeLaFila,
  movimientoCoach,
  nodosDeLaFila,
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

/* ── EL CUERPO DEL ORBE, EN SVG ───────────────────────────────────────────
 * 🔴 **Dos capas, y la segunda es la que se hacía mal.** El cuerpo es un
 * radial de blanco al lila del borde —*eso* es lo que lo vuelve esfera y no
 * disco— y la brasa es un radial CHICO encima, descentrado.
 *
 * ⏪ Antes era UN solo radial de brasa a perla con `r=54%`: el ocre ocupaba
 * más de medio cuerpo y **el orbe se leía ocre en el teléfono**. *No era el
 * color: era el tamaño.* Ahora la brasa tiene su propio degradé que muere
 * transparente, y su tope está en la geometría con gate propio. */
function CuerpoOrbe({ tamano, violeta }: { tamano: number; violeta: boolean }) {
  const r = tamano / 2
  const idCuerpo = violeta ? 'coachCuerpoVioleta' : 'coachCuerpoPerla'
  return (
    <Svg width={tamano} height={tamano}>
      <Defs>
        {/* ⚠️ Las paradas van como ARRAY y no dentro de un fragmento:
            `RadialGradient` tipa sus hijos como lista de `Stop`, y un `<>`
            los envuelve en un solo nodo. El compilador lo dijo. */}
        <RadialGradient id={idCuerpo} cx="50%" cy="50%" r="50%">
          {(violeta
            ? [
                { o: '0', c: palette.coachClaro },
                { o: '0.6', c: palette.coachMedio },
                { o: '1', c: palette.coachProfundo },
              ]
            : [
                { o: '0', c: palette.coachPerla },
                { o: '1', c: palette.coachPerlaBorde },
              ]
          ).map((p) => (
            <Stop key={p.o} offset={p.o} stopColor={p.c} />
          ))}
        </RadialGradient>
        {/* `r` es la MITAD del diámetro de la brasa: r="20%" ⇒ 40 % del
            cuerpo, que es el tope de §2. El gate lee este número del SVG. */}
        <RadialGradient
          id="coachBrasa"
          cx={`${BRASA.cx * 100}%`}
          cy={`${BRASA.cy * 100}%`}
          r={`${(BRASA.diametro / 2) * 100}%`}
        >
          <Stop offset="0" stopColor={palette.coachBrasa} />
          <Stop offset="1" stopColor={palette.coachBrasaFin} />
        </RadialGradient>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill={`url(#${idCuerpo})`} />
      <Circle cx={r} cy={r} r={r} fill="url(#coachBrasa)" />
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
  const estiloBarrido = useAnimatedStyle(() => ({
    opacity: barrido.value > 0 && barrido.value < 1 ? 1 : 0,
    transform: [
      { rotate: `${motion.coach.barridoAngulo}deg` },
      { translateY: (barrido.value * 2 - 1) * tamano },
    ],
  }))

  /* La caja abraza al cuerpo. **Ya no hay caja de halo**: en reposo el halo es
     el resplandor y nada más (§3). Los arcos, cuando existen, se dibujan
     sobre un lienzo que desborda lo justo para su grosor. */
  const lienzo = tamano + ARCO_GROSOR * 4

  return (
    <Animated.View
      style={[
        { width: lienzo, height: lienzo, alignItems: 'center', justifyContent: 'center' },
        estiloRespiro,
      ]}
    >
      {/* ⛔ EN REPOSO NO HAY LÍNEA. Sin pendientes esto no se monta: *un aro
          fino permanente convierte una presencia en un widget.* */}
      {arcos.length > 0 ? (
        <Svg width={lienzo} height={lienzo} style={{ position: 'absolute' }}>
          {arcos.map((a) => (
            <Path
              key={a.clase}
              d={arcoAPath(lienzo / 2, lienzo / 2, lienzo / 2 - ARCO_GROSOR / 2, a.desde, a.hasta)}
              stroke={colorDe(a.clase)}
              strokeWidth={ARCO_GROSOR}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
      ) : null}

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
        <CuerpoOrbe tamano={tamano} violeta={violeta} />
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
    encendido.value = withTiming(abierta ? 1 : 0, { duration: quieta ? 0 : motion.coach.fundidoMs })
  }, [abierta, quieta, velo, encendido])

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
  const arcos = estado === 'atenta' ? arcosDe(pendientes) : []
  const eje = ejeDeLaFila(width, aireInferior)
  const nodos = nodosDeLaFila(pendientes, atajos.length)
  const alturas = alturasDeLaFila(pendientes, width, aireInferior, atajos.length)
  const ancla = anclaOrbe(width, aireInferior)
  /* `right` del eje: lo que hay entre el eje y el borde derecho. */
  const ejeDesdeDerecha = AIRE_BORDE + ORBE / 2
  const violeta = abierta || estado === 'despierta' || estado === 'hablando'

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
            <React.Fragment key={n.tipo === 'pastilla' ? `p-${n.clase}` : atajos[n.indice].id}>
            {n.tipo === 'pastilla' ? (
              <NodoDeFila indice={i} abierta={abierta} escalona={movimientoCoach({ quieta, abierta }).escalona} centro={alturas[i]} ejeX={ejeDesdeDerecha - PASTILLA / 2}>
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
              </NodoDeFila>
            ) : (
              <NodoDeFila indice={i} abierta={abierta} escalona={movimientoCoach({ quieta, abierta }).escalona} centro={alturas[i]} ejeX={ejeDesdeDerecha - DEDO / 2}>
                <Etiqueta>{atajos[n.indice].etiqueta}</Etiqueta>
                <DedoDeLaFila atajo={atajos[n.indice]} onCerrar={onCerrar} onRazonApagado={onRazonApagado} />
              </NodoDeFila>
            )}
            </React.Fragment>
          ))}

          {/* La etiqueta del ORBE, a su izquierda y a su misma altura. */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                right: ejeDesdeDerecha + ORBE_ABIERTO / 2 + SEPARACION,
                bottom: eje.abajo - 16,
              },
              estiloVelo,
            ]}
          >
            <Pressable accessibilityRole="button" accessibilityLabel={voz.preguntar} onPress={onPreguntar}>
              <Etiqueta>{voz.preguntar}</Etiqueta>
            </Pressable>
          </Animated.View>
        </>
      ) : null}

      {/* El orbe. **No se mueve**: se enciende y crece donde vive. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            /* La caja de arcos desborda; se compensa para que el CUERPO caiga
               donde `anclaOrbe` promete. */
            left: ancla.izquierda - ARCO_GROSOR * 2,
            bottom: ancla.abajo - ARCO_GROSOR * 2,
          },
          estiloOrbe,
        ]}
      >
        <Animated.View style={estiloPresionado}>
          <Pressable
            {...handlers}
            accessibilityRole="button"
            accessibilityLabel={abierta ? voz.preguntar : voz.orbe}
            accessibilityState={{ expanded: abierta }}
            /* 🔴 **Abierta, el orbe abre la HOJA — no cierra la fila.** Cerrar
               es tocar afuera o el botón atrás. *Un mismo toque que a veces
               abre y a veces cierra enseña a no tocarlo.* */
            onPress={abierta ? onPreguntar : onAbrir}
          >
            <Orbe
              tamano={ORBE}
              violeta={violeta}
              arcos={arcos}
              respira={movimientoCoach({ quieta, abierta }).respira}
              barre={movimientoCoach({ quieta, abierta }).barre}
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
