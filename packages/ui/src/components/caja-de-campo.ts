/**
 * LA CAJA DEL CAMPO — la anatomía de N11, escrita UNA vez (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y no es prolijidad: **la anatomía de la caja estaba
 * escrita TRES VECES dentro de `packages/ui`** — `Campo`, `CampoCodigo`
 * y `CampoFecha` repetían el mismo `BORDE = 1.5`, el mismo
 * `theme.mode === 'light' ? bg.card : bg.elevated` y la misma
 * transición, byte por byte.
 *
 * Hoy coinciden **por copia**, que es la forma más frágil de coincidir.
 * Y N11 lo vuelve exigible con todas las letras: ***«dos estilos de
 * campo jamás conviven en la misma región de una pantalla»*** — aplicar
 * la ley a `Campo` y no a sus dos hermanas fabricaría exactamente los
 * dos estilos que la ley prohíbe. Es la misma enfermedad que R25 y R30
 * existen para cazar, un piso más adentro.
 *
 * Vive en un `.ts` sin componente —como `chevron.ts` y `usePresionado`—
 * porque **no es una pieza: es geometría compartida.**
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LO QUE N11 CAMBIÓ, Y LO QUE DEROGÓ ─────────────────────────────
 * **☠️ EL RELLENO COMO AFFORDANCE MUERE.** Hasta hoy `Campo` nacía con
 * `sinCaja = true` POR DEFAULT: borde **transparente** en reposo y
 * `bg.overlay` como única señal. Medido: el interior quedaba a
 * **1.07:1** contra el fondo en claro. *Un campo que se distingue de su
 * fondo por 1.07 no se distingue.*
 *
 * 🔴 **Y ESO ERA UNA DECISIÓN FIRMADA (S81), así que el choque se
 * DECLARA y no se resuelve callado** (precedente: el magenta S83, la
 * plata S83 y S88).
 *
 * ⚠️ **LA 19.8 NO MUERE — N11 ES LA 19.8 BIEN APLICADA** (precisión de A
 * al registrar esto para el acta, y vale escribirla acá porque «las dos
 * la leen al revés» se puede leer como que la ley quedó en disputa: no
 * quedó. Lo que muere es **la lectura** de S81, no la ley que citaba):
 *   · **S81:** *«A6 ALCANZA a Campo — el borde de reposo era caja, no
 *     affordance; la affordance la da el RELLENO»*.
 *   · **N11 (S99, firma del founder):** *«☠️ el relleno gris sólido
 *     muere… es la ley 19.8 aplicada al formulario: **se contornea lo
 *     que se fija** — un campo vacío todavía no existe, por eso no se
 *     rellena»*.
 * **Gana N11**: es más nueva, es firma del founder de esta sesión, y
 * trae su razón escrita. *Y el costo de la derogación resultó CERO: la
 * prop `sinCaja` tenía **cero consumidores** — todos los `sinCaja` del
 * árbol son de `Boton`, otra pieza y otra prop.*
 *
 * ── EL CONTORNO TIENE PISO, Y ES UN NÚMERO ─────────────────────────
 * `theme.border.campo` **≥3:1 contra `bg.base`** — token nuevo porque
 * ninguno de la casa llegaba (`default` 1.18/1.28, `presente`
 * 1.62/1.64: se diseñaron para SEPARAR, no para CONTENER). Su gate es
 * **R43** en `verify:diseno`: si alguien mueve el valor por debajo del
 * piso, sale rojo.
 *
 * ── EL FOCO GANA PRESENCIA, NO SOLO COLOR ──────────────────────────
 * N11 pide *«foco con presencia (borde en acento + elevación sutil)»*.
 * La elevación sale de `theme.elevacion.reposo` — **jamás una sombra a
 * mano** (Ley 20 / R4). Y el grosor sigue sin moverse: el estado cambia
 * color y sombra, nunca el borde, porque un borde que engorda **corre
 * el layout mientras alguien tipea**, que es la regla rectora de la
 * pieza desde S43.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ⏪☠️ **N11′ — LA ETIQUETA SALE DE LA CAJA** (firma del founder,
 * 17-ago-2026). S99 la había metido adentro; **hoy vuelve AFUERA Y
 * ARRIBA, siempre visible y siempre del mismo tamaño.**
 *
 * **La razón, que es evidencia y no preferencia** —y por eso la ley se
 * reabrió—: *la etiqueta adentro tiene que encogerse para dejar entrar
 * el valor, y pierde legibilidad justo cuando el campo está lleno, que
 * es cuando la persona revisa antes de pagar.* Más dos costos que
 * ninguna medición de laboratorio muestra: **en español el rótulo pesa
 * el doble** («Instrucciones de entrega» encogida es nota al pie) y **el
 * autofill del sistema tapa el interior de la caja.**
 *
 * 🔴 **LO QUE N11 PROTEGÍA SIGUE ENTERO, y conviene leerlo antes de
 * tocar nada acá:** caja cerrada · contorno ≥3:1 · interior claro (**el
 * relleno gris sólido sigue muerto**) · foco con acento + elevación ·
 * radios N4. *N11′ mueve UN elemento de lugar; no reabre la derogación
 * del relleno.* Quien lea esto como permiso para volver al
 * `sinCaja = true` de S81 está leyendo otra cosa.
 *
 * **LOS DOS NÚMEROS QUE LA SOSTIENEN — y por qué son la ley y no un
 * detalle:** sacar la etiqueta afuera tiene UN riesgo real, que es que
 * se despegue de su campo y se lea como pie del campo de ARRIBA.
 *   · **`GAP_ETIQUETA` = 8** entre la etiqueta y SU caja.
 *   · **≥24 entre un campo y el siguiente**, que en esta casa **no hay
 *     que pedirle a nadie**: lo garantiza `PieDeCampo`, cuyo slot
 *     reservado mide **26.4** (14 × 1.6 + 4). *La proporción queda 8
 *     contra 26.4 — 3.3× — así que la etiqueta está inequívocamente más
 *     cerca de su caja que de la de arriba.*
 *
 * > **Y ahí está el punto que vale más que los números: la ley de N11′
 * > se cumple POR CONSTRUCCIÓN, no por disciplina del consumidor.** El
 * > único modo de romperla es `sinPie` sin `PieDeCampo` — que es
 * > exactamente lo que **R29** ya prohíbe desde S83. *La regla que hacía
 * > falta para esta enmienda ya estaba escrita para otra cosa.*
 *
 * **El 8 y no el 6:** el founder firmó *«6-8px»*. **8 es el único de los
 * dos que cumple N2** (*todo espaciado múltiplo de 8; el 4 solo para
 * pares íntimos icono-texto*). *Elegir 6 obligaría a tallar una
 * excepción en una ley firmada para ahorrar dos píxeles.*
 *
 * **LA CAJA VUELVE A 48**, derivada: línea de entrada (24) + `spacing[3]`
 * de aire arriba y abajo. **Y 48 no es un número nuevo: es el que
 * `CampoCodigo` conservó todo este tiempo** —con el label afuera— *«con
 * su razón escrita»*. ⇒ **la excepción de ayer es la norma de hoy.**
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Theme } from '../themes'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { halo } from '../tokens/elevacion'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'

/** SIEMPRE 1.5 — el estado cambia color, jamás grosor (regla rectora). */
export const BORDE_CAMPO = 1.5

