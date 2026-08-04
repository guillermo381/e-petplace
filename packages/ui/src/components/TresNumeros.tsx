/**
 * TresNumeros — EL BLOQUE DE CIFRAS DEL TECHO (S85-B26).
 *
 * Nace del gate del founder sobre 019fcabf: los tres números salían
 * DESORDENADOS. Su referencia, con sus palabras: *tres columnas
 * centradas, valor grande arriba en blanco, rótulo abajo en mayúsculas
 * pequeñas y apagadas, todo dentro de un bloque con su propia
 * superficie.*
 *
 * ── EL CONTRATO TIENE DOS FORMAS DE COLUMNA, Y ESA ES LA PIEZA ───────
 * La anatomía que él pidió es «valor + rótulo». Pero C había resuelto
 * esto con UNA LÍNEA por columna, y su razón está documentada y es
 * buena: **cuando la plata no es visible, ese hueco dice una FRASE (un
 * permiso), no un número con rótulo.** Un layout de valor+rótulo obliga
 * a inventar un valor para el caso sin valor — y un valor inventado, o
 * un hueco vacío, **se lee como CERO**, que es justo lo que §2.4bis
 * prohíbe.
 *
 * Así que la pieza acepta las dos y NO deja elegir mal:
 *   · `{ valor, rotulo }` — el caso normal, la anatomía del founder.
 *   · `{ frase }`         — el hueco que HABLA: ocupa la columna sin
 *                           fingir una cifra. Sin valor grande arriba,
 *                           porque no hay valor.
 * El tipo hace imposible pasar un `valor` vacío: si no hay número, no
 * hay campo donde ponerlo.
 *
 * ⚠️ «APAGADO» NO SE HACE CON OPACIDAD ACÁ, y no es una licencia: sobre
 * el muro **la opacidad muere** (regla S61, medida por C en este mismo
 * techo). El rótulo se apaga con ESCALA y CAJA —más chico, mayúsculas,
 * espaciado— y conserva el papel PLENO. Es el mismo resultado por otro
 * canal, que es lo que se hace cuando un canal está agotado.
 *
 * La superficie sale de `palette.vidrioOficio`, que trae su medición:
 * papel pleno encima da 7.37 AA.
 */

import { Text, View } from 'react-native'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'

export type ColumnaTecho =
  | { valor: string; rotulo: string; detalle?: string }
  | { frase: string; detalle?: string }

export interface TresNumerosProps {
  /** SIEMPRE tres, siempre en su orden — el tipo lo exige. */
  columnas: [ColumnaTecho, ColumnaTecho, ColumnaTecho]
}

export function TresNumeros({ columnas }: TresNumerosProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: radius.suave,
        backgroundColor: palette.vidrioOficio,
        paddingVertical: spacing[2.5],
        paddingHorizontal: spacing[2],
      }}
    >
      {columnas.map((c, i) => (
        <View
          key={i}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[0.5] }}
          accessibilityLabel={c.detalle}
        >
          {'valor' in c ? (
            <>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.family.sans.medium,
                  /* 🔴 S85-B28 · ERA `xl` (28) — EXACTAMENTE el mismo
                     cuerpo que `Texto variante="titulo"`, o sea que el
                     número competía de igual a igual con EL NOMBRE DEL
                     NEGOCIO, que es la identidad de la pantalla. El
                     founder lo dijo sin ambigüedad: «muy grandes, no están
                     proporcionales». Baja a `md` (18): sigue siendo lo más
                     grande del bloque —manda dentro de su caja— y deja de
                     disputarle la pantalla al nombre. La jerarquía no es
                     el tamaño absoluto: es la distancia al vecino. */
                  fontSize: typography.size.md,
                  color: palette.light0,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {c.valor}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.xs,
                  color: palette.light0,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {c.rotulo}
              </Text>
            </>
          ) : (
            /* EL HUECO QUE HABLA: sin valor grande, porque no hay valor.
               Vive en el registro del RÓTULO —no en el del número— para
               que no se lea como una cifra que no se pudo leer. */
            <Text
              numberOfLines={2}
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.xs,
                color: palette.light0,
                textAlign: 'center',
              }}
            >
              {c.frase}
            </Text>
          )}
        </View>
      ))}
    </View>
  )
}
