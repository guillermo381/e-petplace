import { lightTheme } from './light'
import { darkTheme } from './dark'
import { memorialTheme } from './memorial'
import { palette } from '../tokens/palette'

export { lightTheme, darkTheme, memorialTheme }

export type Theme = typeof lightTheme | typeof darkTheme | typeof memorialTheme
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
  accent: { ...lightTheme.accent, cta: palette.tealDark, ctaTexto: palette.light0, ctaElevado: false },
}
const darkOficio: Theme = {
  ...darkTheme,
  accent: { ...darkTheme.accent, cta: palette.tealDark, ctaTexto: palette.textDark0, ctaElevado: false },
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
