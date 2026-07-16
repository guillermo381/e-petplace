/**
 * e-PetPlace v4 · TEMA MEMORIAL — portado INTACTO de v3.1.
 *
 * Sub-tema que se activa AUTOMÁTICAMENTE cuando:
 *   · La mascota está en M6 (fin de vida)
 *   · La mascota tiene status = 'memorial' (fallecida)
 *   · El usuario navega a una pantalla de memorial
 *   · El usuario abre un hito etiquetado como 'fin-de-vida'
 *
 * No es elegible por el usuario. Es la respuesta del producto a un
 * momento concreto. Ver MODELO_PRODUCTO §3.3 (Memorial).
 * Memorial NO tiene gradiente firma: la marca habla bajito acá.
 */

import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

export const memorialTheme = {
  mode: 'memorial' as const,

  bg: {
    base:     palette.memorialDark0,   // bosque nocturno
    card:     palette.memorialDark1,
    elevated: palette.memorialDark1,
    overlay:  palette.memorialDark1,
    border:   'rgba(143,166,142,.18)',
    warm:     palette.cream,
    tinta:    palette.tinta,   // S58: constante — el techo del prestador no celebra ni se apaga
  },

  text: {
    primary:    palette.textMemorialDark,
    secondary:  'rgba(232,220,200,.65)',
    tertiary:   'rgba(232,220,200,.38)',
    inverse:    palette.memorialDark0,
    onGradient: palette.cream,
    // v3.1 traía cream sobre bg.warm cream (1.00:1 — nunca validado).
    // Corregido en S43-B2: texto oscuro de pergamino sobre superficie cálida.
    warm:       palette.textMemorialLight,
  },

  accent: {
    // S63 — enmienda Ley 21 FIRMADA: el CTA primario resuelve por SLOT.
    // Default 'tinta' (este valor); ThemeProvider cta='oficio' lo ancla a
    // tealDark en light Y dark. Memorial SIEMPRE tinta (no se celebra).
    cta:           palette.textMemorialDark as string,
    ctaTexto:      palette.memorialDark0 as string,
    primary:       palette.sage,
    primaryBg:     palette.sageAlpha14,
    primaryBorder: 'rgba(143,166,142,.28)',

    brand:         palette.rose,
    brandBg:       palette.roseAlpha14,
    brandBorder:   'rgba(201,160,160,.30)',

    warm:          palette.cream,
    warmBg:        palette.creamAlpha06,
    warmBorder:    'rgba(250,246,232,.18)',

    // S58 — en memorial el control es TINTA (la marca no celebra ahí)
    control:       palette.textMemorialDark,

    gradient:       gradients.transparent,   // B1: en memorial, transparent
    gradientSubtle: gradients.transparent,
  },

  capa: {
    identidad:       palette.sage,
    cuidado:         palette.sage,
    comunidad:       palette.rose,
    comunidadAmplia: palette.rose,
  },

  status: {
    success:       palette.sage,
    successBg:     palette.sageAlpha14,
    successBorder: 'rgba(143,166,142,.28)',
    successText:   palette.sage,

    warning:       palette.rose,
    warningBg:     palette.roseAlpha14,
    warningBorder: 'rgba(201,160,160,.30)',
    warningText:   palette.rose,

    danger:        palette.rose,
    dangerBg:      palette.roseAlpha14,
    dangerBorder:  'rgba(201,160,160,.30)',
    dangerText:    palette.rose,

    info:          palette.sage,
    infoBg:        palette.sageAlpha14,
    infoBorder:    'rgba(143,166,142,.28)',
    infoText:      palette.sage,
  },

  services: {
    vet:       palette.sage,
    grooming:  palette.sage,
    walking:   palette.sage,
    boarding:  palette.sage,
    store:     palette.sage,
    insurance: palette.sage,
    wearable:  palette.sage,
    adoption:  palette.rose,
  },

  shadow: shadows.memorial,

  // Ley 20 (D-358 S58): memorial CONSERVA la elevación — la calidez es
  // dignidad, no celebración. Superficies oscuras → resuelve como dark.
  elevacion: elevacion.memorial,

  border: {
    width:   1,
    default: 'rgba(143,166,142,.18)',
    subtle:  'rgba(232,220,200,.06)',
    accent:  'rgba(143,166,142,.28)',
    brand:   'rgba(201,160,160,.30)',
    warm:    'rgba(250,246,232,.18)',
  },
} as const
