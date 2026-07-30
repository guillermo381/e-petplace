/**
 * e-PetPlace — Design Tokens v4 · PALETA PRIMITIVA
 * Evolución de v3.1 (repo prestadores, congelado) con la paleta
 * canonizada desde los SVG de marca reales (Manual de Marca, Abr 2026).
 *
 * REGLA DE ORO (v3.1, intacta):
 *   Ningún componente escribe un color, tamaño o sombra hardcodeado.
 *   Si no está acá, no existe en el producto.
 *
 * CAMBIOS v3.1 → v4:
 *   · pink   #FF2D9B → #FF00AF  (hex real del logo)
 *   · cyan   #00E5FF → teal #28E8DA  (hex real del logo; B1 lo llama "cyan")
 *   · lime   #C5FF3A → ELIMINADO — su rol (capa vida / success) lo toma
 *     verdeVital #2BE86B (B2.1; el menta de marca #90FF8B quedó solo-marca).
 *     Jade #00F5A0 también sigue deprecado.
 *   · yellow #FFE600 → ELIMINADO — amarillo #FFF645 existe SOLO como
 *     color de marca/logo. JAMÁS rol funcional (status, capa, acento).
 *   · Extensiones v3.1 conservadas con los mismos hex.
 *   · Fondos light re-derivados (§7.3 B1): base nunca blanco puro
 *     (S58/D-360: el base es papel algodón #FAF9F7 — ver light0).
 *
 * ALPHAS PRECOMPUTADAS (lección Kaxo):
 *   Nada de interpolar hex+opacidad en runtime. Toda transparencia vive
 *   acá como string rgba lista para usar. Si algún día entra NativeWind,
 *   el patrón twin -rgb (variables por canal) es obligatorio — anotado.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA DE DOS REGISTROS (S43-B2.1, firmada por el founder):
 *
 *   Cada color de marca/capa vive en DOS registros: el PURO para
 *   rellenos gráficos (puntos, tints de fondo, indicadores, isotipo,
 *   decoración) en cualquier tema; la variante *Dark AA exclusivamente
 *   donde hay texto o elemento funcional. AA gobierna texto, no gráfica.
 * ═══════════════════════════════════════════════════════════════════
 */

