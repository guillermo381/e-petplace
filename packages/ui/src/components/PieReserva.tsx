/**
 * PieReserva — EL PIE FIJO DE UNA RESERVA (componente de DOMINIO,
 * promovido desde `apps/cliente/src/components/reserva-piezas.tsx` en
 * S82-B r35; molde: `FilaCita`).
 *
 * POR QUÉ SUBE. La causa la nombró el founder: **lo que se copia,
 * diverge.** Vivía en el app y dos de sus cuatro consumidores lo tenían
 * copiado a mano — y la copia había perdido EL PRECIO ENTERO, no un
 * matiz (medido S82-B r35: grooming y adiestramiento montaban un `View`
 * con solo el CTA). Acá arriba no puede copiarse sin que se note, y el
 * quinto oficio lo hereda sin que nadie se acuerde.
 *
 * LA ANATOMÍA (S61-A3 rasgo 2 + la escalera del precio S61-A13, ambas
 * firmadas): PRECIO a la izquierda con su "desde" honesto · CTA a la
 * derecha ocupando el resto · fijo abajo, FUERA del scroll, con una
 * hairline superior que lo separa del contenido que le pasa por detrás.
 * Es el ÚNICO relleno pleno de la pantalla (Ley 5: una primaria).
 *
 * LAS TRES CLÁUSULAS QUE EL CONTRATO CONGELA (leídas de los cuatro
 * consumidores ANTES de subir — el orden que la extracción exige):
 *
 *  1. **`total = null` es legal y no es un vacío que haya que dibujar.**
 *     Adiestramiento NO TIENE precio en esta pantalla (medido: su
 *     `CUÁNDO` no pide ningún precio al motor — el número recién existe
 *     en el QUIÉN). Con `total` en null el bloque de precio NO SE MONTA
 *     y el CTA ocupa el pie entero. La pieza no inventa un "—" ni un
 *     "desde $0": L-139 rige acá igual que en una nota clínica.
 *  2. **`totalDesde` es del DATO, no del oficio.** Paseo dice "desde"
 *     porque el precio varía por prestador; veterinaria y grooming
 *     traen su `varia` YA RESUELTO server-side (grooming, además, por
 *     la TALLA de esa mascota). La pieza no deduce: recibe el booleano.
 *  3. **`cuando` es la segunda línea DEL PRECIO, no una tercera zona.**
 *     Sin total no se pinta — comportamiento conservado byte por byte
 *     del original para que esta promoción no mueva un píxel en las dos
 *     pantallas que ya lo consumían. *(Si el founder quiere el día/hora
 *     visible sin precio —el caso de adiestramiento—, es composición y
 *     va a gate: la pieza está lista, la decisión no está tomada.)*
 *
 * LO QUE LA PIEZA SE LLEVA DEL CONSUMIDOR, a propósito: el
 * `paddingBottom` de la safe area. La ley chica de la cola de scroll
 * (S70-B5) exige que el contenido pase POR ENCIMA del pie; si cada
 * pantalla recalcula `Math.max(insets.bottom, ...)` vuelve a divergir
 * —que es exactamente lo que pasó—. El consumidor entrega `insetBottom`
 * crudo y la pieza decide el piso.
 *
 * LO QUE **NO** RESUELVE, declarado para que nadie lo suponga: `total`
 * llega FORMATEADO (`"$ 12.00"`). El símbolo y los decimales se arman en
 * cada pantalla porque el riel de moneda por país no existe todavía —
 * es la misma clase de divergencia, un piso más abajo, y se cura cuando
 * ese riel nazca. Queda escrito acá para que la próxima copia se vea.
 */

import { Text, View } from 'react-native'

import { useTheme } from '../ThemeProvider'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { Boton } from './Boton'
import { Texto } from './Texto'

