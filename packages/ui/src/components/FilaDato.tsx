/**
 * FilaDato — etiqueta sobre valor (S71-A2, componente 59).
 *
 * POR QUÉ NACE: no existía "campo de solo lectura" en la casa. El hueco
 * estaba DECLARADO en el código —
 * `veterinaria/cita/[citaId].tsx:310`: *"composición local con la casa (no
 * hay componente de 'campo de solo lectura'; Celda es para listas
 * tapeables)"* — y esa nota es exactamente el disparo de Ley 11 que nadie
 * levantó: el comentario documentaba la deuda en vez de pagarla.
 *
 * QUÉ TRABAJO HACE (Ley 19, entrada nueva): mostrar UN dato con su rótulo,
 * sin interacción. No es `Celda` (eso es una fila de lista, tapeable, con
 * su pressed), no es `Campo` (eso se edita). La prueba: si tocarlo no
 * hace nada, es `FilaDato`.
 *
 * ES HERMANO DE `Texto`, NO UNA VARIANTE. Es LAYOUT: dos nodos en una
 * pila. Meterlo como variante de `Texto` habría obligado a ese componente
 * a devolver dos elementos — el primer paso para que la pieza más usada
 * del sistema se vuelva un mini-framework.
 *
 * `mono` es del VALOR, no del rótulo: la etiqueta siempre es humana
 * (`apoyo`), el valor viste de máquina solo cuando LO ES — fechas, horas,
 * importes, códigos (Ley 3). El rótulo jamás va en mono.
 *
 * ESCALERA (§4b): no aplica — no muestra datos del expediente por sí
 * mismo; es el traje de un dato que la pantalla ya resolvió. Un valor
 * ausente NO se dibuja vacío: la pantalla decide si omite la fila o pasa
 * su voz honesta (Ley 13 — el hueco jamás se disfraza de dato).
 *
 * El layout es del padre: sin margin propio, como toda hoja del sistema.
 */

import { View } from 'react-native'
import type { ReactNode } from 'react'

import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

export type FilaDatoProps = {
  /** El rótulo. Siempre voz humana. */
  etiqueta: string
  /** El valor ya resuelto por la pantalla (formateado, nunca crudo). */
  valor: ReactNode
  /** El valor es de máquina (fecha, hora, importe, código). Default: false. */
  mono?: boolean
  /** Truncado del valor. */
  numberOfLines?: number
}

export function FilaDato({ etiqueta, valor, mono = false, numberOfLines }: FilaDatoProps) {
  return (
    <View style={{ gap: spacing[0.5] }}>
      <Texto variante="apoyo">{etiqueta}</Texto>
      {typeof valor === 'string' ? (
        <Texto variante={mono ? 'dato' : 'cuerpo'} color="primary" numberOfLines={numberOfLines}>
          {valor}
        </Texto>
      ) : (
        valor
      )}
    </View>
  )
}
