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

  // CTA "tinta" (dosis prestador): texto inverso sobre text.primary como fondo
  add('text.inverse / text.primary(CTA tinta)', t.text.inverse, t.text.primary)

  // Gradiente firma: onGradient contra CADA stop (salvo memorial: transparent)
  if (t.accent.gradient.colors[0] !== 'transparent') {
    t.accent.gradient.colors.forEach((stop, i) =>
      add(`text.onGradient / gradient.stop${i}(${stop})`, t.text.onGradient, stop),
    )
  }

  return p
}

const todos: Pair[] = [
  ...paresDe(lightTheme, 'LIGHT'),
  ...paresDe(darkTheme, 'DARK'),
  ...paresDe(memorialTheme, 'MEMORIAL'),
]

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
