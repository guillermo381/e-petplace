/**
 * e-PetPlace v4 · TEMA OSCURO — OPT-IN (el default del producto es claro).
 * Superficies v3.1 intactas; acentos re-tonalizados a los hex de marca.
 */

import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

export const darkTheme = {
  mode: 'dark' as const,

  bg: {
    base:     palette.dark0,
    card:     palette.dark1,
    elevated: palette.dark2,
    overlay:  palette.dark3,
    border:   palette.dark4,
    warm:     palette.creamAlpha06,
    tinta:    palette.tinta,   // S58: el techo del prestador (constante en los 3 temas)
  },

  text: {
    primary:    palette.textDark0,
    secondary:  palette.textDark1,
    tertiary:   palette.textDark2,
    inverse:    palette.dark0,
    onGradient: palette.white,   // B3.1c: blanco en AMBOS temas (gradiente v2 con violeta dominante)
    warm:       palette.cream,
  },

  accent: {
    // S63 — enmienda Ley 21 FIRMADA: el CTA primario resuelve por SLOT.
    // Default 'tinta' (este valor); ThemeProvider cta='oficio' lo ancla a
    // tealDark en light Y dark. Memorial SIEMPRE tinta (no se celebra).
    cta:           palette.textDark0 as string,
    ctaTexto:      palette.dark0 as string,
    primary:       palette.teal,
    primaryBg:     palette.tealAlpha15,
    primaryBorder: palette.tealBorder,

    brand:         palette.pink,
    brandBg:       palette.pinkAlpha09,     // B3.3: paridad perceptual (el magenta grita a .15)
    brandBorder:   palette.pinkBorderSuave,

    warm:          palette.terracotta,
    warmBg:        palette.terracottaAlpha14,
    warmBorder:    palette.terracottaBorder,

    // B2.1 — indicador de estado ACTIVO (subrayado de tab, selección, paso
    // actual). Registro gráfico: pink puro. Un solo elemento activo por vista lo usa.
    active:        palette.pink,

    // S58 — acento de controles del cliente en dark: violetText (gateado
    // S44 — cero pares nuevos por firma).
    control:       palette.violetText,

    gradient:       gradients.firmaUIDark,  // contextos cerrados (ver palette.ts)
    gradientSubtle: {
      colors: [palette.pinkAlpha15, palette.tealAlpha15],
      locations: [0, 1],
      angle: 165,
    },
  },

  // B2.1 — REGISTRO GRÁFICO: hex puros. Para TEXTO usar capaText.
  capa: {
    identidad:       palette.verdeVital,  // B2.1: vida = verdeVital en los 3 temas
    cuidado:         palette.teal,
    comunidad:       palette.pink,
    comunidadAmplia: palette.violet,
  },

  // B2.1 — REGISTRO DE TEXTO (AA sobre superficies dark)
  capaText: {
    identidad:       palette.verdeVital,
    cuidado:         palette.teal,
    comunidad:       palette.pink,
    comunidadAmplia: palette.violetText,  // violet base da 4.16:1 en dark (gate S43-B2)
  },

  // S44-B2.3 — REGISTRO DE TINTS: fondo suave por capa (AvatarMascota
  // fallback; mismos tokens que los tintes de Tarjeta, ahora nombrados).
  capaBg: {
    identidad:       palette.verdeVitalAlpha15,
    cuidado:         palette.tealAlpha15,
    comunidad:       palette.pinkAlpha09,
    comunidadAmplia: palette.violetAlpha15,
  },

  status: {
    success:       palette.verdeVital,
    successBg:     palette.verdeVitalAlpha15,
    successBorder: palette.verdeVitalBorder,
    successText:   palette.verdeVital,

    warning:       palette.ochre,
    warningBg:     palette.ochreAlpha15,
    warningBorder: palette.ochreBorder,
    warningText:   palette.ochre,

    danger:        palette.coral,
    dangerBg:      palette.coralAlpha15,
    dangerBorder:  palette.coralBorder,
    dangerText:    palette.coral,

    info:          palette.teal,
    infoBg:        palette.tealAlpha15,
    infoBorder:    palette.tealBorder,
    infoText:      palette.teal,
  },

  services: {
    vet:       palette.teal,
    grooming:  palette.teal,
    walking:   palette.teal,
    boarding:  palette.teal,
    store:     palette.teal,
    insurance: palette.verdeVital,  // B2.1: vida = verdeVital
    wearable:  palette.verdeVital,  // B2.1: vida = verdeVital
    adoption:  palette.pink,
  },

  shadow: shadows.dark,

  // Ley 20 (D-358 S58): en dark la elevación la dice el paso de luminancia
  // de bg.card — estos tokens resuelven a contacto mínimo, jamás calentar el fondo.
  elevacion: elevacion.dark,

  border: {
    width:   1,
    default: palette.dark4,
    subtle:  'rgba(255,255,255,.05)',
    accent:  palette.tealBorder,
    brand:   palette.pinkBorder,
    warm:    'rgba(250,246,232,.18)',
  },
} as const
