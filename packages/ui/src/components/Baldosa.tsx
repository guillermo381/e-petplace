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
 * LA PIEZA ES **UNA** BALDOSA, NO LA GRILLA — sube la UNIDAD, no el
 * contenedor (la misma línea que separa `ChipEntidad` de su hilera, S91).
 *
 * ✅ **S100-B · EL PATRÓN SALIÓ A CÓDIGO: vive en `grilla-de-dos.ts`**
 * (`GRILLA_DE_DOS` + `CELDA_DE_GRILLA`), y este archivo lo APUNTA en vez
 * de describirlo. **Su segundo consumidor llegó** —`TarjetaProducto`— y
 * la advertencia de abajo pedía exactamente esto: *no se sincronizan dos
 * copias, se deja UNA*. **Un patrón que solo se puede obedecer copiándolo
 * ya tiene su divergencia agendada.**
 *
 * ⚠️ **EL PATRÓN DE GRILLA VIVE AL PIE DE ESTE ARCHIVO, UNA SOLA VEZ, Y
 * NO SE REPITE ACÁ.** Esta línea llevaba su propia copia —`gap` +
 * `flexBasis: '48%'`— y **quedó congelada mientras el patrón real
 * evolucionaba 47 → 48 → 50**: el archivo terminó con DOS patrones
 * ejecutables que se contradecían, y el de arriba —**el que se lee
 * primero**— era justo el que A midió que **no entra en ningún
 * teléfono**. C lo leyó de acá y reportó el defecto que yo creía curado.
 *
 * *No se sincronizan dos copias: se deja UNA.* Un patrón repetido en el
 * mismo archivo no diverge algún día — diverge la primera vez que alguien
 * cura el otro.
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
/** N7 — el glifo con presencia. 48, no 32: es lo primero que se ve.
 *
 *  🔴 **ENMIENDA S107-B (medición de C): ese 48 se firmó PARA DOS COLUMNAS.**
 *  En la grilla de Negocio a TRES, la baldosa es ~2/3 de ancho —y por
 *  `aspectRatio: 1` también ~2/3 de alto—, y el glifo de 48 **le come el aire
 *  al label**. *No falló la firma: se la aplicó a un ancho para el que no se
 *  midió.*
 *
 *  **El número no se eligió a ojo: se derivó.** 48 servía a una baldosa de
 *  ~50 % del ancho; a ~33 % la caja es 2/3 ⇒ 48 × 2/3 = **32**. Y el resultado
 *  aterriza en un lugar elocuente: **32 es exactamente el valor que N7
 *  rechazó** — o sea que *32 nunca fue «chico», era chico PARA DOS COLUMNAS*.
 *
 *  ⚠️ **Se agrega un caso, NO se cambia el firmado:** a dos columnas sigue
 *  valiendo 48, intacto. Quien renderiza en tres es quien sabe que son tres, y
 *  lo declara. */
const LADO_GLIFO: Record<2 | 3, number> = { 2: 48, 3: 32 }

