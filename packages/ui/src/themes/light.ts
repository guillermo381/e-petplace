import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 **TEMA CLARO — v5, LA PIEL DEL REDISEÑO DEL CLIENTE (S116-B lote 1).**
 * Letra: `docs/LETRA_REDISENO_S116.md` §2, firmada 13-sep-2026.
 *
 * **ESTE TEMA ES EL DEL CLIENTE.** El prestador lo recibe por herencia y
 * le pisa sus slots en `lightOficio` (ver `themes/index.ts`) — **y en este
 * lote esa lista crece a NUEVE**, porque `accent.primary` (su teal) no
 * estaba ahí y la paleta nueva se lo habría llevado puesto.
 *
 * **LO QUE HEREDA EL PRESTADOR Y CAMBIA, medido y declarado** (`grep`
 * sobre `apps/prestador/src`, comentarios excluidos): `text.primary` 27 ·
 * `text.secondary` 23 · `bg.overlay` 8 · `text.tertiary` 6 ·
 * `bg.hundido` 4 · `status.success` 4 · `status.warning` 4 ·
 * `border.default` 3 · `bg.card` 1 · `border.subtle` 1.
 * **Ninguno es cromático de marca** —son texto, superficie, borde y
 * estado— y por eso no se pisan: pisar diez slots más sería fabricar un
 * tema paralelo del prestador sin que nadie lo haya firmado. *Se declara
 * para que el cambio se vea venir, no para que sorprenda en un gate.*
 * ═══════════════════════════════════════════════════════════════════════
 */
