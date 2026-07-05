/**
 * e-PetPlace — Design Tokens v4 · ESPACIADO
 * Portado de v3.1 sin cambio. Base 4px, múltiplos estrictos.
 * NUNCA usar valores fuera de esta escala.
 */

export const spacing = {
  0:   0,
  px:  1,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,
  28:  112,
  32:  128,
} as const

export type SpacingKey = keyof typeof spacing
