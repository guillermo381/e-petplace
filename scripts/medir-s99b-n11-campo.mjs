/**
 * S99-B · B3 — LA MEDICIÓN DE N11 SOBRE `Campo`, LA PIEZA.
 *
 * N11 pide: interior claro · CONTORNO ≥3:1 · etiqueta ADENTRO de la caja ·
 * foco con presencia.
 *
 * Esto mide SOLO la pata numérica (el contorno contra su propio interior)
 * en las tres casas. Las otras tres patas son de forma y se leen del
 * código, no de un número.
 *
 * Se mide el contorno CONTRA SU INTERIOR, no contra el fondo de pantalla:
 * el borde separa la caja de lo que tiene ADENTRO tanto como de lo de
 * afuera, y el interior es el vecino que la pieza controla. Se reportan
 * los dos por si la mesa quiere el otro.
 */

// ── valores leídos del objeto (packages/ui/src/tokens/palette.ts y themes/) ──
const C = {
  light: {
    base: '#FAF2F5', // papelTapiz
    interior: '#FFFFFF', // bg.card  (Campo en light)
    borde: '#E3E0EF', // bg.border (light4)
  },
  dark: {
    base: '#0D050D', // bg.base = tapizDark
    interior: '#13131A', // bg.elevated (dark2) — Campo en dark
    borde: '#222230', // bg.border (dark4)
  },
}

function canal(v) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
function lum(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const MIN = 3
let fallos = 0
console.log('S99-B · N11 — el CONTORNO de `Campo` contra su interior (mín 3:1)\n')
for (const casa of ['light', 'dark']) {
  const c = C[casa]
  const vsInterior = ratio(c.borde, c.interior)
  const vsBase = ratio(c.borde, c.base)
  const ok = vsInterior >= MIN
  if (!ok) fallos++
  console.log(
    `  ${ok ? '✅' : '🔴'} ${casa.padEnd(8)} borde ${c.borde} · interior ${c.interior} → ` +
      `${vsInterior.toFixed(2)}:1   (contra el fondo de pantalla ${c.base}: ${vsBase.toFixed(2)}:1)`,
  )
}
console.log(
  `\n${fallos === 0 ? '✅ VERDE' : `🔴 ${fallos} casa(s) por debajo de ${MIN}:1`}` +
    ' — memorial no se mide acá: su Campo hereda el tema y su par se mide en el gate WCAG.\n',
)
process.exitCode = 0 // instrumento de MEDICIÓN, no gate: no rompe nada
