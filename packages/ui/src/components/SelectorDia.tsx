/**
 * SelectorDia — LA RUEDA DE DÍAS (D3).
 *
 * PROMOVIDA desde `apps/cliente/src/components/reserva-piezas.tsx` en
 * S85-B8, por LA REGLA DE LAS PIEZAS: apareció el segundo consumidor (el
 * bloque «Tu día» de la portada del prestador). Era un override LOCAL del
 * cliente declarado como tal, con su promoción escrita como trabajo de B
 * post-gate. Esto es esa promoción.
 *
 * ⚠️ SU FÍSICA ESTÁ FIRMADA Y NO SE RECALIBRA. Los números salieron de un
 * gate en dispositivo (S82-C r12) y viajaron VERBATIM: no son preferencias
 * de esta pieza y no se tocan sin otro gate. Se listan acá porque el
 * consumidor no los elige y quien los cambie tiene que saber qué está
 * cambiando:
 *   · ítem 66 · paso 76 · separación = paso − ítem = 10
 *   · escalas por anillo  1.16 / 0.94 / 0.84 / 0.78
 *   · opacidades por anillo  1 / .62 / .34 / .18
 *   · 520 ms con cubic-bezier(.32, .72, 0, 1) — la curva de la casa
 *   · el elegido SIEMPRE centrado (translateX)
 *
 * EL IMÁN, que es lo que la hace rueda: hasta r11 solo respondía al clic,
 * que es MEDIA rueda — el gesto es la otra mitad. Al soltar cae al día más
 * cercano y JAMÁS queda entre dos, con la misma curva y duración firmadas.
 *
 * POR QUÉ ESCALA, OPACIDAD Y ACENTO VIVEN EN UN WORKLET y no en estado de
 * React, que es el detalle que se rompe al portarla: durante el arrastre
 * el estado NO cambia hasta soltar (`runOnJS` va en `onEnd`), así que
 * cualquier cosa atada a React llega TARDE. El anillo se recalcula en el
 * hilo de UI contra `indiceVivo` y el decaimiento es continuo mientras el
 * dedo arrastra, cayendo exacto en la calibración al soltar. El color del
 * número viaja en ESE mismo worklet por la misma razón — si el acento
 * fuera de React, el número se pintaría después del movimiento.
 *
 * CADA CASA LA VISTE CON SU TEMA, sin ramas: la superficie del día sale de
 * `bg.card` + `elevacion.reposo` y el acento del número de
 * `accent.control`, que se resuelve POR CASA desde S83-B17 (magentaDark /
 * violetText en el cliente · tealDark / teal puro en el prestador, R27 lo
 * vigila). En memorial degrada SOLO, sin rama propia: ahí `accent.control`
 * ES la tinta (Ley 8).
 *
 * ⚠️ GATE ABIERTO, declarado: el COLOR DE LA SUPERFICIE de los días —el
 * "techo" de la rueda— nunca se firmó en el prestador, porque hasta hoy la
 * rueda no vivía ahí. Resuelve de `bg.card` como en el cliente; si en la
 * casa del oficio pide otra cosa, es firma del founder sobre pantalla y
 * una línea acá. Ahora es gateable en LAS DOS casas.
 */

import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import { Texto } from './Texto'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type DiaOpcion = { iso: string; dia: string; numero: string }

const CURVA_D3 = Easing.bezier(0.32, 0.72, 0, 1)

/** LA CALIBRACIÓN FIRMADA. No se toca sin gate — ver el encabezado. */
const D3 = {
  item: 66,
  paso: 76,
  escalas: [1.16, 0.94, 0.84, 0.78],
  opacidades: [1, 0.62, 0.34, 0.18],
  duracion: 520,
} as const