/* ── S107-B · EL LABEL A TRES COLUMNAS — medido, no ajustado a ojo ────────
   **Medición de C:** el ancho útil es `(ancho − 16)/3 − 51` = **73,7 pt en
   390**, y «Adiestramiento» mide **~116 a cuerpo · ~102 a sm · ~80 a xs**.
   **Es UNA palabra de 14 caracteres**, así que `numberOfLines={2}` sola no
   alcanza: no hay dónde cortar. «Veterinaria» también se pasa en 360 y 390.

   ── 🔴 LA ELIPSIS QUEDA DESCARTADA POR PRECEDENTE, NO POR GUSTO ──────────
   **`D-576` ya registra «"Adiestramiento" trunca» como DEFECTO medido por el
   founder en dispositivo (S80), y sigue abierta.** Elegir elipsis sería
   reproducir, en otra pantalla, un defecto que él ya rechazó **sobre esta
   misma palabra**. ⇒ **la palabra se parte y no se corta: nada se pierde.**

   ── EL MODELO, derivado de los tres números de C (se cruzan entre sí) ────
   `116/(14·16) = 0,518` · `102/(14·14) = 0,520` · `80/(14·11) = 0,519`
   ⇒ **ancho ≈ 0,519 × caracteres × tamaño** para DM Sans regular.

   ── LAS DOS PALANCAS, las dos DERIVADAS ─────────────────────────────────
   · **Escala:** `cuerpo` (16) → **`enfasis` (14, bold)**. No es `apoyo`
     porque el título quedaría del mismo peso que el `detalle`; `enfasis` es
     literalmente *«el elemento destacado de una lista, que no es un
     rótulo»*, que es lo que un título de baldosa es.
   · **Padding:** `spacing[4]` (16) → **`spacing[2.5]` (10)**, por la MISMA
     derivación que el glifo — la baldosa a tres es ~2/3 de ancho, y 16×2/3 ≈
     10. *Ni el glifo ni el aire se eligen a ojo: los dos salen de la misma
     proporción.* Devuelve **12 pt** al ancho útil.

   ── EL RESULTADO CONTRA LOS CINCO LABELS REALES (no contra el más corto) ─
   Útil = `(ancho−16)/3 − 39` · bold ≈ +5 %

   | label | ancho @14 bold | 360 (75,7) | 390 (85,7) | 430 (99,0) |
   |---|---|---|---|---|
   | Paseo (5) | 38 | ✓ | ✓ | ✓ |
   | Grooming (8) | 61 | ✓ | ✓ | ✓ |
   | Guardería (9) | 69 | ✓ | ✓ | ✓ |
   | Veterinaria (11) | 84 | **2 líneas** | ✓ | ✓ |
   | Adiestramiento (14) | 107 | **2 líneas** | **2 líneas** | ✓ |

   **Ninguno trunca en ningún tamaño.** Los que no entran **se parten**, y
   con `numberOfLines={2}` el peor caso —14 caracteres— entra holgado en dos
   renglones. ⚠️ **El modelo es una ESTIMACIÓN de ancho de glifo**: la vara
   final es el aparato, y por eso el par de la galería monta los cinco. */
const RELLENO: Record<2 | 3, number> = { 2: spacing[4], 3: spacing[2.5] }
const AIRE: Record<2 | 3, number> = { 2: spacing[2], 3: spacing[1.5] }

/* 🔴 ── S107-B · LA PROPORCIÓN, TERCER NÚMERO FIRMADO PARA DOS COLUMNAS ───
   **El founder vio en el aparato que el glifo se monta ENCIMA del texto** en
   «Adiestramiento» y «Vender por e-PetPlace». **No era ancho: era ALTO**, y la
   causa es mía por partida doble:

   ① **El glifo estaba `position: absolute`** — o sea **fuera del flujo, sin
     reservar altura** — y el texto crece desde abajo (`flex-end`). *Nada
     impedía que el texto subiera hasta debajo del glifo: no había espacio
     reservado, había un hueco que casualmente alcanzaba a dos columnas.*
   ② **`aspectRatio: 1` es el TERCER número de esta pieza firmado PARA DOS
     COLUMNAS** —después del glifo (48) y del aire (16)—, y es el único que no
     re-derivé. *Curé los dos que se veían y dejé el que causaba el choque.*

   **La cuenta que lo prueba, en el peor caso (360):** la baldosa mide
   `(360−16)/3 − 8 = 106,7`. Demanda con dos líneas de título:
   `20 (aire) + 32 (glifo) + 6 + 40 (2×20) + 6 + 20 (detalle) = 124`.
   ⇒ **faltan ~17 pt, y en un cuadrado no hay de dónde sacarlos.**

   ⇒ **A tres columnas la baldosa deja de ser cuadrada** (`0.8`): alto ≈ 133 en
   360 y ≈ 146 en 390, con holgura sobre los 124. **A dos columnas sigue
   CUADRADA, intacta** — su firma no se toca.

   ⚠️ **Y esta vez la vara es el APARATO, no una cuenta.** La cuenta de arriba
   es de la geometría de la pieza (números propios, no estimación de ancho de
   texto), pero *el modelo de ancho ya me dijo una vez que entraba y el founder
   vio que no*. Por eso el par de la galería monta los cinco labels reales. */
