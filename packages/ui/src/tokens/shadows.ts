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
} as const
