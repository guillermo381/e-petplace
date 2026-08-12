/**
 * AvisoAlergia — LA ALERGIA ADVIERTE, NO ESCONDE.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §5.4, enmienda firmada a
 * `MODELO_DESPENSA` §6 y §10: **exclusión dura en la RECOMENDACIÓN,
 * advertencia dura en la BÚSQUEDA.** La app jamás sugiere pollo para
 * Thor; si el dueño lo busca y lo encuentra, *se lo dice y lo deja
 * decidir*.
 *
 * ══════════════════════════════════════════════════════════════════════
 * 🔴 S96-B · SEGUNDA TANDA — LA COMPOSICIÓN TIENE TRES ESTADOS
 * ══════════════════════════════════════════════════════════════════════
 * **Firma del founder.** Esta pieza nació con una unión de DOS y era
 * insuficiente:
 *
 *     verificada · declarada_sin_verificar · ausente
 *
 * > **SOLO LA VERIFICADA PUEDE CALLAR.** Las otras dos dicen su
 * > condición.
 *
 * **La razón, medida sobre el catálogo real y no supuesta:** *133
 * productos tienen composición presente y lista de alérgenos INCOMPLETA*
 * — Royal Canin Medium Adulto lleva aceite de pescado y no declara
 * pescado. **El silencio de esos 133 se ve IDÉNTICO al silencio
 * confiable**, y romper esa confusión es exactamente para lo que existe
 * la tercera rama. *Con dos estados, "no aparece pollo en la lista" y
 * "confiamos en que no tiene pollo" eran la misma pantalla.*
 *
 * ── LA PIEZA SE NIEGA A CALLAR, y ése es el cambio de fondo ────────────
 * No recibe un `modo` que la pantalla elige: recibe los **HECHOS**
 * (`composicion` + `contieneAlergeno`) y **deriva ella** si habla y con
 * qué tono. **El único silencio legal es `verificada` sin el alérgeno**,
 * y es el único caso en que devuelve `null`.
 *
 * Montada con `declarada_sin_verificar`, **la pantalla no tiene forma de
 * hacerla callar** — no existe la prop. *Antes, "qué se muestra" era una
 * decisión de la pantalla; ahora es una consecuencia del dato.*
 *
 * ⚠️ **SU LÍMITE, declarado para que nadie lo descubra tarde:** esta
 * pieza no puede obligar a que la MONTEN. Si una pantalla decide no
 * renderizarla, calla igual. Ese hueco no se cierra desde un componente
 * — es candidato de regla de lint, no de prop.
 *
 * ── LOS TRES CANDADOS ──────────────────────────────────────────────────
 *
 * ① **JAMÁS SILENCIO fuera de `verificada`.** Arriba.
 *
 * ② **NO SE APAGA POR UNA PROMOCIÓN.** No hay prop para ocultarla ni
 *    para bajarle el tono: el motor de alertas manda sobre el de
 *    beneficios, siempre.
 *
 * ③ **NO SE APAGA POR EL NOMBRE DEL PRODUCTO** *(corolario de la firma
 *    de hoy)*. **Medido: 10 productos se llaman "hypoallergenic" o
 *    "sensitive" y traen un alérgeno común adentro.** La advertencia se
 *    dispara por COMPOSICIÓN y jamás por nombre — y por eso **esta pieza
 *    no tiene prop de nombre de producto**: no hay por dónde pasarle el
 *    dato con el que alguien podría querer silenciarla. *Un producto que
 *    se llama hipoalergénico y lleva pollo es exactamente el caso que
 *    esta pieza existe para atrapar; dejarle el nombre a la vista sería
 *    darle a la pantalla la tentación de confiar en él.*
 *
 * ── DOS REGISTROS VISUALES, TRES VOCES ─────────────────────────────────
 * `contiene` va en warning; los otros dos en superficie neutra, y **la
 * VOZ los distingue** — *"no verificamos esta lista"* no es lo mismo que
 * *"no tenemos la lista"*. Tres tonos para tres estados sería el tercer
 * peso que no informa (Ley 19.7): la palabra es más precisa que un matiz,
 * y es el mismo criterio con el que `EscaleraEstados` no distingue hecho
 * de actual en su tira compacta.
 *
 * Lo que NO cambia: **el paso explícito** (*"con un paso explícito de
 * entendimiento que queda registrado"*) — el componente no registra nada,
 * avisa con `onEntendido` y la pantalla escribe. TINTE, JAMÁS FILL (R20).
 *
 * ── CANDIDATO A SEGUNDO CONSUMIDOR, declarado y NO construido ──────────
 * §5.5 (*"tu veterinario recomendó X para Thor"*) tiene la misma
 * anatomía. **Se ENSANCHA con su voz, jamás se clona** (§6 del método).
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * Los tres estados firmados. **Los nombres son los del founder a
 * propósito** — si acá se llamaran distinto, cada pantalla tendría que
 * traducir, y una traducción por consumidor es donde nace la divergencia.
 *
 * ⚠️ **SU PRODUCTOR NO EXISTE TODAVÍA** (medido en S96-B, y D lo midió
 * por su lado y coincide): `productos` tiene `alergenos text[]` e
 * `ingredientes_activos text[]`, **sin ninguna marca de verificación**.
 * Desde los datos de hoy lo declarado es a lo sumo
 * `declarada_sin_verificar` y el array vacío es `ausente` — **nadie puede
 * derivar `verificada`**. La forma existe y espera su dato; ese hueco es
 * del motor y está reportado a la mesa. *Es el inverso del "motor sin
 * puerta": acá la puerta está y falta el motor.*
 */