function RuedaDias({
  dias,
  elegido,
  cerrados,
  onElegir,
}: {
  dias: DiaOpcion[]
  elegido: string
  cerrados: ReadonlyMap<string, string>
  onElegir: (iso: string) => void
}) {
  const { theme } = useTheme()
  const [ancho, setAncho] = useState(0)
  const indice = Math.max(0, dias.findIndex((d) => d.iso === elegido))
  // `centro` = el desplazamiento que deja al elegido en el medio.
  const centro = (i: number) => ancho / 2 - D3.item / 2 - i * D3.paso
  const desplaz = useSharedValue(0)
  const inicioPan = useSharedValue(0)
  // el índice VIVO durante el arrastre (para que escalas y opacidades
  // sigan al dedo, no al estado de React)
  const indiceVivo = useSharedValue(indice)

  /** 🔴 S98-B · REDUCE-MOTION — acá la cura NO es «no te muevas», y ésa
   *  es la parte que hay que leer antes de tocar: **el desplazamiento de
   *  esta rueda es FUNCIONAL** —centra el día elegido—, así que apagarlo
   *  no reduce movimiento: rompe la pieza.
   *
   *  Lo que se apaga es el VIAJE, no el destino: con la preferencia
   *  activada la rueda **salta** a su lugar en vez de deslizarse hasta
   *  él. Mismo estado final, mismo centrado, cero recorrido — que es
   *  exactamente lo que la preferencia pide y lo que hacen las ruedas
   *  nativas. *La distinción es la misma de `Entrada`: quitarle el viaje,
   *  no el momento.*
   *
   *  El arrastre con el dedo NO se toca: eso es manipulación directa —el
   *  contenido sigue al dedo— y no es animación autónoma. Lo que sí cae
   *  bajo la preferencia es el IMÁN del final, que se mueve solo. */
  const reduceMotion = useReducedMotion()
  const durSnap = reduceMotion ? 0 : D3.duracion

  useEffect(() => {
    if (ancho === 0) return
    indiceVivo.value = indice
    desplaz.value = withTiming(centro(indice), { duration: durSnap, easing: CURVA_D3 })
  }, [indice, ancho, durSnap])

  // el día CERRADO se elige igual — y es a propósito. Ver la nota de
  // `cerrados` en SelectorDia: un día apagado y mudo es el bug que esto
  // viene a curar, no la cura.
  const elegirPorIndice = (i: number) => {
    const d = dias[i]
    if (d !== undefined) onElegir(d.iso)
  }

  /** EL IMÁN: al soltar, la rueda cae al día más cercano — jamás queda
   *  entre dos. El snap usa la MISMA curva y duración firmadas. */
  const pan = Gesture.Pan()
    .onBegin(() => {
      inicioPan.value = desplaz.value
    })
    .onUpdate((e) => {
      desplaz.value = inicioPan.value + e.translationX
      const i = Math.round((ancho / 2 - D3.item / 2 - desplaz.value) / D3.paso)
      indiceVivo.value = Math.min(Math.max(i, 0), dias.length - 1)
    })
    .onEnd(() => {
      const crudo = (ancho / 2 - D3.item / 2 - desplaz.value) / D3.paso
      const i = Math.min(Math.max(Math.round(crudo), 0), dias.length - 1)
      indiceVivo.value = i
      // EL IMÁN: se mueve SOLO después de que soltás, así que entra bajo
      // la preferencia (a diferencia del arrastre, que sigue al dedo).
      desplaz.value = withTiming(ancho / 2 - D3.item / 2 - i * D3.paso, {
        duration: durSnap,
        easing: CURVA_D3,
      })
      runOnJS(elegirPorIndice)(i)
    })

  const pista = useAnimatedStyle(() => ({ transform: [{ translateX: desplaz.value }] }))

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        style={{ height: 96, justifyContent: 'center', overflow: 'hidden' }}
      >
        <Animated.View style={[{ flexDirection: 'row', gap: D3.paso - D3.item }, pista]}>
          {dias.map((d, i) => (
            <ItemRueda
              key={d.iso}
              dia={d}
              indice={i}
              indiceVivo={indiceVivo}
              motivoCerrado={cerrados.get(d.iso)}
              onPress={() => elegirPorIndice(i)}
              superficie={theme.bg.card}
              sombra={theme.elevacion.reposo}
              acento={theme.accent.control}
              tinta={theme.text.primary}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

/** Un día de la rueda. Escala, opacidad y ACENTO siguen al dedo (worklet
 *  sobre `indiceVivo`), no al estado de React. */
function ItemRueda({
  dia,
  indice,
  indiceVivo,
  motivoCerrado,
  onPress,
  superficie,
  sombra,
  acento,
  tinta,
}: {
  dia: DiaOpcion
  indice: number
  indiceVivo: SharedValue<number>
  /** El POR QUÉ de este día cerrado. `undefined` = el día está abierto.
   *  **Un solo campo dice las dos cosas** — ver la nota del contrato. */
  motivoCerrado: string | undefined
  onPress: () => void
  /** Colores YA resueltos (el worklet no puede leer el tema). */
  superficie: string
  sombra: string
  acento: string
  tinta: string
  /* (la voz de cerrado viaja en `motivoCerrado`)
   *  pero un lector no ve opacidades — el estado tiene que DECIRSE. */
}) {
  const vivo = useAnimatedStyle(() => {
    const anillo = Math.min(Math.abs(indice - indiceVivo.value), D3.escalas.length - 1)
    const bajo = Math.floor(anillo)
    const alto = Math.min(bajo + 1, D3.escalas.length - 1)
    const t = anillo - bajo
    // interpolación entre anillos: el decaimiento es continuo mientras el
    // dedo arrastra, y cae exacto en la calibración al soltar
    const escala = D3.escalas[bajo] + (D3.escalas[alto] - D3.escalas[bajo]) * t
    const opacidad = D3.opacidades[bajo] + (D3.opacidades[alto] - D3.opacidades[bajo]) * t
    return { transform: [{ scale: escala }], opacity: motivoCerrado !== undefined ? 0.18 : opacidad }
  })

  /** EL ACENTO DEL DÍA — la letra literal de D3 («el acento queda en el
   *  número»). Va en el MISMO worklet que la escala por comportamiento:
   *  durante el arrastre el estado no cambia hasta soltar, así que un
   *  acento atado a React llegaría TARDE. Memorial degrada solo: ahí
   *  `accent.control` ES la tinta (Ley 8, sin rama propia). */
  const acentoNumero = useAnimatedStyle(() => {
    const anillo = Math.min(Math.abs(indice - indiceVivo.value), 1)
    return { color: interpolateColor(anillo, [0, 1], [acento, tinta]) }
  })

  return (
    <Animated.View style={vivo}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={
          motivoCerrado !== undefined
            ? `${dia.dia} ${dia.numero} · ${motivoCerrado}`
            : `${dia.dia} ${dia.numero}`
        }
        onPress={onPress}
        style={{
          width: D3.item,
          height: 76,
          borderRadius: 22,
          backgroundColor: superficie,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[0.5],
          boxShadow: sombra,
        }}
      >
        <Texto variante="dato">{dia.dia}</Texto>
        {/* EL NÚMERO A SANS con tabular-nums. El mono es dato de MÁQUINA
            (Ley 3) y un día que ELEGÍS es una elección, no un dato leído:
            el traje cambia con el rol. La cifra tabular conserva lo único
            que el mono aportaba acá — que 11 y 22 ocupen lo mismo y la
            rueda no tiemble al pasar. */}
        <Animated.Text
          style={[
            {
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.xl,
              fontVariant: ['tabular-nums'],
            },
            acentoNumero,
          ]}
        >
          {dia.numero}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  )
}

export interface SelectorDiaProps {
  dias: DiaOpcion[]
  elegido: string
  /** Fechas que el negocio declaró CERRADAS.
   *
   *  ⚠️ EL DÍA CERRADO SE PUEDE TOCAR, y es decisión firmada: hasta r14
   *  estaba `disabled`. Un día apagado Y MUDO es exactamente el bug que
   *  este cableado vino a curar — el usuario ve algo gris y no sabe si el
   *  negocio cierra o si nadie configuró. Y el `disabled` hacía
   *  INALCANZABLE la voz que lo explica: el nulo honesto solo se monta
   *  para el día ELEGIDO, y a un día que no se puede elegir no se llega
   *  jamás (L-161 en su forma chica: un gate que no se alcanza no existe).
   *  Ahora el día se toca y la pantalla CONTESTA. Ley 23 sigue en pie: la
   *  puerta no ofrece lo que va a RECHAZAR — acá el toque no se rechaza,
   *  se responde. */
  /**
   * LOS DÍAS CERRADOS, **cada uno con SU porqué** — `iso → motivo`.
   *
   * 🔴 **Era un `Set` con UNA etiqueta para todos, y C midió el costo:**
   * conviven dos causas —*«no abre ese día»* y *«ya la reservaste»*— y con una
   * sola cadena **sólo se podía decir el neutro**: «Cerrado». *Dos hechos
   * distintos contados con la misma palabra.*
   *
   * ⚠️ **Y el día cerrado es MUDO por diseño:** se ve sólo como una opacidad
   * de 0.18, así que **el motivo vive en el `accessibilityLabel`** — el único
   * lugar donde ese día puede explicarse. Con etiqueta única, quien usa lector
   * de pantalla oía «cerrado» sobre un día que él mismo había reservado.
   *
   * **Por qué un `Map` y no `Set` + etiqueta opcional:** con el mapa **«cerrado
   * sin porqué» es inexpresable** —una entrada siempre trae su valor— y las dos
   * props se vuelven una. *Un opcional habría dejado el caso viejo vivo para
   * quien no se acordara.*
   *
   * 🔴 **La pieza NO aprende qué es «no abre»:** recibe el texto de quien la
   * monta, como siempre. Lo que cambió es la granularidad — de uno para todos,
   * a uno por día.
   */
  cerrados?: ReadonlyMap<string, string>
  onElegir: (iso: string) => void
}

export function SelectorDia(props: SelectorDiaProps) {
  const cerrados = props.cerrados ?? new Map<string, string>()
  return (
    <RuedaDias
      dias={props.dias}
      elegido={props.elegido}
      cerrados={cerrados}
      onElegir={props.onElegir}
    />
  )
}