/** N11′ · el aire entre la etiqueta y SU caja. Ver el porqué del 8 sobre
 *  el 6 en la cabecera (N2: múltiplo de 8, sin tallar excepción). */
export const GAP_ETIQUETA = spacing[2] // 8

/** N11′ · la línea de entrada: el alto del texto que se tipea. */
export const ALTO_LINEA_CAMPO = Math.round(
  typography.size.base * typography.leading.normal,
) // 24

/** N11′ · el alto de la caja, DERIVADO y no elegido: línea + aire arriba
 *  y abajo. Da **48**, que es el target táctil de N8 y el mismo número
 *  que `CampoCodigo` conservó siempre con su label afuera.
 *  ⚠️ Derivado a propósito: quien mueva la escala de N1 no tiene que
 *  acordarse de mover también este número (misma disciplina que el 62
 *  que este valor reemplaza). */
export const ALTO_CAJA_CAMPO = ALTO_LINEA_CAMPO + spacing[3] * 2 // 48

/** N11′ · el tamaño de la etiqueta. **`sm` (14) y no `xs` (11)**, y es
 *  la mitad de la enmienda que se pierde si solo se la muda de lugar:
 *  el rótulo de S99 medía 11 px porque tenía que caber DENTRO de la
 *  caja junto al valor. **Afuera ya no compite con nada**, y una
 *  etiqueta de 11 px afuera es exactamente la «nota al pie» que la firma
 *  nombra. `sm` es el registro SECUNDARIO de N1 (14/20), que es lo que
 *  una etiqueta es.
 *
 *  🔴 **Y no cambia nunca**: ni por foco, ni por contenido, ni por
 *  error. *Un rótulo que cambia de tamaño o de color según el estado
 *  deja de ser el nombre del campo y pasa a ser otro indicador más* —
 *  y el estado ya lo dicen el contorno y el pie. */
