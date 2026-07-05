/**
 * e-PetPlace — Design Tokens v4 · TIPOGRAFÍA
 *
 * CAMBIO v3.1 → v4: SIN Playfair Display. DM Sans es la ÚNICA familia
 * de UI (300/400/500/700) + JetBrains Mono (400/500) para metadata.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE VOZ (vinculante — B1 firmado):
 *
 *   JetBrains Mono SOLO para datos que una máquina generó —
 *   IDs, horas, códigos, montos — siempre minúsculas, tracking
 *   suave (.04–.06em), sin text-transform.
 *
 *   Todo lo que describe a un ser vivo o persona va en DM Sans.
 *
 *   Voz humana = DM Sans 300/400 en tamaños lg+.
 *
 *   Vocabulario interno del modelo (M1..M7, IDs de capa) JAMÁS
 *   visible al usuario.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Los nombres de fontFamily son los que registra expo-font vía
 * @expo-google-fonts (ver src/fonts.ts — cargarlos con useFonts en el
 * root layout de cada app antes de renderizar).
 */

export const typography = {

  family: {
    // DM SANS — única voz de UI. Un nombre por peso (así funciona RN:
    // fontFamily selecciona el archivo, fontWeight no aplica a customs).
    sans: {
      light:   'DMSans_300Light',
      regular: 'DMSans_400Regular',
      medium:  'DMSans_500Medium',
      bold:    'DMSans_700Bold',
    },
    // JETBRAINS MONO — metadata generada por máquina (ver REGLA DE VOZ)
    mono: {
      regular: 'JetBrainsMono_400Regular',
      medium:  'JetBrainsMono_500Medium',
    },
  },

  // Escala v3.1 intacta (px — RN usa números directos)
  size: {
    xs:    11,
    sm:    13,
    base:  15,
    md:    18,
    lg:    22,
    xl:    28,
    '2xl': 32,
    '3xl': 38,
    '4xl': 48,
    hero:  56,
    display: 68,
  },

  // Pesos — solo informativos para web/RN-web; en nativo el peso
  // viene dado por la familia (ver family arriba)
  weight: {
    light:   '300',
    regular: '400',
    medium:  '500',
    bold:    '700',
  },

  // Altura de línea (multiplicadores — en RN: lineHeight = size * leading)
  leading: {
    tight:   1.1,
    snug:    1.3,
    normal:  1.6,
    relaxed: 1.75,
  },

  // Espaciado de letras.
  // RN usa letterSpacing en px, no em → valores precomputados por
  // contexto de uso (px ≈ em * fontSize típico del contexto).
  tracking: {
    tight:  -0.4,   // títulos display (≈ -0.025em @ 16px+)
    normal:  0,
    mono:    0.6,   // metadata mono 11-13px (≈ .04-.06em) — REGLA DE VOZ
    wide:    0.8,   // (≈ .05em @ 15px)
    widest:  1.4,   // tags — recordar: mono JAMÁS en mayúsculas
  },

} as const

export type TypeSizeKey = keyof typeof typography.size