export const palette = {

  // ── Marca (canonizada desde SVG del logo) ──
  pink:      '#FF00AF',  // Capa 3 · comunidad — rgb(255,0,175)
  pinkDark:  '#C4008A',  // variante AA para light — rgb(196,0,138)
  pinkVivo:  '#DF00A1',  // B3.1c — el magenta más vivo que pasa 4.5:1 con blanco
                         // (4.514:1; #E000A2 falla). SOLO stop 0 del gradiente firma dark. rgb(223,0,161)
  magentaDark: '#8E1F68', // S58 (firma founder) — el registro FUNCIONAL de la capa
                          // marca/afecto: acento de CONTROLES del cliente en claro
                          // (selección, toggles, slider, píldoras de día). El puro
                          // #FF00AF conserva su reserva INTACTA (destello, huella de
                          // tab, techo) — este es su registro trabajador, jamás su
                          // reemplazo. Blanco encima gatea AA. rgb(142,31,104)
  teal:      '#28E8DA',  // Capa 2 · cuidado (B1 lo llama "cyan") — rgb(40,232,218)
  tealDark:  '#0A7268',  // variante AA para light — rgb(10,114,104)
  tealDarkNoche: '#0A4A44',  // S63 D-407: EL par oscuro del muro del oficio (papel 9.61 · textDark0 8.81 · teal puro 6.57 — mediciones B, candidato a firmado; el gate visual puede ajustar)
  verde:     '#90FF8B',  // menta de marca — SOLO marca/logo/gradientLogo, no funcional
                         // (acotado en B2.1: la capa vida usa verdeVital) — rgb(144,255,139)
                         // verdeDark #2E7A28 eliminado en B3.1 (huérfano — decisión founder)
  amarillo:  '#FFF645',  // SOLO marca/logo. JAMÁS funcional — rgb(255,246,69)

  // ── Capa Vida (B2.1 — semántica, no cambia por tema) ──
  verdeVital:     '#2BE86B',  // capa vida + success en LOS TRES temas (registro gráfico) — rgb(43,232,107)
  /** S82-B r10 — CURA COORDINADA DEL TAPIZ (medida por R12, no supuesta):
   *  era #1E7A33 y con el tinte encendido el par successText/successBg
   *  caía a 4.42 (el tinte se composita SOBRE bg.base, así que mover el
   *  fondo mueve el tinte y con él el par). Un paso más oscuro: 5.18.
   *  Reversa r10: volver a #1E7A33 junto con papelTapiz a light0. */
  verdeVitalDark: '#1B6E2E',  // texto AA de vida/success en claro — rgb(27,110,46)

  // ── Extensiones v3.1 (mismos hex) ──
  violet:         '#9E3AFF',  // Capa 3 · comunidad amplia — rgb(158,58,255)
  violetDark:     '#7C2DD4',  // rgb(124,45,212)
  violetText:     '#AE59FF',  // violet aclarado MÍNIMO para AA como texto en dark
                              // (S44-B2.3: subió de #A64BFF para pasar también
                              // sobre el tint capaBg — 4.63:1 en el peor par)
                              // (#9E3AFF da 4.16:1 sobre card — gate S43-B2). rgb(166,75,255)
  coral:          '#FF5C5C',  // danger · separado del pink de marca — rgb(255,92,92)
  coralDark:      '#BE3535',  // rgb(190,53,53) — oscurecido MÍNIMO en B2.1: #C73A3A
  coralDarkTexto: '#B93333',  // S82-B r5 (orden founder): UN paso más oscuro — dangerText
                              // sobre dangerBg∘papel daba 4.48 (R12); este paso da 4.69.
                              // Consumidor: light.dangerText (coralDark quedó sin consumidores
                              // de texto — se conserva como escalón de la rampa)
                              // daba 4.30:1 sobre el tint danger saturado (gate WCAG)
  ochre:          '#E8B547',  // warning — rgb(232,181,71)
  /** S82-B r15 — EL CTA DEL CLIENTE, FIRMADO EN GALERÍA (el ámbar más
   *  claro de los tres candidatos, con LABEL EN TINTA). El par que manda
   *  es el label sobre el fill: **tinta 8.40** (blanco daba 2.02 — por eso
   *  el label es tinta y no al revés). Fill vs tapiz 1.83: NO llega al 3
   *  no-textual y está DECLARADO — su canal es la elevación, igual que
   *  `sinCaja` (r12): un fill que llegue a 3:1 contra papel ya es marrón
   *  (medido r11: el más claro que pasa es #966708 y se lee marrón).
   *  Distancia del ámbar de ALERTA (#E8B547, L59%): 9 puntos de
   *  luminosidad y +14 de saturación — si compartieran registro, el color
   *  no diría nada. */
  ctaOcre:        '#F5A70A',  // rgb(245,167,10)
  /** S82-B r10 — CURA COORDINADA DEL TAPIZ: era #925F0C y vivía en
   *  **4.50 EXACTO** sobre su tinte SIN tapiz (el más frágil de los tres
   *  status — cualquier tinte lo tumbaba: 4.35 al 3%). Un paso más:
   *  4.90. Historia del token: B2.1 ya lo había oscurecido desde
   *  #97620C porque daba 4.44. Reversa r10: #925F0C. */
  ochreDark:      '#875809',  // rgb(135,88,9) — warning AA en claro
                              // sobre el tint warning saturado (v3.1 #A66E10 ya había fallado en B2)
  terracotta:     '#D97757',  // hogar, familia — rgb(217,119,87)
  terracottaDark: '#AF5433',  // rgb(175,84,51) — oscurecido MÍNIMO en S43-B2: el v3.1
                              // #B85937 daba 4.25:1 sobre bg.base claro (gate WCAG)
  cream:          '#FAF6E8',  // narrativa cálida — rgb(250,246,232)

  // ── Memorial · M6 (v3.1 intacto) ──
  sage:     '#8FA68E',  // memorial · primario — rgb(143,166,142)
  sageDark: '#6B7A6A',  // rgb(107,122,106)
  rose:     '#C9A0A0',  // memorial · acento cálido — rgb(201,160,160)
  roseDark: '#9E6A6A',  // rgb(158,106,106)

  // ── Fondos dark (v3.1 intactos — dark es opt-in) ──
  dark0: '#050508',   // fondo base — el universo
  dark1: '#0D0D12',   // cards nivel 1
  dark2: '#13131A',   // cards nivel 2 / hover
  dark3: '#1A1A24',   // elementos elevados
  /** S82-B r12 — el mismo fill en OSCURO, con MÁS presencia (orden
   *  founder): en dark la elevación es contacto mínimo por diseño, así
   *  que el canal tiene que ser el TONO. 1.49 vs base · texto 11.93. */
  sinCajaDark: '#2C2C3C',
  dark4: '#222230',   // bordes visibles / separadores

  // ── Fondos light (§7.3 B1 — DEFAULT del producto) ──
  light0: '#FAF9F7',  // fondo base — PAPEL ALGODÓN (D-360 firmado S58; era lavanda #F5F4FA).
  /** PAPEL TAPIZ (S82-B r9, orden founder) — hermano de papel algodón: el
   *  fondo del tema CLARO con un tinte magenta muy leve. **NACE APAGADO:
   *  su valor de hoy ES `light0` — cero cambio visual, cero tinte al
   *  prestador** (patrón preparado-apagado, precedente D-456/D-579).
   *  El porqué del apagado, declarado: la orden pide que `bg.base`
   *  resuelva acá (punto 1) Y que la separación del prestador se
   *  construya recién con el valor firmado (punto 4) — con un valor
   *  encendido hoy, el prestador recibiría el tinte que la orden le
   *  prohíbe. Así el cableado existe y el color espera su firma.
   *  LOS CANDIDATOS van a la lámina de gate (`papelTapizCandidatos`) —
   *  el ojo elige, no el contraste (medido r8: cero pares caen).
   *  AL FIRMARSE: esta línea toma el candidato + nace el slot de fondo
   *  del provider para que el prestador siga en papel. Reversa: volver
   *  a `light0`. */
  papelTapiz: '#FAF2F5',  // S82-B r10 ENCENDIDO (orden founder): pink 3% sobre papel algodón
  /** Los candidatos del gate (S82-B r9) — pink puro compositado sobre
   *  papel algodón al 2/3/4/5%: mezcla de DOS tokens FIRMADOS, jamás
   *  hexes huérfanos. El de la lámina de Claude Design ("PAPEL TAPIZ ·
   *  Magenta suave · Cálido") entra como QUINTO cuando el zip llegue al
   *  repo — al abrir esta ronda NO estaba (medido: docs/laminas/ sin él).
   *  Recomendación de B anotada, NO valor: el 3%. */
  /** S82-B r18 — LOS TRES CANDIDATOS DEL ORO: **UN color para los DOS
   *  temas**, con label TINTA (los de r11 quedaron atrás: eran del claro y
   *  pedían un token oscuro aparte).
   *
   *  LOS TRES NÚMEROS QUE PEDISTE, medidos: `#fff645` (amarillo de MARCA)
   *  = **H57.1** · `ochre` (warning/consumo) = **H41.0** · `ctaOcre` de
   *  hoy = H40.1. **El swatch del founder NO llegó al repo** (mismo caso
   *  que el zip de r9) — su estimación declarada de ~50° cae **ADENTRO**
   *  de la ventana prohibida, confirmando la sospecha.
   *
   *  LA VENTANA Y EL HUECO: ±12° del amarillo de marca ⇒ PROHIBIDO
   *  [45.2, 69.2]. Por abajo está el ámbar de ALERTA en H41.0. **El hueco
   *  real es 41.0–45.2: CUATRO GRADOS.** Sí hay lugar (no es el caso del
   *  teal, donde no había ninguno) — pero es angosto, y de ahí sale el
   *  hallazgo que importa: **a 2-4° de matiz el ojo NO separa el CTA del
   *  alerta.** La distancia tiene que venir de otro lado, y viene: estos
   *  candidatos van a S95-100% contra el S78% del ochre, y sobre todo el
   *  alerta casi nunca aparece como FILL — vive como tinte al 24% con su
   *  texto AA. El CTA es fill saturado; el alerta, tinte pálido. Esa es
   *  la separación real, no el matiz.
   *
   *  EL BORDE, CONFIRMADO: contra papel el oro da 1.43–1.66 (el ~1.6 que
   *  el founder anticipó) — el botón NO se recorta por color. El label sí
   *  se lee (9.26–10.78). Sobre negro el fill da 11–13: **en oscuro el
   *  color carga la separación, en claro no.** Por eso el CTA que cierra
   *  lleva ELEVACIÓN — la cura de `sinCaja` (r12): cuando el color no
   *  puede cargar la separación, el canal es la superficie apoyada.
   *  La galería los monta CON y SIN, sobre los dos fondos.
   *
   *  `#fff645` como CTA oscuro: RETIRADO por el founder — con un solo
   *  color para los dos temas deja de hacer falta, y evita enmendar el
   *  estatuto solo-marca. */
  ctaOroCandidatos: [
    { etiqueta: 'oro A · H43', valor: '#FCBC1D', tinta: '9.96', papel: '1.55', negro: '11.97' },
    { etiqueta: 'oro B · H44 (el más luminoso)', valor: '#FFC629', tinta: '10.78', papel: '1.43', negro: '12.95' },
    { etiqueta: 'oro C · H42 (el más cerca del alerta)', valor: '#F9B310', tinta: '9.26', papel: '1.66', negro: '11.13' },
  ] as const,
  papelTapizCandidatos: [
    { etiqueta: '2%', valor: '#FAF4F6' },
    { etiqueta: '3%', valor: '#FAF2F5' },
    { etiqueta: '4%', valor: '#FAEFF4' },
    { etiqueta: '5%', valor: '#FAEDF3' },
  ] as const,
                      // La otra mitad del efecto papel es la sombra de tinta cálida
                      // de tokens/elevacion.ts. Nunca blanco puro.
  light1: '#FFFFFF',  // cards
  light2: '#F8F7FC',  // elevated / secciones
  light3: '#EDEBF5',  // hover states
  /** S82-B r12 — EL FILL DEL SECUNDARIO SIN CAJA (Boton `sinCaja`). NO se
   *  reusa `light3`: es un token de HOVER (su propio comentario lo dice) y
   *  lo consumen 19 componentes vía bg.overlay — no se toca un token de N
   *  consumidores para curar uno (el principio que el founder fijó con
   *  light0 en r9). Un paso más de presencia que el hover, medido contra
   *  el TAPIZ (el fondo real del cliente): 1.23 · texto tinta 12.49. */
  sinCajaLight: '#E0DBE9',
  light4: '#E3E0EF',  // bordes visibles / separadores

  // ── Tinta (S58, depósito prestador) — superficie del TECHO del
  // prestador (dosis baja: el techo es tinta, no gradiente). Pariente
  // de la tinta cálida de las sombras (31,27,22), un paso más arriba. ──
  tinta: '#221E19',

  // ── Fondos memorial (v3.1 intactos) ──
  memorialDark0:  '#0A0E0A',   // bosque nocturno
  memorialDark1:  '#141A14',   // surface
  memorialLight0: '#FAF6E8',   // pergamino (cream sólido)
  memorialLight1: '#FFFFFF',

  // ── Texto dark (v3.1) ──
  textDark0: '#F0EEF8',
  textDark1: 'rgba(240,238,248,.65)',
  textDark2: 'rgba(240,238,248,.38)',

  // ── Texto light (§7.3 B1) ──
  textLight0: '#1D1A2E',  // primario · también es la "tinta" de CTA prestador
  textLight1: '#6B6584',  // secundario
  textLight2: '#A9A4C0',  // terciario / placeholder (NO gatea AA: decorativo)

  // ── Texto memorial (v3.1) ──
  textMemorialDark:  '#E8DCC8',
  textMemorialLight: '#2A2A1F',

  // ── Tints claros B2.1 (construidos sobre el hex PURO — valores aprobados en mockup) ──
  verdeVitalAlpha20: 'rgba(43,232,107,.20)',   // vida/success (light)
  tealAlpha16:       'rgba(40,232,218,.16)',   // cuidado/info (light)
  pinkAlpha08:       'rgba(255,0,175,.08)',    // comunidad (light)
  ochreAlpha24:      'rgba(232,181,71,.24)',   // warning (light)
  coralAlpha16:      'rgba(255,92,92,.16)',    // danger (light)

  // ── Tint dark de vida ──
  verdeVitalAlpha15: 'rgba(43,232,107,.15)',
  verdeVitalBorder:  'rgba(43,232,107,.30)',

  // ── Alphas dark (precomputadas) ──
  // PARIDAD PERCEPTUAL (B3.3): la paridad de tints es perceptual, no
  // numérica — el magenta satura más por alfa (OLED lo agrava); en claro
  // ya era .08 por esto mismo. Por eso comunidad usa .09/.21 en dark
  // mientras vida/cuidado quedan en .15/.25-.30.
  tealAlpha15:       'rgba(40,232,218,.15)',
  tealAlpha10:       'rgba(40,232,218,.10)',
  pinkAlpha15:       'rgba(255,0,175,.15)',
  pinkAlpha10:       'rgba(255,0,175,.10)',
  pinkAlpha09:       'rgba(255,0,175,.09)',   // tint comunidad dark (paridad perceptual)
  pinkBorderSuave:   'rgba(255,0,175,.21)',   // border comunidad dark (paridad perceptual)
  verdeAlpha15:      'rgba(144,255,139,.15)',
  verdeAlpha10:      'rgba(144,255,139,.10)',
  violetAlpha15:     'rgba(158,58,255,.15)',
  coralAlpha15:      'rgba(255,92,92,.15)',
  ochreAlpha15:      'rgba(232,181,71,.15)',
  creamAlpha06:      'rgba(250,246,232,.06)',
  terracottaAlpha14: 'rgba(217,119,87,.14)',
  sageAlpha14:       'rgba(143,166,142,.14)',
  roseAlpha14:       'rgba(201,160,160,.14)',

  // ── Alphas light (más sutiles, sobre base clara) ──
  tealAlphaL:       'rgba(10,114,104,.08)',
  pinkAlphaL:       'rgba(196,0,138,.08)',
  violetAlphaL:     'rgba(124,45,212,.08)',
  coralAlphaL:      'rgba(190,53,53,.08)',
  ochreAlphaL:      'rgba(146,95,12,.08)',
  terracottaAlphaL: 'rgba(175,84,51,.06)',
  sageAlphaL:       'rgba(107,122,106,.10)',

  // ── Bordes de acento (precomputados) ──
  tealBorder:        'rgba(40,232,218,.25)',
  pinkBorder:        'rgba(255,0,175,.28)',
  verdeBorder:       'rgba(144,255,139,.30)',
  violetBorder:      'rgba(158,58,255,.30)',
  coralBorder:       'rgba(255,92,92,.30)',
  ochreBorder:       'rgba(232,181,71,.30)',
  terracottaBorder:  'rgba(217,119,87,.30)',
  tealBorderL:       'rgba(10,114,104,.25)',
  pinkBorderL:       'rgba(196,0,138,.22)',
  violetBorderL:     'rgba(124,45,212,.22)',
  coralBorderL:      'rgba(190,53,53,.22)',
  ochreBorderL:      'rgba(146,95,12,.22)',
  terracottaBorderL: 'rgba(175,84,51,.22)',

  // ── Neutros puros ──
  white: '#FFFFFF',
  black: '#000000',

  // ── Scrim (B3.8) — backdrop de la Hoja, derivado de dark0 ──
  scrim: 'rgba(5,5,8,.52)',

} as const

