/**
 * DesgloseCompra — EL RESUMEN ANTES DE PAGAR (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL IVA SE MUESTRA SIEMPRE, AUNQUE SEA CERO — y eso NO deroga la ley
 * del nulo (19.9), aunque se le parezca mucho.**
 *
 * `PrecioText` dice, con todas las letras, que **`$0.00` es una mentira con
 * formato de dato**: *dice «esto es gratis» cuando lo que pasa es que no
 * sabemos cuánto vale.* Esa ley habla de la **AUSENCIA** — un precio que no
 * llegó, un total que todavía no se calculó.
 *
 * **Acá el cero no es una ausencia: es un HECHO MEDIDO.** El alimento
 * balanceado tributa IVA 0 % en Ecuador, así que «IVA: $0,00» no dice «no
 * sabemos»: dice *«corresponde cero, y por eso no te lo cobramos»*. Ocultar
 * esa línea le quitaría a la familia la única forma de aprender por qué la
 * bolsa de alimento y el juguete no suman lo mismo.
 *
 * ⇒ **La distinción que rige acá: `null` no se dibuja · `0` sí.** Un `iva`
 * nulo (todavía no calculado) omite la fila; un `iva` en cero la muestra. Son
 * dos estados distintos y la pieza los trata distinto **a propósito**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LA TARIFA NO VIVE ACÁ ───────────────────────────────────────────────
 * `tarifaIva` llega por props y se interpola en la etiqueta. **En Ecuador ya
 * cambió** —la base todavía tiene la columna `subtotal_12` al lado de
 * `subtotal_15`, que es la cicatriz de ese cambio— así que un `15` escrito
 * adentro tendría fecha de vencimiento. **Lo vigila `R84`.**
 *
 * ── LOS DOS SUBTOTALES SÓLO APARECEN SI HAY DOS ─────────────────────────
 * Con una sola tarifa en juego, «Subtotal» a secas. Con las dos, cada una con
 * su etiqueta **y una frase al pie que explica la diferencia**: es el único
 * lugar del recorrido donde la familia puede entender la regla, y una lista
 * de números sin esa línea es un tablero, no una explicación.
 *
 * ── EL FORMATO DE LA PLATA ──────────────────────────────────────────────
 * Los montos los pinta **`PrecioText registro="linea"`**, la pieza canónica
 * de la casa. *No se formatea acá*: una tercera forma de escribir un monto
 * sería exactamente la divergencia que `PrecioText` nació para cerrar (53
 * sitios con `toFixed(2)` a mano).
 *
 * ✅ **EL FORMATO YA ES UNO SOLO (S115-B, firma del founder):** coma decimal y
 * punto de miles — `$45,00` · `$1.234,50`. `PrecioText` re-exporta la fuente
 * única, que vive en `packages/i18n` (ahí y no en `ui`, porque `ui` ya depende
 * del riel y al revés sería un ciclo).
 *
 * ⏪ *Esta cabecera decía que la puerta de pago usaba coma y que migrar era una
 * línea. Lo primero era falso —usaba punto, medido— y lo segundo resultó ser
 * una decisión de producto: el separador de MILES. El arco entero quedó
 * escrito en `packages/i18n/src/moneda.ts`.*
 */

import { View } from 'react-native'

import { PrecioText } from './PrecioText'
import { Separador } from './Separador'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

import { useTraduccionUi } from '../i18n'

/**
 * LA TARIFA DE SERVICIO — y su forma es una UNIÓN DISCRIMINADA a propósito.
 *
 * 🔴 **Con `promocionada: true`, `montoLista` y `hasta` son OBLIGATORIOS: una
 * promoción sin su precio tachado es INEXPRESABLE.** Si fueran opcionales
 * sueltos, el día que alguien pase `promocionada` sin `montoLista` la pieza
 * dibujaría un «gratis» sin decir gratis **desde cuánto** — que es justo lo
 * que la promoción tiene que comunicar. *Una ley que depende de que el
 * consumidor la respete no está puesta* (mismo movimiento que `CabeceraCaso`
 * con el monto y `TarjetaDestinoPlata` con sus dos tiempos).
 *
 * ── POR QUÉ `hasta` VIENE POR PROPS ────────────────────────────────────
 * «Gratis hasta **diciembre**» tiene adentro un dato que CADUCA, igual que la
 * tarifa del IVA. Escrito en el riel, el día que la promoción se extienda a
 * marzo habría que tocar los dos diccionarios — y hasta que alguien lo haga,
 * la pantalla estaría afirmando una fecha vencida.
 * ⇒ **la FRASE vive en el riel** (es lo que cambia entre idiomas: «Gratis
 * hasta X» / «Free until X») **y el DATO llega por props**. Es el mismo
 * reparto que `iva: 'IVA {{tarifa}} %'`.
 * ⚠️ Y como es un mes en palabras, **llega ya en el idioma del usuario**:
 * quien la monta tiene el riel de fechas; esta pieza no.
 */
export type TarifaServicio =
  | {
      promocionada: false
      /** Lo que se cobra. */
      monto: number
    }
  | {
      promocionada: true
      /** Lo que se cobra hoy — **0 mientras dure la promoción**. */
      monto: number
      /** El precio que va a regir, para tacharlo. Obligatorio: ver arriba. */
      montoLista: number
      /** «diciembre» — ya en el idioma del usuario. */
      hasta: string
    }

