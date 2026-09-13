/**
 * e-PetPlace — Design Tokens v4 · SOMBRAS
 * Portadas de v3.1 traducidas a objetos React Native:
 *   shadowColor/shadowOffset/shadowOpacity/shadowRadius (iOS/web)
 *   + elevation (Android). shadowRadius ≈ blur CSS / 2.
 *
 * REGLA v4: glow SOLO en dark. En light no existe (v3.1 tenía glow
 * light; B1 lo elimina — la elevación en claro es sombra lavanda sutil).
 * Memorial NUNCA usa glow (v3.1): la luz no encaja con el momento.
 *
 * GLOW ES SEMÁNTICO, no decorativo (decisión founder + dirección, S43-B3.5):
 * reservado a estados "en vivo/en curso" (una cita ejecutándose ahora).
 * Dark: glow real del color de capa. Claro: se traduce a anillo nítido
 * 1.5px del hex puro + pill "● vivo" — el glow difuso sobre claro se
 * ensucia y está prohibido. Un solo elemento vivo por pantalla.
 * Se implementa con el componente de cita en curso (S44).
 */

import { palette } from './palette'

export type ShadowToken = {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

const none: ShadowToken = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
}

export const shadows = {
  dark: {
    none,
    sm: { shadowColor: palette.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: palette.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
    lg: { shadowColor: palette.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12 },
    // Glow — SOLO dark (v4). Acentos re-tonalizados a marca.
    glow: {
      teal:   { shadowColor: palette.teal,   shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
      pink:   { shadowColor: palette.pink,   shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
      verde:  { shadowColor: palette.verde,  shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22, shadowRadius: 9,  elevation: 8 },
      violet: { shadowColor: palette.violet, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
      coral:  { shadowColor: palette.coral,  shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.20, shadowRadius: 8,  elevation: 8 },
    },
  },
  light: {
    none,
    // Lavanda #6450B4 — la sombra "tintada" de v3.1, sin glow
    sm: { shadowColor: '#6450B4', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#6450B4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#6450B4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 },
  },
  memorial: {
    none,
    sm: { shadowColor: palette.sage, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: palette.sage, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 4 },
  },
  /* ═══════════════════════════════════════════════════════════════════
   * 🔴 **v5 · LAS DOS SOMBRAS DEL REDISEÑO (S116, letra §2).**
   *
   * **La letra elige el mecanismo, y es este archivo:** *«Sombras: por
   * `elevation` + `shadow*` (tokens `shadows.ts`/`elevacion.ts`), **nunca
   * CSS**»*. Por eso entran acá como `ShadowToken` y no en
   * `elevacion.ts`, que es `boxShadow` string.
   *
   * ⚠️ **`elevacion.ts` NO se deroga ni se toca**: lo consumen `Tarjeta`,
   * `Hoja` y la enmienda S82 del halo direccional, en las DOS apps. Lo
   * que la letra hace es elegir el mecanismo **para lo que nace en v5**,
   * no jubilar el que ya existe.
   * ═══════════════════════════════════════════════════════════════════ */
  v5: {
    /** «CTA alto 58 radio 999 **con sombra magenta 28 %**». Es una sombra
     *  de COLOR, no de tinta: el CTA no se apoya en el papel, **brilla**.
     *  El color sale de la paleta (`sombraMagenta28`) — acá va su
     *  geometría. */
    ctaMagenta: {
      shadowColor: palette.magentaAccion,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 8,
    },
    /** «tarjeta radio 24, borde 1 tinta 9 %, **sombra suave**». Suave es
     *  literal: la tarjeta conserva su hairline (enmienda S86, que la
     *  letra ratifica — *«en claro, la superficie en reposo conserva el
     *  hairline»*), así que la sombra sólo tiene que despegarla, no
     *  dibujarle el borde. */
    tarjetaSuave: {
      shadowColor: palette.tintaV5,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
  },

} as const
