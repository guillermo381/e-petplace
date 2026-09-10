/**
 * TarjetaFactura — «TU FACTURA» (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LA FAMILIA NUNCA VE UN ERROR DEL SRI, Y ESO NO SE PIDE: SE CONSTRUYE.**
 *
 * `facturas` tiene una columna `sri_error` con el texto crudo que devuelve el
 * organismo. Si esta pieza aceptara un `motivo`, un `detalle` o un slot
 * `ReactNode`, ese texto llegaría a la pantalla **el día que alguien tenga
 * apuro por diagnosticar** — no por mala fe, sino porque estaría a mano.
 *
 * ⇒ **la prop no existe, y el slot tampoco.** El estado `corrigiendo` dice lo
 * único que le importa a la persona —*«esto lo estamos resolviendo
 * nosotros»*— y nada más. Es el mismo movimiento con el que `CabeceraCaso`
 * hizo inexpresable el monto: *una ley que depende de que el consumidor la
 * respete no está puesta.* **Lo vigila `R86`.**
 *
 * Y el porqué de fondo es de negocio, no de estilo: en Ecuador la factura
 * electrónica falla seguido —`MODELO_DESPENSA` §8.6bis: *«la factura se
 * REGISTRA, no se emite»*— así que `corrigiendo` **no es un caso raro: es un
 * estado normal del sistema.** Un estado normal no puede verse como una
 * falla del usuario.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LOS CUATRO ESTADOS MIDEN LO MISMO, Y POR ESO NO SALTAN ──────────────
 * `minHeight` común y una sola receta: **la tarjeta no cambia de tamaño al
 * cambiar de estado.** Sin eso, la lista entera se re-acomoda cuando una
 * factura pasa de «preparando» a «lista», y lo que la persona ve es que la
 * pantalla salta sola.
 *
 * ── LA NOTA DE CRÉDITO SE DISTINGUE POR COLOR, NO POR LAYOUT ────────────
 * Mismo esqueleto, **guijarro de otra capa**. *Si se distinguiera por
 * estructura habría que aprender dos tarjetas; distinguiéndose por color se
 * aprende una y se la reconoce de un vistazo.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * No descarga: `onDescargar` es del consumidor (el share sheet es del sistema
 * y la URL es del wrapper). No sabe de tarifas ni de IVA — **cero**, y lo
 * vigila `R84`.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { EsperaDeMarca } from '../brand/EsperaDeMarca'
import { EstadoVacio } from './EstadoVacio'
import { Guijarro } from '../brand/Guijarro'
import { PrecioText } from './PrecioText'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTraduccionUi } from '../i18n'

/** Los cuatro estados que la familia puede ver.
 *
 *  ⚠️ **NO son los de `facturas.estado`** —ahí viven `pendiente`,
 *  `autorizada`, `rechazada`— y la diferencia es deliberada: **el mapeo de un
 *  estado del SRI a lo que se le dice a una persona es una decisión de
 *  producto**, y hacerlo acá adentro obligaría a esta pieza a conocer el
 *  vocabulario del organismo. Quien la monta traduce. */
export type EstadoFactura = 'preparando' | 'lista' | 'corrigiendo' | 'notaCredito'

export interface TarjetaFacturaProps {
  estado: EstadoFactura
  /** El número corto legible: `001-002-000000123`. Ausente mientras se
   *  prepara — todavía no existe. */
  numero?: string
  /** Sólo en `notaCredito`: cuánto se devolvió. */
  monto?: number
  /** Las dos acciones. Ausentes = la tarjeta no ofrece descargar (es lo que
   *  pasa en `preparando` y en `corrigiendo`). */
  onDescargarPdf?: () => void
  onDescargarXml?: () => void
}

/** UNA receta: el tamaño no puede variar entre estados (ver la cabecera). */
const RECETA = {
  gap: spacing[3],
  padding: spacing[4],
  borderRadius: radius.suave,
  minHeight: 132,
} as const

export function TarjetaFactura({
  estado,
  numero,
  monto,
  onDescargarPdf,
  onDescargarXml,
}: TarjetaFacturaProps) {
  const { t } = useTraduccionUi()

  const esNota = estado === 'notaCredito'
  const conAcciones = estado === 'lista' || esNota

  return (
    <Tarjeta elevacion="reposo">
      <View style={RECETA}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {/* El guijarro es lo ÚNICO que cambia entre factura y nota: misma
              estructura, otra capa (§4 de DIRECCION_ARTE — cada guijarro de
              una vista se rota distinto). */}
          <Guijarro capa={esNota ? 'cuidado' : 'identidad'} tamano={40} rotacion={esNota ? 12 : -8} />
          <View style={{ flex: 1, gap: spacing[0.5] }}>
            <Texto variante="cuerpo">{t(`factura.titulo.${estado}`)}</Texto>
            {/* El número en voz de máquina: nadie lo eligió ni lo pronuncia
                (Ley 3). Ausente mientras se prepara — no existe todavía. */}
            {numero === undefined ? null : <Texto variante="dato">{numero}</Texto>}
          </View>
          {estado === 'preparando' ? <EsperaDeMarca tamano={28} /> : null}
        </View>

        {/* El monto de la devolución: se dice ANTES de las acciones, porque
            es el dato por el que alguien abre una nota de crédito. */}
        {esNota && monto !== undefined ? <PrecioText valor={monto} registro="ficha" /> : null}

        {/* 🔴 NINGÚN MOTIVO, NINGÚN DETALLE — ver la cabecera. Sólo la voz
            de que lo estamos resolviendo nosotros. */}
        {estado === 'corrigiendo' ? <Texto variante="apoyo">{t('factura.corrigiendoVoz')}</Texto> : null}

        {conAcciones && (onDescargarPdf !== undefined || onDescargarXml !== undefined) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            {onDescargarPdf === undefined ? null : (
              <Boton variante="primario" onPress={onDescargarPdf} etiqueta={t('factura.descargarPdf')} />
            )}
            {/* El XML en texto: es el archivo que casi nadie abre, y ponerlo
                al mismo peso que el PDF haría dudar sobre cuál sirve. */}
            {onDescargarXml === undefined ? null : (
              <Boton variante="ghost" onPress={onDescargarXml} etiqueta={t('factura.descargarXml')} />
            )}
          </View>
        ) : null}
      </View>
    </Tarjeta>
  )
}

/**
 * El vacío digno de «Mis facturas». **Sin botón**, y es deliberado: una
 * factura no se crea —aparece cuando comprás— así que un CTA acá llevaría a
 * una acción que no existe. La invitación la hace la despensa, no esta lista.
 *
 * ⚠️ Convive con la Ley 17.5 (*«el vacío invita a actuar»*) sin romperla: la
 * ley pide **un camino**, y acá el camino honesto es esperar a la próxima
 * compra. *Fabricar un botón para cumplir la forma de la ley sería el final
 * mudo que la ley existe para evitar.*
 */
export function FacturasVacio() {
  const { t } = useTraduccionUi()
  return (
    <EstadoVacio
      registro="seccion"
      icono={<Guijarro capa="identidad" tamano={48} rotacion={-6} />}
      titulo={t('factura.vacioTitulo')}
      descripcion={t('factura.vacioVoz')}
    />
  )
}