export type EstadoComposicion =
  /** Lista verificada contra el fabricante. **La única que puede callar.** */
  | 'verificada'
  /** Hay lista, pero nadie la verificó — los 133 del catálogo real. */
  | 'declarada_sin_verificar'
  /** No tenemos los ingredientes. */
  | 'ausente'

export type AvisoAlergiaProps = {
  /** El HECHO, no lo que la pantalla quiere mostrar. */
  composicion: EstadoComposicion
  /** El alérgeno de la mascota aparece en la lista declarada. */
  contieneAlergeno: boolean
  /**
   * LA VOZ DE LA CASA, con el nombre de la mascota y el del alérgeno:
   * *"Thor es alérgico al pollo y este alimento lo contiene."* La compone
   * la pantalla — acá no se arma ninguna frase sobre una mascota.
   */
  mensaje: string
  detalle?: string
  /**
   * El paso explícito ya ocurrió. Con `true` el control desaparece: la
   * decisión ya se tomó y volver a pedirla sería un muro, no un aviso.
   */
  entendido?: boolean
  /** Ausente = el aviso INFORMA y no pide nada. */
  onEntendido?: () => void
  /** La voz del control y de su confirmación. */
  etiquetaEntendido?: string
  etiquetaYaEntendido?: string
}

export function AvisoAlergia({
  composicion,
  contieneAlergeno,
  mensaje,
  detalle,
  entendido = false,
  onEntendido,
  etiquetaEntendido,
  etiquetaYaEntendido,
}: AvisoAlergiaProps) {
  const { theme } = useTheme()

  // ── EL ÚNICO SILENCIO LEGAL ──────────────────────────────────────────
  // Lista verificada y el alérgeno no está: acá callar es honesto, porque
  // alguien fue a verificarlo. En TODO el resto la pieza habla, y la
  // pantalla no tiene con qué impedírselo.
  if (composicion === 'verificada' && !contieneAlergeno) return null

  const alerta = contieneAlergeno

  return (
    <View
      accessible
      // Contiene el alérgeno = interrumpe (`alert`). No saber = importa y
      // NO interrumpe: el lector de pantalla también tiene que poder
      // distinguir "le hace mal" de "no lo sabemos".
      // (`status` sería el rol exacto y RN no lo tiene — su unión no lo
      // incluye. `text` es el que la plataforma da para "contenido que se
      // anuncia sin cortar"; se declara para que nadie lo "corrija".)
      accessibilityRole={alerta ? 'alert' : 'text'}
      style={{
        gap: spacing[2],
        padding: spacing[4],
        borderRadius: radius.suave,
        // Tinte + borde, jamás fill (R20). Los dos estados de
        // incertidumbre comparten registro: los distingue la VOZ.
        backgroundColor: alerta ? theme.status.warningBg : theme.bg.overlay,
        borderWidth: theme.border.width,
        borderColor: alerta ? theme.status.warningBorder : theme.border.default,
      }}
    >
      <Texto variante="cuerpo" color={alerta ? 'warning' : 'secondary'}>
        {mensaje}
      </Texto>
      {detalle === undefined ? null : <Texto variante="apoyo">{detalle}</Texto>}

      {onEntendido === undefined || etiquetaEntendido === undefined ? null : entendido ? (
        etiquetaYaEntendido === undefined ? null : (
          <Texto variante="apoyo">{etiquetaYaEntendido}</Texto>
        )
      ) : (
        <View style={{ alignSelf: 'flex-start', paddingTop: spacing[1] }}>
          <Boton variante="compacto" onPress={onEntendido} etiqueta={etiquetaEntendido} />
        </View>
      )}
    </View>
  )
}
