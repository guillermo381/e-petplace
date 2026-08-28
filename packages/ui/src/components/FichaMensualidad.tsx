/**
 * FichaMensualidad — LA OFERTA DEL LUGAR, en una línea que se entiende (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * «Lun–Vie · $180 el mes». **Qué días, y cuánto por mes.** Nada más.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hermana de `FichaFranja` y por la misma razón: **es la misma pieza en la
 * configuración del prestador y en el perfil del lugar.** Si fueran dos, el
 * día que el prestador cambie su patrón de días el perfil seguiría vendiendo
 * el viejo — y quien paga un mes de lunes a viernes descubriría el sábado que
 * no estaba incluido.
 *
 * ── 🔴 EL PATRÓN DE DÍAS LLEGA RESUELTO, Y ESO ES DELIBERADO ──────────────
 * `dias` es un **string ya compuesto** («Lun–Vie», «Lun, Mié y Vie»), no un
 * arreglo de días que esta pieza colapse. **Colapsar días es trabajo de
 * IDIOMA, no de layout**: en español «Lun–Vie» y en inglés «Mon–Fri» no se
 * separan igual, y el día que aparezca un patrón salteado la regla de
 * abreviatura vive en el riel de i18n con `fechaCortaMono` y familia — jamás
 * en un componente de presentación. *La misma frontera que `PrecioText` traza
 * con la moneda y `FichaFranja` con sus rótulos.*
 *
 * ── POR QUÉ NO TRAE TEXTO PROPIO ──────────────────────────────────────────
 * Igual que `FichaFranja`: `LETRA_GUARDERIA` está **FRENADA** (`D-918`/`D-919`)
 * y el perímetro de la tanda prohíbe que una pieza escriba texto que reparta
 * responsabilidad. **Acá el riesgo es concreto y no teórico:** una mensualidad
 * es un compromiso de plata, y una pieza que decidiera adentro palabras como
 * «incluye» o «cubre» estaría afirmando alcance de servicio — que es
 * exactamente lo que la letra frenada todavía no puede sostener. **Todo
 * texto entra por prop.**
 *
 * ── LEY 11: POR QUÉ NACE (protocolo 1c, pregunta 2) ───────────────────────
 * · `PrecioText` **ya resuelve el número** y se MONTA acá — no se reimplementa
 *   (`registro="ficha"` + `porUnidad`, que existe para exactamente esto).
 * · `FilaDato` sería etiqueta-sobre-valor: apila lo que acá va emparejado, y
 *   el par «días ↔ precio» se lee de un vistazo justamente porque convive.
 * · `Insignia` informa UN estado, no una oferta con dos mitades.
 * Lo que nace no es el precio ni los días: **es el PAR**, que es la unidad con
 * la que se decide.
 *
 * ── LA REGLA DE EXISTENCIA ────────────────────────────────────────────────
 * Sin `valor` no hay oferta que mostrar. `PrecioText` ya trata `null`/
 * `undefined` con su propia voz honesta, así que **no se inventa acá un
 * segundo criterio**: la pieza delega y la pantalla decide si monta o no
 * (`LETRA_GUARDERIA` §5 declara la mensualidad como una de tres unidades de
 * cobro — día, paquete, mes —, así que un lugar sin mes es normal).
 *
 * ── ESCALERA (§4b) · DOSIS · TEMAS ────────────────────────────────────────
 * No muestra datos del expediente. Tokens puros, cero color propio; sirve a
 * las dos apps y a los tres temas sin variante. Sin animación (Ley 6).
 */

import { View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { PrecioText } from './PrecioText'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

export type FichaMensualidadProps = {
  /**
   * El patrón de días **ya compuesto por el riel de i18n**: «Lun–Vie».
   * Ver el encabezado: colapsar días es trabajo de idioma, no de esta pieza.
   */
  dias: string
  /** El precio del período. `null`/`undefined` los resuelve `PrecioText`. */
  valor: number | null | undefined
  /**
   * La unidad, en voz de la app: «el mes». Viaja a `PrecioText.porUnidad`.
   * 🔴 Por prop, como todo texto de esta pieza.
   */
  porUnidad: string
  /** Rótulo del grupo, si la pantalla lo necesita. */
  rotulo?: string
  /** Ver `FichaFranja.conSuperficie` — la pieza no decide su fondo. */
  conSuperficie?: boolean
}

export function FichaMensualidad({
  dias,
  valor,
  porUnidad,
  rotulo,
  conSuperficie = false,
}: FichaMensualidadProps) {
  const cuerpo = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      {/* Los días los escribió el riel en voz humana (Ley 3): DM Sans. */}
      <Texto variante="cuerpo">{dias}</Texto>

      {/* El precio es el dato que DECIDE: lo viste `PrecioText`, que existe
          para no volver a escribirlo a mano (su censo midió 53 sitios). */}
      <PrecioText valor={valor} registro="ficha" porUnidad={porUnidad} />
    </View>
  )

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {/* La superficie la pone `Tarjeta` — ver `FichaFranja`. */}
      {conSuperficie ? (
        <Tarjeta elevacion="reposo" relleno="amplio">
          {cuerpo}
        </Tarjeta>
      ) : (
        cuerpo
      )}
    </View>
  )
}