/**
 * GRADIENTES — datos para expo-linear-gradient (no strings CSS).
 *
 * gradientLogo — los 6 stops EXACTOS del SVG de marca (vertical).
 *   USO CERRADO: splash y logo. Nada más. El amarillo solo existe acá.
 *
 * gradientFirmaUI v2 (B3.1c — hallazgo del gate en OLED real): 2 stops le
 *   daban al cyan media superficie (se dispara a verde) y el texto perdia
 *   contraste en la zona media. Receta de la app vieja formalizada: violeta
 *   DOMINANTE al centro (location .5), cyan solo en la cola, texto BLANCO
 *   en ambos temas. pinkVivo #DF00A1 = el magenta mas vivo que pasa 4.5:1
 *   con blanco (derivado por script; #E000A2 ya falla con 4.476:1).
 *   CONTEXTOS CERRADOS (B1): hero de onboarding, CTA principal del
 *   dueño, momento adopción. Fuera de eso NO se usa (dosis prestador:
 *   jamás). En memorial: transparent — la marca habla bajito ahí.
 */
export const gradients = {
  logo: {
    colors: ['#FF00AF', '#D32EB7', '#68A2CD', '#28E8DA', '#90FF8B', '#FFF645'],
    locations: [0, 0.06, 0.2, 0.28, 0.48, 0.65],
    angle: 180, // vertical, como el SVG (x1=x2)
  },
  firmaUILight: {
    colors: [palette.pinkDark, palette.violetDark, palette.tealDark],
    locations: [0, 0.5, 1],
    angle: 165,
  },
  firmaUIDark: {
    colors: [palette.pinkVivo, palette.violet, palette.teal],
    locations: [0, 0.5, 1],
    angle: 165,
  },
  transparent: {
    colors: ['transparent', 'transparent'],
    locations: [0, 1],
    angle: 165,
  },
} as const

export type GradientToken = {
  colors: readonly string[]
  locations: readonly number[]
  angle: number
}
