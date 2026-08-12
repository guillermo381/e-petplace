/**
 * FilaEntrega — UNA parada del repartidor.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §9.1: *"al abrir una: dirección, punto
 * en el mapa, referencia, instrucciones de entrega y un botón para
 * llamar"*. La vara de esta pieza no es la del resto de la casa: **se lee
 * a pleno sol, arriba de una moto, con las manos ocupadas.**
 *
 * ── 🔴 LO QUE ESTA PIEZA NO PUEDE MOSTRAR, POR CONSTRUCCIÓN ────────────
 * §9.2 es la regla más dura del recorrido: *"el envío asignado a él y
 * nada más. Ni catálogo, ni los otros pedidos, ni una palabra de la
 * mascota."* **Acá eso no es disciplina de la pantalla: es el
 * contrato** — no existe prop de mascota, de pedido, de productos ni de
 * monto. **El estado malo es INEXPRESABLE** (L-222): no alcanza con que
 * nadie los pase, hace falta que no se pueda.
 *
 * Y coincide con lo que A ya cerró del otro lado: `EntregaAsignada` trae
 * dirección, punto, referencia, instrucciones y teléfono — *"cero
 * mascota, cero pedido: el snapshot es todo lo que la puerta necesita"*
 * (contrato del motor §1). **Las dos capas dicen lo mismo sin haberse
 * copiado, y esa coincidencia es la prueba de que la línea está bien
 * puesta.**
 *
 * ── LAS TRES DECISIONES DE LA VARA ─────────────────────────────────────
 *
 * ① **La jerarquía es de LECTURA, no de importancia editorial.** Arriba
 *    la dirección en `seccion` (18, medium): es lo que se busca de un
 *    vistazo. La referencia va en `cuerpo` — *"casa verde, portón negro,
 *    frente a la panadería"* (§7) es lo que de verdad encuentra la casa,
 *    así que **no es metadata y no se apaga a `apoyo`**.
 *
 * ② **La instrucción tiene SUPERFICIE PROPIA.** No es un dato más: §9.3
 *    la nombra el árbitro del caso feo — *"la instrucción que el cliente
 *    dio al comprar es la que decide"*, y por eso se pide al comprar y no
 *    en la vereda. Enterrarla entre líneas sería dejar al repartidor
 *    decidiendo en la puerta lo que la familia ya decidió.
 *
 * ③ **`Boton tamaño="lg"` (alto 56) — y no se inventó nada para lograrlo.**
 *    Relevado (protocolo 1c, pregunta 2): la escala de `Boton` YA tenía el
 *    tamaño de guantes. *La casa lo resolvía; hacía falta recorrerla, no
 *    ensancharla.*
 *
 * ── CHANEL (Ley 16) ────────────────────────────────────────────────────
 * Se quitó el glifo de teléfono junto al botón "Llamar": la palabra ya lo
 * dice y el glifo era el elemento haciendo doble turno (Ley 17.6). Y se
 * quitó el rótulo "Dirección" sobre la dirección — un rótulo que nombra
 * lo evidente es estructura decorativa (Ley 18).
 *
 * El mapa NO vive acá: lo monta la pantalla con `MapaZona`. Esta pieza es
 * la ficha de la parada, y una pieza que además dibuja mapas es dos.
 * Presentacional puro: no llama, no navega — avisa a quien la montó.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

export type FilaEntregaProps = {
  /** La calle, tal como la validó Places. */
  direccion: string
  /** *"Casa verde, portón negro"* — lo que encuentra la casa (§7). */
  referencia?: string
  /** *"Dejar en portería"* — el árbitro del caso feo (§9.3). */
  instrucciones?: string
  /**
   * Llamar es el ÚNICO canal de v1 (`LETRA_PANEL_VENDEDOR_S96` §6: *"es
   * el único que no exige que nadie tenga la app abierta. Nadie escribe
   * cuando está arriba de una moto"*). Sin teléfono no se dibuja el
   * botón — jamás uno que no puede llamar.
   */
  onLlamar?: () => void
}

export function FilaEntrega({ direccion, referencia, instrucciones, onLlamar }: FilaEntregaProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: spacing[1] }}>
        <Texto variante="seccion">{direccion}</Texto>
        {referencia === undefined ? null : <Texto variante="cuerpo">{referencia}</Texto>}
      </View>

      {instrucciones === undefined ? null : (
        <View
          style={{
            gap: spacing[1],
            padding: spacing[3],
            borderRadius: radius.suave,
            backgroundColor: theme.bg.overlay,
          }}
        >
          {/* Este rótulo SÍ informa (Ley 18): dice de quién viene el
              texto. Sin él, "dejar en portería" se lee como una nota del
              sistema en vez de como lo que la familia pidió. */}
          <Texto variante="apoyo">{t('filaEntrega.instrucciones')}</Texto>
          <Texto variante="cuerpo">{instrucciones}</Texto>
        </View>
      )}

      {onLlamar === undefined ? null : (
        <Boton variante="secundario" tamaño="lg" onPress={onLlamar} etiqueta={t('filaEntrega.llamar')} />
      )}
    </View>
  )
}
