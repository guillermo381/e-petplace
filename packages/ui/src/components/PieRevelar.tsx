/**
 * PieRevelar — revelar el resto de una sección (S71-A3, componente 60).
 *
 * D-454 DISPARADA: el trabajo "revelar lo que ya está en memoria" vivía
 * TRES veces con tres vestidos — `citas/[mascotaId]` (Boton secundario
 * bloque), `hogar/paseos` (Boton compacto sm) y los dos pies de la jornada
 * del prestador (B1). El Hogar v2 era el cuarto consumidor: tercera copia
 * prohibida, el componente nace (entrada 19.6 del diccionario, firmada en
 * gate S71-B1; el componente esperaba su disparo).
 *
 * QUÉ ES: el control canónico al PIE de una sección truncada o plegada —
 * `Boton compacto` centrado cuya etiqueta DICE EL NÚMERO ("Ver 5 más"),
 * jamás un "Ver más" mudo. Con `revelado`, la etiqueta pasa a "Ocultar"
 * (el pliegue de vuelta es el mismo control, mismo lugar).
 *
 * QUÉ NO ES:
 *  · Paginación (traer datos que NO están): eso es el pie de `LineaDeVida`
 *    con su cursor. PieRevelar jamás carga — solo muestra lo ya cargado.
 *  · Abrir un compuesto en sus partes (`FilaSalida`): otro trabajo.
 *
 * Con n === 0 y sin `revelado` NO SE DIBUJA (nada que revelar = nada
 * apagado — regla de existencia). La voz vive en el namespace ui
 * ("Ver {{n}} más": forma neutra a propósito — la etiqueta con artículo
 * obligaría a un género por consumidor; keys al lote de gate founder).
 *
 * ESCALERA (§4b): no aplica — no muestra datos del expediente; es el
 * control de una sección que ya los mostró.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { useTraduccionUi } from '../i18n'

export type PieRevelarProps = {
  /** Cuántos ítems quedan por revelar. 0 sin `revelado` = no se dibuja. */
  n: number
  onPress: () => void
  /** La sección ya está revelada: la etiqueta pasa a "Ocultar". */
  revelado?: boolean
}

export function PieRevelar({ n, onPress, revelado = false }: PieRevelarProps) {
  const { t } = useTraduccionUi()

  if (n <= 0 && !revelado) return null

  return (
    <View style={{ alignItems: 'center' }}>
      <Boton
        variante="compacto"
        tamaño="sm"
        etiqueta={revelado ? t('pieRevelar.ocultar') : t('pieRevelar.ver', { n })}
        onPress={onPress}
      />
    </View>
  )
}
