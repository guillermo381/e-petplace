/**
 * CodigoAEscala — EL CÓDIGO QUE SE LEE A TRAVÉS DE UN MOSTRADOR.
 *
 * Pedido de C con dos consumidores ya nombrados, que es lo que la Regla
 * de las Piezas pide para que algo suba: **el código de reclamo de la
 * venta de mostrador** (decisión ③ del arranque: se muestra en
 * `e-PetPlace Negocios` y el vet lo copia a su factura) y **el código de
 * la puerta** que la familia dice al repartidor (`obtenerCodigoEntrega`,
 * el lector de D). *Nace con dos casas, no con una.*
 *
 * ── POR QUÉ NO ALCANZABA `Texto` ──────────────────────────────────────
 * `Texto variante="dato"` es mono de **13** — la metadata chica de la
 * Ley 3. Este código se lee **a un metro de distancia y en voz alta**, y
 * `Texto` **no tiene escotilla de tamaño a propósito** (su JSDoc lo dice:
 * sin prop `style`, para que la jerarquía no se re-decida por pantalla).
 * Sin esta pieza, C estaba componiéndolo con `variante="titulo"` — que es
 * **sans**, o sea la Ley 3 rota para conseguir el tamaño. *El desvío no
 * era de C: era el hueco del sistema, y C lo declaró en vez de taparlo.*
 *
 * ── LA REGLA DE VOZ, EN SU EXCEPCIÓN FIRMADA ───────────────────────────
 * La Ley 3 manda mono para metadata CHICA y, **a escala display, el dato
 * viste DM Sans** (matiz S53, la fila hero de Vitales). **Acá NO aplica
 * esa excepción, y la razón es funcional y no estética: este dato se
 * TRANSCRIBE y se DICTA.** Un código en sans confunde 0/O y 1/l/I; el
 * mono existe justamente para que no pase. *La excepción display nació
 * para números que se LEEN de un vistazo (un total, un contador); ésta es
 * la familia de datos que se COPIA — y ahí el mono es la herramienta, no
 * el traje.* Se declara acá porque es un desvío del matiz y no se deduce.
 *
 * ── LA A11Y ES LA MITAD DE LA PIEZA ────────────────────────────────────
 * El label lee el código **dígito a dígito** (`"8 7 6 5 4 3 2 1"`): un
 * lector de pantalla que dice "ochenta y siete millones..." es inútil
 * para alguien que tiene que repetirlo en una puerta. Es el mismo
 * problema que el visual resuelve con mono, en el otro canal.
 *
 * ── AGRUPADO, y por qué es del DATO y no de la pieza ───────────────────
 * Si el código viene con guiones o espacios, **se respetan**: la pieza no
 * los inventa ni los quita. *Agrupar de a 4 un código de 6 es fabricar
 * una estructura que el emisor no le dio, y el día que alguien lo dicte
 * va a dictar los grupos equivocados.*
 *
 * `seleccionable` viene de fábrica: un código que no se puede copiar
 * obliga a transcribir a mano, que es donde nacen los errores.
 * Presentacional puro, sin interacción — no es un botón.
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { Text } from 'react-native'

export type CodigoAEscalaProps = {
  /** El código, tal como lo emitió el motor. Sus separadores se respetan. */
  codigo: string
  /** Rótulo arriba, voz de la casa: "Código de la puerta". */
  etiqueta?: string
  /** Ya formateado por el riel: "vence el 12 de noviembre". */
  expira?: string
}

export function CodigoAEscala({ codigo, etiqueta, expira }: CodigoAEscalaProps) {
  const { theme } = useTheme()

  // Dígito a dígito para el lector de pantalla. Los separadores no se
  // leen: quien escucha necesita los caracteres, no la puntuación.
  const deletreado = codigo.replace(/[\s-]/g, '').split('').join(' ')

  return (
    <View style={{ gap: spacing[1] }}>
      {etiqueta === undefined ? null : <Texto variante="apoyo">{etiqueta}</Texto>}
      <Text
        accessible
        accessibilityLabel={deletreado}
        selectable
        style={{
          fontFamily: typography.family.mono.regular,
          // `2xl` es escala de lectura a distancia. El mono se conserva
          // A PROPÓSITO — ver la excepción declarada en el encabezado.
          fontSize: typography.size['2xl'],
          fontVariant: ['tabular-nums'],
          color: theme.text.primary,
        }}
      >
        {codigo}
      </Text>
      {expira === undefined ? null : <Texto variante="apoyo">{expira}</Texto>}
    </View>
  )
}
