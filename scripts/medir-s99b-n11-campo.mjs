/**
 * S99-B · N11 — EL CONTORNO DEL CAMPO CONTRA EL FONDO DE SU REGIÓN.
 *
 * N11 (firmada, `DIRECCION_DISENO_S99` §N11) pide **contorno visible
 * ≥3:1 contra el fondo**. Esto lo mide en las TRES casas, leyendo los
 * valores del objeto (`palette.ts`), no de memoria.
 *
 * ⚠️ SU PRIMERA VERSIÓN MIDIÓ LA RAMA QUE NADIE CORRÍA, y queda escrito
 * porque es la trampa más cara de este archivo: medí `border.default`
 * contra `bg.card` y reporté 1.30 / 1.18 — **pero `Campo` nacía con
 * `sinCaja = true` POR DEFAULT**, o sea borde **transparente** y el
 * relleno como única señal. *Leí el código y tomé por vivo el brazo del
 * `else`.* El estado real era peor y más simple: contorno invisible, y
 * el interior a **1.07:1** contra el fondo en claro.
 * ⇒ La lección, que es la de la casa con otro disfraz: **un default
 * decide qué rama corre, y una rama que no corre no describe el
 * producto.**
 *
 * ── ESTO ES MEDICIÓN; EL GATE ES R43 ───────────────────────────────
 * `verify:diseno` R43 vigila que el token no baje del piso. Acá se ve
 * el número y el margen, que es lo que sirve al calibrar.
 */

// ── valores leídos del objeto (packages/ui/src/tokens/palette.ts) ──
const CASAS = [
  { casa: 'light', fondo: '#FAF2F5', interior: '#FFFFFF', borde: '#88829A' },
  { casa: 'dark', fondo: '#0D050D', interior: '#1A1A24', borde: '#62627A' },
  { casa: 'memorial', fondo: '#0A0E0A', interior: '#141A14', borde: '#5A695A' },
]
/** El estado ANTERIOR, conservado para que el después se lea contra algo.
 *  Es el brazo que de verdad corría: `sinCaja = true`. */
const ANTES = [
  { casa: 'light', fondo: '#FAF2F5', interior: '#EDEBF5', borde: null },
  { casa: 'dark', fondo: '#0D050D', interior: '#1A1A24', borde: null },
]

const MIN = 3

function canal(v) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
function lum(hex) {
  const h = hex.replace('#', '')
  return (
    0.2126 * canal(parseInt(h.slice(0, 2), 16)) +
    0.7152 * canal(parseInt(h.slice(2, 4), 16)) +
    0.0722 * canal(parseInt(h.slice(4, 6), 16))
  )
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

console.log('S99-B · N11 — el CONTORNO del campo contra el FONDO de su región (mín 3:1)\n')

console.log('  ANTES (el brazo que corría: `sinCaja = true`, DEROGADO por N11)')
for (const c of ANTES) {
  console.log(
    `    🔴 ${c.casa.padEnd(9)} borde TRANSPARENTE · el interior ${c.interior} llevaba toda la señal → ` +
      `${ratio(c.interior, c.fondo).toFixed(2)}:1 contra el fondo`,
  )
}

console.log('\n  DESPUÉS (N11 · `theme.border.campo`)')
let fallos = 0
for (const c of CASAS) {
  const v = ratio(c.borde, c.fondo)
  const ok = v >= MIN
  if (!ok) fallos++
  console.log(
    `    ${ok ? '✅' : '🔴'} ${c.casa.padEnd(9)} borde ${c.borde} contra fondo ${c.fondo} → ` +
      `${v.toFixed(2)}:1   (margen +${(v - MIN).toFixed(2)}) · interior ${c.interior}`,
  )
}

console.log(
  `\n${fallos === 0 ? '✅ VERDE — las tres casas cumplen N11' : `🔴 ${fallos} casa(s) por debajo de ${MIN}:1`}\n`,
)
process.exitCode = fallos === 0 ? 0 : 1
