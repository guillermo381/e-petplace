/**
 * FILTROS DE LA LÍNEA DE VIDA — chips por tipo, multi-selección.
 *
 * 🔴 **SIN SCROLL HORIZONTAL: los ocho van en DOS FILAS DECLARADAS.**
 * *Una tira que se desplaza esconde sus últimos chips y no avisa* — el que no
 * sabe que hay más, no arrastra. **Todo lo que existe está a la vista**, y el
 * alto que crece es el precio honesto de eso.
 *
 * ⏪ Antes eran ocho chips y **un `flexWrap` suelto**, o sea *dos filas si el
 * ancho alcanzaba y tres si no*. El reparto de abajo las fija — y de paso es
 * lo que hace **imposible** que un tipo nuevo se cuele sin chip: no es una
 * decoración, es el guard. `flexWrap` se queda **dentro de cada fila**, para
 * que un chip que no entre baje en vez de recortarse: *el reparto dice la
 * intención, el wrap protege del desborde.*
 *
 * ⚠️ **Ninguno seleccionado = TODOS**, y no es un atajo: *un timeline vacío
 * porque nadie tocó un chip se lee como «no pasó nada», que es exactamente lo
 * contrario de lo que pasa.* La pieza no lo decide sola — devuelve el conjunto
 * y la pantalla lo interpreta —, pero su voz lo dice.
 */

import { Pressable, Text, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

/**
 * LOS OCHO DEL VOCABULARIO DE LA MESA.
 *
 * ☠️ **`cuidado` MURIÓ, y no por prolijidad: era un balde.** Adentro caían
 * paseos, estética y adiestramiento —tres oficios distintos, con tres partes
 * distintos— bajo una sola palabra. *Un filtro que junta tres cosas que la
 * familia vivió por separado no filtra: agrupa lo que ella quería separar.*
 * Al darles nombre propio el balde quedó vacío, así que se va con ellos.
 *
 * ⚠️ **Guardería entró como novena por firma del founder**, no por deducción:
 * es el quinto oficio y tiene datos en la base —`foto_guarderia` y las
 * estadías—. *Se declaró como hueco en vez de agregarse sola, y esa es la
 * diferencia: un noveno que nadie firma es el balde otra vez con otro nombre;
 * uno que alguien firma es vocabulario.*
 */
export type TipoLineaDeVida =
  | 'salud'
  | 'vacunas'
  | 'antiparasitario'
  | 'peso'
  | 'paseos'
  | 'estetica'
  | 'adiestramiento'
  | 'guarderia'
  | 'recuerdos'

/**
 * 🔴 **EL REPARTO EN DOS FILAS — Y EL GUARD, QUE SON LA MISMA COSA.**
 *
 * `satisfies Record<TipoLineaDeVida, 0 | 1>` obliga a que **cada tipo tenga su
 * fila**: un noveno sin entrada acá **no compila**, y uno de más tampoco.
 * *Sin esto, un tipo nuevo se dibujaría igual y nadie sabría que su lugar en
 * la grilla lo eligió el azar del ancho.*
 *
 * El criterio del corte: **arriba lo que mira un veterinario, abajo lo que
 * vivió la familia.** No es una jerarquía —los nueve pesan igual— es que
 * buscarlos agrupados por naturaleza es más rápido que por orden alfabético.
 *
 * ⚠️ **Quedan 4 y 5, no 4 y 4**, y el desbalance es del criterio: guardería es
 * un oficio y los oficios están todos abajo. *Emparejar las filas moviendo uno
 * arriba pondría un oficio entre lo clínico, que es justo lo que el corte
 * existe para no hacer.* Y `recuerdos` cierra la segunda porque **no es un
 * oficio**: va con lo vivido, pero al final.
 */
const FILA = {
  salud: 0,
  vacunas: 0,
  antiparasitario: 0,
  peso: 0,
  paseos: 1,
  estetica: 1,
  adiestramiento: 1,
  guarderia: 1,
  recuerdos: 1,
} satisfies Record<TipoLineaDeVida, 0 | 1>

export interface FiltrosLineaDeVidaProps {
  /** Los tipos que la pantalla ofrece, en su orden. */
  tipos: readonly TipoLineaDeVida[]
  /** Los elegidos. **Vacío = todos** (ver cabecera). */
  elegidos: readonly TipoLineaDeVida[]
  /** La voz de cada chip (Ley 3). */
  voz: (t: TipoLineaDeVida) => string
  onAlternar: (t: TipoLineaDeVida) => void
}

export function FiltrosLineaDeVida({ tipos, elegidos, voz, onAlternar }: FiltrosLineaDeVidaProps) {
  const { theme } = useTheme()
  /* Las dos filas, en el orden del reparto. La pantalla puede ofrecer un
     subconjunto: **cada fila dibuja lo que le tocó de lo que llegó**, y una
     fila que queda vacía no se monta —*una fila vacía es una línea de aire
     que no dice nada*—. */
  const porFila = ([0, 1] as const).map((n) => tipos.filter((t) => FILA[t] === n))

  return (
    <View style={{ gap: spacing[2] }}>
      {porFila.map((fila, i) =>
        fila.length === 0 ? null : (
          <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {fila.map((t) => {
              const on = elegidos.includes(t)
              return (
                <Pressable
            key={t}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={voz(t)}
            onPress={() => onAlternar(t)}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: spacing[3],
              borderRadius: radius.full,
              backgroundColor: on ? theme.accent.control : theme.bg.card,
            }}
          >
            {/* ⚠️ **`Texto` no puede decir «blanco sobre el acento» y no debe:**
                su paleta es semántica y `sobreVideo` —el único blanco que
                expone— tiene su nota diciendo *«se usa SOLO sobre video»*.
                Acá el fondo lo pinta la casa, así que el par es
                `text.inverse` sobre `accent.control`, **medido en
                `verify:contrast`**. */}
            <Text
              style={{
                fontFamily: typography.family.sans.medium,
                fontSize: typography.size.control,
                color: on ? theme.text.inverse : theme.text.secondary,
              }}
            >
              {voz(t)}
            </Text>
          </Pressable>
              )
            })}
          </View>
        ),
      )}
    </View>
  )
}
