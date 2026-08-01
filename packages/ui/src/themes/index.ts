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
 *  para separar las dos casas — `lightOficio`/`darkOficio`. **Son CINCO**
 *  (eran cuatro hasta S83-B6), y hasta r30 había que abrir los tres
 *  archivos y comparar para saber cuáles:
 *    1. `bg.base`           — el fondo: el tapiz es del cliente
 *    2. `accent.cta`        — oro el cliente · tealDark el oficio
 *    3. `accent.ctaTexto`   — el par del anterior
 *    4. `accent.ctaElevado` — el relieve del CTA, solo del cliente
 *    5. `accent.control`    — el acento de ELECCIÓN: magenta el cliente ·
 *       tealDark el oficio (S83-B6). Apareció el quinto y se agregó acá,
 *       como la nota de r30 mandaba: la lista ES el contrato.
 *  Si aparece un sexto, se agrega ACÁ: la lista es el contrato. */
export type SlotDeTema =
  | 'bg.base'
  | 'accent.cta'
  | 'accent.ctaTexto'
  | 'accent.ctaElevado'
  | 'accent.control'
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
  // S82-B r10 — LA SEPARACIÓN DEL FONDO (orden founder r8 §5 y r9 §4,
  // firmada dos veces: "el prestador NO recibe tinte. Es fondo del
  // cliente"). El tapiz se encendió en el tema del cliente; acá el
  // prestador se queda en PAPEL ALGODÓN. El guard R16 de verify:diseno
  // EXIGE esta línea mientras `papelTapiz !== light0` — su rojo fue
  // producido antes de escribirla (exit 1, r9).
  bg: { ...lightTheme.bg, base: palette.light0 },
  // S82-B: el prestador NO recibe la elevación del CTA (su teal no
  // tiene el problema del oro contra papel — sería arrastre).
  // S83-B6 — EL QUINTO SLOT: `accent.control` es el acento de ELECCIÓN
  // (§15b.1: UN acento de oficio para TODO estado y control funcional del
  // prestador; el magenta vive SOLO en la marca). Sin esta línea el
  // prestador elegía en MAGENTA por herencia — la letra al revés, y en
  // silencio. NO arrastra la PATA: su color lo firma el founder y hoy
  // vive aparte, en `accent.marcaEleccion` (su nota está en los temas).
  // Lo vigila R26 de verify:diseno, con su rojo producido.
  accent: { ...lightTheme.accent, cta: palette.tealDark, ctaTexto: palette.light0, ctaElevado: false, control: palette.tealDark },
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
  // silencio. NO arrastra la PATA: su color lo firma el founder y hoy
  // vive aparte, en `accent.marcaEleccion` (su nota está en los temas).
  // Lo vigila R26 de verify:diseno, con su rojo producido.
  accent: { ...darkTheme.accent, cta: palette.tealDark, ctaTexto: palette.textDark0, ctaElevado: false, control: palette.tealDark },
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
