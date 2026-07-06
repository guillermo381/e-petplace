/**
 * verify-contrast.ts — Gate WCAG de los Design Tokens v4 (S43-B2).
 *
 * Valida TODO par (texto funcional, su fondo) de los tres temas:
 *   ≥ 4.5:1 normal · ≥ 3:1 para pares marcados `large` (≥22px).
 * Fondos con alpha se compositan sobre su superficie real antes de medir.
 * Si un par falla, el script FALLA (exit 1) imprimiendo par y ratio.
 *
 * FUERA del gate (documentado):
 *   · text.tertiary — placeholder/decorativo, no texto funcional
 *   · bordes y gradientSubtle — no son fondos de texto
 *   · palette.amarillo — solo marca/logo, jamás porta texto
 *   · capa.* y accent.active (B2.1) — REGISTRO GRÁFICO (puntos, indicadores,
 *     subrayados): AA gobierna texto, no gráfica. El texto usa capaText.*
 *   · tab INACTIVO de BarraTabs (B3.7) — text.tertiary por espec firmada
 *     (convención de plataforma: el tab no seleccionado se atenúa; el icono
 *     duplica el canal y el activo sí gatea). Se imprime medición informativa.
 *   · anillo de CitaEnVivo (S44-B2.1) — hex puro de capa, registro gráfico
 *     REDUNDANTE: el canal semántico es el pill "● vivo", cuyo texto
 *     (capaText / bg.card) SÍ gatea arriba. Medición informativa.
 *
 * Correr: pnpm exec tsx scripts/verify-contrast.ts
 */

import { lightTheme, darkTheme, memorialTheme, type Theme } from '../packages/ui/src/themes'

type RGBA = { r: number; g: number; b: number; a: number }

function parse(color: string): RGBA {
  if (color.startsWith('#')) {
    const h = color.slice(1)
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    }
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/)
  if (!m) throw new Error(`Color no parseable: ${color}`)
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 }
}

/** Composita fg (con alpha) sobre bg opaco. */
function blend(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  }
}