export const TAMANO_ETIQUETA = typography.size.sm // 14

/* ═══════════════════════════════════════════════════════════════════
 * ⭐ **N11″ — LA ETIQUETA VUELVE ADENTRO, AHORA FLOTANDO** (firma del
 *    founder, S116-B lote 6). **Y es la TERCERA vuelta de esta ley, así
 *    que el choque se declara entero en vez de resolverse callado**
 *    (precedente: el magenta S83, la plata S83 y S88, el foco S104).
 *
 * **El arco, para que nadie lo vuelva a recorrer a ciegas:**
 *   · **N11 (S99-B):** la etiqueta ADENTRO.
 *   · **N11′ (S100-B, firma del founder):** AFUERA Y ARRIBA, *«siempre
 *     visible y siempre del mismo tamaño»*, con su evidencia.
 *   · **N11″ (hoy):** adentro otra vez — **pero flotando**: al enfocar
 *     se achica y sube al borde superior, y el valor queda debajo.
 *
 * 🔴 **NO ES UNA REVERSIÓN A CIEGAS: CONTESTA EL ARGUMENTO DE N11′.**
 * Aquel decía *«la etiqueta adentro tiene que ENCOGERSE PARA DEJAR
 * ENTRAR EL VALOR, y pierde legibilidad justo cuando el campo está
 * lleno»* — y el supuesto escondido es **que encogerse significa
 * desaparecer o volverse ilegible**. Flotando no compite con el valor:
 * cada uno tiene su renglón, y **el nombre del campo sigue a la vista
 * siempre**, que es literalmente lo que N11′ quería proteger.
 *
 * ⚠️ **LO QUE N11′ DIJO Y ESTA ENMIENDA *NO* CONTESTA — los dos costos
 * quedan vivos y se declaran para que el founder pueda revisarlos:**
 *   1. **«En español el rótulo pesa el doble.»** Los ejemplos del
 *      encargo son cortos («Nombre», «Correo electrónico»,
 *      «Contraseña») y a 11 px entran. **«Instrucciones de entrega» a
 *      11 px sigue siendo una nota al pie**, y ese campo existe. *La
 *      pieza no lo puede resolver: o el rótulo es corto, o la etiqueta
 *      flotada de ese campo va a leerse chica.*
 *   2. **«El autofill del sistema tapa el interior de la caja.»**
 *      Sigue siendo cierto y ahora la etiqueta vive ahí adentro. No
 *      está medido en este lote.
 *
 * ✅ **LO QUE SÍ SE RESOLVIÓ, Y NO POR CASUALIDAD: la regla rectora
 * QUEDA INTACTA, sin tallarle una excepción.** *«Nada se mueve mientras
 * alguien tipea»* — y la etiqueta **se mueve AL ENFOCAR**, o sea
 * ANTES del primer carácter, no en el primero. Con el campo ya lleno se
 * queda arriba y **no se mueve un píxel mientras se escribe**. *Atarlo
 * al primer carácter habría sido exactamente lo que la regla prohíbe, y
 * la diferencia entre las dos formas no se ve leyendo: se ve tipeando.*
 *
 * ⚠️ **Y NO SE ANIMA, declarado:** animar el tamaño de la etiqueta es
 * animar LAYOUT, que la Ley 6 prohíbe desde S43. El cambio viaja junto
 * al del borde y el halo —que sí se animan— así que se lee como la
 * respuesta al toque y no como un salto. *Si la mesa quiere el
 * deslizamiento, es una firma sobre píxeles y una excepción escrita a la
 * Ley 6, no una decisión de esta pieza.*
 *
 * ☠️ **EL PLACEHOLDER DE EJEMPLO MUERE** («ej: ana@correo.com»): la
 * etiqueta hace ese trabajo. **Con UNA excepción viva y medida: la
 * búsqueda** (`etiquetaVisible={false}`), donde N11′ firmó *lupa +
 * placeholder* y no hay etiqueta que flote.
 * ═══════════════════════════════════════════════════════════════════ */

