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
 *     el verde de marca #90FF8B (dark) / #2E7A28 (light)
 *   · yellow #FFE600 → ELIMINADO — amarillo #FFF645 existe SOLO como
 *     color de marca/logo. JAMÁS rol funcional (status, capa, acento).
 *   · Extensiones v3.1 conservadas con los mismos hex.
 *   · Fondos light re-derivados (§7.3 B1): base #F5F4FA, nunca blanco puro.
 *
 * ALPHAS PRECOMPUTADAS (lección Kaxo):
 *   Nada de interpolar hex+opacidad en runtime. Toda transparencia vive
 *   acá como string rgba lista para usar. Si algún día entra NativeWind,
 *   el patrón twin -rgb (variables por canal) es obligatorio — anotado.
 */

export const palette = {

  // ── Marca (canonizada desde SVG del logo) ──
  pink:      '#FF00AF',  // Capa 3 · comunidad — rgb(255,0,175)
  pinkDark:  '#C4008A',  // variante AA para light — rgb(196,0,138)
  teal:      '#28E8DA',  // Capa 2 · cuidado (B1 lo llama "cyan") — rgb(40,232,218)
  tealDark:  '#0A7268',  // variante AA para light — rgb(10,114,104)
  verde:     '#90FF8B',  // Capa 1 · vida + success — rgb(144,255,139)
  verdeDark: '#2E7A28',  // variante AA para light — rgb(46,122,40)
  amarillo:  '#FFF645',  // SOLO marca/logo. JAMÁS funcional — rgb(255,246,69)

  // ── Extensiones v3.1 (mismos hex) ──
  violet:         '#9E3AFF',  // Capa 3 · comunidad amplia — rgb(158,58,255)
  violetDark:     '#7C2DD4',  // rgb(124,45,212)
  violetText:     '#A64BFF',  // violet aclarado MÍNIMO para AA como texto en dark
                              // (#9E3AFF da 4.16:1 sobre card — gate S43-B2). rgb(166,75,255)
  coral:          '#FF5C5C',  // danger · separado del pink de marca — rgb(255,92,92)
  coralDark:      '#C73A3A',  // rgb(199,58,58)
  ochre:          '#E8B547',  // warning — rgb(232,181,71)
  ochreDark:      '#97620C',  // rgb(151,98,12) — oscurecido en S43-B2: el v3.1 #A66E10
                              // daba 4.32:1 sobre card y 3.91:1 sobre warningBg (gate WCAG)
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
  dark4: '#222230',   // bordes visibles / separadores

  // ── Fondos light (§7.3 B1 — DEFAULT del producto) ──
  light0: '#F5F4FA',  // fondo base — lavanda muy sutil (nunca blanco puro)
  light1: '#FFFFFF',  // cards
  light2: '#F8F7FC',  // elevated / secciones
  light3: '#EDEBF5',  // hover states
  light4: '#E3E0EF',  // bordes visibles / separadores

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

  // ── Alphas dark (precomputadas) ──
  tealAlpha15:       'rgba(40,232,218,.15)',
  tealAlpha10:       'rgba(40,232,218,.10)',
  pinkAlpha15:       'rgba(255,0,175,.15)',
  pinkAlpha10:       'rgba(255,0,175,.10)',
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
  verdeAlphaL:      'rgba(46,122,40,.10)',
  violetAlphaL:     'rgba(124,45,212,.08)',
  coralAlphaL:      'rgba(199,58,58,.08)',
  ochreAlphaL:      'rgba(151,98,12,.08)',
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
  verdeBorderL:      'rgba(46,122,40,.25)',
  violetBorderL:     'rgba(124,45,212,.22)',
  coralBorderL:      'rgba(199,58,58,.22)',
  ochreBorderL:      'rgba(151,98,12,.22)',
  terracottaBorderL: 'rgba(175,84,51,.22)',

  // ── Neutros puros ──
  white: '#FFFFFF',
  black: '#000000',

} as const

/**
 * GRADIENTES — datos para expo-linear-gradient (no strings CSS).
 *
 * gradientLogo — los 6 stops EXACTOS del SVG de marca (vertical).
 *   USO CERRADO: splash y logo. Nada más. El amarillo solo existe acá.
 *
 * gradientFirmaUI — 165deg, 2 stops.
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
    colors: [palette.pinkDark, palette.tealDark],
    locations: [0, 1],
    angle: 165,
  },
  firmaUIDark: {
    colors: [palette.pink, palette.teal],
    locations: [0, 1],
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
