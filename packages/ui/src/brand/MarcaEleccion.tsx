/**
 * MarcaEleccion — LA PATA QUE PISA LO ELEGIDO (S82, firmada por el
 * founder en tres gates sucesivos).
 *
 * POR QUÉ ES UNA PIEZA Y NO UNA RECETA. La pata ya marca la elección en
 * TRES controles distintos —`FiltroPills`, `FiltroMascotas` y ahora
 * `SelectorSegmentado`— y eso dejó de ser una decisión por pieza: es la
 * gramática de la casa. Una gramática que vive copiada en tres archivos
 * no es una gramática, es tres coincidencias esperando divergir (la
 * lección que costó el pie de reserva en esta misma sesión). El CUARTO
 * control no la reinventa porque no puede: la importa.
 *
 * LA ANATOMÍA, FIRMADA Y CONGELADA ACÁ (los números salieron del gate,
 * no de esta pieza — se mudaron sin tocarse):
 *  · `PATA = 24` — el lado del glifo.
 *  · `MONTA = PATA / 3` — cuánto SE SUBE sobre el canto. Es lo que la
 *    hace pisar: una marca que no monta está al lado, no encima.
 *  · `−14°` — la inclinación. **Algo que se apoya casi nunca cae
 *    recto**, y eso es lo único que la separa de un símbolo centrado.
 *  · huella a `escala 0.95`, offset `0.6` — centrada en su caja de 24.
 *
 * SUS TRES CONDICIONES (la ley, escrita para que el cuarto no invente):
 *  ① aparece SOLO en la elegida — nunca en las demás, nunca "apagada".
 *    Una marca que existe en todas no marca nada.
 *  ② JAMÁS adentro de la placa (R22 la mecaniza): los glifos b′ ya
 *    contienen una huella, y adentro la marca es una huella entre
 *    huellas y deja de señalar. Es HERMANA del contenido, jamás hija.
 *  ③ apoyada sobre el CANTO, montando hacia afuera — de donde sale la
 *    obligación del consumidor: **reservar el aire que la pata invade.**
 *    Un contenedor que recorta a sus bordes la parte por la mitad, y eso
 *    ya pasó una vez (el ScrollView de FiltroPills con paddingTop 4 <
 *    MONTA 8). Por eso `MONTA` se exporta: el aire se calcula, no se
 *    estima.
 *
 * EL COLOR ES DEL CONSUMIDOR y a propósito: la marca habla el acento del
 * control que la porta (hoy `accent.control`, el magenta). La pieza no
 * elige color — si lo eligiera, sería la pieza decidiendo dosis desde
 * adentro, que es justo lo que Ley 4 le prohíbe a un componente.
 */

import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import Svg from 'react-native-svg'

import { motion } from '../tokens/motion'
import { Huella } from './Huella'

/** El lado del glifo, en px. FIRMADO. */
export const PATA = 24
/** Cuánto monta sobre el canto. FIRMADO como PATA/3 — es la relación,
 *  no el número: si la pata cambiara de tamaño, la monta lo acompaña. */
export const MONTA = PATA / 3

export type MarcaEleccionProps = {
  /** El acento del control que la porta (Ley 4: la dosis no se decide acá). */
  color: string
}

export function MarcaEleccion({ color }: MarcaEleccionProps) {
  /* ══════════════════════════════════════════════════════════════════
   *  LA PATA PISA — S116-B. **Hasta hoy APARECÍA, que no es lo mismo.**
   *
   * 🔴 Medido: esta pieza tenía **cero movimiento**. El encargo del lote 2
   * pedía *«el Chip con la pata que pisa (receta S62 para la aparición de
   * la huella)»* y lo que había era un `<View>` que se monta y ya. *Una
   * pata que aparece de golpe no pisó nada: se materializó encima.*
   *
   * LA FÍSICA, y por qué ésta: **entra desde arriba, se pasa, y vuelve.**
   * Un pie que se apoya llega, carga el peso y asienta — el excedente es
   * lo que lo hace leer como PESO y no como aparición. Por eso la escala
   * sobrepasa a `1.12` y vuelve a `1`, y no al revés.
   *
   * ⚠️ **Y VA CON `easeOut`, NO con `spring`, aunque spring sea la curva
   * de la confirmación táctil:** el rebote de la casa (`0.34, 1.56`) hace
   * que la pata OSCILE, y algo que se apoya no rebota — se detiene. *El
   * sobrepaso lo da la secuencia, no la curva; ponerlos juntos da dos
   * rebotes encimados.*
   *
   * ⚠️ **`useReducedMotion`: la pata SIGUE APARECIENDO**, sin escala ni
   * fundido. *La marca de elección es información —dice cuál elegiste— y
   * un estado que sólo se comunica con movimiento es inaccesible.* Lo que
   * se apaga es cómo llega, nunca que esté. */
  const sinMovimiento = useReducedMotion()
  const escala = useSharedValue(sinMovimiento ? 1 : 0.6)
  const opacidad = useSharedValue(sinMovimiento ? 1 : 0)

  useEffect(() => {
    if (sinMovimiento) {
      escala.value = 1
      opacidad.value = 1
      return
    }
    const curva = Easing.bezier(...motion.easing.easeOut.bezier)
    opacidad.value = withTiming(1, { duration: motion.duration.fast, easing: curva })
    escala.value = withSequence(
      withTiming(1.12, { duration: motion.duration.fast, easing: curva }),
      withTiming(1, { duration: motion.duration.fast * 0.6, easing: curva }),
    )
  }, [sinMovimiento, escala, opacidad])

  const estiloPisa = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    /* La rotación firmada VIAJA ACÁ ADENTRO: si quedara en el `style`
       estático, el `transform` animado la pisaría y la pata se enderezaría
       al aparecer — los −14° son parte del dibujo, no del movimiento. */
    transform: [{ rotate: '-14deg' }, { scale: escala.value }],
  }))

  return (
    <Animated.View
      // decorativa: lo que un lector de pantalla anuncia es el `selected`
      // del control, jamás esta marca. Sin esto, el elegido se leería dos
      // veces y una de ellas sin nombre.
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estiloPisa, {
        position: 'absolute',
        top: -MONTA,
        right: -MONTA / 2,
        width: PATA,
        height: PATA,
      }]}
    >
      <Svg width={PATA} height={PATA} viewBox="0 0 24 24">
        <Huella color={color} escala={0.95} x={0.6} y={0.6} />
      </Svg>
    </Animated.View>
  )
}
