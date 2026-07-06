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
    primaryBg:     palette.tealAlpha16,     // B2.1: tint sobre el hex puro
    primaryBorder: palette.tealBorderL,

    brand:         palette.pinkDark,
    brandBg:       palette.pinkAlpha08,     // B2.1: tint sobre el hex puro
    brandBorder:   palette.pinkBorderL,

    // B2.1 — indicador de estado ACTIVO (subrayado de tab, selección, paso
    // actual). Registro gráfico: pink puro. Un solo elemento activo por vista lo usa.
    active:        palette.pink,

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

  // El color codifica CAPA, no servicio (v3 — intacto).
  // B2.1 — REGISTRO GRÁFICO: hex PUROS para puntos/indicadores/decoración
  // (el punto vida ya no necesita anillo). Para TEXTO usar capaText.
  capa: {
    identidad:       palette.verdeVital,  // Capa 1 · vida
    cuidado:         palette.teal,        // Capa 2 · cuidado activo
    comunidad:       palette.pink,        // Capa 3 · vínculo propio
    comunidadAmplia: palette.violet,      // Capa 3 · comunidad amplia
  },

  // B2.1 — REGISTRO DE TEXTO: variantes AA. AA gobierna texto, no gráfica.
  capaText: {
    identidad:       palette.verdeVitalDark,
    cuidado:         palette.tealDark,
    comunidad:       palette.pinkDark,
    comunidadAmplia: palette.violetDark,
  },

  // S44-B2.3 — REGISTRO DE TINTS: fondo suave por capa (AvatarMascota
  // fallback; mismos tokens que los tintes de Tarjeta, ahora nombrados).
  capaBg: {
    // identidad a .15 (no .20 como el tint de Tarjeta): con .20 el par
    // verdeVitalDark/tint⊕base daba 4.46 — bajo AA (gate S44-B2.3).
    identidad:       palette.verdeVitalAlpha15,
    cuidado:         palette.tealAlpha16,
    comunidad:       palette.pinkAlpha08,
    comunidadAmplia: palette.violetAlphaL,
  },

  status: {
    // campo base = registro gráfico (íconos, barras); *Text = registro AA
    success:       palette.verdeVital,
    successBg:     palette.verdeVitalAlpha20,
    successBorder: palette.verdeVitalBorder,
    successText:   palette.verdeVitalDark,

    warning:       palette.ochre,
    warningBg:     palette.ochreAlpha24,
    warningBorder: palette.ochreBorderL,
    warningText:   palette.ochreDark,

    danger:        palette.coral,
    dangerBg:      palette.coralAlpha16,
    dangerBorder:  palette.coralBorderL,
    dangerText:    palette.coralDark,

    info:          palette.teal,
    infoBg:        palette.tealAlpha16,
    infoBorder:    palette.tealBorderL,
    infoText:      palette.tealDark,
  },

  // Servicio identificado por ícono; el color es el de su capa (registro AA:
  // los íconos de servicio acompañan texto funcional en listas)
  services: {
    vet:       palette.tealDark,
    grooming:  palette.tealDark,
    walking:   palette.tealDark,
    boarding:  palette.tealDark,
    store:     palette.tealDark,
    insurance: palette.verdeVitalDark,  // Capa 1 · protección de vida
    wearable:  palette.verdeVitalDark,  // Capa 1 · monitoreo de vida
    adoption:  palette.pinkDark,        // Capa 3 · comunidad
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