export type PieReservaProps = {
  /** Ya formateado con su moneda. `null` = no hay qué totalizar y el
   *  bloque de precio no se monta (jamás un placeholder). */
  total: string | null
  /** ⭐ **S116-B lote 5 · el rótulo chico sobre la cifra («Total»).**
   *  Opcional y **sin default a propósito**: un pie cuyo precio varía por
   *  prestador NO dice «Total» —dice «desde»—, y rotularlo así afirmaría un
   *  total que la pantalla todavía no sabe. Sin rótulo, el pie es el de
   *  siempre. La palabra viene del diccionario de quien monta. */
  rotuloTotal?: string | null
  /** Del dato, no del oficio: true cuando el precio agregado varía. */
  totalDesde?: boolean
  /** Día y hora elegidos. Segunda línea del precio: sin total, no vive. */
  cuando?: string | null
  etiqueta: string
  habilitado: boolean
  onPress: () => void
  /** Crudo, sin `Math.max`: el piso lo pone la pieza (ley de la cola). */
  insetBottom: number
  /** Passthrough a `Boton` (S82-B r14): el CTA apagado puede DECIR qué
   *  falta en vez de ser una pared muda. Sin consumidor todavía — vive
   *  para que la próxima pantalla no copie el pie con tal de tenerlo. */
  razonDeshabilitado?: string
  onRazon?: () => void
}

export function PieReserva({
  total,
  rotuloTotal = null,
  totalDesde = false,
  cuando = null,
  etiqueta,
  habilitado,
  onPress,
  insetBottom,
  razonDeshabilitado,
  onRazon,
}: PieReservaProps) {
  const { theme } = useTheme()
  const esV5 = 'formaV5' in theme.accent && theme.accent.formaV5 === true
  return (
    <View
      style={{
        paddingHorizontal: spacing[5],
        paddingTop: spacing[3],
        paddingBottom: Math.max(insetBottom, spacing[4]),
        backgroundColor: theme.bg.base,
        borderTopWidth: 1,
        borderTopColor: theme.border.subtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
      }}
    >
      {total !== null ? (
        <View>
          {/* ⭐ **S116-B lote 5 · EL RÓTULO, arriba y chico.** Opcional y sin
              default: *el pie de un oficio con precio por prestador no dice
              «Total» —dice «desde»— y rotularlo así sería afirmar un total
              que la pantalla todavía no sabe.* Quien monta trae la palabra
              de su diccionario; sin ella, el pie es el de siempre. */}
          {rotuloTotal !== null ? (
            <Texto variante="apoyo" color="tertiary">
              {rotuloTotal}
            </Texto>
          ) : null}
          {/* 🔴 **LA CIFRA PASA A BALOO cuando la casa lo es** (`formaV5`).
              ⏪ Esta línea decía *«el precio es dato de máquina a escala
              chica: mono (Ley 3)»* — **y ese criterio quedó atrás, no
              equivocado.** La Ley 3 manda mono para metadata chica de
              máquina; la letra v5 le dio a la casa **una voz propia para las
              cifras** (`escala.cifra` 44 · `cifraChica` 22) que no existía
              cuando esto se escribió, y un total que decide una compra dejó
              de ser metadata el día que la escala lo nombró. *La ley no se
              deroga: lo que cambió es que ahora hay un registro para esto.*

              ⚠️ **`cifraChica` (22) y no `cifra` (44), declarado:** 44 es la
              cifra que PRESIDE una pantalla; acá comparte el renglón con el
              CTA y a ese tamaño lo empuja fuera. *El registro nombra la voz,
              no el tamaño más grande que esa voz tenga.*

              El prestador **conserva el mono**: su tema tiene `formaV5:
              false` por la letra §5, y su único consumidor —el taller de
              guardería— no pidió rediseño. */}
          <Text
            style={
              esV5
                ? {
                    fontFamily: typography.escala.cifraChica.familia,
                    fontSize: typography.escala.cifraChica.size,
                    lineHeight: typography.escala.cifraChica.lineHeight,
                    color: theme.text.primary,
                  }
                : {
                    fontFamily: typography.family.mono.medium,
                    fontSize: typography.size.lg,
                    color: theme.text.primary,
                  }
            }
          >
            {total}
          </Text>
          {cuando !== null ? <Texto variante="dato">{totalDesde ? `desde · ${cuando}` : cuando}</Texto> : null}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Boton
          variante="primario"
          bloque
          etiqueta={etiqueta}
          deshabilitado={!habilitado}
          onPress={onPress}
          razonDeshabilitado={razonDeshabilitado}
          onRazon={onRazon}
        />
      </View>
    </View>
  )
}