/** N11″ · el tamaño de la etiqueta cuando FLOTA. `xs` (11) — el único
 *  registro que deja entrar el valor debajo sin subir la caja más de lo
 *  que el encargo vino a bajar. ⚠️ **Su contraste tiene piso y se mide:
 *  `text.secondary` es `tintaTexto65`**, el 65 % que la orden nombra. */
export const TAMANO_ETIQUETA_FLOTANTE = typography.size.xs // 11

/** N11″ · el alto de la etiqueta flotada. **`snug` y no `normal`**: un
 *  rótulo de una línea con interlínea de párrafo desperdicia 4 px en una
 *  caja que este lote vino a achicar. */
export const ALTO_ETIQUETA_FLOTANTE = Math.round(
  TAMANO_ETIQUETA_FLOTANTE * typography.leading.snug,
) // 14

/** N11″ · el alto de la caja con la etiqueta adentro. **DERIVADO**:
 *  etiqueta flotada + línea de entrada + aire arriba y abajo. Da **54**.
 *
 *  🔴 **Es CONSTANTE entre los dos estados, y ésa es la mitad que hace
 *  que la regla rectora se cumpla.** La caja se dimensiona para el
 *  estado LLENO, así que enfocar no la mueve: lo único que cambia
 *  adentro es dónde está la etiqueta. *Una caja que creciera al enfocar
 *  empujaría todo el formulario hacia abajo — que es el defecto que la
 *  regla nombra.*
 *
 *  ⚠️ **Sube 6 sobre los 48 de N11′ y el lote igual ACHICA**, porque lo
 *  que se va es la etiqueta de afuera (14 + su gap de 8 = 22). Neto por
 *  campo: **−16**. */
export const ALTO_CAJA_CAMPO_V5 = ALTO_ETIQUETA_FLOTANTE + ALTO_LINEA_CAMPO + spacing[2] * 2 // 54

/** N11″ · **el INTERIOR de la caja: los dos renglones, etiqueta y valor.**
 *
 * 🔴 **Nace de un defecto del founder en el aparato, y el número es la
 * mitad de la cura:** *«la etiqueta chica y el valor comparten renglón en
 * vez de tener el suyo»*. **Medido: con la etiqueta arriba, el input
 * pasaba de 23 dp a 11.** La causa era un `flex: 1` heredado —ver la nota
 * en `Campo`— y **el remedio completo son dos cosas**: quitarle el `flex`
 * al input **y darle a la columna un alto EXPLÍCITO**, para que los dos
 * renglones existan por construcción y no por lo que sobre.
 *
 * *Un `justifyContent: 'center'` sobre un alto que nadie fijó reparte lo
 * que haya; si el alto está fijo en la suma de sus dos hijos, no hay nada
 * que repartir — y ése es exactamente el estado que la orden pide.* */
