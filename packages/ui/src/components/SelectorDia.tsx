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
import { Pressable, ScrollView, View } from 'react-native'
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
import { llenoDeSeleccion } from './lleno-de-seleccion'
import { radius } from '../tokens/radius'
import { MarcaEleccion } from '../brand/MarcaEleccion'

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
  etiquetaCerrado,
  onElegir,
}: {
  dias: DiaOpcion[]
  elegido: string
  cerrados: Set<string>
  etiquetaCerrado: string
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
              cerrado={cerrados.has(d.iso)}
              onPress={() => elegirPorIndice(i)}
              superficie={theme.bg.card}
              sombra={theme.elevacion.reposo}
              acento={theme.accent.control}
              tinta={theme.text.primary}
              etiquetaCerrado={etiquetaCerrado}
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
  cerrado,
  onPress,
  superficie,
  sombra,
  acento,
  tinta,
  etiquetaCerrado,
}: {
  dia: DiaOpcion
  indice: number
  indiceVivo: SharedValue<number>
  cerrado: boolean
  onPress: () => void
  /** Colores YA resueltos (el worklet no puede leer el tema). */
  superficie: string
  sombra: string
  acento: string
  tinta: string
  /** La voz de "cerrado" para el lector de pantalla: el día apagado se ve,
   *  pero un lector no ve opacidades — el estado tiene que DECIRSE. */
  etiquetaCerrado: string
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
    return { transform: [{ scale: escala }], opacity: cerrado ? 0.18 : opacidad }
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
        accessibilityLabel={cerrado ? `${dia.dia} ${dia.numero} · ${etiquetaCerrado}` : `${dia.dia} ${dia.numero}`}
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


/* ══════════════════════════════════════════════════════════════════════
 *  LA TIRA — LA ANATOMÍA v5 DE ESTE MISMO TRABAJO (S116-B lote 5)
 * ══════════════════════════════════════════════════════════════════════
 *
 * Cuadrados deslizables: el nombre corto arriba, el número en Baloo, el
 * elegido en ciruela con letra blanca y **la pata pisándolo**.
 *
 * ── 🔴 POR QUÉ CONVIVE CON LA RUEDA EN LUGAR DE REEMPLAZARLA ──────────
 * Son **el mismo trabajo** (Ley 19: elegir un día ⇒ UN componente), así que
 * no nace una pieza hermana. Lo que cambia es **de qué casa es la
 * anatomía**, y esa pregunta ya tiene su slot: **`accent.formaV5` — «¿esta
 * casa recibió la geometría del rediseño?»**. Cliente sí, prestador no
 * (letra §5), memorial no (§4).
 *
 * *No es una prop de variante inventada para la ocasión: es la decisión que
 * la casa ya tomó, aplicada donde corresponde.* La consecuencia práctica es
 * la que importa: **los NUEVE montajes vivos —seis del cliente y tres del
 * prestador— no se tocan**, y cada uno recibe la anatomía de su casa.
 *
 * ⚠️ **Y por eso la física firmada de la rueda queda INTACTA.** Sus números
 * salieron de un gate en dispositivo (S82-C r12) y su propia cabecera dice
 * que no se recalibran sin otro gate. Un reemplazo habría cambiado la
 * portada del prestador sin que nadie la mirara.
 *
 * ── EL CERRADO SE VE APAGADO Y **NO SE ELIGE** ────────────────────────
 * ⚠️ **Acá SÍ va `disabled`, y es lo contrario de lo que decidió la rueda.**
 * La rueda lo dejó tocable porque el nulo honesto —la voz que explica por
 * qué no hay— sólo se monta para el día ELEGIDO, así que sin poder elegirlo
 * esa voz era inalcanzable. **En la tira el encargo es explícito**: *«si un
 * día u hora no tiene lugar, se ve apagado y no se elige»*. La contrapartida
 * se declara: quien monte la tira tiene que decir en otro lado por qué ese
 * día no está, porque acá ya no se llega tocándolo. → buzón.
 */
const CUADRO = 60

function TiraDias({
  dias,
  elegido,
  cerrados,
  etiquetaCerrado,
  onElegir,
}: {
  dias: DiaOpcion[]
  elegido: string
  cerrados: Set<string>
  etiquetaCerrado: string
  onElegir: (iso: string) => void
}) {
  const { theme } = useTheme()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}
    >
      {dias.map((d) => {
        const esElegido = d.iso === elegido
        const cerrado = cerrados.has(d.iso)
        return (
          <View key={d.iso} style={{ alignItems: 'center' }}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: esElegido, disabled: cerrado }}
              accessibilityLabel={cerrado ? `${d.dia} ${d.numero}, ${etiquetaCerrado}` : `${d.dia} ${d.numero}`}
              disabled={cerrado}
              onPress={() => onElegir(d.iso)}
              style={{
                width: CUADRO,
                height: CUADRO + spacing[3],
                borderRadius: radius.md,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[0.5],
                backgroundColor: esElegido ? llenoDeSeleccion(theme) : theme.bg.card,
                boxShadow: esElegido ? undefined : theme.elevacion.reposo,
                /* Apagado: **pierde presencia, no forma.** El cuadro sigue
                   entero — lo que falta no es el día, es el lugar. */
                opacity: cerrado ? 0.4 : 1,
              }}
            >
              <Texto variante="apoyo" color={esElegido ? 'sobreControl' : 'tertiary'}>
                {d.dia}
              </Texto>
              {/* 🔴 **EL NÚMERO EN BALOO, y acá SÍ.** La rueda lo puso en
                  sans con tabular-nums *«porque un día que ELEGÍS es una
                  elección, no un dato leído»* — y ese criterio sigue siendo
                  cierto: lo que cambia es que la casa v5 **tiene una voz
                  propia para las cifras** (`escala.cifraChica`, Baloo 22) y
                  no la tenía cuando la rueda se calibró. *La tira no
                  contradice a la rueda: hereda su razón y la dice con la
                  tipografía que ahora existe.* */}
              <Texto variante="dato" color={esElegido ? 'sobreControl' : 'primary'} tabular>
                {d.numero}
              </Texto>
              {/* 🔴 **LA PATA VA ADENTRO DEL CUADRO, no al lado.** La
                  primitiva es `position: 'absolute'` con `top: -MONTA`, o sea
                  que **se posiciona contra su PADRE**: colgada de la columna
                  quedaba flotando arriba de todo, lejos de lo que tiene que
                  pisar. *Lo vio la captura: un puntito suelto en el aire, no
                  una pata apoyada.* Hermana del número, como en `FiltroPills`
                  es hermana del label. */}
              {esElegido ? <MarcaEleccion color={theme.accent.marcaEleccion} /> : null}
            </Pressable>
          </View>
        )
      })}
    </ScrollView>
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
  cerrados?: Set<string>
  /** Cómo se dice "cerrado" — el lector de pantalla no ve opacidades. */
  etiquetaCerrado: string
  onElegir: (iso: string) => void
}

export function SelectorDia(props: SelectorDiaProps) {
  const { theme } = useTheme()
  const cerrados = props.cerrados ?? new Set<string>()
  /* La anatomía la decide LA CASA, no el consumidor (ver la cabecera de
     `TiraDias`). `formaV5` ya es el slot que contesta «¿esta casa recibió
     la geometría del rediseño?». */
  const v5 = 'formaV5' in theme.accent && theme.accent.formaV5 === true
  if (v5) {
    return (
      <TiraDias
        dias={props.dias}
        elegido={props.elegido}
        cerrados={cerrados}
        etiquetaCerrado={props.etiquetaCerrado}
        onElegir={props.onElegir}
      />
    )
  }
  return (
    <RuedaDias
      dias={props.dias}
      elegido={props.elegido}
      cerrados={cerrados}
      etiquetaCerrado={props.etiquetaCerrado}
      onElegir={props.onElegir}
    />
  )
}
