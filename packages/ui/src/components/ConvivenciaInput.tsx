/**
 * ConvivenciaInput — LA CARA QUE ESCRIBE LOS TRES ESTADOS (S112-B, B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **«TODAVÍA NO SE SABE» ES UNA RESPUESTA, NO LA AUSENCIA DE UNA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hermana de `Convivencia`: aquélla LEE, ésta ESCRIBE, y las dos hablan el
 * mismo vocabulario porque importan `EstadoConvivencia` del mismo archivo.
 *
 * ── EL CENSO QUE ORDENÓ ESTA PIEZA (protocolo 1c) — Y CAMBIÓ QUÉ ERA ──────
 * El pedido decía «los tres botones del mismo peso por eje». **La casa ya
 * tiene ese control y no hacía falta escribirlo:** `SelectorSegmentado` con
 * `proposito="eleccion"` da 2-3 alternativas excluyentes de un mismo eje,
 * con la exclusividad hecha FORMA (un riel, una superficie que se mueve) y
 * con semántica `radiogroup`/`radio` — no `tablist`. *«Del mismo peso» no es
 * una instrucción de pintura: es lo que un riel único ya garantiza, y lo que
 * tres botones sueltos no pueden garantizar por más que se pinten iguales.*
 *
 * ⇒ **Esta pieza NO es un control. Es la composición que ata el control al
 * vocabulario** — y todo lo que aporta es que el estado equivocado no se
 * pueda expresar.
 *
 * 📌 **Y aporta un dato que la mesa estaba esperando, sin decidir nada:**
 * `SelectorSegmentado` declara en su cabecera un desvío abierto desde S82
 * —*«queda abierto si nace una entrada nueva del diccionario para elegir
 * entre 2-3 alternativas excluyentes de un mismo eje»*—. Convivencia es el
 * **segundo caso independiente** de exactamente eso, en otro oficio y con
 * otro founder de por medio. *Un desvío con dos casos deja de ser desvío y
 * pasa a ser una entrada que falta.* La decisión es de mesa; acá sólo queda
 * el segundo caso anotado donde la mesa lo va a encontrar.
 *
 * ── 🔴 EL ROJO DE ESTA PIEZA: LO QUE NO SE PUEDE DIBUJAR ──────────────────
 * 1. **Un boolean.** `estado: true` no compila (`TS2322`): el eje pide
 *    `EstadoConvivencia`, y `true` no es ninguno de los tres.
 * 2. **Un cuarto estado.** `estado: 'quizas'` no compila, por lo mismo.
 * 3. **Un eje sin estado.** `estado` es obligatoria: no existe «todavía no
 *    lo declaró» distinto de `no_se_sabe`. **Ése es el punto entero:** el
 *    tercer estado ES la ausencia, hecha explícita y con voz. Si además
 *    hubiera un `undefined`, volveríamos a tener dos formas de no saber —
 *    una dicha y otra callada— y la callada se dibujaría como un hueco.
 * 4. **Un estado sin voz.** `voces` es `Record<EstadoConvivencia, string>`:
 *    faltar una es `TS2739` en la pantalla que lo monta.
 *
 * ⚠️ **Lo que este contrato NO impide, dicho entero (`L-459`):** que la
 * pantalla mande el eje equivocado a la columna equivocada. `eje` es la
 * clave con la que la pantalla escribe, y la pieza no conoce columnas. Eso
 * lo cierra el motor, no el diseño.
 *
 * ── LA LETRA QUE CUMPLE, con su número ───────────────────────────────────
 * · **N11′** — la etiqueta de cada eje va **AFUERA Y ARRIBA**, visible y del
 *   mismo tamaño siempre: se monta `EtiquetaDeCampo`, la pieza compartida,
 *   jamás una copia. Su aire a la caja lo pone ella misma.
 * · **N11′ (los números que evitan que la etiqueta se despegue)** — entre un
 *   eje y el siguiente van **24 px** (`spacing[6]`), que es el mínimo que la
 *   ley pide, contra los 6-8 px de la etiqueta a SU control. La proporción
 *   es la ley: la etiqueta tiene que estar inequívocamente más cerca de su
 *   riel que del riel de arriba.
 * · **N24** — el control no cambia el tamaño de lo que lo contiene: los tres
 *   segmentos viven en un riel de alto fijo, y elegir no mueve nada.
 * · **N23** — el color marca clase: la elegida se marca por la superficie
 *   del riel (forma), no tiñendo texto por importancia.
 * · **Ley 3** — cero diccionario adentro: las tres palabras son obligatorias
 *   y las trae la pantalla.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La ficha de edición del adoptable, tab **Mascotas** del portal del refugio
 * (C7). **Entregada y no montada hasta que esa pantalla exista.**
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { EtiquetaDeCampo } from './Campo'
import { SelectorSegmentado } from './SelectorSegmentado'
import type { EstadoConvivencia } from './Convivencia'

/**
 * Un eje: con quién convive, cómo se llama en pantalla, y en qué estado
 * está HOY. `estado` obligatoria — ver el rojo 3 de la cabecera.
 */