const PROPORCION: Record<2 | 3, number> = { 2: 1, 3: 0.8 }

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
  /**
   * Cuántas baldosas entran por fila donde ésta se monta.
   *
   * 🔴 **OBLIGATORIA, SIN DEFAULT — firma de mesa, S107.** Y la enmienda es
   * contra el razonamiento de su propio autor: nació como `columnas = 2` «para
   * dejar intacto a todo consumidor existente», **y eso es exactamente lo que
   * la volvió silenciosa para el consumidor NUEVO** — la grilla de tres de
   * Negocio siguió con el glifo de 48 porque nadie le dijo nada, y *un glifo
   * grande de más no lanza, no rompe el build y no sale en ningún gate: se ve,
   * y sólo si alguien mira.*
   *
   * **La casa ya tenía la regla y no se fue a buscar** (19.9): *«la prop de
   * identidad va OBLIGATORIA sin default — el tsc obliga a decidirlo»*, con su
   * precedente `capa=` en `CabezalOficio`, donde **la primera consumidora real
   * probó que sin declararla el clon salía teal.** Mismo caso, mismo desenlace.
   *
   * ⇒ **Que rompa el typecheck ES el punto:** convierte un defecto invisible en
   * un error de compilación, y obliga a cada grilla a declarar cuántas
   * columnas tiene.
   *
   * 🔴 Sólo modula **el tamaño del glifo** — ver `LADO_GLIFO`. **No decide el
   * ancho**: eso lo pone el contenedor, y una pieza que se auto-anchara
   * pelearía con su grilla.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * ☠️ **OBLIGATORIA — acá había un `?` con default `2`** *(firma de la mesa,
   * S107; la propuso B contra su propia decisión).*
   *
   * El default existía **«para no romper consumidores existentes»**, y fue
   * exactamente eso lo que volvió el defecto **silencioso para el consumidor
   * NUEVO**: la grilla de Negocio pasó a `33.333 %` y las baldosas siguieron
   * pidiendo su glifo de 48 — *sin error, sin warning, con el glifo pisando
   * el label.* **Medido al ejecutar esta firma: DOS de las tres baldosas de
   * `negocio.tsx` estaban así HOY**, y ningún gate las veía.
   *
   * > **Un default que existe para no romper a nadie es un default que no
   * > rompe a nadie el día que alguien debería enterarse.** Es la regla 19.9
   * > en su forma más barata de evitar: *quien renderiza sabe en cuántas
   * > columnas está; la pieza no puede adivinarlo, y adivinar mal no duele
   * > hasta que se ve.*
   *
   * ⇒ **Sin default. El compilador pregunta, una vez, en cada call site.**
   * ═══════════════════════════════════════════════════════════════════════
   */
  columnas: 2 | 3
}

