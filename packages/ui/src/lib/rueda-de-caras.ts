import { useEffect, useRef, useState } from 'react'
import { Easing, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated'
import { motion } from '../tokens/motion'
import type { EspeciePersonaje } from '../components/Personaje'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **LA RUEDA DE CARAS — una sola, para 00, 02, la onda y la espera larga
 * (S116-B lote 8).**
 *
 * ── POR QUÉ SUBE ACÁ ─────────────────────────────────────────────────
 * La mesa la pidió con esas palabras: *«la misma de 00, 02 y la onda, **sin
 * copiarla**»*. Nació adentro de `OndaAcceso` y ya tenía tres consumidores a
 * la vista. **`N17`**, el mismo movimiento que hicieron `EvitaTeclado` y
 * `EscaleraIconos`.
 *
 * *Y lo que se pierde al copiarla no es código: es la CADENCIA.* Cuatro
 * ruedas escritas aparte giran a cuatro ritmos el día que alguien ajuste
 * una, y **cuatro pantallas de la misma app respirando distinto se lee como
 * que la app está mal hecha**, sin que nada falle.
 *
 * ── LAS DOS CADENCIAS, y son dos decisiones ──────────────────────────
 * **La primera llega al segundo; las siguientes cada tres.** Son tokens
 * separados (`personajePrimeraMs` · `personajeCadaMs`) porque *cuándo
 * arranca la rueda y cada cuánto gira no son la misma pregunta*.
 *
 * ── LO QUE ESTE MÓDULO NO HACE ───────────────────────────────────────
 * **No dibuja.** Devuelve *qué cara toca* y *cuánta opacidad*; quién la
 * monta decide el tamaño, la forma y el fondo. *Una rueda que además
 * dibujara obligaría a las cuatro superficies a verse igual, y no lo son.*
 *
 * ⚠️ **Con `useReducedMotion` la rueda NO ARRANCA:** queda la primera cara,
 * quieta. *Apagar el fundido y dejar el salto sería peor que no moverse — un
 * cambio brusco cada tres segundos es exactamente lo que la preferencia pide
 * evitar.*
 * ═══════════════════════════════════════════════════════════════════════
 */

/** Las seis. **Orden fijo y no sorteado**: una rueda que sortea puede repetir
 *  dos veces seguidas la misma cara, *y eso se lee como que se colgó*. */
export const LAS_SEIS: readonly EspeciePersonaje[] = [
  'perro',
  'gato',
  'conejo',
  'ave',
  'roedor',
  'otro',
] as const

export interface RuedaDeCaras {
  /** La cara de ahora. Nunca `undefined`: con la lista vacía cae a `'otro'`,
   *  que es la especie que esta casa ya usa para «no sé cuál». */
  cara: EspeciePersonaje
  /** Para el fundido cruzado. Quien monta lo aplica donde quiera. */
  opacidad: SharedValue<number>
}

export function useRuedaDeCaras(especies: readonly EspeciePersonaje[] = LAS_SEIS): RuedaDeCaras {
  const sinMovimiento = useReducedMotion()
  const [indice, setIndice] = useState(0)
  const opacidad = useSharedValue(1)
  /* El índice se lee de un ref adentro del reloj y no de la clausura: un
     `setTimeout` capturaría el valor del primer render y la rueda avanzaría
     de 0 a 1 para siempre. */
  const indiceRef = useRef(0)

  useEffect(() => {
    if (sinMovimiento || especies.length < 2) return
    /* **Los relojes se juntan y se apagan TODOS**, no sólo el último: cada
       vuelta arma dos —el cambio de cara a mitad del fundido y la próxima—, y
       un `clearTimeout` sobre una variable deja vivo al otro. *Un timer
       huérfano llamando a `setIndice` sobre una pieza desmontada no rompe
       nada visible y avisa por consola cada tres segundos.* */
    const relojes = new Set<ReturnType<typeof setTimeout>>()
    const enMs = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        relojes.delete(id)
        fn()
      }, ms)
      relojes.add(id)
    }

    /* El fundido CRUZADO con una sola capa: baja a 0 y sube a 1 con el cambio
       de cara en el medio. Montar dos capas apiladas costaría el doble de
       imágenes en memoria por una diferencia que a 500 ms nadie ve. */
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

  return { cara: especies[indice] ?? especies[0] ?? 'otro', opacidad }
}
