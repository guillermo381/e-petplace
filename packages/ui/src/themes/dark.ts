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
    base:     palette.tapizDark,
    card:     palette.dark1,
    elevated: palette.dark2,
    overlay:  palette.dark3,
    /** S82-B — SUPERFICIE HUNDIDA (rieles, botones -/+): el hueco.
     *  Nace porque `overlay` NO hunde en oscuro (es 2.6× más luminoso que
     *  la tarjeta: el riel se leía ELEVADO). En claro coincide con overlay
     *  —ahí sí hundía—, en oscuro baja al fondo. El slot ABSORBE la rama
     *  por tema que SelectorSegmentado tenía que hacer a mano. */
    hundido:  palette.hundidoDark,
    /* S82-B r29 — LA REFERENCIA CAMBIÓ, y tu punto 4 tenía razón: este
     *  slot nació midiendo contra la TARJETA (el riel se leía elevado
     *  porque overlay era 2.6× más luminoso que card). SIN TARJETA, el
     *  hundido ya no hunde respecto de una superficie: hunde respecto
     *  del FONDO. Y sigue funcionando por suerte medida, no por diseño:
     *  el valor (#050508, el negro de siempre) es MÁS OSCURO que el
     *  tapiz al 8% (#190515), así que el riel sigue leyéndose como
     *  hueco. SU CONDICIÓN DE MUERTE NO SE CUMPLIÓ pero se ACORTÓ: si
     *  el tapiz sube más, el hundido y el fondo se acercan y el slot
     *  necesita bajar con él o pierde sentido. */
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
    // S82-B — EL ORO FIRMADO. Un solo color para los DOS temas (label
    // tinta 9.96 en ambos). El PRESTADOR no lo recibe: su oficio ancla a
    // tealDark por `lightOficio`/`darkOficio`; memorial sigue en tinta
    // por `getTheme` — las dos garantías viven en la fuente.
    cta:           palette.ctaOro,
    ctaTexto:      palette.textLight0,
    /** S82-B — ¿el CTA lleva ELEVACIÓN? coherencia de anatomía entre temas del cliente (en oscuro el color ya separa: 11.97)
     *  Es SLOT y no prop: la pantalla no elige, y el prestador lo pisa en
     *  `lightOficio`/`darkOficio` (su teal no tiene el problema del oro
     *  contra papel — meterle relieve sería ARRASTRE). */
    ctaElevado:    true,
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
    marcaEleccion: palette.violetText,
    /** El color de la LUZ DE AMBIENTE (S83-B34). En el cliente es su
     *  MAGENTA de marca; los temas de oficio lo pisan a su verde. En
     *  memorial da igual — la pieza no se monta (Ley 8). */
    atmosfera: palette.pink,
    // S82-B r12 — el fondo del Boton `sinCaja` (MÁS presencia: en dark el canal es el tono):
    // el secundario sin borde necesita un canal, y el borde ya no está.
    sinCaja:      palette.sinCajaDark,
    // S73 — el elegido LLENO, FIRMADO por el founder (opción B del
    // mini-gate): magentaDark + blanco en AMBOS temas. REGISTRO honesto:
    // fill-vs-fondo dark = 2.24–2.47 (bajo el 3:1 no-textual de
    // componentes) — el ojo del founder respondió esa pregunta EN EL
    // mini-gate ("no se hunde") y su firma manda; blanco encima 8.25:1.
    controlLleno: palette.magentaDark,
    sobreControlLleno: '#FFFFFF',

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
