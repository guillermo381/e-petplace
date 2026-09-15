import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **TEMA MEMORIAL — v5 (S116-B lote 1). LETRA NUEVA: `LETRA_REDISENO_S116`
 * §4, que ENMIENDA la Ley 21 para el cliente.**
 *
 * *«El memorial es la misma estructura sin la fiesta.»*
 *
 * **EL CAMBIO MÁS GRANDE DE ESTE ARCHIVO: memorial deja de ser OSCURO.**
 * Hasta v4 era bosque nocturno (`memorialDark0`); la letra §4 dice
 * textual *«lienzo y superficie del claro (#F8F2F6 / #FFFFFF)»*. **No es
 * una calibración: es un cambio de familia**, y por eso la propia letra
 * declara que *«lo que E midió el 13-sep (fondo 244 vs 237) deja de
 * valer: el memorial se mide de nuevo sobre estos valores»*.
 *
 * **Las seis cláusulas de §4, cada una con su línea acá:**
 *   1. **Sin magenta** — la acción es tinta (Ley 21 sigue).
 *   2. **Sin verde ni ámbar** — «no hay estados que cumplir».
 *   3. **Cabecera en ciruela noche PLANA**, sin degradado.
 *   4. **Rosa tinte → gris cálido**, derivado de tinta al 6 % (COMPUTADO).
 *   5. Sin personajes, trío, check festivo ni entrada escalonada: sólo
 *      fundido. *(Vive en `motion`/las piezas, no en un color.)*
 *   6. Sin pastillas de progreso ni contadores (LOYALTY §7.1: el motor
 *      calla). *(Vive en las piezas.)*
 *
 * ⚠️ **GANA LOS 12 SLOTS QUE LE FALTABAN** (`accent.active`,
 * `accent.controlBg`, `accent.controlLleno`, `accent.sobreControlLleno`,
 * `capaBg.*` ×4, `capaText.*` ×4). Medido en el lote 0: eran 74 de 86, y
 * **28 lecturas en 17 archivos caían a un fallback**. Ahora los tres
 * temas tienen la MISMA forma, y lo prueba el compilador — ver
 * `FormaDeTema` en `themes/index.ts`.
 * ═══════════════════════════════════════════════════════════════════════
 */
export const memorialTheme = {
  mode: 'memorial' as const,

  bg: {
    base:     palette.lienzo,               // §4: el lienzo del claro
    card:     palette.superficie,           // §4: la superficie del claro
    elevated: palette.superficie,
    overlay:  palette.grisCalidoMemorial,   // §4: reemplaza al rosa tinte
    /** S116-B lote 4 · la superficie SOBRE LA BANDA. Blanco tenue también
     *  acá: la banda de memorial es ciruela noche, y el gris cálido del
     *  lienzo encima de ella desaparece. */
    sobreGradiente: palette.blancoBanda17,
    hundido:  palette.grisCalidoMemorial,
    border:   palette.tintaBorde12,
    warm:     palette.cream,
    tinta:    palette.tinta,
  },

  text: {
    primary:    palette.tintaV5,
    secondary:  palette.tintaTexto65,
    tertiary:   palette.tintaTexto50,
    inverse:    palette.white,
    onGradient: palette.white,              // sobre la cabecera ciruela noche
    warm:       '#2A1A10',   // texto sobre `bg.warm` (cream) — 15.48
  },

  accent: {
    /* §4 cláusula 1 — **SIN MAGENTA. La acción es tinta.** Ley 21 sigue
       rigiendo ("memorial SIEMPRE tinta"), y por eso `getTheme` ignora el
       ancla de casa para este tema: memorial no se celebra. */
    cta:           palette.tintaV5,
    ctaTexto:      palette.white,
    ctaElevado:    false,                   // sin relieve: no hay nada que celebrar
    // S116-B · memorial NO lleva la píldora con sombra magenta: §4 apaga la
    //    fiesta y la acción va en tinta. Conserva la geometría serena de v4.
    formaV5:    false,

    primary:       palette.tintaV5,
    primaryBg:     palette.grisCalidoMemorial,
    primaryBorder: palette.tintaBorde12,

    brand:         palette.tintaV5,
    brandBg:       palette.grisCalidoMemorial,
    brandBorder:   palette.tintaBorde12,

    /* 🔴 LOS CUATRO QUE MEMORIAL NO TENÍA. Ya no degradan por fallback:
       existen, en tinta y gris, que es lo que §4 pide. */
    active:            palette.tintaV5,
    /* S116-B lote 4 · el acento SOBRE LA BANDA. 🔴 **En memorial NO es
       tinta**: `tintaV5` es oscuro y la banda de memorial es `ciruelaNoche`,
       o sea tinta sobre tinta. Va **blanco**, que es como memorial degrada
       todo lo de marca (Ley 8: el isotipo va blanco, el botón marca baja a
       primario). *La elección se sigue viendo —aro pleno contra aro apenas
       insinuado— y no entra una gota de color de marca donde no corresponde.* */
    sobreGradiente:    palette.white,

    /* S116-B · el PAR del glifo (fila · campo · acceso · paso). Ver

       `SlotDeTema`: van juntos porque se miden juntos. */

    glifo:         palette.tintaV5,

    glifoBg:       palette.grisCalidoMemorial,    controlBg:         palette.grisCalidoMemorial,
    controlLleno:      palette.tintaV5,
    sobreControlLleno: palette.white,

    control:       palette.tintaV5,
    hito:          palette.tintaV5,
    marcaEleccion: palette.tintaV5,
    atmosfera:     palette.tintaV5,

    apoyada:          palette.grisCalidoMemorial,
    activoLleno:      palette.tintaV5,
    sobreActivoLleno: palette.white,

    /* S116-B · memorial paso a CLARO (§4), asi que su familia `warm` va en
       registro CLARO: `cream` sobre el lienzo daba 1.02 y verify:contrast
       lo tumbo. `terracottaDark` da 5.27 sobre lienzo y 5.82 sobre blanco
       — es el mismo registro que usa el tema claro. */
    warm:          palette.terracottaDark,
    warmBg:        palette.terracottaAlphaL,
    warmBorder:    palette.terracottaBorderL,

    /** §4 cláusula 3 — **ciruela noche PLANA, sin degradado.** */
    gradient:       gradients.memorialPlano,
    gradientSubtle: gradients.memorialPlano,
  },

  /* Las capas mueren igual que en claro, y acá ni siquiera tienen tinte:
     **Ley 8 — memorial no tinta.** Los 8 slots existen para que la forma
     sea la misma; su valor es neutro. */
  capa: {
    identidad:       palette.tintaV5,
    cuidado:         palette.tintaV5,
    comunidad:       palette.tintaV5,
    comunidadAmplia: palette.tintaV5,
  },
  capaText: {
    identidad:       palette.tintaTexto65,
    cuidado:         palette.tintaTexto65,
    comunidad:       palette.tintaTexto65,
    comunidadAmplia: palette.tintaTexto65,
  },
  capaBg: {
    identidad:       palette.grisCalidoMemorial,
    cuidado:         palette.grisCalidoMemorial,
    comunidad:       palette.grisCalidoMemorial,
    comunidadAmplia: palette.grisCalidoMemorial,
  },

  /* §4 cláusula 2 — **SIN VERDE NI ÁMBAR: «no hay estados que cumplir».**
     Los 16 slots existen (la forma es la misma) y todos resuelven a
     tinta/gris. ⚠️ **`danger` conserva su lectura**: un error sigue
     siendo un error incluso en memorial — lo que §4 apaga es el
     CUMPLIMIENTO (al día / pendiente), no la falla. */
  status: {
    success:       palette.tintaTexto65,
    successBg:     palette.grisCalidoMemorial,
    successBorder: palette.tintaBorde12,
    successText:   palette.tintaTexto65,
    warning:       palette.tintaTexto65,
    warningBg:     palette.grisCalidoMemorial,
    warningBorder: palette.tintaBorde12,
    warningText:   palette.tintaTexto65,
    danger:        palette.coralDarkTexto,
    dangerBg:      palette.grisCalidoMemorial,
    dangerBorder:  palette.tintaBorde12,
    dangerText:    palette.coralDarkTexto,
    info:          palette.tintaTexto65,
    infoBg:        palette.grisCalidoMemorial,
    infoBorder:    palette.tintaBorde12,
    infoText:      palette.tintaTexto65,
  },

  services: {
    vet:       palette.tintaV5,
    grooming:  palette.tintaV5,
    walking:   palette.tintaV5,
    boarding:  palette.tintaV5,
    store:     palette.tintaV5,
    insurance: palette.tintaV5,
    wearable:  palette.tintaV5,
    adoption:  palette.tintaV5,
  },

  shadow: shadows.memorial,
  elevacion: elevacion.memorial,

  border: {
    width:    1,
    default:  palette.tintaBorde12,
    presente: palette.tintaBorde12,
    campo:    palette.campoBordeL,
    /* S116-B lote 6 · el reposo de la casa v5. Memorial NO es v5 y conserva
       su verde sereno: el slot existe porque los tres temas son isomorfos. */
    campoV5:  palette.campoBordeM,
    subtle:   palette.tintaBorde09,
    accent:   palette.tintaBorde12,
    brand:    palette.tintaBorde12,
    warm:     'rgba(250,246,232,.18)',
  },
} as const