export const ALTO_INTERIOR_CAMPO_V5 = ALTO_ETIQUETA_FLOTANTE + ALTO_LINEA_CAMPO // 38

/* ═══════════════════════════════════════════════════════════════════
 * 🔴 **LOS TRES DE ARRIBA SON dp FIJOS Y EL TEXTO NO LO ES — ésa era la
 *    causa raíz, y la encontró el teléfono del founder, no el emulador.**
 *
 * En React Native `fontSize` **escala con la preferencia de tamaño de
 * letra del sistema** (`allowFontScaling`, encendido por defecto). Los
 * altos de caja de arriba **no**. ⇒ con la letra del sistema agrandada el
 * texto crece y la caja no, **y el valor se aplasta contra la etiqueta**.
 *
 * **Medido en el emulador, mismo campo, mismo texto:**
 *   · escala **1,0** → etiqueta 12,3 dp · valor **23,0 dp** · limpio
 *   · escala **1,3** → etiqueta 16,7 dp · valor **6,7 dp** · **se pisan**
 *
 * *Mi verificación anterior no estaba mal hecha: estaba hecha con la
 * escala 1,0, que es la única que un emulador recién creado tiene. El
 * founder mira su teléfono, y su teléfono tiene otra.*
 *
 * ⚠️ **La salida FÁCIL está prohibida:** `allowFontScaling={false}`
 * congelaría el texto y el defecto desaparecería de la pantalla —
 * *ignorando la preferencia de accesibilidad de la persona, que es
 * exactamente lo que esa preferencia existe para que no pase.*
 *
 * ⇒ **Las medidas se DERIVAN de la escala en cada render.** Con 1,0 dan
 * los mismos números de siempre (14 · 24 · 38 · 54), así que nada se
 * mueve donde hoy está bien.
 * ═══════════════════════════════════════════════════════════════════ */
export interface MedidasCampoV5 {
  /** Alto del renglón de la etiqueta flotada. */
  etiqueta: number
  /** Alto del renglón del valor. */
  linea: number
  /** Los dos renglones: el interior de la caja. */
  interior: number
  /** El interior más el aire de arriba y abajo. */
  caja: number
}

/** Las medidas del campo v5 **para la escala de letra vigente**.
 *
 *  ⚠️ **Se llama EN EL RENDER, no en el módulo.** Una constante calculada
 *  al importar se congela con la escala que hubiera en ese momento — *que
 *  es el mismo defecto de un piso más arriba, y más difícil de ver.* */
export function medidasCampoV5(escalaDeLetra: number): MedidasCampoV5 {
  const etiqueta = Math.round(TAMANO_ETIQUETA_FLOTANTE * typography.leading.snug * escalaDeLetra)
  const linea = Math.round(typography.size.base * typography.leading.normal * escalaDeLetra)
  const interior = etiqueta + linea
  return { etiqueta, linea, interior, caja: interior + spacing[2] * 2 }
}

/** N11″ · el disco del glifo a la izquierda. El par `accent.glifo` /
 *  `accent.glifoBg` ya nombra al CAMPO entre sus cuatro empleos («fila ·
 *  campo · acceso · paso»), así que el color no se elige acá: se pide. */
export const DISCO_GLIFO_CAMPO = 32

export interface EstadoCaja {
  /** Pinta `status.danger` y gana prioridad sobre el foco. */
  error?: boolean
  enfocado?: boolean
}

/** El color del contorno según estado. El reposo YA NO ES TRANSPARENTE
 *  (ver la derogación en la cabecera). */
