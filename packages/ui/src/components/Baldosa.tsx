/**
 * Baldosa — LA PIEZA DE LO QUE SE ELIGE (S97+-B, Acto II).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA DIRECCIÓN DE FORMA QUE LA ORDENA (firma del founder):
 *   **tarjetas para lo que se ELIGE · filas para lo que se LEE.**
 * Su instinto literal: *«rectángulos en dos columnas»* en vez del botón
 * tradicional.
 * ═══════════════════════════════════════════════════════════════════
 *
 * La `Celda`/`FilaCita` sirve a una lista que se recorre con el ojo: es
 * densa, horizontal, y su trabajo es que muchas cosas quepan y se
 * comparen. Una elección es lo contrario — pocas opciones, cada una con
 * peso propio, y el ojo saltando entre ellas en vez de barriéndolas.
 * *Una fila con un chevron dice «hay más adentro»; una baldosa dice
 * «elegí una».*
 *
 * LA PIEZA ES **UNA** BALDOSA, NO LA GRILLA. Quien la monta arma las dos
 * columnas —con `gap: spacing[4]` y `flexBasis: '48%'`, o el
 * `flexDirection: 'row'` con `flexWrap` que le sirva— porque **cuántas
 * columnas entran es del ancho de SU pantalla**, no de la pieza. Es la
 * misma línea que separa `ChipEntidad` de su hilera (S91): sube la
 * UNIDAD, no el contenedor.
 *
 * LO QUE LA MESA FIJÓ, y dónde vive cada cosa:
 *  · **canto de su categoría (Ley 10)** — el canto dice CATEGORÍA y el
 *    glifo dice SERVICIO. Va **a la IZQUIERDA, como en `FilaCita`**: la
 *    posición del canto es vocabulario, no composición. Si en la fila
 *    vive a la izquierda y en la baldosa arriba, el sistema deja de
 *    poder leerse de un vistazo — *un mismo significante que cambia de
 *    lugar según la pieza obliga a re-aprenderlo en cada pantalla.*
 *  · **el glifo con presencia (N7)** — 48, no 32. La baldosa se elige de
 *    un vistazo y el glifo es lo que se ve primero.
 *  · **`usePresionado`** (la receta única de la casa) y **entrada
 *    escalonada (N6)** vía `orden`.
 *  · **radio de la escala única (N4)** — `radius.lg`, el registro de las
 *    superficies que contienen. No un valor propio.
 *
 * MI FORMA, y su porqué:
 *  · **`aspectRatio: 1`** — cuadrada. Con dos columnas en un teléfono da
 *    ~160×160: un blanco enorme, imposible de errar con el pulgar, y el
 *    mismo alto para todas sin importar el largo del nombre. *Un alto
 *    que depende del texto hace que dos baldosas vecinas no se alineen,
 *    y una grilla desalineada se lee como un error.*
 *  · **el contenido se ancla ABAJO** (`justifyContent: 'flex-end'`) con
 *    el glifo arriba: así el título de todas las baldosas cae a la misma
 *    altura aunque una tenga detalle y otra no.
 *  · **el canto respira**: la baldosa recorta (`overflow: 'hidden'`) para
 *    que el canto siga la curva del radio en vez de cortarla — el
 *    precedente exacto de `FilaCita`.
 *
 * PENSADA PARA SUS DOS CONSUMIDORES desde el primer día (condición de la
 * mesa: *que el segundo no la deforme*):
 *  ① las tarjetas de oficio de **ATENDER** — glifo + nombre del oficio.
 *  ② los servicios del tab **Negocio**, que el founder señaló como
 *     monótonos — mismo glifo + nombre + `detalle` (el precio, el conteo).
 * Por eso `detalle` es OPCIONAL y no hay ningún slot libre: si el segundo
 * consumidor necesitara meterle nodos propios, la baldosa se volvería un
 * contenedor y dejaría de garantizar que dos baldosas se vean iguales.
 */

import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { usePresionado } from './usePresionado'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Entrada } from './Entrada'
import type { CapaDeOficio } from './PuertaDeOficio'

/** El canto: mismo ancho que `FilaCita`. La coherencia es el punto. */
const ANCHO_CANTO = 3
/** N7 — el glifo con presencia. 48, no 32: es lo primero que se ve. */
const LADO_GLIFO = 48

export type BaldosaProps = {
  /** El nombre de lo que se elige. Una línea; dos si el nombre es largo. */
  titulo: string
  /** Segunda línea opcional — el conteo, el precio, el estado. */
  detalle?: string
  /** Glifo del registry (Ley 12: el glifo dice SERVICIO). */
  glifo: IconoNombre
  /** Categoría (Ley 10: el canto dice CATEGORÍA). */
  capa: CapaDeOficio
  onPress: () => void
  /** Posición en el ORDEN DE LECTURA (N6). Sin `orden`, no entra
   *  escalonada — el consumidor que no quiera la entrada simplemente no
   *  la pide. Los NÚMEROS del escalonado siguen siendo de `Entrada`,
   *  jamás de acá (la condición de mesa sobre §5). */
  orden?: number
  /** Voz de a11y cuando el título solo no alcanza ("Veterinaria, 3
   *  servicios activos"). Default: el título. */
  etiquetaA11y?: string
}

