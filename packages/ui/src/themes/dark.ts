import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **TEMA OSCURO — v5 (S116-B lote 1). EXISTE CON SU FORMA COMPLETA Y
 * **NO ESTÁ CALIBRADO**. Todos sus valores son PROVISORIOS.**
 *
 * **La letra lo dice dos veces y por eso está en el encabezado:**
 * §1.8 *«Modo oscuro después de F&F. Memorial nace ahora … Los tres temas
 * son isomorfos o no se publica ninguno»* y §5 *«Modo oscuro (después de
 * F&F: el tema existe isomorfo, **no se calibra**)»*.
 *
 * ⇒ **Lo que este archivo garantiza es la FORMA, no el color.** Cada slot
 * existe para que los tres temas sean isomorfos —lo prueba el compilador,
 * ver `FormaDeTema`— y su valor está DERIVADO por regla mecánica, no
 * elegido por ojo:
 *   · el fondo es la familia ciruela, de noche a profunda;
 *   · lo que en claro es `magentaAccion` (oscuro sobre claro) acá es
 *     `magentaLuz` (claro sobre oscuro) — el mismo rol, invertido;
 *   · lo que en claro es `tintaV5` acá es `light0`.
 *
 * 🔴 **NADIE DEBE LEER UN NÚMERO DE ACÁ COMO FIRMADO.** `verify:contrast`
 * mide los tres temas, así que los pares de este archivo van a aparecer
 * en su salida: **son la medición de un tema sin calibrar, y eso no es lo
 * mismo que un tema aprobado**. Su calibración es un lote propio, después
 * de F&F.
 * ═══════════════════════════════════════════════════════════════════════
 */
export const darkTheme = {
  mode: 'dark' as const,

  bg: {
    base:     palette.ciruelaNoche,      // #26062E
    card:     palette.ciruelaProfunda,   // #3B0B47
    elevated: palette.ciruela,           // #4E1160
    overlay:  'rgba(255,255,255,.06)',
    hundido:  'rgba(0,0,0,.24)',
    border:   'rgba(255,255,255,.12)',
    warm:     palette.cream,
    tinta:    palette.tinta,
  },

  text: {
    primary:    palette.light0,
    secondary:  'rgba(250,249,247,.70)',
    tertiary:   'rgba(250,249,247,.48)',
    inverse:    palette.tintaV5,
    onGradient: palette.white,
    warm:       palette.cream,
  },

  accent: {
    /* El magenta invertido: sobre ciruela, el registro que se lee es
       `magentaLuz`. `magentaAccion` sobre `ciruelaNoche` da un par pobre
       — por eso la inversión es una regla y no una preferencia. */
    cta:           palette.magentaLuz,
    ctaTexto:      palette.ciruelaNoche,
    ctaElevado:    true,

    primary:       palette.magentaLuz,
    primaryBg:     'rgba(255,127,196,.14)',
    primaryBorder: 'rgba(255,127,196,.28)',

    brand:         palette.magentaLuz,
    brandBg:       'rgba(255,127,196,.14)',
    brandBorder:   'rgba(255,127,196,.28)',

    active:            palette.magentaLuz,
    control:           palette.rosaSobreCiruela,
    controlBg:         'rgba(255,184,222,.14)',
    controlLleno:      palette.rosaSobreCiruela,
    sobreControlLleno: palette.ciruelaNoche,

    hito:          palette.magentaLuz,
    marcaEleccion: palette.magentaLuz,
    atmosfera:     palette.magentaLuz,

    apoyada:          'rgba(255,255,255,.08)',
    activoLleno:      palette.magentaLuz,
    sobreActivoLleno: palette.ciruelaNoche,

    warm:          palette.cream,
    warmBg:        palette.creamAlpha06,
    warmBorder:    'rgba(250,246,232,.18)',

    gradient:       gradients.entradaV5,   // §2: el degradado de entrada, 178°
    gradientSubtle: {
      colors: [palette.ciruelaProfunda, palette.ciruelaNoche],
      locations: [0, 1],
      angle: 165,
    },
  },

  capa: {
    identidad:       palette.light0,
    cuidado:         palette.light0,
    comunidad:       palette.light0,
    comunidadAmplia: palette.light0,
  },
  capaText: {
    identidad:       palette.rosaSobreCiruela,
    cuidado:         palette.rosaSobreCiruela,
    comunidad:       palette.rosaSobreCiruela,
    comunidadAmplia: palette.rosaSobreCiruela,
  },
  capaBg: {
    identidad:       'rgba(255,255,255,.06)',
    cuidado:         'rgba(255,255,255,.06)',
    comunidad:       'rgba(255,255,255,.06)',
    comunidadAmplia: 'rgba(255,255,255,.06)',
  },

  status: {
    success:       palette.verdeVital,
    successBg:     'rgba(43,232,107,.14)',
    successBorder: 'rgba(43,232,107,.28)',
    successText:   palette.verdeVital,
    warning:       palette.ambarPendiente,
    warningBg:     'rgba(224,162,31,.16)',
    warningBorder: 'rgba(224,162,31,.30)',
    warningText:   palette.ambarPendiente,
    danger:        palette.coral,
    dangerBg:      'rgba(255,107,107,.16)',
    dangerBorder:  'rgba(255,107,107,.30)',
    dangerText:    palette.coral,
    info:          palette.magentaLuz,
    infoBg:        'rgba(255,127,196,.14)',
    infoBorder:    'rgba(255,127,196,.28)',
    infoText:      palette.magentaLuz,
  },

  services: {
    vet:       palette.light0,
    grooming:  palette.light0,
    walking:   palette.light0,
    boarding:  palette.light0,
    store:     palette.light0,
    insurance: palette.light0,
    wearable:  palette.light0,
    adoption:  palette.light0,
  },

  shadow: shadows.dark,
  elevacion: elevacion.dark,

  border: {
    width:    1,
    default:  'rgba(255,255,255,.12)',
    presente: 'rgba(255,255,255,.22)',
    campo:    palette.campoBordeD,
    subtle:   'rgba(255,255,255,.09)',
    accent:   'rgba(255,127,196,.28)',
    brand:    'rgba(255,127,196,.28)',
    warm:     'rgba(250,246,232,.18)',
  },
} as const
