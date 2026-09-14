import { useEffect, useState } from 'react'
import { Keyboard, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { spacing } from '../tokens/spacing'
import { LAS_SEIS, useRuedaDeCaras } from '../lib/rueda-de-caras'
import { Personaje, type EspeciePersonaje } from './Personaje'
import { Texto } from './Texto'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **OndaAcceso — LA FRANJA QUE ENTRA POR ABAJO (S116-B lote 5, punto 3).**
 *
 * Firma de la mesa, literal: *«una franja magenta que entra por abajo con
 * el borde superior curvo como una ola suave, de lado a lado. Adentro, a
 * un lado, una frase corta en Baloo blanco de dos líneas; al otro, un
 * círculo blanco con la cara de un personaje, que cambia por fundido
 * cruzado cada tres segundos (la primera al segundo) recorriendo las
 * seis. Se queda por debajo del teclado: cuando el teclado sube, la onda
 * no se aplasta ni salta; desaparece con fundido y vuelve.»*
 *
 * ── POR QUÉ ES PIEZA Y NO EL PIE DE DOS PANTALLAS ─────────────────────
 * Porque tiene **estado propio que corre solo**: una rueda de seis caras
 * con dos cadencias y un fundido cruzado. *Dos pantallas que la dibujen
 * son dos ruedas que se desincronizan* — y peor, dos lugares donde alguien
 * tiene que acordarse de apagarla con `useReducedMotion`.
 *
 * ── LA OLA, Y POR QUÉ ES UN PATH Y NO UN `borderRadius` ───────────────
 * Un radio superior da un DOMO: sube por los dos lados y baja al medio,
 * simétrico. *Una ola tiene dos inflexiones* — sube de un lado y baja del
 * otro— y eso un radio no lo puede expresar. El path va en un `viewBox`
 * de 100 de ancho con `preserveAspectRatio="none"`, así que **la curva se
 * estira con la pantalla en vez de repetirse o recortarse**: la misma ola
 * en un teléfono angosto y en una tablet.
 *
 * ── EL TECLADO: ALTO FIJO + FUNDIDO + DEJAR DE PINTAR ─────────────────
 * **El alto es una constante, no un `flex`.** Ésa es la mitad que impide
 * que se aplaste: una franja que mide `ALTO_ONDA` no se puede comprimir
 * cuando la ventana se achica — se sale de la pantalla, que es otra cosa.
 * **El fundido es la mitad que impide que se vea salir.**
 *
 * 🔴 **Y HACE FALTA UNA TERCERA, que C midió: el fundido no alcanzaba.**
 * Con el teclado arriba quedaban **píxeles magenta a y≈1505-1510**. *Una
 * opacidad que llega a 0 no deja nada visible — salvo que el fundido no
 * llegue a correr, o que lo que se ve no sea esta pieza.* Sea cual sea de
 * las dos, **la cura que cierra las dos puertas es la misma: al terminar
 * el fundido la onda DEJA DE PINTARSE.** Lo que no está dibujado no puede
 * dejar píxeles, y eso no depende de que un listener haya disparado.
 *
 * ⚠️ **Lo que NO cambia es el lugar que ocupa.** El contenedor conserva su
 * alto siempre, pintada o no: *si además se encogiera, el contenido de
 * arriba saltaría al subir el teclado — y «no salta» es de la misma orden
 * que «desaparece».* Se deja de pintar, no de existir.
 *
 * ⚠️ **LO QUE ESTA PIEZA NO PUEDE HACER SOLA, declarado:** si la pantalla
 * la monta dentro de un contenedor con `flex: 1` y reparto, el reparto es
 * de la pantalla y esta constante no lo gobierna. *La pieza garantiza que
 * ella no se encoge; que nadie la encoja desde afuera es del consumidor.*
 *
 * ── LO QUE SE DECLARA Y NO SE DISIMULA ────────────────────────────────
 * La orden dice «la CARA de un personaje» y lo que la casa tiene es el
 * personaje ENTERO (`assets/personajes/*.png`). **Se monta entero dentro
 * del círculo, sin recorte inventado:** recortar a ojo la zona de la cara
 * de seis ilustraciones distintas daría seis encuadres distintos, y el que
 * quede mal no se va a notar hasta que el founder lo vea. Si la mesa
 * quiere cara, el recorte lo decide el ilustrador y entra como asset.
 * ═══════════════════════════════════════════════════════════════════════
 */

/** El alto de la franja, **sin la ola**. La ola se dibuja ENCIMA, así que
 *  el alto total que ocupa la pieza es `ALTO_ONDA + ALTO_OLA` — y por eso
 *  se exporta la suma, que es lo que un consumidor necesita reservar. */
const ALTO_BANDA = 132
/** La cresta. Poca: *«una ola suave»* — con 40 deja de ser una ola y pasa
 *  a ser una montaña. */
const ALTO_OLA = 24
/** Lo que la pieza ocupa de punta a punta. **Se exporta** por el mismo
 *  motivo que `ALTO_CABECERA_RAIZ_FIJO`: quien la monte al pie de una
 *  hoja que scrollea tiene que reservarle el lugar, y ese número no se
 *  teclea dos veces. */
export const ALTO_ONDA_ACCESO = ALTO_BANDA + ALTO_OLA

/* ⏪ **LA RUEDA SALIÓ DE ACÁ (lote 8).** Nació en esta pieza y la mesa la
   pidió compartida con 00, 02 y la espera larga, *«sin copiarla»*: vive en
   `lib/rueda-de-caras.ts` con sus dos cadencias y su regla de orden fijo.
   **Acá no quedó una copia** — lo que se pierde al copiar una rueda no es
   código, es que las cuatro giren al mismo ritmo. */

export interface OndaAccesoProps {
  /** La frase, **ya partida en dos líneas**. Llega partida y no se parte
   *  acá: dónde corta *«Mascotas / más felices»* es una decisión de
   *  redacción, y un `numberOfLines={2}` la tomaría por su cuenta con el
   *  ancho de cada teléfono. */
  frase: [string, string]
  /** De qué lado va el personaje. La frase va del otro. */
  lado: 'izq' | 'der'
  /** Por cuáles rota. Default: **las seis**. Se puede acotar (una pantalla
   *  de gatos rota gatos), y con UNA sola la rueda no arranca — no hay a
   *  dónde ir. */
  especies?: readonly EspeciePersonaje[]
}

export function OndaAcceso({ frase, lado, especies = LAS_SEIS }: OndaAccesoProps) {
/* 🔴 **EL INSET VUELVE A SER EL CRUDO, y el aparato lo decidió (lote 8).**

     ⏪ En el lote 6 lo pasé a derivado (`useInsetQueFalta`) y el founder vio
     en 03 **la franja ENTERA subida, con lienzo a los lados y abajo**. La
     derivación mide *cuánto de la barra queda debajo del contenedor*, y eso
     es lo correcto para un pie que vive DENTRO de un contenedor — **no para
     una franja que tiene que llegar al borde físico**. *Es la misma lección
     que el asistente ya me había cobrado: dos piezas con el mismo síntoma no
     tienen por qué tener la misma cura.*

     La orden es literal y no admite interpretación: *«la franja magenta llega
     hasta los bordes y hasta el fondo, PINTADA; lo único que se aparta de las
     teclas es el CONTENIDO»*. ⇒ el inset **empuja el contenido** y no mueve
     un píxel del color. */
  const insets = useSafeAreaInsets()
  const insetInferior = insets.bottom
  const { cara, opacidad } = useRuedaDeCaras(especies)

  /* ── EL TECLADO ────────────────────────────────────────────────────
     `Keyboard` y no `useAnimatedKeyboard`: la segunda está bajo sospecha
     en esta casa desde `SuperficieChat` (ver su cabecera) y acá no hace
     falta seguir el teclado píxel a píxel — sólo saber si está. */
  const visible = useSharedValue(1)
  const [pintada, setPintada] = useState(true)
  useEffect(() => {
    const dur = motion.duration.fast
    const subio = Keyboard.addListener('keyboardDidShow', () => {
      /* Se deja de pintar CUANDO TERMINA el fundido, no al empezar: apagarla
         de golpe sería el salto que la orden prohíbe. */
      visible.value = withTiming(0, { duration: dur }, (fin) => {
        'worklet'
        if (fin) runOnJS(setPintada)(false)
      })
    })
    const bajo = Keyboard.addListener('keyboardDidHide', () => {
      /* Al revés: primero vuelve a existir —invisible— y recién entonces
         aparece. *Montar y fundir en el mismo frame deja el primer cuadro
         a opacidad 1, que es un parpadeo.* */
      setPintada(true)
      visible.value = 0
      visible.value = withTiming(1, { duration: dur })
    })
    return () => {
      subio.remove()
      bajo.remove()
    }
  }, [visible])

  const estiloCara = useAnimatedStyle(() => ({ opacity: opacidad.value }))
  const estiloOnda = useAnimatedStyle(() => ({ opacity: visible.value }))

  const laCara = (
    <Animated.View style={estiloCara}>
      <Personaje especie={cara} tamano="hogar" forma="circulo" />
    </Animated.View>
  )

  const palabras = (
    <View style={{ flex: 1, gap: spacing[0.5] }}>
      {/* Dos `Texto` y no uno con salto de línea: el interlineado de dos
          líneas de un mismo bloque lo decide la variante, y acá la mesa
          pidió DOS líneas — que sean dos elementos lo hace verdad y no
          una consecuencia del ancho. */}
      <Texto variante="titulo" color="inverso">{frase[0]}</Texto>
      <Texto variante="titulo" color="inverso">{frase[1]}</Texto>
    </View>
  )

  /* El lugar que ocupa, SIEMPRE — pintada o no (ver la cabecera). El inset
     se suma acá y no adentro de la banda: el magenta tiene que llegar al
     filo de la pantalla, y lo que no puede quedar debajo de la barra del
     sistema es el CONTENIDO. */
  const alto = ALTO_ONDA_ACCESO + insetInferior

  /* 🔴 **EL MAGENTA VIVE EN LA RAÍZ, y ésa es la cura de los huecos.**
     Antes el color lo ponían la ola y la banda, cada una en su caja: **todo
     lo que quedara entre ellas o alrededor salía lienzo** —el SVG a 100 %
     deja subpíxeles en los cantos, y cualquier redondeo de alto abre una
     línea abajo—. *Un color que se compone de dos piezas tiene tantas
     junturas como piezas.* Con el fondo en la raíz, **cualquier superficie
     que la onda ocupe es magenta por construcción**, y las junturas dejan de
     poder existir. */
  const fondoDeLaFranja = { height: alto, backgroundColor: palette.magentaAccion }

  if (!pintada) return <View style={fondoDeLaFranja} />

  return (
    <Animated.View
      style={[fondoDeLaFranja, estiloOnda]}
      /* La onda no es un control: no recibe toques ni los roba a lo que
         tenga debajo mientras está desvanecida. */
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height={ALTO_OLA} viewBox="0 0 100 24" preserveAspectRatio="none">
        {/* La ola: sube por la izquierda, baja por la derecha. Las dos
            inflexiones son lo que la distingue de un domo. */}
        <Path d="M0 24 C 18 2, 42 0, 60 9 S 86 22, 100 6 L 100 24 Z" fill={palette.magentaAccion} />
      </Svg>
      <View
        style={{
          height: ALTO_BANDA + insetInferior,
          /* Ley 8: el inset lo pone la pieza, no el consumidor — mismo
             precedente que `Hoja` (S65) y que `PantallaConPie`. Va como
             padding y no como margen para que **el color siga sangrando
             hasta el borde** y sólo el contenido se corra. */
          paddingBottom: insetInferior,
          backgroundColor: palette.magentaAccion,
          flexDirection: lado === 'der' ? 'row' : 'row-reverse',
          alignItems: 'center',
          gap: spacing[4],
          paddingHorizontal: spacing[5],
          /* La banda se pega al borde de abajo: la pantalla no tiene nada
             más allá. El respiro de la barra del sistema lo pone quien la
             monta, que es el que sabe si hay una. */
          marginTop: -1, // el hairline entre el SVG y el bloque, que en Android se ve
        }}
      >
        {palabras}
        {laCara}
      </View>
    </Animated.View>
  )
}
