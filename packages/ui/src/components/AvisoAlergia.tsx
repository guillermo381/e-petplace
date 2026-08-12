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
 * 🔴 S96-B · LA COMPOSICIÓN TIENE CUATRO ESTADOS · LA COINCIDENCIA, TRES
 * ══════════════════════════════════════════════════════════════════════
 * **Dos firmas del founder, en dos tandas del mismo día.** La pieza nació
 * con una unión de DOS y se quedó corta dos veces:
 *
 *     verificada · declarada_sin_verificar · ausente · no_aplica
 *
 * > **SOLO CALLAN `verificada` Y `no_aplica`** — y son DOS SILENCIOS
 * > DISTINTOS: una calla porque *cotejamos y está bien*, la otra porque
 * > **no hay nada que cotejar** (una bolsa de arena no tiene
 * > ingredientes). Las otras dos dicen su condición.
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
 * (`composicion` + `coincidencia`) y **deriva ella** si habla y con qué
 * tono. Devuelve `null` **solo cuando no hay nada que advertir Y el
 * silencio es de los dos legales**.
 *
 * *Nota de historia, porque el archivo se contradecía: esta línea decía
 * «el único silencio legal es `verificada` sin el alérgeno» y dejó de ser
 * cierta el día que entró `no_aplica`. **Un encabezado que contradice al
 * código desinforma más que uno ausente.***
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
 * ① **JAMÁS SILENCIO fuera de los dos silencios legales.** Arriba.
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
 * ── DOS REGISTROS VISUALES, CUATRO VOCES ───────────────────────────────
 * Las dos coincidencias (exacta e imprecisa) van en warning; los dos
 * estados de incertidumbre en superficie neutra, y **la VOZ los
 * distingue** — *"contiene pollo"* / *"podría ser pollo"* / *"no
 * verificamos esta lista"* / *"no tenemos la lista"*. Tres tonos para tres estados sería el tercer
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
 * Los CUATRO estados firmados. **Los nombres son los del founder a
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
  /** Lista verificada contra el fabricante. Puede callar. */
  | 'verificada'
  /** Hay lista, pero nadie la verificó — los 133 del catálogo real. */
  | 'declarada_sin_verificar'
  /** No tenemos los ingredientes, y deberíamos. */
  | 'ausente'
  /**
   * 🔴 S96-B · CUARTO ESTADO (firma del founder, tarea 3). La composición
   * de ingredientes **no es una categoría que aplique** — el caso medido:
   * las seis arenas sanitarias del catálogo real.
   *
   * **Calla, como `verificada`, PERO ES OTRO SILENCIO** y por eso es un
   * valor propio y no un alias: `verificada` calla porque *cotejamos y
   * está bien*; `no_aplica` calla porque **no hay nada que cotejar**.
   * *Meterlo en `ausente` sería peor que no tenerlo: la app le pediría
   * ingredientes a una bolsa de arena, y «no tenemos los ingredientes de
   * este producto» es absurdo ahí — un dato faltante que no falta.*
   */
  | 'no_aplica'

/**
 * 🔴 S96-B · LA COINCIDENCIA TIENE TRES VALORES (firma del founder,
 * tarea 2). El vocabulario de alérgenos pasó a 23 entradas **con
 * relaciones como DATO** (`cat_alergeno_relaciones`), y el motor ya
 * distingue exacta de imprecisa (`expandir_alergenos_a_vigilar` devuelve
 * `exacta: boolean`).
 *
 * **POR QUÉ UNA UNIÓN Y NO `contieneAlergeno` + `advertenciaImprecisa`,
 * que era la salida corta:** con dos booleans, *"no contiene pero es
 * imprecisa"* sería **expresable y no significa nada**. Un estado
 * inválido que compila es un estado que alguien va a mandar. Es el mismo
 * movimiento que `DestinoItem` (donde «donación para Thor» no compila) y
 * que `EstadoComposicion`: **el hecho tiene tres valores, y el tipo tiene
 * tres valores.**
 */
export type CoincidenciaAlergeno =
  /** Por lo que sabemos, no está. */
  | 'ninguna'
  /** El alérgeno declarado ES el de la mascota: *"contiene pollo"*. */
  | 'exacta'
  /**
   * El producto declara algo que **PODRÍA SER** el alérgeno —
   * `ave_no_especificada` para un alérgico al pollo. La voz cambia y la
   * pone la casa: *"contiene proteína de ave sin especificar, y podría
   * ser pollo"*, jamás *"contiene pollo"*.
   *
   * **El TONO no baja, y es decisión declarada:** va en el mismo registro
   * de warning que la exacta. *Bajarle el tono la volvería ignorable, y
   * el riesgo no es menor — si esa proteína ES pollo, le hace igual de
   * mal.* Lo que cambia es la VOZ, que es más preciso que un matiz: la
   * casa ya resolvió así los dos estados de incertidumbre (dos registros
   * visuales, cuatro voces).
   */
  | 'imprecisa'

export type AvisoAlergiaProps = {
  /** El HECHO, no lo que la pantalla quiere mostrar. */
  composicion: EstadoComposicion
  /**
   * 🔴 S96-B · DEJÓ DE SER UN BOOLEAN, y no es cosmético: **el hecho tiene
   * TRES valores.** Ver `CoincidenciaAlergeno`.
   */
  coincidencia: CoincidenciaAlergeno
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
  coincidencia,
  mensaje,
  detalle,
  entendido = false,
  onEntendido,
  etiquetaEntendido,
  etiquetaYaEntendido,
}: AvisoAlergiaProps) {
  const { theme } = useTheme()

  // ── LOS DOS SILENCIOS LEGALES ────────────────────────────────────────
  // `verificada` calla porque COTEJAMOS Y ESTÁ BIEN. `no_aplica` calla
  // porque NO HAY NADA QUE COTEJAR. Son dos silencios distintos con el
  // mismo píxel — y por eso son dos valores del tipo y no uno.
  // En TODO el resto la pieza habla, y la pantalla no tiene con qué
  // impedírselo.
  const hayAdvertencia = coincidencia !== 'ninguna'

  // ⚠️ DEFENSA EN PROFUNDIDAD, declarada: `no_aplica` CON un alérgeno
  // encontrado es incoherente, y A confirmó que la puerta lo rebota
  // (`no_aplica` con ingredientes presentes no pasa). Aun así esta pieza
  // NO asume que el dato llegó limpio: si esa combinación llegara igual,
  // **habla**. *Ante una incoherencia, el error barato es advertir de más
  // y el caro es callar — y acá el caro se paga en el cuerpo de una
  // mascota.* Por eso el silencio pide `!hayAdvertencia` en los DOS casos
  // y no confía en el estado solo.
  if (!hayAdvertencia && (composicion === 'verificada' || composicion === 'no_aplica')) return null

  const alerta = hayAdvertencia

  return (
    <View
      accessible
      // Hay algo que advertir = interrumpe (`alert`). No saber = importa
      // y NO interrumpe: el lector de pantalla también tiene que poder
      // distinguir "le hace mal" de "no lo sabemos".
      // ⚠️ EXACTA E IMPRECISA COMPARTEN `alert`, y es decisión: las dos
      // interrumpen porque el riesgo es el mismo — si esa proteína ES
      // pollo, le hace igual de mal. **La diferencia la dice la VOZ**, que
      // el lector lee entera; darle además un canal propio sería el
      // elemento haciendo doble turno (Ley 17.6).
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