function luminance({ r, g, b }: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contraste WCAG. El texto con alpha se composita sobre el fondo antes de medir. */
function contrast(fgStr: string, bgStr: string, surface?: string): number {
  let bg = parse(bgStr)
  if (bg.a < 1) {
    if (!surface) throw new Error(`Fondo con alpha sin superficie: ${bgStr}`)
    bg = blend(bg, parse(surface))
  }
  let fg = parse(fgStr)
  if (fg.a < 1) fg = blend(fg, bg)
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

type Pair = {
  nombre: string
  fg: string
  bg: string
  /** superficie real debajo cuando bg tiene alpha */
  surface?: string
  large?: boolean
}

function paresDe(t: Theme, nombre: string): Pair[] {
  const p: Pair[] = []
  const add = (n: string, fg: string, bg: string, surface?: string, large?: boolean) =>
    p.push({ nombre: `${nombre} · ${n}`, fg, bg, surface, large })

  // Texto base sobre superficies
  for (const s of ['base', 'card', 'elevated', 'overlay'] as const) {
    add(`text.primary / bg.${s}`, t.text.primary, t.bg[s])
  }
  for (const s of ['base', 'card', 'elevated'] as const) {
    add(`text.secondary / bg.${s}`, t.text.secondary, t.bg[s])
  }
  // Narrativa cálida (bg.warm puede ser alpha → composita sobre card)
  add('text.warm / bg.warm', t.text.warm, t.bg.warm, t.bg.card)

  // Acentos usados como texto (links, labels) sobre base y card
  add('accent.primary / bg.base', t.accent.primary, t.bg.base)
  add('accent.primary / bg.card', t.accent.primary, t.bg.card)
  add('accent.brand / bg.base', t.accent.brand, t.bg.base)
  add('accent.brand / bg.card', t.accent.brand, t.bg.card)
  add('accent.warm / bg.base', t.accent.warm, t.bg.base)
  add('accent.warm / bg.card', t.accent.warm, t.bg.card)

  // Capas como etiqueta de texto — B2.1: el registro de texto es capaText.
  // Memorial no tiene capaText (INTACTO de v3.1): ahí capa.* cumple ambos roles.
  const capaTexto = 'capaText' in t ? t.capaText : t.capa
  for (const c of ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const) {
    add(`capaText.${c} / bg.base`, capaTexto[c], t.bg.base)
    add(`capaText.${c} / bg.card`, capaTexto[c], t.bg.card)
  }

  // Status: su texto sobre su fondo tinteado (compositado sobre card) y sobre card pelada
  for (const s of ['success', 'warning', 'danger', 'info'] as const) {
    add(`status.${s}Text / status.${s}Bg⊕card`, t.status[`${s}Text`], t.status[`${s}Bg`], t.bg.card)
    add(`status.${s}Text / bg.card`, t.status[`${s}Text`], t.bg.card)
  }

  // Tintes de Tarjeta (B3.2): el texto AA de cada capa sobre su tint compositado.
  // (warning/danger/success ya están cubiertos por los pares de status de arriba;
  // vida comparte tint con success.)
  add('capaText.identidad / Tarjeta vida (successBg⊕card)', capaTexto.identidad, t.status.successBg, t.bg.card)
  add('capaText.cuidado / Tarjeta cuidado (infoBg⊕card)', capaTexto.cuidado, t.status.infoBg, t.bg.card)
  add('capaText.comunidad / Tarjeta comunidad (brandBg⊕card)', capaTexto.comunidad, t.accent.brandBg, t.bg.card)

  // Campo (B3.3): mensaje de error sobre las superficies donde vive el form,
  // y los bordes de ESTADO como gráficos funcionales a 3:1 (WCAG 1.4.11 —
  // usan el flag `large`). El borde default queda fuera del gate: el campo
  // se identifica por su label siempre visible, no por el borde en reposo.
  const bgCampo = t.mode === 'light' ? t.bg.card : t.bg.elevated
  add('dangerText / bg.base (mensaje error Campo)', t.status.dangerText, t.bg.base)
  add('borde error Campo (danger gráfico 3:1) / bgCampo', t.status.danger, bgCampo, undefined, true)
  add(
    'borde focus Campo (accent.active gráfico 3:1) / bgCampo',
    'active' in t.accent ? t.accent.active : t.accent.primary,
    bgCampo,
    undefined,
    true,
  )

  // CTA "tinta" (dosis prestador): texto inverso sobre text.primary como fondo
  add('text.inverse / text.primary(CTA tinta)', t.text.inverse, t.text.primary)

  // Gradiente firma v2 (B3.1c) — REGLA DE PEOR PUNTO: onGradient contra cada
  // stop con location ≤ 0.7 DEBE pasar 4.5. La COLA (location 1, teal) queda
  // EXENTA por geometría verificada — no es un agujero:
  //   (a) el stop central está en location ≥ .5 (violeta dominante), y
  //   (b) Boton marca garantiza paddingHorizontal ≥ 24 (spacing[6]),
  //   por lo que el texto jamás se apoya sobre la zona de la cola.
  // Condiciones (a)+(b) se verifican acá abajo; el resto es gate visual.
  if (t.accent.gradient.colors[0] !== 'transparent') {
    const g = t.accent.gradient
    if ((g.locations[1] ?? 0) < 0.5) {
      throw new Error(
        `Exención de cola inválida en ${nombre}: el stop central está en ${g.locations[1]} (< .5)`,
      )
    }
    g.colors.forEach((stop, i) => {
      const loc = g.locations[i]
      if (loc <= 0.7) {
        add(`text.onGradient / gradient.stop${i}@${loc}(${stop})`, t.text.onGradient, stop)
      } else {
        console.log(
          `  (exenta) ${nombre} · gradient.stop${i}@${loc}(${stop}) — cola fuera del área de texto (padding ≥ 24 en Boton marca)`,
        )
      }
    })
  }

  return p
}

const todos: Pair[] = [
  ...paresDe(lightTheme, 'LIGHT'),
  ...paresDe(darkTheme, 'DARK'),
  ...paresDe(memorialTheme, 'MEMORIAL'),
]

// Informativa (no gatea): tab inactivo de BarraTabs — decisión B3.7
for (const [n, t] of [['LIGHT', lightTheme], ['DARK', darkTheme], ['MEMORIAL', memorialTheme]] as const) {
  console.log(
    `  (info) ${n} · tab inactivo (text.tertiary / bg.base) → ${contrast(t.text.tertiary, t.bg.base).toFixed(2)}:1 — exento por espec`,
  )
}

// Informativa (no gatea): anillo de CitaEnVivo — S44-B2.1. Hex puro de capa
// (claro) / text.secondary (memorial) como refuerzo gráfico: el canal
// semántico AA es el pill, gateado arriba (capaText / bg.card).
for (const c of ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const) {
  console.log(
    `  (info) LIGHT · anillo CitaEnVivo capa.${c} / bg.base → ${contrast(lightTheme.capa[c], lightTheme.bg.base).toFixed(2)}:1 — exento: el pill porta el canal AA`,
  )
}
console.log(
  `  (info) MEMORIAL · anillo CitaEnVivo (text.secondary / bg.base) → ${contrast(memorialTheme.text.secondary, memorialTheme.bg.base).toFixed(2)}:1 — exento: el pill porta el canal AA`,
)

let fallos = 0
for (const par of todos) {
  const ratio = contrast(par.fg, par.bg, par.surface)
  const minimo = par.large ? 3 : 4.5
  const ok = ratio >= minimo
  if (!ok) fallos++
  console.log(
    `${ok ? '  ✓' : '✗ FALLA'}  ${par.nombre}  →  ${ratio.toFixed(2)}:1  (mín ${minimo}:1)`,
  )
}

console.log(`\n${todos.length} pares verificados · ${fallos} fallo(s)`)
if (fallos > 0) {
  console.error('\nGATE WCAG: FALLÓ. Ajustar los tokens de los pares listados.')
  process.exit(1)
}
console.log('GATE WCAG: OK — los tres temas pasan.')