export const lightTheme = {
  mode: 'light' as const,

  bg: {
    /* ☠️ **EL PAPEL ALGODÓN MUERE COMO FONDO DEL CLIENTE** (letra §2: el
       lienzo es `#F8F2F6`). ⚠️ **El HEX `palette.light0` NO muere** —
       medido: **37 lectores vivos**, casi todos del prestador, donde no
       es «el fondo» sino el PAPEL que va sobre su muro teal. Matarlo
       habría roto `techo-oficio`, `cuenta`, `perfil-piezas` y
       `grabador-clip`. *Muere el ROL, no el valor.* */
    base:     palette.lienzo,        // era papelTapiz #F6F6F6
    card:     palette.superficie,    // #FFFFFF — sin cambio de valor
    elevated: palette.superficie,
    overlay:  palette.rosaTinte,     // el tinte que reemplaza a las capas
    hundido:  palette.rosaTinte,
    border:   palette.tintaBorde12,
    warm:     palette.cream,         // narrativa cálida — SIN consumidores
    tinta:    palette.tinta,
  },

  text: {
    primary:    palette.tintaV5,        // #1C1D20
    secondary:  palette.tintaTexto65,   // el extremo legible del rango §2
    tertiary:   palette.tintaTexto50,   // apoyo — jamás un dato
    inverse:    palette.white,
    onGradient: palette.white,
    warm:       '#2A1A10',
  },

  accent: {
    /* 🔴 **MAGENTA ACCIONA, CIRUELA SELECCIONA** (letra §1.3 — deroga N26:
       el ocre muere como CTA). */
    cta:           palette.magentaAccion,
    ctaTexto:      palette.white,
    ctaElevado:    true,

    primary:       palette.magentaAccion,
    primaryBg:     palette.rosaTinte,
    primaryBorder: palette.tintaBorde12,

    brand:         palette.magentaAccion,
    brandBg:       palette.rosaTinte,
    brandBorder:   palette.tintaBorde12,

    /** El estado ACTIVO — magenta, que es el empleo «acción y marca». */
    active:        palette.magentaAccion,

    /** El acento de ELECCIÓN — **ciruela**: «el chip activo es ciruela». */
    control:       palette.ciruela,
    controlBg:     palette.rosaTinte,
    /* ⚠️ **`controlLleno`/`sobreControlLleno` NO MUEREN, y el lote 0 los
       midió en CERO por un ciego de patrón.** Tienen **3 lectores**:
       `SelectorOpcion.tsx:283` y `:408` (el entity chip que el founder
       firmó en S73) y `EncuadreFoto.tsx:297`. Los tres los leen como
       `'controlLleno' in theme.accent` + cast — una forma que el censo
       `theme\.\w+\.\w+` no puede ver. *Es la advertencia literal de la
       cabecera de `verify-diseno`: un censo por patrón acota, no cierra.*
       ⇒ Se RE-APUNTAN a v5 y llevan su disparo: mueren cuando esas dos
       piezas migren. */
    controlLleno:      palette.ciruela,
    sobreControlLleno: palette.white,

    hito:          palette.magentaAccion,
    marcaEleccion: palette.magentaAccion,
    atmosfera:     palette.magentaAccion,

    apoyada:       palette.rosaTinte,
    activoLleno:      palette.magentaAccion,
    sobreActivoLleno: palette.white,

    warm:          palette.terracottaDark,
    warmBg:        palette.terracottaAlphaL,
    warmBorder:    palette.terracottaBorderL,

    /** El degradado de cabecera de la letra §2 (168°, ciruela→profunda).
     *  Reemplaza a `firmaUILight` en el rol de superficie cerrada. */
    gradient:       gradients.cabeceraV5,
    gradientSubtle: {
      colors: [palette.rosaTinte, palette.lienzo],
      locations: [0, 1],
      angle: 165,
    },
  },

  /* ☠️ **LAS CAPAS DE COLOR POR CATEGORÍA MUEREN EN EL CLIENTE** (letra
     §1.2: deroga la ley 10, los dos cantos de §9.1 y la huella en hex de
     capa). **La categoría se dice con glifo + palabra + lugar.**

     ⚠️ **Los slots NO se borran, por orden de la letra §3**: apuntan a
     los valores nuevos y mueren cuando su último lector migre (censo por
     import). Los cuatro de cada grupo **colapsan al mismo valor** — que
     es exactamente lo que significa «el color deja de decir la
     categoría». Medido: **28 lecturas en 17 archivos** (lote 0 §④). */
  capa: {
    identidad:       palette.tintaV5,
    cuidado:         palette.tintaV5,
    comunidad:       palette.tintaV5,
    comunidadAmplia: palette.tintaV5,
  },
  capaText: {
    identidad:       palette.magentaTinta,
    cuidado:         palette.magentaTinta,
    comunidad:       palette.magentaTinta,
    comunidadAmplia: palette.magentaTinta,
  },
  capaBg: {
    identidad:       palette.rosaTinte,
    cuidado:         palette.rosaTinte,
    comunidad:       palette.rosaTinte,
    comunidadAmplia: palette.rosaTinte,
  },

  /* «Estado con palabra» (§1.2): verde al día · ámbar pendiente · rosa
     informativo. **Sigue rigiendo «ningún estado solo con color»** — la
     letra lo ratifica textualmente. `danger` NO lo nombra la letra y por
     eso conserva su coral: derogar por silencio sería inventar. */
  status: {
    success:       palette.verdeAlDia,
    successBg:     palette.verdeAlDiaBg,
    successBorder: palette.verdeAlDia,
    successText:   palette.verdeAlDia,
    warning:       palette.ambarPendiente,
    warningBg:     palette.ambarPendienteBg,
    warningBorder: palette.ambarPendiente,
    warningText:   palette.ochreDark,     // el ámbar puro no llega a 4.5 sobre claro
    danger:        palette.coral,
    dangerBg:      palette.coralAlpha16,
    dangerBorder:  palette.coralBorderL,
    dangerText:    palette.coralDarkTexto,
    info:          palette.magentaAccion,  // «rosa informativo»
    infoBg:        palette.rosaTinte,
    infoBorder:    palette.tintaBorde12,
    infoText:      palette.magentaTinta,
  },

  /* Los servicios pierden su color propio por la misma razón que las
     capas: la categoría ya no se dice con color. Quedan en tinta. */
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

  shadow: shadows.light,
  elevacion: elevacion.light,

  border: {
    width:   1,
    default:  palette.tintaBorde12,
    presente: palette.tintaBorde12,
    campo:    palette.campoBordeL,   // conserva su piso medido de 3:1 (R43)
    subtle:   palette.tintaBorde09,  // el hairline de tarjeta (§2: «borde 1 tinta 9 %»)
    accent:   palette.magentaAccion,
    brand:    palette.magentaAccion,
    warm:     '#E8E0C8',
  },
} as const
