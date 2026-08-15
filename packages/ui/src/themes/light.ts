/**
 * e-PetPlace v4 · TEMA CLARO — DEFAULT del producto (B1 §7.3).
 * Shape v3.1 (bg/text/accent/capa/status/services/shadow/border),
 * components-ready para StyleSheet: colores string, sombras objeto RN,
 * bordes color+width (RN no tiene shorthand CSS).
 */

import { palette, gradients } from '../tokens/palette'
import { shadows } from '../tokens/shadows'
import { elevacion } from '../tokens/elevacion'

export const lightTheme = {
  mode: 'light' as const,

  bg: {
    // S82-B r9 (orden founder punto 1): el fondo del claro resuelve a
    // PAPEL TAPIZ — hermano de papel algodón. `light0` QUEDA INTACTO a
    // propósito: tiene DOS consumidores (este fondo y `accent.ctaTexto`,
    // el texto sobre el CTA de tinta) y no se toca un token de dos
    // consumidores para cambiar uno. Hoy `papelTapiz === light0`: el
    // cableado vive, el color espera su firma en el gate.
    // (Acá vivía la explicación del `as string`. S82-B r30: D-582 PAGADA
    // — `Theme` dejó de derivarse y los 11 casts murieron juntos. El
    // comentario se retira con ellos: describía un problema que ya no
    // existe, y un comentario que sobrevive a su causa desinforma.)
    base:     palette.papelTapiz,   // S82-B r10: pink 3% sobre papel
    card:     palette.light1,   // #FFFFFF
    elevated: palette.light2,   // #F8F7FC
    overlay:  palette.light3,
    /** S82-B — SUPERFICIE HUNDIDA (rieles, botones -/+): el hueco.
     *  Nace porque `overlay` NO hunde en oscuro (es 2.6× más luminoso que
     *  la tarjeta: el riel se leía ELEVADO). En claro coincide con overlay
     *  —ahí sí hundía—, en oscuro baja al fondo. El slot ABSORBE la rama
     *  por tema que SelectorSegmentado tenía que hacer a mano. */
    hundido:  palette.light3,
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
    border:   palette.light4,   // #E3E0EF
    /** ⏳ S82-B r22 — CERO CONSUMIDORES (medido: bg.warm 0 · text.warm 0
     *  · accent.warm 0). NO SE MATA, y el porqué es que hay historia:
     *  `cream` y `terracotta` vienen del MANUAL DE MARCA con la paleta v4
     *  (S43-B2), no son invención de un tema — matar el slot no mata el
     *  color, pero borra la única pista de que la casa tiene un registro
     *  CÁLIDO reservado. Su rol declarado: **la voz de hogar/familia** —
     *  la narrativa que el producto todavía no construyó (ninguna
     *  superficie narrativa existe hoy).
     *  ⚠️ PERO ES LA TRAMPA QUE EL FOUNDER NOMBRÓ: un token que nadie usó
     *  jamás pasó por un gate, y el próximo que lo encuentre lo va a
     *  estrenar sin que nadie lo haya mirado. Por eso queda DECLARADO CON
     *  FECHA (D-583): si al soft launch (1-oct-2026) sigue en cero,
     *  MUERE — y su primer consumidor, cuando llegue, entra por gate. */
    warm:     palette.cream,    // narrativa cálida (hogar/familia) — SIN consumidores
    tinta:    palette.tinta,    // S58: el techo del prestador (constante en los 3 temas)
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
    // S63 — enmienda Ley 21 FIRMADA: el CTA primario resuelve por SLOT.
    // Default 'tinta' (este valor); ThemeProvider cta='oficio' lo ancla a
    // tealDark en light Y dark. Memorial SIEMPRE tinta (no se celebra).
    // S82-B r15 — EL CTA DEL CLIENTE PASA A OCRE (FIRMADO por el founder
    // en galería). ENMIENDA A LA LEY 21 en su mitad del cliente: "el CTA
    // primario del CLIENTE sigue en tinta" deja de regir — era la ley por
    // la que cada CTA nuevo nacía negro. La mitad del PRESTADOR queda
    // INTACTA (su oficio ancla a tealDark por `lightOficio`), y memorial
    // SIGUE EN TINTA por `getTheme` (memorial no se celebra) — las dos
    // garantías viven en la fuente, no en la disciplina de cada pantalla.
    // El par que manda: label TINTA sobre el ocre = 8.40 (blanco daba 2.02).
    // S82-B — EL ORO FIRMADO. Un solo color para los DOS temas (label
    // tinta 9.96 en ambos). El PRESTADOR no lo recibe: su oficio ancla a
    // tealDark por `lightOficio`/`darkOficio`; memorial sigue en tinta
    // por `getTheme` — las dos garantías viven en la fuente.
    cta:           palette.ctaOro,
    ctaTexto:      palette.textLight0,
    /** S82-B — ¿el CTA lleva ELEVACIÓN? el oro NO se recorta contra papel (1.55): su canal es la superficie apoyada
     *  Es SLOT y no prop: la pantalla no elige, y el prestador lo pisa en
     *  `lightOficio`/`darkOficio` (su teal no tiene el problema del oro
     *  contra papel — meterle relieve sería ARRASTRE). */
    ctaElevado:    true,
    primary:       palette.tealDark,
    primaryBg:     palette.tealAlpha16,     // B2.1: tint sobre el hex puro
    primaryBorder: palette.tealBorderL,

    brand:         palette.pinkDark,
    brandBg:       palette.pinkAlpha08,     // B2.1: tint sobre el hex puro
    brandBorder:   palette.pinkBorderL,

    // B2.1 — indicador de estado ACTIVO (subrayado de tab, selección, paso
    // actual). Registro gráfico: pink puro. Un solo elemento activo por vista lo usa.
    active:        palette.pink,

    // S58 (firma founder) — acento de CONTROLES del cliente (selección,
    // toggles, slider, píldoras de día). Marca ELECCIÓN y estado; la
    // ACCIÓN sigue en tinta (CTA primario intacto). El prestador no lo
    // usa: su oficio es tealDark (§15b).
    control:       palette.magentaDark,
    /** 🔴 EL TINTE DE LA ELECCIÓN — SLOT NUEVO (S98-B, cura de D-813).
     *  MISMO VALOR que hoy: `capaBg.comunidad` es `pinkAlpha08`, así que
     *  el cliente NO cambia un píxel. Lo que cambia es de dónde sale.
     *
     *  EL DEFECTO QUE CIERRA, medido: la elección se pintaba con DOS
     *  familias — el BORDE leía `accent.control` (que resuelve por casa)
     *  y el RELLENO tecleaba `capaBg.comunidad` (que NO resuelve por
     *  casa, porque los temas de oficio se arman por spread y pisan
     *  `accent`, jamás `capaBg`). En el prestador eso daba **borde teal
     *  con relleno magenta**, en la app donde §15b.1 firmó que el
     *  magenta vive SOLO en la marca.
     *
     *  🔴 Y POR QUÉ NO SE VEÍA: la pieza nació en el CLIENTE, donde las
     *  dos familias COINCIDEN. *Un acoplamiento entre dos valores que
     *  casualmente son iguales no tiene síntoma hasta que alguien los
     *  monta donde difieren* — la misma familia que D-806.
     *
     *  Memorial NO porta el slot y degrada como sus hermanos (Ley 8): el
     *  guard de las piezas es `'controlBg' in theme.accent`, que pregunta
     *  lo que de verdad importa —¿este tema tiñe la elección?— en vez del
     *  proxy `'capaBg' in theme`. Lo vigila **R27**, junto a `control`,
     *  `active` y `marcaEleccion`: son la misma física y por eso los
     *  cubre UNA regla. */
    controlBg:     palette.pinkAlpha08,
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
    marcaEleccion: palette.magentaDark,
    /** El color de la LUZ DE AMBIENTE (S83-B34). En el cliente es su
     *  MAGENTA de marca; los temas de oficio lo pisan a su verde. En
     *  memorial da igual — la pieza no se monta (Ley 8). */
    atmosfera: palette.pink,
    // S82-B r12 — el fondo del Boton `sinCaja` (el paso sobre el papel tapiz):
    // el secundario sin borde necesita un canal, y el borde ya no está.
    sinCaja:      palette.sinCajaLight,
    // S73 (entity chip, token PROPUESTO — mini-gate founder pendiente):
    // el elegido LLENO. En dark NO usa el violeta (acento de TEXTO):
    // magentaDark porta blanco 8.25:1 — el MISMO par físico en ambos
    // temas (ya medido en el gate). Memorial NO porta el slot: degrada.
    controlLleno: palette.magentaDark,
    sobreControlLleno: '#FFFFFF',

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
  // S82-B r5 (orden founder, censo R12): en CLARO los hex vivos de vida y
  // cuidado no llegaban a 3:1 sobre papel (1.46–1.63) — el valor de TEMA
  // CLARO baja al PRIMER escalón oscuro de su propia rampa que pasa
  // (tealDark 5.51 · verdeVitalDark 5.13); la CATEGORÍA no cambia, y en
  // claro capa colapsa al mismo registro que capaText. Dark/memorial
  // intactos (allá los vivos pasan). Multiplica a toda superficie que
  // lea theme.capa en claro (huella de Icono, puntos, cantos) — asumido
  // en la orden. REVERSA r5 (una línea): identidad=palette.verdeVital ·
  // cuidado=palette.teal · dangerText=palette.coralDark.
  capa: {
    identidad:       palette.verdeVitalDark,  // Capa 1 · vida (era verdeVital)
    cuidado:         palette.tealDark,        // Capa 2 · cuidado activo (era teal)
    comunidad:       palette.pink,            // Capa 3 · vínculo propio
    comunidadAmplia: palette.violet,          // Capa 3 · comunidad amplia
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
    dangerText:    palette.coralDarkTexto,  // S82-B r5: 4.48→4.69 sobre dangerBg∘papel (R12)

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

  // Ley 20 (D-358 S58): dos niveles, tinta cálida, regla Chanel del marco.
  elevacion: elevacion.light,

  border: {
    width:   1,
    default: palette.light4,
    /** S86-B (firma de mesa) · EL BORDE DE LO PRESENTE — nombrado por ROL
     *  y no por color, porque lo que define no es "más oscuro": es *el
     *  límite de la superficie que ESTÁ*, frente a `default`, que es el
     *  de la que ESPERA. En oscuro el mismo rol se cumpliría con un valor
     *  MÁS CLARO. */
    presente: palette.light5,
    subtle:  'rgba(0,0,0,.05)',
    accent:  palette.tealBorderL,
    brand:   palette.pinkBorderL,
    warm:    '#E8E0C8',
  },
} as const