export function colorDeContorno(theme: Theme, { error, enfocado }: EstadoCaja): string {
  /* 🔴 **S116-B lote 2 · EL ERROR DEJA DE PINTAR LA CAJA DE ROJO.**
     Punto 5 del encargo, textual: *«si hay un error, la caja no se pone
     roja: aparece una línea de texto debajo que dice qué falta, en tinta,
     y el borde toma el ámbar»*.
     **Sólo donde la casa recibió la geometría v5** — el prestador conserva
     su rojo, que es lo que su gate midió. *El rojo no se saca porque
     moleste: se saca porque un campo a medio llenar no es una falla, y
     pintarlo de rojo mientras la persona todavía está escribiendo la
     acusa de algo que no hizo.* La voz sigue en su línea de texto: ahí
     está el «qué falta» (Ley 17.4, intacta). */
  if (error) return formaV5(theme) ? theme.status.warning : theme.status.danger
  /* 🔴 **S116-B lote 5 · EL FOCO PASA A CIRUELA, Y SÓLO EN LA CASA v5.**
     Orden de la mesa: *«Campo y CampoCodigo: el borde de foco y el halo
     pasan a ciruela… El magenta queda solo en lo accionable»*. Un campo
     enfocado no es una acción: es dónde está parada la persona.

     ⚠️ **Se resuelve por `accent.glifo` y no por un slot nuevo, y el
     acoplamiento se declara en vez de esconderse:** el par del glifo ES
     «el acento NO accionable de esta casa» —la misma decisión que pintó
     los glifos—, y en el tema oscuro del cliente resuelve rosa, que es lo
     que un cerco de foco necesita sobre fondo oscuro. *Si algún día la
     mesa mueve el color del glifo sin querer mover el foco, este slot se
     parte en dos — y entonces habrá una razón escrita para partirlo, que
     hoy no existe.*

     El prestador conserva su `accent.active` (tealDark), que es lo que su
     gate midió, y **Ley 5 sigue intacta**: el campo enfocado sigue siendo
     el elemento activo de la vista; lo único que cambió es con qué color
     lo dice la casa del cliente. */
  if (enfocado) return formaV5(theme) ? theme.accent.glifo : theme.accent.active  /* S116-B · memorial ya porta este slot (los 3 temas son isomorfos): el fallback era rama muerta. */
  /* 🔴 **S116-B lote 6 · EL REPOSO PASA A CIRUELA TENUE, CON SU PISO.**
     Firma del founder: *«el borde de los campos en reposo es gris; en el
     sketch es ciruela tenue»*.
     ⚠️ **«Tenue» tiene un piso y no es negociable:** el borde de un campo
     es contorno de control ⇒ **3:1 (WCAG 1.4.11)**, que `R43` vigila.
     Ciruela al 25 % —lo que «tenue» sugiere a ojo— da **1,82:1**: *se ve
     tenue y deja de existir para quien no distingue bien los tonos bajos.*
     El token es el primero que pasa contra las tres superficies, y **mejora
     los números del gris que reemplaza** (3,82 vs 3,68 sobre tarjeta).
     Sólo en la casa v5: el prestador conserva su gris, que es lo que su
     gate midió. */
  return formaV5(theme) ? theme.border.campoV5 : theme.border.campo
}

/** El grosor del contorno. S104-B: el foco suma **1** sobre el reposo —
 *  el «+1pt» de la orden. Vive acá y no en la pieza porque el grosor es
 *  anatomía y las tres cajas la comparten. */
export function grosorDeContorno({ enfocado }: EstadoCaja): number {
  return enfocado ? BORDE_CAMPO + 1 : BORDE_CAMPO
}

/** El interior: **lo más claro de su región** (N11). En claro es blanco
 *  sobre el papel tapiz; en los temas oscuros, el paso de luminancia que
 *  cada tema ya tiene declarado para sus superficies. */
export function interiorDeCaja(theme: Theme): string {
  return theme.mode === 'light' ? theme.bg.card : theme.bg.overlay
}