export interface DesgloseCompraProps {
  /** Lo que tributa 0 %. `null` = no hay nada en esa tarifa. */
  subtotal_0: number | null
  /** Lo que tributa la tarifa vigente. `null` = no hay nada en esa tarifa. */
  subtotal_15: number | null
  /** 🔴 **`0` se dibuja; `null` NO.** Ver la cabecera: son dos estados. */
  iva: number | null
  total: number
  /** Ya en negativo o en positivo, como venga: la pieza lo muestra con el
   *  signo que corresponde a un descuento. `null`/ausente = no hubo. */
  descuento?: number | null
  /** El número de la tarifa vigente — **por props, siempre**. */
  tarifaIva: number
  /** 🔴 **Ausente = la línea NO se dibuja.** No hay cero por defecto: un
   *  «Tarifa de servicio · $0.00» donde no hay tarifa afirma que existe y
   *  que es gratis, cuando lo que pasa es que no hay ninguna. *Es la ley del
   *  nulo (19.9) en su caso limpio* — a diferencia del IVA, donde el cero SÍ
   *  es un hecho medido. */
  tarifaServicio?: TarifaServicio
}

/** Una fila del resumen: rótulo a la izquierda, monto a la derecha.
 *  Local a propósito: es la anatomía de ESTE resumen, no una pieza con vida
 *  propia (mismo criterio con el que `PieDeCampo` vive dentro de `Campo`). */
function Linea({
  rotulo,
  valor,
  fuerte = false,
  valorAnterior,
  nota,
}: {
  rotulo: string
  valor: number
  fuerte?: boolean
  /** El precio tachado, a la IZQUIERDA del vigente (orden de lectura: de lo
   *  que era a lo que es). Ausente = no se dibuja. */
  valorAnterior?: number
  /** La aclaración bajo el rótulo. Ver por qué NO va pegada al monto en la
   *  cabecera de `tarifaServicio`. */
  nota?: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <View style={{ flex: 1 }}>
        <Texto variante={fuerte ? 'cuerpo' : 'apoyo'}>{rotulo}</Texto>
        {/* 🔴 LA NOTA VA BAJO EL RÓTULO Y NO AL LADO DEL MONTO, **por ancho**:
            «Tarifa de servicio» + el tachado + el vigente + «Gratis hasta
            diciembre» no entran en una línea de teléfono, y lo que se parte
            es siempre lo último. Acá la frase tiene el ancho de la columna
            izquierda entera y **los montos no se mueven de su sitio** — que es
            la condición que la orden pone: el día que deje de estar
            promocionada desaparecen la nota y el tachado, y la fila queda
            exactamente donde estaba. */}
        {nota === undefined ? null : <Texto variante="apoyo">{nota}</Texto>}
      </View>
      {/* Alineados a la derecha: los montos se leen en COLUMNA, y con
          `tabular-nums` de `PrecioText` el decimal no baila entre filas. */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
        {valorAnterior === undefined ? null : <PrecioText valor={valorAnterior} anterior />}
        <PrecioText valor={valor} registro="linea" />
      </View>
    </View>
  )
}

export function DesgloseCompra({
  subtotal_0,
  subtotal_15,
  iva,
  total,
  descuento,
  tarifaIva,
  tarifaServicio,
}: DesgloseCompraProps) {

  const { t } = useTraduccionUi()

  /* «Hay dos tarifas en juego» es lo que decide si cada subtotal lleva su
     etiqueta larga y si aparece la frase que explica la diferencia. */
  const mixto = subtotal_0 !== null && subtotal_15 !== null

  return (
    <View style={{ gap: spacing[2] }}>
      {subtotal_0 === null ? null : (
        <Linea
          rotulo={mixto ? t('desglose.subtotalSinIva') : t('desglose.subtotal')}
          valor={subtotal_0}
        />
      )}

      {subtotal_15 === null ? null : (
        <Linea
          rotulo={mixto ? t('desglose.subtotalConIva', { tarifa: tarifaIva }) : t('desglose.subtotal')}
          valor={subtotal_15}
        />
      )}

      {descuento === null || descuento === undefined ? null : (
        <Linea rotulo={t('desglose.descuento')} valor={descuento} />
      )}

      {/* LA TARIFA DE SERVICIO va ANTES del IVA, y el orden no es casual: en
          una factura el impuesto es siempre el penúltimo renglón, después de
          TODOS los conceptos. Ponerla después del IVA sugeriría que quedó
          fuera de ese impuesto — y esta pieza **no puede saber si la tarifa
          tributa**, porque recibe los montos ya calculados. *Entre un orden
          que afirma algo que no sabemos y uno que no afirma nada, gana el
          segundo.* */}
      {tarifaServicio === undefined ? null : (
        <Linea
          rotulo={t('desglose.tarifaServicio')}
          valor={tarifaServicio.monto}
          valorAnterior={tarifaServicio.promocionada ? tarifaServicio.montoLista : undefined}
          nota={
            tarifaServicio.promocionada
              ? t('desglose.tarifaPromocion', { hasta: tarifaServicio.hasta })
              : undefined
          }
        />
      )}

      {/* 🔴 EL CERO SE DIBUJA — ver la cabecera. Sólo el `null` se omite. */}
      {iva === null ? null : <Linea rotulo={t('desglose.iva', { tarifa: tarifaIva })} valor={iva} />}

      <View style={{ marginVertical: spacing[1] }}>
        <Separador />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Texto variante="seccion">{t('desglose.total')}</Texto>
        </View>
        {/* El total en el registro grande: es el número que decide. */}
        <PrecioText valor={total} registro="ficha" />
      </View>

      {/* LA FRASE QUE ENSEÑA. Sólo con las dos tarifas conviviendo: sin
          mezcla no hay diferencia que explicar, y explicarla igual sería
          texto que no informa (Ley 18). */}
      {mixto ? (
        <View style={{ marginTop: spacing[1] }}>
          <Texto variante="apoyo">{t('desglose.porQue')}</Texto>
        </View>
      ) : null}
    </View>
  )
}
