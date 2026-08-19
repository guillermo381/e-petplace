/**
 * TarjetaProducto — UN PRODUCTO EN LA VITRINA, y el `+` que lo agrega
 * sin abrir nada (S100-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA FIRMA QUE LA ORDENA (founder, 17-ago): **premium · vitrina a DOS
 * columnas · AGREGAR SIN ABRIR DETALLE.**
 * El mecanismo se toma de **Instacart** (grid + quick-add); lo que su
 * superficie tiene y nuestra ley prohíbe —rankings, urgencia, moneda
 * visible— **queda entero afuera** (§0.2 de `DIRECCION_DISEÑO_S99`).
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LEY 11 · POR QUÉ NACE Y NO SE REUSA `Baldosa` ──────────────────
 * Relevado antes de crear: `Baldosa` es **la pieza de lo que se ELIGE**
 * y su contrato **exige `glifo` y `capa`** — un canto de CATEGORÍA de
 * oficio y un glifo de SERVICIO (Ley 10/12). Un saco de alimento no
 * tiene oficio ni servicio: **tiene foto, precio y stock.** Montarlo en
 * `Baldosa` obligaría a inventarle una capa, que es *mentir una prop
 * para lograr una combinación legítima* — y la casa ya declaró que
 * cuando eso pasa **el defecto es de la pieza** (§12.2, S91).
 *
 * ✅ **Lo que SÍ se reusa, y es lo que importaba: la GRILLA.** El patrón
 * de dos columnas sale de `grilla-de-dos.ts` —la misma geometría medida
 * que usa `Baldosa`—, así que las dos familias de tarjeta caen en la
 * misma retícula sin que nadie las sincronice a mano.
 *
 * ── EL `+` ES EL TIMBRE DE LA CASA ─────────────────────────────────
 * **Siempre en la misma esquina** (abajo a la derecha), en todas las
 * tarjetas, sin importar el alto del nombre. *La mano lo encuentra sin
 * mirar* — y por eso su posición es **ley de la pieza y no composición
 * del consumidor**: nadie lo re-ubica.
 *
 * **Al agregar, el `+` MUTA A STEPPER** (`− 1 +`), 150 ms —
 * `motion.duration.fast`, la banda micro de N10. **No aparece un control
 * nuevo al lado: el mismo control cambia de forma**, que es lo que hace
 * que la acción se sienta directa y no como un formulario.
 *
 * ⏪ **ENMENDADO S100b-B — esta línea decía «en el lugar» y hoy es falso.**
 * El stepper **baja a su propia fila**, porque en la caja de 138 dp no
 * entran precio + stepper en el mismo renglón (la aritmética está en el
 * cuerpo, sobre el ancla). *Se corrige acá en vez de dejarlo dicho de
 * menos: una constante y su comentario divergiendo no rompe nada, y por
 * eso sobrevive —el código sigue funcionando y la prosa sigue mintiendo*
 * (D-790). **Lo que NO cambió es la ley: sigue siendo UN control que
 * cambia de forma, y sigue anclado al mismo borde derecho.**
 *
 * ⏪ **RE-ENMENDADO S100d-B — «en el lugar» VUELVE A SER VERDAD, y por eso
 * esta nota se conserva en vez de borrarse.** El control tiene **su propio
 * escalón, siempre**: el `+` y el stepper viven en el MISMO renglón, con el
 * mismo alto y el mismo borde derecho, y **el precio subió a su propia
 * línea**. *Lo que bajó no fue el control: fue el precio.* La cuenta que lo
 * vuelve forzado —tres blancos de 44 son 132 en una caja de 138— está en el
 * cuerpo, sobre el ancla, junto con lo que deroga de S100b y S100c.
 *
 * ── 🔴 EL NOMBRE: DOS LÍNEAS MÁXIMO — adjudicación de mesa ─────────
 * C midió el catálogo real (563 nombres): **42 % EN MAYÚSCULAS** ·
 * **18 % pasan los 40 caracteres** · **máximo 81** · y dos categorías
 * donde es la norma (`acondicionador_agua` 88 %, `higiene` 45 %).
 *
 * ⏪ **Mi primera lectura fue que la tarjeta quedaba chica** y dejé el
 * nombre creciendo sin techo (precedente `Celda.tituloEntero`).
 * **LA MESA LO DIO VUELTA, y su razón es mejor que la mía:** esos
 * números **no dicen que la tarjeta sea chica — dicen que esos nombres
 * no están curados.** *«Acondicionador de agua para acuario Marca X
 * 250 ml» es un nombre de CATÁLOGO, no un nombre de VITRINA.*
 *
 * ⇒ **Las dos columnas se sostienen. Nombre curado en 2 líneas · la
 * presentación en SU PROPIA línea** (jamás compitiendo con el nombre
 * por el mismo renglón, porque **la presentación es dato que decide la
 * compra**) · **el nombre largo completo vive en la ficha.**
 *
 * ⏪ **S100d·bis — «su propia línea» CAMBIA DE VECINO, no de rango.** Por
 * palabra del founder la presentación **baja a compartir renglón con el
 * control** (*«la cantidad abajo, junto a la presentación»*). **Lo que la
 * cláusula protegía sigue protegido:** no comparte renglón **con el
 * nombre**, que era el vecino que se la comía. *Y sigue sin truncarse
 * nunca: cuando no entra, envuelve* — la aritmética y su acreedor están
 * en el cuerpo, sobre el ancla.
 * ⛔ Prohibido resolverlo encogiendo la letra o truncando la
 * presentación.
 *
 * > *Dimensionar la pieza para el peor dato sin curar es dejar que el
 * > dato malo decida la forma de la casa.* La medición seguía siendo
 * > correcta; lo que estaba mal era **qué concluía de ella**.
 *
 * ⚠️ **LA CONSECUENCIA HONESTA, declarada y no escondida: hasta que los
 * nombres se curen, ~18 % se va a ver cortado en la vitrina** (y en
 * `acondicionador_agua`, casi todos). **Eso es deuda de DATOS con dueño
 * fuera de esta pieza, no un defecto de forma** — y se dice acá para
 * que nadie lo lea como que la tarjeta falla.
 *
 * ✅ **EL PRECIO Y EL `+` SE ANCLAN ABAJO** (`marginTop: 'auto'`). Las
 * dos tarjetas de una fila comparten alto, así que **los precios quedan
 * alineados aunque un nombre ocupe una línea y el otro dos.** *Sin ese
 * ancla cada precio flota a la altura que le tocó, y la columna deja de
 * poder compararse de un vistazo — que es para lo que existe la grilla.*
 *
 * ── SIN STOCK: EL CARTEL VA EN LA PUERTA ───────────────────────────
 * Foto atenuada + etiqueta **DENTRO de la tarjeta**, y el `+` no se
 * dibuja. *El cartel de cerrado va en la puerta del local, no en la
 * vereda:* una lista que avisa la falta en otro lado obliga a leer dos
 * lugares para saber si se puede comprar.
 *
 * 🔴 **`hayStock` ES BOOLEANO Y JAMÁS UN NÚMERO** (firma S99): la
 * familia necesita *«¿puedo comprar esto?»*, no el inventario ajeno.
 * La prop no acepta cantidad **por construcción** — así el número no
 * puede llegar a esta superficie ni por descuido.
 *
 * ── 🔴 EL ACOPLAMIENTO QUE VIAJA CON ESTA PIEZA (declarado por C) ───
 * **El `nombre` llega YA CURADO** — hoy lo cura `nombreCurado`, que vive
 * en `apps/cliente/src/lib/despensa/` porque es donde se consume. **La
 * pieza recibe el resultado y no sabe de eso**, y está bien que no sepa.
 *
 * ⚠️ **PERO EL DÍA QUE EL ESPEJO DEL VENDEDOR MONTE ESTA MISMA PIEZA
 * (N17: una fuente, N consumidores), `nombreCurado` TIENE QUE SUBIR CON
 * ELLA.** Si el espejo la monta y le pasa el nombre CRUDO, **el vendedor
 * y la familia van a ver nombres distintos del mismo producto** — que es
 * exactamente el defecto H-001 con otro disfraz: *dos superficies
 * pintando el mismo dato y desacordando sin síntoma*.
 *
 * **Y el porqué del cuidado, medido:** 42 % del catálogo viene EN
 * MAYÚSCULAS (`CANADA LITTER`). *La curación no agrega palabras —cambia
 * la caja—, pero si una sola de las dos caras la aplica, el desacuerdo
 * es visible y nadie sabe cuál es el nombre real.*
 *
 * ⇒ **No es trabajo de hoy: es una condición de la próxima mudanza**, y
 * se escribe acá porque *el lugar donde se lee al construir es la pieza,
 * no la bitácora de quien lo descubrió.*
 *
 * ── LAS DOS TEMPERATURAS · TEMAS Y REDUCE-MOTION, al nacer ─────────
 * **Tres temas: resuelven solos.** `warning` y `secondary` son slots del
 * tema —no hay un solo color escrito acá—, así que light, dark y
 * **memorial** salen de sus propios tokens. *En memorial el acento cae a
 * tinta por el slot, que es la degradación correcta: un memorial no
 * necesita menos honestidad, necesita menos estridencia.*
 *
 * **`reduce-motion`: NADA QUE DEGRADAR, y se declara en vez de omitirse.**
 * La señal **no anima**: aparece con el dato y se va con él. *Una pieza
 * que no mueve no necesita el hook — pero sí necesita decir que lo
 * pensó, porque el silencio en esta línea se lee como olvido* (N15: toda
 * pieza nueva declara sus tres temas y su conducta con la preferencia).
 *
 * ⛔ **Ninguna de las dos se colapsa JAMÁS dentro de un acordeón**, ni en
 * tarjeta ni en ficha. *Plegar una advertencia de salud la convierte en
 * nota al pie, y el acordeón dice «esto es opcional».*
 *
 * ── LO QUE ESTA PIEZA NO HACE ──────────────────────────────────────
 * No sabe de carrito (recibe `cantidad` y avisa), no formatea precio
 * (`PrecioText`), no decide el orden de la grilla, y **no lista
 * composición ni alérgenos**: no entran sin volverse ilegibles, y
 * **medio dato de alergia es peor que ninguno** — viven en la ficha, a
 * un toque (N19 ④).
 *
 * ⏪ **ENMENDADO S100-B:** esta línea decía *«no muestra composición ni
 * alérgenos»* y quedó corta cuando entró `alergia`. **La distinción que
 * la salva —y que es la que autoriza el ensanche— es entre LISTAR y
 * SEÑALAR:** la tarjeta **no lista** ingredientes (eso sí sería medio
 * dato), pero **sí dice que hay un conflicto**, que es una señal
 * COMPLETA. *Una advertencia de salud recortada a la mitad es peligrosa;
 * una advertencia entera que remite al detalle, no.*
 */

