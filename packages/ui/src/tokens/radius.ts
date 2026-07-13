/**
 * e-PetPlace — Design Tokens v4 · RADIOS
 * Portado de v3.1 sin cambio.
 */

export const radius = {
  none:  0,
  xs:    4,
  sm:    8,
  // LEY DE GEOMETRÍA (S58, firma founder): lo que se ELIGE es rectángulo
  // suave (10-12); lo que INFORMA es píldora (full). Insignia intacta.
  suave: 10,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  full:  9999,
} as const

export type RadiusKey = keyof typeof radius
