import { useEffect, useRef, useState } from 'react'
import { Keyboard, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { spacing } from '../tokens/spacing'
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
 * ── EL TECLADO: ALTO FIJO + FUNDIDO, y las dos mitades hacen falta ────
 * **El alto es una constante, no un `flex`.** Ésa es la mitad que impide
 * que se aplaste: una franja que mide `ALTO_ONDA` no se puede comprimir
 * cuando la ventana se achica — se sale de la pantalla, que es otra cosa.
 * **El fundido es la mitad que impide que se vea salir.** Con las dos, el
 * teclado sube y la onda ya no está; baja y vuelve.
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

/** Las seis. Orden fijo y no aleatorio: *una rueda que sortea puede
 *  repetir dos veces seguidas la misma cara, y eso se lee como que se
 *  colgó.* */
const LAS_SEIS: EspeciePersonaje[] = ['perro', 'gato', 'conejo', 'ave', 'roedor', 'otro']

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
  especies?: EspeciePersonaje[]
}

export function OndaAcceso({ frase, lado, especies = LAS_SEIS }: OndaAccesoProps) {
  const sinMovimiento = useReducedMotion()
  const [indice, setIndice] = useState(0)
  const opacidad = useSharedValue(1)
  /* El índice se lee de un ref adentro del intervalo y no de la clausura:
     un `setInterval` capturaría el valor del primer render y la rueda
     avanzaría de 0 a 1 para siempre. */
  const indiceRef = useRef(0)

  /* ── LA RUEDA ──────────────────────────────────────────────────────
     Dos cadencias, y por eso son un `setTimeout` que se re-arma y no un
     `setInterval`: el primero llega al segundo y los siguientes cada
     tres. Con `useReducedMotion` **la rueda no arranca**: queda la
     primera cara, quieta. *Apagar el fundido y dejar el salto sería peor
     que no moverse — un cambio brusco cada tres segundos es exactamente
     lo que la preferencia pide evitar.* */
  useEffect(() => {
    if (sinMovimiento || especies.length < 2) return
    /* **Los relojes se juntan y se apagan TODOS**, no sólo el último: el
       giro arma dos —el cambio de cara a mitad del fundido y la próxima
       vuelta— y un `clearTimeout` sobre una sola variable deja vivo al
       otro. *Un timer huérfano que llama a `setIndice` sobre una pieza
       desmontada no rompe nada visible y avisa por consola una vez cada
       tres segundos.* */
    const relojes = new Set<ReturnType<typeof setTimeout>>()
    const enMs = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        relojes.delete(id)
        fn()
      }, ms)
      relojes.add(id)
    }

    /* El fundido CRUZADO con una sola capa: baja a 0 y sube a 1 con el
       cambio de cara en el medio. La casa no tiene una primitiva de
       crossfade y montar dos capas apiladas costaría el doble de imágenes
       en memoria por una diferencia que a 500 ms nadie ve. */
    const mitad = motion.v5.personajeFundidoMs / 2
    const suave = Easing.bezier(...motion.easing.easeInOut.bezier)

    const girar = () => {
      opacidad.value = withTiming(0, { duration: mitad, easing: suave })
      enMs(mitad, () => {
        indiceRef.current = (indiceRef.current + 1) % especies.length
        setIndice(indiceRef.current)
        opacidad.value = withTiming(1, { duration: mitad, easing: suave })
      })
      enMs(motion.v5.personajeCadaMs, girar)
    }

    enMs(motion.v5.personajePrimeraMs, girar)
    return () => {
      relojes.forEach(clearTimeout)
      relojes.clear()
    }
  }, [sinMovimiento, especies.length, opacidad])

  /* ── EL TECLADO ────────────────────────────────────────────────────
     `Keyboard` y no `useAnimatedKeyboard`: la segunda está bajo sospecha
     en esta casa desde `SuperficieChat` (ver su cabecera) y acá no hace
     falta seguir el teclado píxel a píxel — sólo saber si está. */
  const visible = useSharedValue(1)
  useEffect(() => {
    const dur = motion.duration.fast
    const subio = Keyboard.addListener('keyboardDidShow', () => {
      visible.value = withTiming(0, { duration: dur })
    })
    const bajo = Keyboard.addListener('keyboardDidHide', () => {
      visible.value = withTiming(1, { duration: dur })
    })
    return () => {
      subio.remove()
      bajo.remove()
    }
  }, [visible])

  /* Con la lista vacía la pieza no adivina: cae a `'otro'`, que es la
     especie que esta casa ya usa para «no sé cuál». *Un `especies[0]`
     sobre un arreglo vacío daría `undefined` y `Personaje` reventaría al
     buscar su archivo — y el consumidor que pasó la lista vacía se
     enteraría en el teléfono.* */
  const enRueda: EspeciePersonaje = especies[indice] ?? especies[0] ?? 'otro'

  const estiloCara = useAnimatedStyle(() => ({ opacity: opacidad.value }))
  const estiloOnda = useAnimatedStyle(() => ({ opacity: visible.value }))

  const cara = (
    <Animated.View style={estiloCara}>
      <Personaje especie={enRueda} tamano="hogar" forma="circulo" />
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

  return (
    <Animated.View
      style={estiloOnda}
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
          height: ALTO_BANDA,
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
        {cara}
      </View>
    </Animated.View>
  )
}
