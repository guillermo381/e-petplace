/**
 * TarjetaPedido — UN pedido en una lista, de los DOS lados.
 *
 * La fila de la lista Hoy del vendedor (`LETRA_PANEL_VENDEDOR_S96` §2.1:
 * *"quién, la ventana prometida, cuántos ítems, el monto, y en qué
 * escalón está"*) y la fila de "Mis pedidos" de la familia
 * (`LETRA_RECORRIDO_DESPENSA_S96` §8.1: *"del más reciente al más viejo,
 * con el seguimiento adentro"*).
 *
 * ── UNA PIEZA, NO DOS — y por qué, que es la decisión ──────────────────
 * La tentación era `TarjetaPedido` + `TarjetaSeguimiento`. **Se midió la
 * anatomía de las dos y es LA MISMA**: identidad arriba · una línea de
 * datos · el monto · la escalera. Lo único que cambia es QUÉ va en cada
 * slot y con qué voz — *el mismo hecho contado a dos audiencias*.
 * `METODO_TRES_PISTAS` §6 lo firma al pie: **la excepción de la voz es
 * sobre el TEXTO, jamás sobre el componente** — la forma se ensancha con
 * una prop, no con un segundo archivo. Dos archivos habrían divergido, y
 * la casa ya pagó ese precio: los cuatro logs de oficio de S82 nacieron
 * por copia y dos habían perdido el precio entero.
 *
 * Por eso los slots son NEUTROS (`titulo`, `detalle`, `monto`) en vez de
 * `nombreContacto` / `nombreVendedor`: un slot que nombra al dato de UNA
 * de las dos casas es el primer paso de la bifurcación.
 *
 * ── LO QUE ESTA PIEZA NO PUEDE MOSTRAR, POR CONSTRUCCIÓN ───────────────
 * 🔴 **No hay prop de mascota, y es a propósito.** `LETRA_PANEL_VENDEDOR`
 * §4 es dura: *"el nombre de la mascota no aparece en ninguna superficie
 * del panel"*, y §7.4 de `MODELO_DESPENSA` lo cierra sin excepción ni
 * configuración. **El contrato del componente vuelve el estado malo
 * INEXPRESABLE** (L-222): no alcanza con que nadie la pase hoy — hace
 * falta que no se pueda. La pantalla del vendedor no tiene por dónde
 * filtrar identidad aunque su lector se la traiga.
 *
 * ── LA PLATA ES DEL RIEL ───────────────────────────────────────────────
 * `monto` llega **formateado**, como en `PieReserva`. El formateo de
 * plata por idioma es del riel (D-448: `montoCorto` NO nació) — un
 * componente que formatea moneda es un componente que va a inventar la
 * moneda el día que haya dos.
 *
 * ── ESCALERA ADENTRO, COMO EL CANTO DE `FilaCita` ──────────────────────
 * La escalera vive DENTRO y la pantalla no elige su color: lo deriva de
 * `acento`. Mismo criterio que el canto de `FilaCita` (§9.1/§9.2) — si la
 * pantalla pudiera elegirlo, la ley se rompe de a una pantalla por vez.
 *
 * `pasos: []` NO dibuja escalera (regla de existencia) — un pedido de
 * mostrador reclamado no tiene recorrido, y un riel vacío afirmaría que sí.
 *
 * Presentacional puro. Memorial degrada por slot.
 */

import { View } from 'react-native'

import { EscaleraEstados, type DesvioEscalera, type PasoEscalera } from './EscaleraEstados'
import { Tarjeta } from './Tarjeta'
import { Insignia } from './Insignia'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