export function Baldosa({
  titulo,
  detalle,
  glifo,
  capa,
  onPress,
  orden,
  columnas,
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
      style={{ width: '100%', aspectRatio: PROPORCION[columnas] }}>
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
            padding: RELLENO[columnas],
            gap: AIRE[columnas],
          },
          estiloPresionado,
        ]}
      >
        {/* ⏪ EL GLIFO VUELVE AL FLUJO. Estaba `absolute`, y por eso **no
            reservaba altura**: el texto crecía desde abajo y se le metía
            encima (lo vio el founder en el aparato). Ahora ocupa su lugar y
            **el choque es imposible por construcción**, no por que las
            cuentas den.

            🔴 **Y la alineación firmada NO se pierde, que era el porqué del
            `absolute`:** la sostiene el ESPACIADOR de abajo — empuja el texto
            al pie igual que lo hacía `justifyContent: flex-end`, y todas las
            baldosas siguen alineando su título a la misma altura, tengan
            detalle o no. *La diferencia es que ahora, cuando el contenido
            crece, lo primero que cede es el espaciador — y no el glifo.* */}
        <Icono nombre={glifo} registro="aa" tamano={LADO_GLIFO[columnas]} />
        <View style={{ flex: 1 }} />

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
        {/* A tres columnas baja a `enfasis` (14 bold) y **se parte antes que
            truncarse** — ver la tabla de arriba y el porqué de `D-576`. */}
        <Texto variante={columnas === 3 ? 'enfasis' : 'cuerpo'} numberOfLines={2}>
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
 *  unidad, no el contenedor), pero se escribe acá porque **es parte del
 *  contrato**: la pieza ata su alto a su ancho, así que quien le da mal
 *  el ancho le rompe las dos dimensiones.
 *
 *      <View style={{ flexDirection: 'row', flexWrap: 'wrap',
 *                     marginHorizontal: -spacing[2] }}>
 *        {oficios.map((o, i) => (
 *          <View key={o.key} style={{ width: '50%',
 *                                     paddingHorizontal: spacing[2],
 *                                     paddingBottom: spacing[4] }}>
 *            <Baldosa … orden={i} />
 *          </View>
 *        ))}
 *      </View>
 *
 *  🔴 **SIN `gap`. EL AIRE VIVE ADENTRO DE LA CELDA**, y eso es lo único
 *  que cierra por construcción: `50% + 50% = 100%` EXACTO en cualquier
 *  ancho, sin nada que sumarle. El `marginHorizontal` negativo del
 *  contenedor devuelve el padding de los bordes para que la grilla quede
 *  alineada con el resto de la pantalla.
 *
 *  ⏪ ESTE PATRÓN SE EQUIVOCÓ DOS VECES Y LA SEGUNDA FUE PEOR. Va con su
 *  historia porque **un número sin su porqué se vuelve a «arreglar» en
 *  seis meses** (y ya pasó dos veces en un día):
 *
 *    · v1 `flexBasis: 47%` + `flexGrow: 1` — entraba por **7 px**, y
 *      cuando el redondeo lo hacía envolver, el `flexGrow` estiraba cada
 *      baldosa al 100 % ⇒ cuadrados de 380×380, **~800 px apilados**
 *      (D-804, medido por A en dispositivo).
 *    · v2 `width: '48%'` — puesto para dejar de ser «frágil por 7 px».
 *      **Falla SIEMPRE en vez de a veces**: A generalizó la condición y
 *      es implacable —
 *
 *          dos ítems entran ⟺ 2·pct·u + gap ≤ u
 *          48 % ⟺ u ≥ 400  ⇒ 🔴 NINGÚN teléfono
 *          47 % ⟺ u ≥ 267  ⇒ entra en todos
 *
 *      Medido en cuatro anchos reales, los cuatro envuelven con 48 %:
 *      Android 412 (380,8 sobre 380) · web 420 (388,5 sobre 388) ·
 *      Android 360 (330,9 sobre 328) · **iPhone 430 (398,08 sobre 398,
 *      por 0,08 px)**.
 *
 *  ⚠️ **POR QUÉ EL ERROR ES FÁCIL Y NO DESCUIDADO** — la frase de A, que
 *  es lo que de verdad protege este patrón: ***el `gap` no se ve en el
 *  porcentaje.*** `48 + 48 = 96 < 100` invita a concluir que sobra 4 % —
 *  y sobra, pero el gap se come 16 px, que en 380 son **4,2 %**. *El
 *  porcentaje y el gap están en unidades distintas y la resta se hace en
 *  píxeles.*
 *
 *  ⇒ Por eso la cura no es un tercer porcentaje con más margen: es
 *  **sacar el gap de la cuenta del wrap**. Un patrón que depende de
 *  cuánto sobra no es determinista — es una coincidencia con suerte. */