import { Image, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import {
  temperaturaDeAlergia,
  type CoincidenciaAlergeno,
  type EstadoComposicion,
} from './AvisoAlergia'
import { Icono } from './Icono'
import { PrecioText } from './PrecioText'
import { ALTO_STEPPER_ANCHO, StepperCantidad } from './StepperCantidad'
import { Boton } from './Boton'
import { Mutacion } from './Mutacion'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'
import { opacity } from '../tokens/opacity'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/* 🔴 LA FOTO PASA A 1:1 — S100b-B, y la razón es que el asset manda.

   ⏪ **Era 4:3, heredado de la portada de la vitrina del prestador**
   (§12.1). Ese 4:3 es correcto **para una foto de un LUGAR**, que es lo
   que aquella portada muestra. **Un packshot no es una foto de un lugar.**

   **Lo que decidió el cambio son dos `[SPEC]` independientes del
   benchmark, no una preferencia:**
   · **eBay Playbook — 1:1, *«our dominant and recommended ratio»***.
   · **Instacart (catálogo de grocery, el análogo más cercano al nuestro)
     — 1:1, mínimo 600×600, fondo blanco puro, y el producto llenando el
     85 % del área.**

   ⇒ **Las galerías de marca entregan cuadrado.** Con la caja en 4:3 y
   `cover`, un packshot cuadrado conforme **pierde el 25 % de su alto**:
   se recorta arriba y abajo, justo donde vive el producto que llena el
   85 %. *El defecto no se habría visto hoy —con dos tercios del catálogo
   sin foto— sino EXACTAMENTE el día que llegaran las fotos buenas.* Eso
   es lo contrario de que la forma espere al dato.

   **LO QUE NO CAMBIA, y es por lo que la relación sigue siendo FIJA:**
   con relación fija el marco existe antes que la foto, así que la grilla
   **no salta al cargar** (N16 ③).

   ⚠️ **EL COSTO, DECLARADO Y NO ESCONDIDO: la tarjeta crece ~41 dp de
   alto** (la foto pasa de 123 a 164 sobre una tarjeta de 164 de ancho).
   La tarjeta ya era alta —305 dp medidos, más que la fila de ancho
   completo de Laika (271)—, así que **el bloque de texto queda como el
   siguiente candidato de la re-derivación**. *Se declara acá en vez de
   compensarlo encogiendo la letra, que es justo lo que la cabecera de
   esta pieza prohíbe.* Su juez es el ojo en dispositivo. */
const RELACION_FOTO = 1
/** ⏪ **ERA 12, con esta razón: *«comprar 30 sacos es un caso de ficha, no de
 *  grilla: acá el gesto es lo quiero, no cuántos»*. S100d·bis LA DEROGA con
 *  un caso real del founder:** *«a veces compro barf y pido 50 unidades»*.
 *  **La premisa era falsa para una clase entera de producto** —la comida
 *  cruda se compra por volumen— y el tope la volvía inalcanzable desde la
 *  grilla sin que nada lo explicara.
 *
 *  **99 no es un número de negocio: es de LEGIBILIDAD** (dos cifras en el
 *  control). 🔴 **El límite real es el STOCK, y no lo aplica esta pieza:** no
 *  lo conoce —`hayStock` es booleano por firma— así que lo acota el motor con
 *  `LEAST(pedido, disponible)` y la pantalla lo dice con un aviso efímero. */
/** EL ALTO DEL ESCALÓN DEL CONTROL — N24 (S100c-B), re-encuadrado en S100d-B.
 *
 *  Se DERIVA del alto real del stepper compacto: no es un `36` tecleado. *Si
 *  el stepper cambia de alto, el escalón lo sigue solo* — que es la
 *  diferencia entre derivar y emparejar a mano (L-284).
 *
 *  ⏪ Nació como **el lugar RESERVADO** de un control que vivía un piso más
 *  abajo. Hoy no reserva nada: **es el renglón donde el control VIVE**, en
 *  los dos estados. *La constante no cambió de valor ni de origen; cambió de
 *  trabajo, y se dice acá porque su nombre viejo describía el otro.* */

const TOPE_EN_VITRINA = 99

export interface TarjetaProductoProps {
  nombre: string
  /** «2.3 kg», «Sobre 85 g» — el dato que distingue dos filas del mismo
   *  producto. Va junto al nombre porque **sin él dos variantes se ven
   *  idénticas** (N19 ②). */
  presentacion?: string
  /**
   * La marca, en su propia línea bajo el nombre (S100-B · brecha medida
   * contra la tarjeta local del espejo del vendedor, que ya la mostraba).
   *
   * **Va aparte y no pegada al nombre** por la misma razón que la
   * presentación: son tres datos distintos y **el que se pierde cuando
   * comparten renglón es siempre el último**. `null`/`undefined` = no se
   * dibuja (19.9).
   */
  marca?: string | null
  precio: number | null
  /** Ya formateado — ver `PrecioText.porUnidad`. */
  precioPorUnidad?: string
  fotoUrl?: string
  /**
   * 🔴 **LA COMPRA, COMO UNIÓN DISCRIMINADA** (S100-B · lo que destrabó
   * la migración del espejo).
   *
   * **El caso que la obligó:** el espejo del vendedor monta esta misma
   * pieza (N17) **y ahí no hay carrito** — el vendedor no compra su
   * propio producto. Con las props sueltas y obligatorias, el espejo
   * tenía que pasar `cantidad={0}`, `onAgregar={() => {}}` y un
   * `hayStock` inventado **solo para que el `+` no se dibujara**.
   *
   * ⇒ Eso es *mentir una prop para lograr una combinación legítima*, y
   * **la casa ya declaró que cuando eso pasa el defecto es de la pieza**
   * (§12.2, S91) — lo tenía escrito en mi propia cabecera, tres párrafos
   * más arriba, como razón para NO reusar `Baldosa`. *Me lo cobré a mí
   * misma.*
   *
   * **Con la unión, «tarjeta de vitrina sin carrito» no compila y
   * «espejo con `+`» tampoco.** Es el mismo movimiento que
   * `SelectorDestinoItem`, donde «donación para Thor» es inexpresable.
   *
   * ⚠️ **Por qué unión y no props opcionales:** con opcionales, olvidar
   * el carrito en la vitrina real **compilaría** y el `+` desaparecería
   * en silencio — el mismo agujero que la `advertencia?: string` que
   * rechacé hace dos lotes. *La forma tiene que hacer imposible el
   * olvido, no confiar en que nadie olvide.*
   */
  compra:
    | {
        modo: 'vitrina'
        /** 🔴 BOOLEANO, jamás un número (ver la cabecera). */
        hayStock: boolean
        /** Cuántos hay en el carrito. `0` = el control es el `+`. */
        cantidad: number
        /** El `+`. Con `cantidad > 0` la pieza monta el stepper. */
        onAgregar: () => void
        onCambiarCantidad: (cantidad: number) => void
      }
    /** El ESPEJO del vendedor: **no hay carrito que ofrecer.** No es
     *  «vitrina con la compra apagada» — es otra cosa, y por eso es otro
     *  brazo y no un flag. */
    | { modo: 'espejo' }
  /**
   * El resumen del VEREDICTO de completitud (N18), en la cara
   * ADMINISTRAR del espejo — *«Sin stock», «Le faltan 2»*.
   *
   * ⏪ La dejé afuera en el primer corte **por no tener el caso**, y era
   * lo correcto: *no se firma una pieza contra un caso imaginado*. Entra
   * ahora **con su caso medido**: el renderer del espejo la monta, y
   * **la cara CLIENTE la deja en `null`** — el veredicto es del vendedor
   * y la familia no lo ve. *La separación ya estaba bien hecha del otro
   * lado; esta prop solo deja de romperla.*
   */
  alcance?: string | null
  /** Abrir la ficha. La FOTO y el NOMBRE llevan acá; el `+` no. */
  onPress: () => void
  /**
   * 🔴 LA ADVERTENCIA DE ALERGIA — **para la BÚSQUEDA** (ensanche S100-B,
   * pedido por C con su caso).
   *
   * **La letra que lo obliga** (`MODELO_DESPENSA`, enmienda S96):
   * ***«exclusión dura en la RECOMENDACIÓN, advertencia dura en la
   * BÚSQUEDA»***. En vitrina y recomendación esta prop **no va**: la
   * vitrina se ve sin mascota (no hay contra qué advertir) y la
   * recomendación **excluye en el motor**. En BÚSQUEDA sí: si la familia
   * busca pollo para un perro alérgico al pollo, **se lo mostramos y se
   * lo decimos.**
   *
   * ── ⚖️ POR QUÉ RECIBE LOS HECHOS Y NO UN TEXTO ────────────────────
   * C propuso `advertencia?: string`, y **el QUÉ era correcto pero esa
   * forma reabre un agujero que la casa ya había cerrado**: con un texto
   * opcional, `undefined` sería silencio legal **en todos los casos** —
   * incluido `ausente`, que es *«no tenemos los ingredientes»*.
   * `AvisoAlergia` cerró eso por construcción (*«la pantalla no tiene
   * prop para hacerla callar»*), y una segunda forma de decir alergia
   * con menos estados **habría dejado callar donde la otra habla**.
   *
   * ⇒ Recibe **los mismos hechos tipados** y **el silencio lo decide
   * `alergiaPuedeCallar`, la MISMA función que usa `AvisoAlergia`**. Las
   * dos piezas no pueden discrepar.
   *
   * **Lo que la tarjeta muestra es la SEÑAL, no el detalle** — y eso
   * respeta el *«medio dato de alergia es peor que ninguno»*: no se
   * lista composición truncada; se dice **que hay un conflicto**, que es
   * una señal COMPLETA. El detalle y el paso de entendimiento viven en
   * la ficha, con `AvisoAlergia` entero.
   */
  alergia?: {
    composicion: EstadoComposicion
    coincidencia: CoincidenciaAlergeno
    /**
     * La voz CORTA de la casa, compuesta por la pantalla — *«Contiene
     * pollo»*, *«Sin composición declarada»*. **Corta y no el mensaje
     * largo de la ficha**: en media pantalla una frase con el nombre de
     * la mascota se vuelve tres líneas y tapa el producto.
     * *La voz la arma quien conoce el expediente; la pieza no lo conoce
     * y no arma frases sobre una mascota* (mismo contrato que
     * `AvisoAlergia.mensaje`).
     */
    senal: string
  }
}

export function TarjetaProducto({
  nombre,
  marca,
  presentacion,
  precio,
  precioPorUnidad,
  fotoUrl,
  compra,
  alcance = null,
  onPress,
  alergia,
}: TarjetaProductoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  // API real de la pieza, verificada contra su fuente: expone
  // `handlers` + `estiloPresionado` (no un `estilo` suelto).
  const { handlers, estiloPresionado } = usePresionado()

  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        onPress={onPress}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={presentacion === undefined ? nombre : `${nombre}, ${presentacion}`}
        style={{
          // `flex: 1` es lo que deja que la tarjeta ocupe el alto de su
          // fila: sin él, el ancla de abajo no tiene contra qué anclar.
          flex: 1,
          backgroundColor: theme.bg.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.bg.border,
        }}
      >
        {/* LA FOTO — a sangre arriba, relación fija (ver RELACION_FOTO).

            🔴 S100b-B · MUERE EL «MARCO PÚRPURA», y su causa estaba medida:
            el fondo de esta caja era `bg.hundido` (lavanda). Con un packshot
            de **fondo transparente** —que es lo que manda el catálogo real—
            ese lavanda asomaba alrededor del producto y se leía como un
            marco de color. Medido en el aparato, misma fila y misma pieza:
            una foto opaca ocupaba el **100 %** del ancho de su caja y un
            packshot transparente el **48 %**, con 43 dp de lavanda a cada
            lado. *No era el contenedor «mal dimensionado»: era un fondo
            visible detrás de píxeles transparentes.*

            ⇒ **Con foto, la caja toma `bg.card`: el MISMO color que la
            tarjeta.** Un packshot transparente queda apoyado sobre la
            superficie de la tarjeta, sin marco; una foto opaca la llena de
            borde a borde. **Una sola caja que sirve a los dos tipos.**

            ⚠️ **Y la mitad que la forma NO puede resolver, declarada:** con
            `cover`, un asset cuya relación no sea 4:3 se recorta. La cura no
            es elegir otro `resizeMode` —`contain` letterboxea y devuelve el
            marco por la otra puerta— sino **que el asset llegue en 4:3**.
            *Si la imagen llega con la relación de la caja, el modo de render
            deja de importar.* Eso es del estándar de imagen, no de la pieza. */}
        <View
          style={{
            aspectRatio: RELACION_FOTO,
            /* 🔴 LA CAJA NO IMPONE FONDO — S100d·bis, firma del founder:
               *«la imagen de la bolsa de comida está puesta sobre un fondo
               blanco, y el fondo es magenta: choca, se ve sobrepuesta, como que
               no encaja. Ideal que la imagen del producto no tenga fondo
               propio»*.

               ⏪ Era `bg.card`. **Y esa elección ya era una cura de otra cosa:**
               S100b la puso ahí para matar el «marco púrpura» que producía el
               `bg.hundido` alrededor de un packshot transparente. *La cura era
               correcta y el encuadre estaba mal: se cambió QUÉ fondo pinta la
               caja, cuando lo que sobraba era QUE PINTE UNO.*

               ⇒ **`transparent`: un packshot transparente se apoya directo en
               la superficie de la tarjeta, sea cual sea el tema.**

               ⚠️ **Y LA MITAD QUE ESTA PIEZA NO PUEDE CURAR, declarada (mitad ②
               de la firma):** en la mayoría del catálogo **el blanco está
               QUEMADO EN LOS PÍXELES del JPEG** — ninguna caja se lo quita.
               Ese rectángulo blanco **no es un defecto de esta pieza: es dato**,
               y su cura es el estándar de imagen (PNG transparente, que es lo
               que entregan las galerías de marca).

               ⛔ **Y NO SE MAQUILLA:** mientras el catálogo se cura, la vitrina
               va a mezclar fotos que flotan con fotos con rectángulo. *Poner un
               fondo blanco general que «empareje» es exactamente lo que el
               founder acaba de rechazar* — emparejaría hacia abajo, volviendo a
               ponerle a los assets buenos el defecto de los malos. */
            backgroundColor: fotoUrl === undefined ? theme.bg.hundido : 'transparent',
            opacity: compra.modo === 'espejo' || compra.hayStock ? 1 : opacity.disabled,
          }}
        >
          {fotoUrl === undefined ? (
            /* 🔴 EL PRODUCTO SIN FOTO — ESTADO PROPIO, NO DEGRADADO.
               Baymard midió que los ítems sin miniatura *«were often
               completely ignored»* ⇒ una caja vacía no es neutral: **cuesta
               ventas**. Y no es una etapa: **el granel, la marca chica y el
               producto del vendedor local no van a tener galería nunca.**

               Por eso lleva marca en vez de vacío — el glifo de la despensa,
               centrado, en voz terciaria. **Y por eso el lavanda se queda
               ACÁ y solo acá:** el mismo color que antes enmarcaba por
               accidente ahora *significa* «este producto no tiene foto».

               ⛔ **Jamás se parece al esqueleto de carga.** Es estático y no
               brilla: *«no hay foto» y «todavía no llegó» son dos cosas
               distintas, y dibujarlas igual es la Ley 23 aplicada al tiempo*
               (§12.3). */
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icono nombre="despensa" tamano={32} registro="tinta" tinta={theme.text.tertiary} />
            </View>
          ) : (
            <Image source={{ uri: fotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          )}

          {/* Sin stock: el cartel va EN la puerta (ver la cabecera). */}
          {compra.modo === 'espejo' || compra.hayStock ? null : (
            <View
              style={{
                position: 'absolute',
                left: spacing[2],
                bottom: spacing[2],
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
                borderRadius: radius.sm,
                backgroundColor: theme.bg.base,
              }}
            >
              <Texto variante="apoyo">{t('tarjetaProducto.sinStock')}</Texto>
            </View>
          )}
        </View>

        <View style={{ flex: 1, padding: spacing[3], gap: spacing[1] }}>
          {/* EL NOMBRE — DOS LÍNEAS, techo de mesa (ver la cabecera).
              El nombre completo vive en la ficha, a un toque. */}
          <Texto variante="cuerpo" numberOfLines={2}>
            {nombre}
          </Texto>

          {/* LA PRESENTACIÓN, EN SU PROPIA LÍNEA y jamás pegada al
              nombre: es el dato que distingue dos variantes del mismo
              producto, así que compartir renglón con un nombre que
              puede ocupar dos líneas la volvería lo primero que se
              pierde. Nunca se trunca. */}
          {marca === undefined || marca === null ? null : (
            <Texto variante="apoyo" color="secondary">
              {marca}
            </Texto>
          )}

          {/* EL VEREDICTO DE COMPLETITUD (N18) — solo la cara
              ADMINISTRAR lo puebla; en la del cliente llega `null` y no
              se dibuja. Neutro: es trabajo pendiente del vendedor, no
              una alarma. */}
          {alcance === null || alcance === undefined ? null : (
            <Texto variante="apoyo" color="tertiary">
              {alcance}
            </Texto>
          )}

          {/* 🔴 LA SEÑAL DE ALERGIA — DENTRO de la tarjeta, jamás colgando
              debajo. Es H-002 de C: un aviso fuera de la fila no tiene
              nada que lo ate a su producto, y en una grilla de dos
              columnas eso es peor todavía — el ojo no sabe de cuál de
              las dos tarjetas está hablando.

              El silencio lo decide `alergiaPuedeCallar`, LA MISMA
              función que usa `AvisoAlergia`: las dos piezas no pueden
              discrepar sobre cuándo callar.

              ⚠️ TONO: `warning`, y el sin-stock queda NEUTRO a propósito
              (decisión declarada por C, y la tarjeta la respeta): *la
              alergia es riesgo para la mascota y el agotado es un hecho
              del estante* — dos naranjas seguidos aplanan la
              diferencia. */}
          {alergia === undefined || temperaturaDeAlergia(alergia) === 'silencio' ? null : (
            <View
              accessible
              // `alert` interrumpe · `text` se anuncia sin cortar. El
              // lector de pantalla también tiene que poder distinguir
              // «le hace mal» de «no lo sabemos».
              accessibilityRole={temperaturaDeAlergia(alergia) === 'alarma' ? 'alert' : 'text'}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
            >
              <Texto
                variante="apoyo"
                // 🔴 LAS DOS TEMPERATURAS (firma del founder · H-008).
                // El ámbar queda RESERVADO a la alergia declarada; la
                // ausencia se dice en voz sobria. Con ~51 % de lo
                // recomendado sin composición, un ámbar acá sería fondo
                // de pantalla — y entonces el ámbar de la alergia real
                // no significaría nada.
                // ⚠️ `secondary` NO es apagado: es el registro de la
                // casa para lo que se lee sin urgencia. La ausencia se
                // dice igual de claro; lo que cambia es la temperatura,
                // no la honestidad.
                color={temperaturaDeAlergia(alergia) === 'alarma' ? 'warning' : 'secondary'}
              >
                {alergia.senal}
              </Texto>
            </View>
          )}

          {/* EL ANCLA — esto es lo que alinea los precios de una fila
              aunque los nombres midan distinto. Ver la cabecera.

              ⏪ **DEROGADO S100d-B — lo de abajo describe la forma VIEJA.**
              Se conserva porque su aritmética sigue siendo cierta y es la
              mitad de la prueba de por qué la forma nueva es forzada; lo que
              caduca es la CONCLUSIÓN («el control baja cuando hay cantidad»).

              🔴 RE-DERIVACIÓN S100b-B · EL CONTROL BAJA A SU PROPIA FILA
              CUANDO HAY CANTIDAD, y el motivo es aritmética de la caja:

                caja interna ………………………… 138 dp
                precio ($57.19, medido) …… 68 dp
                gap ………………………………………………  8 dp
                stepper compacto ……………… 116 dp
                                            ──────
                en UNA fila hacen falta … 192 dp

              **No entra, y forzarlo es exactamente el defecto que G-01
              reportó**: con `overflow: 'hidden'`, lo que no entra no se
              ve — se corta, empezando por la derecha, que es donde vive
              el `+`.

              ⇒ Con `cantidad === 0` el timbre comparte fila con el precio
              (68 + 8 + 36 = 112 ≤ 138, entra con aire). Con `cantidad > 0`
              el control **baja**, y ahí dispone de los 138 completos.

              *El alto extra solo lo paga la tarjeta que YA está en el
              carrito —una minoría— y lo paga a cambio de mostrar su
              estado, que es justo lo que el benchmark señala como el
              defecto real: «el control lleva la acción pero no lleva el
              estado» (96 % de los sitios no destacan lo ya agregado).* */}
          {/* 🔴 EL ESCALÓN DEL CONTROL — S100d-B, y ES LA CURA DE LOS PUNTOS
              5 Y 7 DEL GATE.

              **Firma del founder, verbatim:** *«fichas alargadas… se resuelve
              dejando el agregar pequeño como Laika: al dar el más, en el MISMO
              escalón queda: eliminar/restar · unidades · más»* · *«sigue
              saltando el escalón — se reservó espacio; quiero que SE AJUSTE el
              tamaño para que no salte.»*

              ⏪ **LO QUE SE DEROGA, con su razón:** S100b bajó el control a una
              segunda fila y S100c le reservó el lugar (N24). **Las dos curas
              atacaban el síntoma equivocado.** El founder no está describiendo
              una tarjeta que crece: está describiendo **un control que CAMBIA
              DE ESCALÓN** — el `+` vivía en la fila del precio y el stepper
              aparecía un piso más abajo. *Reservar el hueco dejó de mover a la
              vecina, pero el control siguió mudándose de renglón, y encima la
              tarjeta pagaba el hueco vacío en el 100 % de los casos.*

              ── 🔴 LA CUENTA QUE VUELVE FORZADA ESTA FORMA (no es preferencia)
              El control tiene TRES blancos táctiles y N8 los fija en 44:

                  3 blancos × 44 dp ………………… 132 dp
                  caja interna de la tarjeta … 138 dp
                                               ───────
                  le sobran ………………………………………   6 dp

              ⇒ **el control ocupa la caja entera.** No hay ancho para un precio
              al lado — y no lo hay con NINGUNA geometría: achicar el píxel con
              `hitSlop` (que es como la casa cumple N8 en espacio corto) no
              achica el BLANCO, y son los blancos los que no entran. *No es que
              el control sea grande: es que tres targets de 44 y un precio no
              caben en 138 dp, y eso no se negocia con estilo.*

              ⇒ **El precio sube a su propia línea y el control se queda con el
              último escalón, SIEMPRE.** El escalón existe con `cantidad === 0`
              (lo ocupa el `+`) y con `cantidad > 0` (lo ocupa el stepper): **es
              el mismo renglón, el mismo alto y el mismo borde derecho.** *El
              control ya no se muda: cambia de forma sin cambiar de casa* — que
              es lo que la cabecera de esta pieza dice desde el primer día y lo
              que las dos curas anteriores no habían logrado.

              ── LO QUE MIDE, contra lo que el founder vio ──────────────────
                  antes (S100c) … fila del precio 36 + gap 8 + slot 36 = 80 dp
                  ahora ………………… precio ~26 + gap 8 + escalón 36 ……… = 70 dp
              **−10 dp por tarjeta, y CERO salto.** *Se declara chico a
              propósito: la ficha alargada no se cura acá.* Los dos acreedores
              reales están medidos y son decisión del founder, no de la pieza:
              **la foto 1:1 (+41 dp sobre el 4:3 anterior)** y **el bloque de
              texto**. ⛔ Y no se cura encogiendo la letra (cabecera).

              ✅ **De paso devuelve presupuesto:** los 10 dp vuelven al margen
              de la vitrina que L-301 dejó en 42. */}
          {/* 🔴 `flexShrink: 0` — LA MITAD QUE FALTABA, Y LA ENCONTRÓ EL APARATO
              CONTRA MI PROPIA CURA (S100d-B, medido en el SM-S938B sobre el
              bundle `e6ebf9d3`).

              **El defecto REAL del punto 7 no era el salto: era un RECORTE.**
              Medido tocando el `+` en la vitrina viva:

                tarjeta antes de agregar …………………… 336,4 dp
                tarjeta después …………………………………… 336,4 dp  (no crece ✅)
                el stepper que aparece ………………… **18,1 dp de sus 36**

              **El stepper sale por debajo del borde y `overflow: 'hidden'` lo
              tija por la mitad** — y la tarjeta vecina, sin cantidad, muestra
              su `+` entero al lado. *El founder lo llamó «sigue saltando el
              escalón»; lo que veía era un control cortado.*

              **La causa, y por eso no la curaba mover el control de renglón:**
              este contenedor lleva `flex: 1` —lo necesita para que
              `marginTop: 'auto'` ancle el bloque abajo— y **`flex: 1` incluye
              `flexShrink: 1`**: cuando el contenido no entra, el bloque se
              deja ENCOGER y lo que sobra se corta en silencio.

                caja de texto disponible ……………… 172,1 dp
                contenido con la forma vieja …… 209,0 dp  ⇒ desborda 36,9
                contenido con el escalón único … 199,3 dp  ⇒ desborda 27,2

              ⇒ **mi propia cura devolvía 9,7 dp contra un desborde de 36,9: no
              alcanzaba, y lo habría descubierto el founder en el tercer gate
              del mismo punto.** *La cuenta del escalón era correcta y la
              conclusión estaba incompleta — el alto no era el problema.*

              **`flexShrink: 0` hace el recorte inexpresable EN EL BLOQUE QUE
              IMPORTA:** el precio y el control conservan sus 70,3 dp pase lo
              que pase. Si algo tiene que ceder, cede el bloque de texto — que
              ya tiene techo de líneas y degrada legiblemente. *Entre cortar un
              nombre y cortar el control con el que se compra, no hay empate.*

              ⚠️ **SIN OJO: esto se midió sobre el bundle viejo y la cura no se
              vio correr.** Su verificación es el primer paso del recorrido:
              **tocar el `+` y que el stepper mida 36, no 18.** */}
          <View style={{ marginTop: 'auto', flexShrink: 0, paddingTop: spacing[2], gap: spacing[2] }}>
              {/* 🔴 CUARTA ITERACIÓN — Y LA PRIMERA QUE NO ELIGE A QUIÉN
                SACARLE EL RENGLÓN (S100d·bis).

                **Firma del founder, después de mandarme a mirar el objeto que
                ya lo resolvía:** *«el botón Agregar tiene una microanimación y
                **se transforma** en el selector de cantidad; si eliminás, la
                microanimación es inversa»*.

                ── LO MEDIDO EN LAIKA, en el teléfono del founder ──────────
                    botón «Agregar» ……………………… 130,8 × 28,8 dp
                    control [🗑] N [+] ………………… 129,0 × 27,4 dp
                    sus botones …………………………………  36,6 × 27,4
                    su caja interna …………………… 130,8   (la nuestra: 140,3)

                ⇒ **el control tiene renglón PROPIO y COMPLETO, y los dos
                estados ocupan la misma caja.** *Con menos espacio que nosotros
                les entra cómodo — porque no lo pusieron al lado de nada.*

                ⏪ **LAS TRES FORMAS ANTERIORES, DEROGADAS — y ninguna fue un
                error de cálculo:**
                  · S100b: el control baja a otra fila ⇒ **la tarjeta crece.**
                  · S100c (N24): se reserva el hueco ⇒ **el hueco se paga
                    siempre y el control sigue mudándose de renglón.**
                  · S100d: escalón propio a la derecha, y después junto a la
                    presentación ⇒ **la presentación envuelve.**
                ***Las tres eligieron a quién sacarle el renglón. Ésta no tiene
                que elegir porque no se lo pide a nadie.***

                ✅ **Y las tres cosas que el founder pidió juntas, juntas:**
                ① la presentación **recupera su línea entera** ② la tarjeta
                **no cambia de alto jamás** ③ **los 44 de blanco vuelven sin
                `hitSlop` forzado** (3 × 44 = 132 ≤ 140,3).

                🔴 **LA LEY DE MÉTODO, que vale más que esta tarjeta:** la cura
                salió de **mirar el objeto que ya la resolvía**, en el mismo
                teléfono, disponible desde el día uno. **L-302.** *Antes de la
                cuarta iteración de cualquier cosa, se censa quién ya la
                resolvió.* */}
            {presentacion === undefined ? null : (
              <Texto variante="apoyo">{presentacion}</Texto>
            )}

            <PrecioText valor={precio} registro="vitrina" porUnidad={precioPorUnidad} />

            {/* EL CONTROL, EN SU RENGLÓN COMPLETO. `Mutacion` sostiene la caja
                —alto DERIVADO del stepper, jamás tecleado— y cruza las dos
                formas adentro de ella. La inversa sale sola de `estado`.

                ⚠️ **Con `espejo` o sin stock la caja NO se dibuja**: no hay dos
                formas que turnar. *El espejo del vendedor no compra su propio
                producto, y un agotado no ofrece un botón que no va a andar.* */}
            {compra.modo === 'espejo' || !compra.hayStock ? null : (
              <Mutacion
                alto={ALTO_STEPPER_ANCHO}
                estado={compra.cantidad === 0 ? 'reposo' : 'activo'}
                reposo={
                  <Boton
                    etiqueta={t('tarjetaProducto.agregarCorto')}
                    onPress={compra.onAgregar}
                    // `bloque` = ancho completo, que es la mitad de la forma
                    // de Laika: el botón OCUPA la caja que después va a
                    // ocupar el stepper.
                    bloque
                    tamaño="sm"
                  />
                }
                activo={
                  <StepperCantidad
                    valor={compra.cantidad}
                    min={1}
                    max={TOPE_EN_VITRINA}
                    onCambio={compra.onCambiarCantidad}
                    etiqueta={t('tarjetaProducto.cantidad', { nombre })}
                    // F-OCRE / N26 v2: lo que se ajusta acá es una compra.
                    registro="compra"
                    tamano="ancho"
                    // El número se tipea (el caso del barf). En la vitrina el
                    // cero devuelve el botón: nada desaparece.
                    editable
                    salida="vuelve-al-boton"
                    /* 🔴 LA PAPELERA VUELVE A LA GRILLA, y esto DEROGA la
                       cláusula de `StepperCantidad` que decía *«en la grilla
                       no»*. **Su argumento era que ahí bajar de 1 no hace
                       desaparecer nada, así que una papelera prometería un
                       borrado que no ocurre.** Con la transformación **sí
                       ocurre**: el control desaparece y vuelve a ser «Agregar».
                       *La cláusula no estaba mal: describía una tarjeta que ya
                       no existe.* Y es lo que el founder nombró desde el
                       principio — *«eliminar/restar»*. */
                    onBorrar={() => compra.onCambiarCantidad(0)}
                  />
                }
              />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
