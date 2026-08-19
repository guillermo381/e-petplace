import { lightTheme } from './light'
import { darkTheme } from './dark'
import { memorialTheme } from './memorial'
import { palette } from '../tokens/palette'

export { lightTheme, darkTheme, memorialTheme }

/** `Theme` — LA UNIÓN ENSANCHADA (S82-B r30, paga D-582).
 *  ANTES derivaba de los objetos, así que cada campo quedaba LITERAL y
 *  todo override necesitaba un cast: cobró CUATRO veces en una sesión,
 *  la última BLOQUEANDO trabajo firmado.
 *  EL MAPA que costó un intento fallido: (a) la UNIÓN SE CONSERVA — los
 *  componentes narrowean con `'capa' in theme` porque MEMORIAL no porta
 *  todos los campos, y un tipo único colapsa ese narrowing a `never`
 *  (rompía 20+ componentes); (b) hay TRES formas de literal, no una:
 *  string, boolean y los OBJETOS DE SOMBRA — y estos últimos NO se
 *  ensanchan, porque `shadow.glow` también se narrowea por tema. */
type Ancho<T> = {
  [K in keyof T]: T[K] extends string ? string
    : T[K] extends boolean ? boolean
    : T[K] extends object ? Ancho<T[K]>
    : T[K]
}
/** Ensancha los colores y DEJA INTACTOS los que se narrowean (`shadow`,
 *  `elevacion`) y el discriminante de la unión (`mode`). */
type TemaAncho<T extends { shadow: unknown; elevacion: unknown; mode: unknown }> =
  Omit<Ancho<T>, 'shadow' | 'elevacion' | 'mode'> & Pick<T, 'shadow' | 'elevacion' | 'mode'>
export type Theme = TemaAncho<typeof lightTheme> | TemaAncho<typeof darkTheme> | TemaAncho<typeof memorialTheme>

/** ⭐ LOS SLOTS — el número que antes NO EXISTÍA (S82-B r30).
 *  Un SLOT no es "un campo que cambia entre temas" (eso son casi todos:
 *  es lo que un tema ES). Un slot es un campo que un tema DERIVADO PISA
 *  para separar las dos casas — `lightOficio`/`darkOficio`. **Son OCHO**
 *  (cuatro hasta S83-B6; cinco en B13; seis y siete en B19; ocho en B34), y hasta r30 había que abrir los tres
 *  archivos y comparar para saber cuáles:
 *    1. `bg.base`           — el fondo: el tapiz es del cliente
 *    2. `accent.cta`        — oro el cliente · tealDark el oficio
 *    3. `accent.ctaTexto`   — el par del anterior
 *    4. `accent.ctaElevado` — el relieve del CTA, solo del cliente
 *    5. `accent.control`    — el acento de ELECCIÓN: magenta el cliente ·
 *       el verde del oficio EN SUS DOS REGISTROS (S83-B6, ensanchado a
 *       dos registros en B17 por la misma medición que movió `active`).
 *    6. `accent.active`     — el acento de ESTADO ACTIVO: pink el cliente
 *       · el VERDE del oficio, EN SUS DOS REGISTROS (S83-B13).
 *    7. `accent.marcaEleccion` — el color de LA PATA. Nació fuera del
 *       slot (B9) porque su color no estaba firmado; el founder lo firmó
 *       en B19 con su límite: "en teal, jamás magenta".
 *    8. `accent.atmosfera`  — el color de la LUZ DE AMBIENTE (S83-B34):
 *       magenta el cliente · el verde del oficio. Nace como slot porque
 *       `accent.primary` —el candidato de la orden, que C ya usaba en el
 *       layout del prestador— **es el MISMO teal en las dos casas**
 *       (tealDark en claro, teal puro en oscuro) y por lo tanto NO las
 *       distingue: con él, la atmósfera del cliente saldría verde.
 *       *(Corrección de una medición propia: primero reporté que era
 *       `text.primary`. Era falso — hay DOS `primary` en el tema y el
 *       grep tomó el de texto. `accent.primary` sí es el teal, así que
 *       lo que C montó en el prestador está BIEN; lo que falla es
 *       reusarlo del otro lado.)*
 *  Si aparece un noveno, se agrega ACÁ: la lista es el contrato. */
