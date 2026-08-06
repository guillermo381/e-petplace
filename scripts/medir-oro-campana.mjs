/**
 * medir-oro-campana.mjs — LA MEDICIÓN DEL ORO (S89-B, orden de apertura ①).
 *
 * Enmienda ⑦ (firmada founder): la huella de la campana pasa a ORO
 * #FCBC1D. ANTES de pintar nada, este script mide el contraste del oro
 * en las superficies donde la huella vive (Badge forma="huella"):
 *   · muro claro   — tealDark #0A7268 (techo del prestador, light)
 *   · muro noche   — tealDarkNoche #0A4A44 (techo del prestador, dark)
 *   · papel        — light0 #FAF9F7 (superficie 'clara' en tema claro)
 *   · memorial     — bg.card memorialDark1 #141A14 (el techo plano del
 *                    cliente en memorial — HeroMarca degrada a bg.card)
 * + MEDICIÓN DECLARADA fuera de la lista de la orden: el GRADIENTE firma
 *   del cliente (pinkDark·violetDark·tealDark), porque la campana del
 *   cliente VIVE sobre ese techo hoy (hogar/index.tsx `superficie="muro"`)
 *   — regla del peor punto del gradiente (precedente verify-contrast).
 *
 * MÍNIMO LEGIBLE: 3.0 (WCAG 1.4.11 no-textual — el piso que la casa ya
 * usa para gráfica funcional: fill/canto en verify-diseno-pares).
 *
 * LA MATEMÁTICA ES LA MISMA de verify-contrast.ts (S43) — parse/blend/
 * luminance copiadas literales, y el script se AUTOVALIDA contra dos
 * pares ya firmados antes de imprimir nada (L-197: un instrumento que
 * no prueba su propia regla reporta desde el aire):
 *   · papel/tealDark = 5.51 (§15b.2, vive en verify:contrast)
 *   · tealDarkNoche/papel = 9.61 (comentario de palette, D-407)
 *
 * Correr: node scripts/medir-oro-campana.mjs   (exit 0 = midió; el
 * veredicto por fila se imprime — este script NO gatea: sirve la mesa.)
 */

const ORO = '#FCBC1D' // palette.ctaOro — el hex de la enmienda ⑦

const SUPERFICIES = [
  ['muro claro (tealDark)', '#0A7268'],
  ['muro noche (tealDarkNoche)', '#0A4A44'],
  ['papel (light0)', '#FAF9F7'],
  ['memorial (bg.card memorialDark1)', '#141A14'],
]

// El gradiente firma del cliente (palette.gradients.firma): peor punto.
const GRADIENTE_CLIENTE = [
  ['pinkDark', '#C4008A'],
  ['violetDark', '#7C2DD4'],
  ['tealDark', '#0A7268'],
]

// ── matemática literal de verify-contrast.ts ─────────────────────────
function parse(color) {
  const h = color.slice(1)
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: 1,
  }
}
function luminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function contrast(fgStr, bgStr) {
  const [l1, l2] = [luminance(parse(fgStr)), luminance(parse(bgStr))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// ── autovalidación contra pares FIRMADOS (si esto falla, nada se imprime) ──
const v1 = contrast('#FAF9F7', '#0A7268')
const v2 = contrast('#0A4A44', '#FAF9F7')
if (Math.abs(v1 - 5.51) > 0.01 || Math.abs(v2 - 9.61) > 0.01) {
  console.error(
    `✗ AUTOVALIDACIÓN FALLÓ — la matemática no reproduce los pares firmados: ` +
      `papel/tealDark=${v1.toFixed(2)} (esperado 5.51) · tealDarkNoche/papel=${v2.toFixed(2)} (esperado 9.61). ` +
      `No se reporta ninguna medición desde una regla rota.`,
  )
  process.exit(1)
}
console.log(`autovalidación OK: papel/tealDark ${v1.toFixed(2)}≈5.51 · tealDarkNoche/papel ${v2.toFixed(2)}≈9.61\n`)

const MINIMO = 3.0
console.log(`ORO ${ORO} — contraste no-textual contra cada superficie (mínimo ${MINIMO}):\n`)
for (const [nombre, hex] of SUPERFICIES) {
  const r = contrast(ORO, hex)
  console.log(`  ${r >= MINIMO ? '✓' : '✗'} ${nombre.padEnd(36)} oro/${hex}  ${r.toFixed(2)}`)
}

console.log(`\nGRADIENTE del cliente (medición declarada — la campana del cliente vive ahí):`)
let peor = Infinity
let peorStop = ''
for (const [nombre, hex] of GRADIENTE_CLIENTE) {
  const r = contrast(ORO, hex)
  if (r < peor) { peor = r; peorStop = nombre }
  console.log(`  ${r >= MINIMO ? '✓' : '✗'} stop ${nombre.padEnd(30)} oro/${hex}  ${r.toFixed(2)}`)
}
console.log(`  peor punto: ${peorStop} → ${peor.toFixed(2)} ${peor >= MINIMO ? '(pasa)' : '(NO pasa)'}`)

console.log(`\nreferencia (lo que la huella usa HOY, para comparar):`)
console.log(`  papel sobre muro claro   ${contrast('#FAF9F7', '#0A7268').toFixed(2)}`)
console.log(`  papel sobre muro noche   ${contrast('#FAF9F7', '#0A4A44').toFixed(2)}`)