export type EjeConvivencia<E extends string> = {
  /** La clave con la que la pantalla escribe. La pieza no la interpreta. */
  eje: E
  /** Visible, arriba del riel (N11′). Ej.: «Con perros». */
  etiqueta: string
  estado: EstadoConvivencia
}

export type ConvivenciaInputProps<E extends string> = {
  /** Los ejes, en el orden en que la pantalla los quiera. */
  ejes: EjeConvivencia<E>[]
  /**
   * Las tres palabras. **`Record` y no un objeto a mano**: es lo que hace
   * que un cuarto estado rompa acá, en la pantalla que tendría que decidir
   * cómo se llama, y no en silencio adentro de la pieza.
   */
  voces: Record<EstadoConvivencia, string>
  onCambio: (eje: E, estado: EstadoConvivencia) => void
}

/**
 * El orden es SEMÁNTICO y por eso vive en la pieza, no en la pantalla:
 * afirmación · negación · lo que todavía no se sabe. Que una ficha ponga
 * «no se sabe» primero y otra al final haría que dos fichas del mismo
 * refugio se leyeran distinto.
 *
 * ⚠️ Ésta es una de las **dos líneas** que un cuarto estado dejaría sin
 * actualizar (la otra es `ConvivenciaCon`). El `Record` de arriba obliga a
 * pasar por acá; el tipo de esta constante, no.
 */
const ORDEN: readonly EstadoConvivencia[] = ['si', 'no', 'no_se_sabe']

export function ConvivenciaInput<E extends string>({
  ejes,
  voces,
  onCambio,
}: ConvivenciaInputProps<E>) {
  return (
    // 24 px entre ejes (N11′). El aire de la etiqueta a SU riel lo pone
    // `EtiquetaDeCampo` con su propio `marginBottom`: si se escribiera acá,
    // los dos números convivirían y alguien movería uno solo.
    <View style={{ gap: spacing[6] }}>
      {ejes.map((eje) => (
        <View key={eje.eje}>
          <EtiquetaDeCampo>{eje.etiqueta}</EtiquetaDeCampo>
          <SelectorSegmentado
            segmentos={ORDEN.map((estado) => ({
              codigo: estado,
              etiqueta: voces[estado],
            }))}
            activo={eje.estado}
            /* El `codigo` vuelve como `string` porque el control es genérico
             * sobre cualquier segmento. Se re-estrecha acá, en el único lugar
             * que sabe que estos tres códigos SON los tres estados — y la
             * lista de la que salieron es `ORDEN`, así que no puede llegar
             * otro. Sin esta línea, `onCambio` de la pantalla recibiría un
             * `string` cualquiera y el tipo del padre no protegería nada. */
            onCambio={(codigo) => onCambio(eje.eje, codigo as EstadoConvivencia)}
            /* Mismo texto que la etiqueta visible: el grupo tiene que
             * anunciarse igual que se lee, no con una versión propia. */
            etiqueta={eje.etiqueta}
            /* Acá NO se cambia de vista: se elige un valor de un eje. Con
             * `'vista'` el lector de pantalla anunciaría «pestaña» sobre un
             * dato del animal, que es falso y no lo arregla ningún color. */
            proposito="eleccion"
          />
        </View>
      ))}
    </View>
  )
}
