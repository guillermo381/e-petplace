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

import { View } from 'react-native'
import Svg from 'react-native-svg'

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
  return (
    <View
      // decorativa: lo que un lector de pantalla anuncia es el `selected`
      // del control, jamás esta marca. Sin esto, el elegido se leería dos
      // veces y una de ellas sin nombre.
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: -MONTA,
        right: -MONTA / 2,
        width: PATA,
        height: PATA,
        transform: [{ rotate: '-14deg' }],
      }}
    >
      <Svg width={PATA} height={PATA} viewBox="0 0 24 24">
        <Huella color={color} escala={0.95} x={0.6} y={0.6} />
      </Svg>
    </View>
  )
}
