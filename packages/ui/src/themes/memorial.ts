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
    /** S82-B — SUPERFICIE HUNDIDA (rieles, botones -/+): el hueco.
     *  Nace porque `overlay` NO hunde en oscuro (es 2.6× más luminoso que
     *  la tarjeta: el riel se leía ELEVADO). En claro coincide con overlay
     *  —ahí sí hundía—, en oscuro baja al fondo. El slot ABSORBE la rama
     *  por tema que SelectorSegmentado tenía que hacer a mano. */
    hundido:  palette.memorialDark1,
    // S82-B r22 — RE-DECLARADO (no migrado): su rol es **SUPERFICIE
    // NEUTRA de la casa**, y el hover es UN CASO de ese rol, no un rol
    // aparte. El comentario decía "hover states" y quedó viejo: de 43
    // consumidores, **28 lo usan como superficie de fill** (rieles
    // hundidos, chips en reposo, cajas neutras). Cero migraciones, cero
    // cambio de valor — lo que cambia es lo que el token DICE que es.
    // ⚠️ LO QUE NO ES, con el precedente de r12 escrito: **superficie
    // neutra NO es fill de CONTROL**. Un control necesita su propio
    // canal — es la letra de `sinCaja`, que nació justo porque este
    // token no tenía presencia de control (par 1.07 en claro).
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
    cta:           palette.textMemorialDark,
    ctaTexto:      palette.memorialDark0,
    /** S82-B — ¿el CTA lleva ELEVACIÓN? memorial no se celebra — el CTA es tinta plana, sin relieve
     *  Es SLOT y no prop: la pantalla no elige, y el prestador lo pisa en
     *  `lightOficio`/`darkOficio` (su teal no tiene el problema del oro
     *  contra papel — meterle relieve sería ARRASTRE). */
    ctaElevado:    false,
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
    /** LA PATA — SLOT PROPIO (S83-B19/B20, FIRMA DEL FOUNDER: "lo que
     *  quiero comunicar con la pata es: este es el seleccionado").
     *  Es marca de SELECCIÓN, no de marca: por eso en el prestador toma
     *  su verde y no el magenta (§15b.1), en los DOS registros como sus
     *  hermanos `control` y `active`.
     *  ⚠️ REDUNDANCIA MEDIDA Y DECLARADA: hoy resuelve IDÉNTICO a
     *  `accent.control` en las CINCO resoluciones (los tres temas base y
     *  las dos casas de oficio). Se conserva como slot propio porque son
     *  conceptos distintos —`control` viste la LETRA del segmento, esto
     *  viste la PATA— y el día que diverjan ya está el lugar; pero
     *  mientras coincidan, un cambio en uno que no viaje al otro es una
     *  divergencia por accidente. Si el founder decide que la pata SIEMPRE
     *  sigue al control, este campo se borra y la pata lee `control`. */
    marcaEleccion: palette.textMemorialDark,
    // S82-B r12 — el fondo del Boton `sinCaja` (memorial: la superficie serena que ya existe):
    // el secundario sin borde necesita un canal, y el borde ya no está.
    sinCaja:      palette.memorialDark1,

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
