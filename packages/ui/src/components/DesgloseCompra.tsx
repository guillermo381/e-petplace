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
 * ⚠️ **HALLAZGO DECLARADO, no resuelto acá:** la orden pedía *«coma decimal
 * como ya hace la puerta de pago»*. **Medido: la puerta de pago NO usa
 * coma.** `despensa/checkout.tsx:832` escribe `` `$ ${v.toFixed(2)}` `` y
 * `PrecioText` escribe `$45.00` — las dos con PUNTO. El riel que sí produce
 * coma (`monto()` de `packages/i18n`) **no lo consume nadie**: su propio hook
 * declara «cero llamadores». ⇒ *pintar esta pieza con coma fabricaría una
 * isla: el desglose diría `$45,00` tres centímetros arriba de un total que
 * dice `$45.00`.* Migrar la casa entera es UNA línea en `formatearPrecio`, y
 * es decisión del founder — no de esta pieza.
 */

import { View } from 'react-native'

import { PrecioText } from './PrecioText'
import { Separador } from './Separador'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

import { useTraduccionUi } from '../i18n'

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
}

/** Una fila del resumen: rótulo a la izquierda, monto a la derecha.
 *  Local a propósito: es la anatomía de ESTE resumen, no una pieza con vida
 *  propia (mismo criterio con el que `PieDeCampo` vive dentro de `Campo`). */
function Linea({ rotulo, valor, fuerte = false }: { rotulo: string; valor: number; fuerte?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <View style={{ flex: 1 }}>
        <Texto variante={fuerte ? 'cuerpo' : 'apoyo'}>{rotulo}</Texto>
      </View>
      {/* Alineados a la derecha: los montos se leen en COLUMNA, y con
          `tabular-nums` de `PrecioText` el decimal no baila entre filas. */}
      <PrecioText valor={valor} registro="linea" />
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