export type TarjetaPedidoProps = {
  /**
   * Quién / qué es este pedido, en la voz de quien lo mira. El vendedor
   * lee el nombre de contacto; la familia lee el negocio o su compra.
   */
  titulo: string
  /**
   * La línea de datos: la ventana prometida, cuántos ítems. La compone la
   * pantalla con su riel de fechas — acá jamás se formatea nada.
   */
  detalle?: string
  /** YA FORMATEADO por el riel. `undefined` = no se dibuja (jamás "$0"). */
  monto?: string
  /** Vacío = sin escalera. Ver la regla de existencia del encabezado. */
  pasos?: PasoEscalera[]
  /** El camino se interrumpió — ver la decisión ① de `EscaleraEstados`. */
  desvio?: DesvioEscalera
  /**
   * 🔴 EL ESTADO DE UN PEDIDO QUE TODAVÍA NO TIENE RECORRIDO (S100b-B ·
   * pedido de la pista D **con el caso medido**).
   *
   * **EL CASO, y no es hipotético — es la lista que vio el founder:**
   * `pagando` = 4 · con promesa = 4 · con pago confirmado = **0**, y son
   * **los cuatro primeros** de la lista. Esas tarjetas salían con título,
   * fecha y monto **y nada más**, al lado de vecinas con escalera de
   * cuatro nodos.
   *
   * **Por qué no alcanzaba el `detalle` en `apoyo`** (que es lo que había):
   * no es un problema de tipografía sino de **contraste de FORMA** — la
   * tarjeta vecina tiene una figura y ésta no, así que se lee como *«le
   * falta algo»* en vez de *«está en otro estado»*.
   *
   * ── POR QUÉ NO CRECIÓ `EscaleraEstados` PARA ESTO ──────────────────
   * Su regla de existencia es correcta: **sin pasos no hay escalera.** Un
   * modo «sin pasos pero con estado» le devuelve adentro justo la
   * ambigüedad que le sacamos. ***Un pedido sin recorrido no tiene una
   * escalera vacía: tiene un estado.***
   *
   * ── POR QUÉ NO ES `desvio` ─────────────────────────────────────────
   * `desvio` significa **el camino se interrumpió**, y `pagando` no se
   * interrumpió: todavía no empezó. *Usarlo diría que algo salió mal.*
   *
   * ── 🔴 POR QUÉ ES UN PAR TIPADO Y NO UN `ReactNode` ────────────────
   * D ofreció las dos formas y elijo la cerrada. **Un slot libre entrega
   * la FORMA al consumidor**, y entonces cada pantalla resuelve «el estado
   * de un pedido» a su manera — que es exactamente la divergencia que esta
   * tarjeta existe para no tener.
   *
   * **La voz sigue siendo del consumidor** (él pasa `etiqueta`, y el
   * vendedor y la familia dicen cosas distintas del mismo hecho); **la
   * forma es de la pieza**, que monta `Insignia` adentro. *Es el reparto
   * de siempre: la casa comparte la forma, cada voz es suya.*
   *
   * ⚠️ **Mutuamente excluyente con `pasos` en la práctica:** si el pedido
   * ya tiene recorrido, su estado lo cuenta la escalera. Pasar los dos
   * dibuja dos veces lo mismo — la pieza no lo prohíbe por tipo porque
   * `pasos` es opcional y su ausencia ya es la señal, pero **si aparecen
   * juntos, el que sobra es éste.**
   */
  estado?: {
    /** La voz de quien monta. Jamás la compone esta pieza. */
    etiqueta: string
    /**
     * El vocabulario de `Insignia`, **reusado y no reinventado** (L-175:
     * se ensancha la respuesta que la casa ya tiene). `info` es el default
     * porque *«todavía no pasó nada»* no es una alerta ni un logro.
     */
    tono?: 'info' | 'proximo' | 'atencion'
  }
  /** `oficio` = panel del vendedor · `control` = app de la familia. */
  acento?: 'control' | 'oficio'
  onPress: () => void
  /** El label del tocable — lo compone la pantalla, que tiene la voz. */
  etiqueta: string
}

export function TarjetaPedido({
  titulo,
  detalle,
  monto,
  pasos = [],
  desvio,
  estado,
  acento = 'control',
  onPress,
  etiqueta,
}: TarjetaPedidoProps) {
  return (
    <Tarjeta interactiva onPress={onPress} accessibilityRole="button" etiqueta={etiqueta} relleno="amplio">
      <View style={{ gap: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
          <View style={{ flex: 1, gap: spacing[0.5] }}>
            <Texto variante="seccion" numberOfLines={1}>
              {titulo}
            </Texto>
            {detalle === undefined ? null : (
              <Texto variante="apoyo" numberOfLines={1}>
                {detalle}
              </Texto>
            )}
          </View>
          {/* El monto es dato de máquina y va en mono (Ley 3). Ausente no
              se dibuja: "$0,00" es mentira con formato de dato (19.9). */}
          {monto === undefined ? null : <Texto variante="dato">{monto}</Texto>}
        </View>

        {/* 🔴 EL ESTADO SIN RECORRIDO — ver la prop `estado`. Va DESPUÉS
            del encabezado y ANTES de la escalera: ocupa el lugar donde la
            vecina tiene su figura, que es exactamente el contraste de
            forma que faltaba. La voz la trae quien monta; la forma la
            resuelve `Insignia`, para que dos pantallas no lo dibujen
            distinto. */}
        {estado === undefined ? null : (
          <View style={{ flexDirection: 'row' }}>
            <Insignia estado={estado.tono ?? 'info'} etiqueta={estado.etiqueta} />
          </View>
        )}

        {/* ⏪ **S100-B · MURIÓ EL GUARD `pasos.length === 0 ? null`** (H-04,
            hallazgo de la pista D). Era una re-implementación PARCIAL de
            una decisión que no le pertenece a esta tarjeta: un pedido
            `cancelado` llega con `pasos: []` **más** `desvio`, así que el
            guard mataba la banda y **en la lista el pedido no decía que
            se había cancelado**.

            La regla de existencia vive en `EscaleraEstados` y ahora dice
            lo correcto —*sin pasos NI desvío no hay nada que decir*—, así
            que se la monta SIEMPRE y ella resuelve.

            > *El guard de acá no estaba de más: estaba de menos.* Y
            > mientras existiera, curar la pieza no alcanzaba — el criterio
            > vivía en dos lugares y ganaba el de afuera. */}
        <EscaleraEstados registro="compacta" pasos={pasos} desvio={desvio} acento={acento} />
      </View>
    </Tarjeta>
  )
}
