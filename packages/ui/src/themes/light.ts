/**
 * e-PetPlace v4 · TEMA CLARO — DEFAULT del producto (B1 §7.3).
 * Shape v3.1 (bg/text/accent/capa/status/services/shadow/border),
 * components-ready para StyleSheet: colores string, sombras objeto RN,
 * bordes color+width (RN no tiene shorthand CSS).
 */

import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'

export const lightTheme = {
  mode: 'light' as const,

  bg: {
    base:     palette.light0,   // #F5F4FA — nunca blanco puro
    card:     palette.light1,   // #FFFFFF
    elevated: palette.light2,   // #F8F7FC
    overlay:  palette.light3,   // #EDEBF5 — hover
    border:   palette.light4,   // #E3E0EF
    warm:     palette.cream,    // narrativa cálida sólida
  },

  text: {
    primary:    palette.textLight0,  // #1D1A2E — también "tinta" CTA prestador
    secondary:  palette.textLight1,  // #6B6584
    tertiary:   palette.textLight2,  // #A9A4C0 — placeholder/decorativo
    inverse:    palette.white,
    onGradient: palette.white,       // sobre firmaUILight (#C4008A→#0A7268)
    warm:       '#2A1A10',           // sobre cream
  },

  accent: {
    primary:       palette.tealDark,
    primaryBg:     palette.tealAlphaL,
    primaryBorder: palette.tealBorderL,

    brand:         palette.pinkDark,
    brandBg:       palette.pinkAlphaL,
    brandBorder:   palette.pinkBorderL,

    warm:          palette.terracottaDark,
    warmBg:        palette.terracottaAlphaL,
    warmBorder:    palette.terracottaBorderL,

    gradient:       gradients.firmaUILight,  // contextos cerrados (ver palette.ts)
    gradientSubtle: {
      colors: [palette.pinkAlphaL, palette.tealAlphaL],
      locations: [0, 1],
      angle: 165,
    },
  },

  // El color codifica CAPA, no servicio (v3 — intacto)
  capa: {
    identidad:       palette.verdeDark,   // Capa 1 · vida (ex lime)
    cuidado:         palette.tealDark,    // Capa 2 · cuidado activo
    comunidad:       palette.pinkDark,    // Capa 3 · vínculo propio
    comunidadAmplia: palette.violetDark,  // Capa 3 · comunidad amplia
  },

  status: {
    success:       palette.verdeDark,
    successBg:     palette.verdeAlphaL,
    successBorder: palette.verdeBorderL,
    successText:   palette.verdeDark,

    warning:       palette.ochreDark,
    warningBg:     palette.ochreAlphaL,
    warningBorder: palette.ochreBorderL,
    warningText:   palette.ochreDark,

    danger:        palette.coralDark,
    dangerBg:      palette.coralAlphaL,
    dangerBorder:  palette.coralBorderL,
    dangerText:    palette.coralDark,

    info:          palette.tealDark,
    infoBg:        palette.tealAlphaL,
    infoBorder:    palette.tealBorderL,
    infoText:      palette.tealDark,
  },

  // Servicio identificado por ícono; el color es el de su capa
  services: {
    vet:       palette.tealDark,
    grooming:  palette.tealDark,
    walking:   palette.tealDark,
    boarding:  palette.tealDark,
    store:     palette.tealDark,
    insurance: palette.verdeDark,  // Capa 1 · protección de vida
    wearable:  palette.verdeDark,  // Capa 1 · monitoreo de vida
    adoption:  palette.pinkDark,   // Capa 3 · comunidad
  },

  shadow: shadows.light,

  border: {
    width:   1,
    default: palette.light4,
    subtle:  'rgba(0,0,0,.05)',
    accent:  palette.tealBorderL,
    brand:   palette.pinkBorderL,
    warm:    '#E8E0C8',
  },
} as const