/** El estilo COMPLETO de la caja — las tres piezas lo consumen entero,
 *  jamás por partes: una que tome el borde y se escriba el fondo vuelve
 *  a ser una cuarta copia con otro nombre. */
/* ═══════════════════════════════════════════════════════════════════
 * ☠️ S104-B · EL FOCO A TINTA PLENA — APLICADO Y RETIRADO EL MISMO DÍA.
 *    EL ARCO COMPLETO QUEDA ESCRITO, PORQUE ES LO ÚNICO QUE EVITA QUE
 *    LA PRÓXIMA MESA LO VUELVA A PEDIR.
 *
 * **① La orden:** *«el foco del campo: borde a tinta plena +1pt,
 * 150ms»*. Se aplicó.
 *
 * **② El choque, declarado ACÁ y no en un parte:** el contorno enfocado
 * tomaba `accent.active` —magenta en el cliente, tealDark en el
 * prestador— por **Ley 5** (*«el campo enfocado ES el elemento activo
 * de la vista»*) y por el **SEXTO SLOT de S83-B13**, que resolvió
 * `accent.active` POR CASA justamente para que el foco hablara con el
 * acento de cada una. `CampoCodigo` cita esa ley palabra por palabra.
 * Se anotó también el alcance: **UNA definición, TRES piezas** (`Campo`,
 * `CampoFecha`, `CampoCodigo`) **en LAS DOS APPS**.
 *
 * **③ ☠️ LA ENMIENDA — el founder RETIRA la orden.** Literal:
 * *«fue orden mía sin ver el choque»*. **Vuelve `accent.active`.**
 *
 * ✅ **LO QUE SÍ QUEDA, y no es el resto: es la mitad buena.** El
 * **+1pt en 150 ms** sobrevive — *el movimiento vive en el borde, no en
 * la etiqueta* (N11′ intacta). El foco ahora se lee por **color Y
 * peso**, que además es lo que un daltónico necesita: el color solo
 * nunca fue suficiente.
 *
 * 🔴 **LA NOTA DE MÉTODO, que es lo que vale de todo esto:** la enmienda
 * existe **porque se aplicó lo pedido Y se declaró el choque en la
 * fuente**. Aplicarlo callado habría llegado al gate en dispositivo con
 * la Ley 5 ya rota en tres piezas de dos apps, y el founder habría
 * estado juzgando un desvío sin saber que lo era.
 * *Declarar un choque no es desobedecer una orden: es lo que permite
 * que quien la dio pueda revisarla.*
 *
 * ⚠️ **Costo que YA NO aplica** (se conserva por si alguien reabre): con
 * tinta plena, el texto se corría 1 px horizontal al enfocar, porque el
 * borde pasaba de 1.5 a 2.5. **Ese px sigue existiendo — el +1pt
 * quedó** — pero ahora es el único cambio, no el acompañante de un
 * cambio de color.
 * ═══════════════════════════════════════════════════════════════════ */
/** ¿Esta casa recibió la geometría del rediseño? (`accent.formaV5`, el
 *  décimo slot — nace en el lote 2 de S116-B). Cliente sí; prestador y
 *  memorial no. */
export function formaV5(theme: Theme): boolean {
  return 'formaV5' in theme.accent && theme.accent.formaV5 === true
}