export type SlotDeTema =
  | 'bg.base'
  | 'accent.cta'
  | 'accent.ctaTexto'
  | 'accent.ctaElevado'
  | 'accent.control'
  | 'accent.active'
  | 'accent.marcaEleccion'
  | 'accent.atmosfera'
export type ThemeMode = 'light' | 'dark' | 'memorial'
export type ServiceKey = keyof typeof lightTheme.services
export type StatusKey = 'success' | 'warning' | 'danger' | 'info'
export type CapaKey = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

/** S63 — enmienda Ley 21 FIRMADA: el ancla del CTA primario. 'tinta' =
 *  el de siempre (default, cliente); 'oficio' = tealDark en light Y
 *  dark (raíz del prestador). MEMORIAL SIEMPRE tinta — no se celebra. */
export type CtaAncla = 'tinta' | 'oficio'

// Pares MEDIDOS (S63, B — AA ≥4.5): papel #FAF9F7 / tealDark = 5.51
// (light) · textDark0 #F0EEF8 / tealDark = 5.05 (dark).
const lightOficio: Theme = {
  ...lightTheme,
  // ⚠️ DEROGADO EL 1-AGO-2026 (S83-B33/B34, firma del founder) — LO DE
  // ABAJO ES HISTORIA, NO LA REGLA VIGENTE. Se conserva porque explica
  // de dónde vienen los nombres, y se marca porque quien lea el
  // comentario sin leer el valor entiende lo CONTRARIO de lo que rige:
  // hoy `bg.base` NO es `light0` — es `papelTapizOficio`, y el prestador
  // SÍ recibe tinte (el suyo). *(Marca puesta en S83-A35 por orden de la
  // mesa: es la clase D-604 —la instrucción falsa— y acá todavía era
  // potencial, no consumada.)*
  //
  //   ~~S82-B r10 — LA SEPARACIÓN DEL FONDO (orden founder r8 §5 y r9 §4,
  //   firmada dos veces: "el prestador NO recibe tinte. Es fondo del
  //   cliente"). El tapiz se encendió en el tema del cliente; acá el
  //   prestador se queda en PAPEL ALGODÓN. El guard R16 de verify:diseno
  //   EXIGE esta línea mientras `papelTapiz !== light0` — su rojo fue
  //   producido antes de escribirla (exit 1, r9).~~
  //
  // LO QUE R16 EXIGE HOY (verificado por sabotaje en S83-A35, las TRES
  // mitades en exit 1): que `lightOficio` pise `papelTapizOficio` · que
  // `darkOficio` pise `tapizDarkOficio` · y que los dos tapices NO sean
  // el mismo hex — "la separación es de nombre y no de color".
  // S83-B33 — EL PAPEL VERDE. Hasta hoy esta línea pisaba a `light0`
  // (papel NEUTRO) porque la letra de S82 decía que el prestador no
  // recibía tinte; el founder la enmendó: un tinte por casa en LOS DOS
  // temas. Su método es el del cliente, reproducido: teal puro al 3%
  // sobre light0, igual que su magenta al 3%.
  bg: { ...lightTheme.bg, base: palette.papelTapizOficio },
  // S82-B: el prestador NO recibe la elevación del CTA (su teal no
  // tiene el problema del oro contra papel — sería arrastre).
  // S83-B19 ④ — LA PATA VIAJA AL PRESTADOR, EN TEAL. En B9 la dejé FUERA
  // del slot a propósito (su color no estaba firmado y arrastrarla habría
  // sido decidir por el founder). Ahora lo pidió, con su límite dicho:
  // "en teal, JAMÁS magenta" (§15b.1). Dos registros como sus hermanos.
  // S83-B6 — EL QUINTO SLOT: `accent.control` es el acento de ELECCIÓN
  // (§15b.1: UN acento de oficio para TODO estado y control funcional del
  // prestador; el magenta vive SOLO en la marca). Sin esta línea el
  // prestador elegía en MAGENTA por herencia — la letra al revés, y en
  // silencio. Lo vigila R27 junto a `active` y `marcaEleccion` — los tres
  // son la misma física y por eso los cubre UNA regla, no tres.
  // S83-B13 — EL SEXTO SLOT: `accent.active` es el acento de ESTADO
  // ACTIVO (focus del Campo y de CampoFecha, outline de foco del Boton,
  // huella/pill de la tab). FIRMA DEL FOUNDER en dispositivo sobre el
  // focus del campo: en el prestador NO es magenta, va en verde que
  // ILUMINE. Con eso ARBITRA D-598 a favor de §15b.1 y la posición S72
  // ("accent.active es reserva de MARCA, el magenta en el prestador NO es
  // desvío") queda ENMENDADA — su literal vive en CLAUDE.md:160 y lo
  // enmienda A: dos letras firmadas contradiciéndose es peor que una
  // equivocada, y ésta es la que pierde.
  //
  // POR QUÉ DOS REGISTROS Y NO UN COLOR, medido y no heredado: el focus
  // es BORDE/gráfica (mín 3:1 no textual) y ninguno solo sirve en los dos
  // temas — teal PURO REPRUEBA en claro (1.46 sobre papel) y tealDark en
  // oscuro pasa por poco (3.37, margen 0.37) y no "ilumina". El par da
  // 5.51 en claro y 12.70 en oscuro. Es la regla de dos registros de la
  // Ley 2 y §15b.2 aplicada al estado, no una excepción nueva.
  // 🔴 S98-B · `controlBg` ENTRA A LA LISTA DE PISADOS (cura de D-813): el
  // spread trae el tinte MAGENTA del cliente, y sin esta línea el
  // prestador elegía con borde teal y relleno magenta — medido al píxel
  // en dispositivo. `tealAlpha16` es el tinte de cuidado que la casa ya
  // usa y ya tiene gate WCAG; no es un color nuevo, es el que
  // corresponde. Lo vigila R27 por AUSENCIA, igual que sus tres hermanos.
  // ⭐ S99-B · `activoLleno` PISADO ACÁ — y es el punto entero de la
  // firma del founder: *«lo que queríamos en color oscuro es el VERDE
  // DEL HEADER en el círculo»*. `tealDark` es literalmente el hex con el
  // que `useMuroOficio` pinta el techo en claro, así que el disco de la
  // barra y el techo son **el mismo verde por construcción**, no por
  // coincidencia tecleada. Papel encima: 5.51 (medido S83-B13).
  accent: { ...lightTheme.accent, cta: palette.tealDark, ctaTexto: palette.light0, ctaElevado: false, control: palette.tealDark, hito: palette.tealDark, controlBg: palette.tealAlpha16, active: palette.tealDark, marcaEleccion: palette.tealDark, atmosfera: palette.tealDark, activoLleno: palette.tealDark, sobreActivoLleno: palette.light0 },
}
const darkOficio: Theme = {
  ...darkTheme,
  // S82-B r29 (orden ENMENDADA por el founder): el prestador NO se aísla
  // del tapiz — tiene EL SUYO. Un tinte por casa, misma gramática: el
  // cliente en magenta, el prestador en el verde de SU oficio.
  bg: { ...darkTheme.bg, base: palette.tapizDarkOficio },
  // S83-B6 — EL QUINTO SLOT: `accent.control` es el acento de ELECCIÓN
  // (§15b.1: UN acento de oficio para TODO estado y control funcional del
  // prestador; el magenta vive SOLO en la marca). Sin esta línea el
  // prestador elegía en MAGENTA por herencia — la letra al revés, y en
  // silencio. Lo vigila R27 junto a `active` y `marcaEleccion` — los tres
  // son la misma física y por eso los cubre UNA regla, no tres.
  // S83-B13 — EL SEXTO SLOT: `accent.active` es el acento de ESTADO
  // ACTIVO (focus del Campo y de CampoFecha, outline de foco del Boton,
  // huella/pill de la tab). FIRMA DEL FOUNDER en dispositivo sobre el
  // focus del campo: en el prestador NO es magenta, va en verde que
  // ILUMINE. Con eso ARBITRA D-598 a favor de §15b.1 y la posición S72
  // ("accent.active es reserva de MARCA, el magenta en el prestador NO es
  // desvío") queda ENMENDADA — su literal vive en CLAUDE.md:160 y lo
  // enmienda A: dos letras firmadas contradiciéndose es peor que una
  // equivocada, y ésta es la que pierde.
  //
  // POR QUÉ DOS REGISTROS Y NO UN COLOR, medido y no heredado: el focus
  // es BORDE/gráfica (mín 3:1 no textual) y ninguno solo sirve en los dos
  // temas — teal PURO REPRUEBA en claro (1.46 sobre papel) y tealDark en
  // oscuro pasa por poco (3.37, margen 0.37) y no "ilumina". El par da
  // 5.51 en claro y 12.70 en oscuro. Es la regla de dos registros de la
  // Ley 2 y §15b.2 aplicada al estado, no una excepción nueva.
  // S83-B31 — EL CTA GANA SUS DOS REGISTROS (firma del founder: "el 8% se
  // sostiene y se paga"). En OSCURO el fill pasa a teal PURO y su label a
  // TINTA. NO ES UN PARCHE del tapiz: es §15b.2 —sobre superficie oscura
  // manda el hex puro; `tealDark` es literalmente "la variante AA para
  // light"— aplicada al ÚLTIMO slot de acento del oficio que seguía con
  // un solo registro (control, active y marcaEleccion ya los tenían).
  // Y es la gramática que el cliente ya usa con el oro: fill claro +
  // label tinta (E1).
  // MEDIDO: fill 2.79 → 10.50 (mín 3) · label textDark0 sobre teal daba
  // 1.34 ✗, en tinta da 11.01 ✓. El CLARO no se toca: ahí tealDark rinde
  // 5.51 y el puro REPRUEBA (1.46) — por eso son dos registros y no un
  // color. Reversa: `cta: palette.tealDark, ctaTexto: palette.textDark0`.
  // 🔴 S98-B · `controlBg` pisado también acá (D-813). `tealAlpha15` es el
  // tinte de cuidado del tema oscuro — su par, no un valor nuevo.
  // ⭐ S99-B · `activoLleno` PISADO ACÁ, con la vuelta de registro que
  // §15b.2 manda y que S83-B31 ya midió para el CTA: en oscuro el techo
  // es `tealDarkNoche`, y un disco de ESE verde sobre la barra oscura
  // (`bg.card` = `dark1`) separaría **1.4** — el marcador desaparecería.
  // ⇒ sobre superficie oscura manda el hex PURO, con su contenido en
  // tinta. **Medido S83-B31: fill 10.50 · label 11.01.**
  accent: { ...darkTheme.accent, cta: palette.teal, ctaTexto: palette.textLight0, ctaElevado: false, control: palette.teal, hito: palette.teal, controlBg: palette.tealAlpha15, active: palette.teal, marcaEleccion: palette.teal, atmosfera: palette.teal, activoLleno: palette.teal, sobreActivoLleno: palette.textLight0 },
}

/** El default del producto es CLARO (B1 §7.3). Dark es opt-in. Memorial es automático (M6). */
export function getTheme(mode: ThemeMode, cta: CtaAncla = 'tinta'): Theme {
  switch (mode) {
    case 'dark':     return cta === 'oficio' ? darkOficio : darkTheme
    case 'memorial': return memorialTheme  // memorial JAMÁS celebra: tinta gane quien gane
    case 'light':
    default:         return cta === 'oficio' ? lightOficio : lightTheme
  }
}