export function Baldosa({
  titulo,
  detalle,
  glifo,
  capa,
  onPress,
  orden,
  etiquetaA11y,
}: BaldosaProps) {
  const { theme } = useTheme()
  // 0.99 — la escala de las superficies que contienen (el precedente
  // de `TarjetaEstado` y `SelectorOpcion`); 0.97 es de botones sueltos.
  const { handlers, estiloPresionado } = usePresionado(0.99)

  const cuerpo = (
    <Pressable
      onPress={onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={etiquetaA11y ?? (detalle ? `${titulo}, ${detalle}` : titulo)}
      /* 🔴 LA RAÍZ DECLARA SU ANCHO — sin esto la grilla COLAPSA A ALTURA
         CERO y las baldosas se dibujan encima de lo que sigue.

         EL MECANISMO, medido por C en el navegador (`getBoundingClientRect`
         + `getComputedStyle`): el `aspectRatio: 1` vive en el
         `Animated.View` de adentro, y este `Pressable` no llevaba estilo.
         Un `Pressable` sin estilo **no estira al ancho de su contenedor**,
         así que el `aspectRatio` resolvía contra ancho 0 ⇒ **alto 0** ⇒ el
         contenedor de la grilla no reservaba espacio.

         ⚠️ MEDIDO EN RN-WEB. En nativo Yoga puede resolverlo distinto y es
         posible que el teléfono lo perdone — no se afirma. **Pero lo que
         es cierto en las dos plataformas es el defecto de construcción:
         una pieza que delega su altura a un hijo y cuya raíz no declara
         nada es frágil aunque hoy una plataforma la salve.**

         ⚖️ LA LEY QUE FIJA LA MESA, y vale para toda pieza de la casa:
         **la raíz de una pieza es DUEÑA DE SU ESPACIO.** Delegar la
         geometría a un hijo deja a la pieza a merced de cómo la envuelvan
         — y quien la envuelve no puede saberlo sin leerle las tripas.

         🔴 Y ES UN DEFECTO QUE YO YA HABÍA VISTO: al leer el árbol de
         `Celda` para el caso de «Z…» anoté que su `Pressable` tampoco
         lleva estilo. Ahí no muerde porque el consumidor la envuelve en
         una columna que la estira. **Lo vi, entendí por qué no molestaba
         ahí, y construí la pieza nueva con el mismo hueco.** */
      /* ⏪ D-804 — LA RAÍZ DECLARA LAS **DOS** DIMENSIONES. Antes tenía
         solo el ancho y la proporción vivía en el hijo: el extremo opuesto
         del colapso a 0 y **la misma causa**. Cuando el contenedor le daba
         0 medía 0; cuando le daba todo, medía todo (~800 px en dispositivo,
         dos scrolls por celda).
         *Mi ley decía «la raíz es dueña de su espacio» y yo la había
         cumplido a medias: el espacio son DOS dimensiones.* El hijo deja
         de decidir geometría y solo compone adentro (`flex: 1`). */
      style={{ width: '100%', aspectRatio: 1 }}>
      <Animated.View
        style={[
          {
            // La geometría la declara la RAÍZ (arriba): acá solo se compone.
            flex: 1,
            backgroundColor: theme.bg.card,
            borderRadius: radius.lg,
            boxShadow: theme.elevacion.reposo,
            // EL CANTO — categoría (Ley 10), a la izquierda como en la
            // fila. `overflow: 'hidden'` para que siga la curva del radio
            // en vez de cortarla (precedente FilaCita).
            borderLeftWidth: ANCHO_CANTO,
            // ⚠️ `consumo` NO existe en `theme.capa` — se resuelve por
            // `accent.warm` (el ocre). La fórmula se COPIA de
            // `PuertaDeOficio`, que es la pieza que ya la resolvió: mi
            // primer intento mapeó `consumo → comunidadAmplia` (violeta)
            // por vecindad en la lista de slots, que es exactamente la
            // clase de error que pintó de otra capa una pieza entera en
            // S91. Un vocabulario de cuatro no cae 1:1 sobre slots de
            // cuatro solo porque coincida el número.
            borderLeftColor: capa === 'consumo' ? theme.accent.warm : theme.capa[capa],
            overflow: 'hidden',
            padding: spacing[4],
            justifyContent: 'flex-end',
            gap: spacing[2],
          },
          estiloPresionado,
        ]}
      >
        {/* El glifo arriba, empujado por el `justifyContent: flex-end`
            del padre: el texto queda anclado abajo y todas las baldosas
            alinean su título a la misma altura, tengan detalle o no. */}
        <View style={{ position: 'absolute', top: spacing[4], left: spacing[4] }}>
          <Icono nombre={glifo} registro="aa" tamano={LADO_GLIFO} />
        </View>

        {/* 🔴 EL TÍTULO ES `cuerpo`, NO `seccion` — y la corrección cura
            DOS defectos que resultaron ser el mismo cambio.

            ① EL QUE REPORTÓ C, montándola en ATENDER: «Adiestramiento»
            se partía a mitad de palabra. Medido con el ancho real —190 px
            de baldosa − 32 de padding − 3 de canto = **155 útiles**—:

                seccion md/18 MEDIUM (antes de N1) ..  ~131 px  ✓ entraba
                seccion md/20 BOLD   (tras N1) .....  ~160 px  ✗ NO ENTRA
                cuerpo base/16 REGULAR .............  ~116 px  ✓ entra

            ⚠️ **Y LA CAUSA ES MÍA, DE N1**: la ejecuté moviendo `md`
            18→20 **y** subiendo `seccion` de medium a **bold 700** — los
            dos ejes ensanchan, y juntos empujaron la palabra fuera del
            renglón. *La baldosa nació después de N1, así que no «se
            rompió»: nació rota, y por eso ningún antes/después la
            señalaba.*

            ② EL QUE C NO PODÍA VER, y es de accesibilidad: `seccion`
            trae **`accessibilityRole="header"` de fábrica** (S71, y está
            bien que lo traiga). ⇒ **cada baldosa se anunciaba como
            ENCABEZADO dentro de un `Pressable` con rol de botón.** Una
            baldosa no encabeza nada: es un ítem que se elige. El rol
            estaba mintiendo en las dos apps.

            LA JERARQUÍA NO SE PIERDE: la carga el GLIFO de 48 (N7 — «la
            foto carga la profundidad»), no el peso del texto. Contra
            `apoyo` (14 secundario) el contraste sigue siendo claro.
            *Si el gate dice que falta peso, la salida es una variante
            nueva con su gate (Ley 11) — jamás un `style` inline acá.* */}
        <Texto variante="cuerpo" numberOfLines={2}>
          {titulo}
        </Texto>
        {detalle !== undefined ? (
          <Texto variante="apoyo" numberOfLines={1}>
            {detalle}
          </Texto>
        ) : null}
      </Animated.View>
    </Pressable>
  )

  return orden === undefined ? cuerpo : <Entrada orden={orden}>{cuerpo}</Entrada>
}

/** EL PATRÓN DE LA GRILLA — no sube como pieza (ver el header: sube la
 *  unidad, no el contenedor), pero se escribe acá para que las dos casas
 *  armen la misma sin copiarse entre sí:
 *
 *    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
 *      {oficios.map((o, i) => (
 *        <View key={o.key} style={{ width: '48%' }}>
 *          <Baldosa … orden={i} />
 *        </View>
 *      ))}
 *    </View>
 *
 *  ⏪ DECÍA `flexBasis: '47%', flexGrow: 1` Y ERA FRÁGIL POR SIETE
 *  PÍXELES. El defecto lo midió A en dispositivo (D-804): las baldosas
 *  se dibujaban de **~800 px de alto**, «glifo arriba, rótulo abajo,
 *  vacío enorme en el medio», y la portada exigía dos scrolls para
 *  mostrar dos celdas.
 *
 *  LA ARITMÉTICA, con el ancho real de la portada (412 − 32 de padding =
 *  380 útiles):
 *
 *      dos ítems a 47% .... 357 + gap 16 = 373   ← entra por 7 px
 *      si algo se corre ... WRAP ⇒ cada una SOLA en su fila
 *      y ahí `flexGrow: 1` la estira al 100% .... 380 × aspectRatio 1
 *      ⇒ 380 de alto cada una · **760 apiladas** ≈ los ~800 medidos
 *
 *  🔴 Y LA DECISIÓN QUE LO CAUSÓ ES MÍA, ESCRITA EN ESTE MISMO ARCHIVO:
 *  puse `flexGrow: 1` razonando que *«una baldosa impar ocupe la fila
 *  entera en vez de quedar a media pantalla»*. **Esa regla, pensada para
 *  el caso impar, se aplica a TODAS cuando el wrap se dispara por
 *  redondeo** — y con 7 px de margen se dispara con cualquier padding,
 *  scrollbar o diferencia de redondeo entre plataformas.
 *
 *  ⇒ `width: '48%'` es DETERMINISTA: no crece, no depende del sobrante,
 *  y una baldosa impar queda a media pantalla — que en una grilla es lo
 *  correcto y lo que el ojo espera. *Un patrón que se comporta distinto
 *  según sobren 7 px no es un patrón: es una coincidencia documentada.*
 *
 *  ⚠️ ESTO ES EL EXTREMO OPUESTO DEL COLAPSO A 0 de `Entrada`, y A lo
 *  nombró bien: cuando el contenedor le daba 0 medía 0, cuando le da todo
 *  mide todo. **La pieza declara su PROPORCIÓN (`aspectRatio: 1`), y la
 *  proporción sin un ancho acotado no acota nada** — el ancho es del
 *  contenedor por diseño, así que el patrón es parte del contrato y no
 *  una sugerencia. Por eso se corrige acá y no en la pantalla que lo
 *  sufrió. */