export function estiloDeCaja(theme: Theme, estado: EstadoCaja) {
  const v5 = formaV5(theme)
  return {
    /* S116-B · «campo radio 18» (letra §2). Sólo con la geometría v5; el
       prestador conserva su `radius.md`. */
    borderRadius: v5 ? radius.campoV5 : radius.md,
    borderWidth: grosorDeContorno(estado),
    borderColor: colorDeContorno(theme, estado),
    backgroundColor: interiorDeCaja(theme),
    /** La presencia del foco (N11). En reposo NO hay sombra: el contorno
     *  ya contiene, y sombrear todo campo llenaría de material una
     *  pantalla de formulario. */
    /* S116-B · «foco borde 1,5 + **halo 4 al 10 %**» (letra §2). Con v5 el
       foco deja de tomar prestada la elevación de reposo —que es una sombra
       de apoyo, no un halo— y usa un halo del acento: *un halo dice «acá
       estás», una sombra dice «esto está apoyado», y no son lo mismo.* */
    boxShadow: estado.enfocado && !estado.error
      ? v5
        ? /* El halo ES el borde al 10 %: se deriva del mismo color en vez
             de repetirlo, así el día que el foco cambie de acento el halo
             ya cambió con él. */
          halo.presencia(colorDeContorno(theme, estado))
        : theme.elevacion.reposo
      : undefined,
    /* S104-B — `fast` YA vale **150**, exactamente la duración que la orden
     * pide: no se tecleó un número nuevo ni se fundó una excepción.
     *
     * ⚠️ **SE ANIMA EL COLOR, NO EL GROSOR — y se declara en vez de
     * disimularse.** El intento de listar las dos (`'borderColor,
     * borderWidth'` y su forma de array) **rompió el typecheck del
     * prestador**: con el `as const` del objeto la lista se vuelve tupla
     * readonly y el estilo deja de ser asignable. **Lo cazó `tsc`, no el
     * ojo** — y el baseline del worktree primario probó que el rojo era
     * mío y no heredado.
     *
     * ⇒ El grosor **salta** de 1.5 a 2.5 y el color recorre sus 150 ms.
     * En pantalla el gesto se lee igual: el salto de `border.campo` a
     * tinta plena es el cambio dominante y 1 px aparece dentro de esa
     * transición. *Perseguir la animación del grosor habría costado sacar
     * el `as const` de una anatomía que TRES piezas consumen entera — el
     * precio no lo paga el efecto.*
     *
     * 🔴 **S116-B · EL HALO ENTRA A LA TRANSICIÓN, y su ausencia era un
     * defecto medible, no una decisión.** La lista decía sólo
     * `borderColor` **desde antes de que el halo existiera** —nació en el
     * lote 2— así que el borde llegaba suave y **el halo aparecía de
     * golpe**: dos mitades del mismo estado de foco entrando distinto.
     * *Nadie lo decidió: la lista se quedó donde estaba cuando la cosa que
     * describe creció.*
     *
     * ⚠️ **Y NO CONTRADICE la regla rectora de abajo.** «Nada se mueve
     * mientras alguien tipea» prohíbe animar el CONTENIDO —el label, el
     * layout, el texto—; el foco es lo que pasa ANTES de tipear, y su
     * borde ya se animaba. *Lo que se agrega no es movimiento nuevo: es la
     * otra mitad del que ya había.*
     *
     * Sigue sin animarse nada más (Ley 6 · regla rectora: nada se mueve
     * mientras alguien tipea). */
    /* ⚠️ **ARRAY y no `'borderColor, boxShadow'`** — el tipo de Reanimated
     * es `'all' | 'none' | keyof S | (…)[]`: **la cadena con coma es CSS,
     * no su API**.
     * ⚠️ **Y el cast no es decoración: el `as const` del return vuelve el
     * array `readonly`, y el tipo pide uno mutable.** Sin él la pieza
     * compila igual pero **el objeto entero deja de matchear** y el error
     * sale en los CONSUMIDORES, no acá.
     * 🔴 Las dos cosas las cazó el gate del hook —que compila las apps— y
     * NO el tsc de `packages/ui`, que daba 0 en los dos intentos. *Un
     * verde del paquete es un verde sobre un tsconfig que ningún usuario
     * ejecuta.* Medido con `stash`: sin este cambio, `apps/prestador` da
     * EXIT 0 — el rojo era mío. */
    transitionProperty: ['borderColor', 'boxShadow'] as ('borderColor' | 'boxShadow')[],
    transitionDuration: motion.duration.fast,
  } as const
}
