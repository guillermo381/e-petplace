/**
 * desplazamiento.mjs — ¿SE MOVIÓ EL CONTENIDO, Y CUÁNTO?
 *
 * Mide el corrimiento VERTICAL entre dos capturas dentro de una banda, por
 * correlación: prueba cada desplazamiento posible y se queda con el que
 * hace coincidir más filas.
 *
 * Por qué correlación y no «son distintas»: *«distintas» contesta que algo
 * cambió y no si fue scroll* — un cursor que parpadea, un reloj que avanza
 * o una hoja que se arrastró también cambian píxeles. El corrimiento que
 * ALINEA las dos imágenes sí distingue scroll de cualquier otra cosa.
 *
 * Uso: node desplazamiento.mjs antes.png despues.png y0 y1 x0 x1
 */
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const [, , aPath, bPath, y0s, y1s, x0s, x1s] = process.argv
const A = PNG.sync.read(readFileSync(aPath))
const B = PNG.sync.read(readFileSync(bPath))
const y0 = Number(y0s), y1 = Number(y1s), x0 = Number(x0s), x1 = Number(x1s)

/** Firma de una fila: luminancia media de la banda de x. Una fila de texto
 *  y una fila vacía dan números muy distintos, y eso alcanza para alinear. */
function firma(img) {
  const f = []
  for (let y = 0; y < img.height; y++) {
    let s = 0, n = 0
    for (let x = x0; x < x1; x++) {
      const i = (img.width * y + x) << 2
      s += 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2]
      n++
    }
    f.push(s / n)
  }
  return f
}

const fa = firma(A), fb = firma(B)
const MAX = 900
let mejor = { d: 0, err: Infinity }
for (let d = -MAX; d <= MAX; d++) {
  let e = 0, n = 0
  for (let y = y0; y < y1; y++) {
    const yb = y + d
    if (yb < 0 || yb >= B.height) continue
    e += Math.abs(fa[y] - fb[yb]); n++
  }
  if (n < (y1 - y0) * 0.6) continue
  const err = e / n
  if (err < mejor.err) mejor = { d, err }
}

// Control: cuánto error da NO moverse. Si el mejor no le gana con holgura,
// no hubo desplazamiento medible y se dice, en vez de publicar un número.
let e0 = 0, n0 = 0
for (let y = y0; y < y1; y++) { e0 += Math.abs(fa[y] - fb[y]); n0++ }
const errQuieto = e0 / n0

console.log(`banda y=${y0}..${y1}  x=${x0}..${x1}`)
console.log(`  error si NO se movió : ${errQuieto.toFixed(2)}`)
console.log(`  mejor corrimiento    : ${mejor.d > 0 ? '+' : ''}${mejor.d} px  (error ${mejor.err.toFixed(2)})`)
if (Math.abs(mejor.d) <= 2 || errQuieto < 1.5) {
  console.log(`  ⇒ NO SE MOVIÓ`)
} else {
  console.log(`  ⇒ SE DESPLAZÓ ${Math.abs(mejor.d)} px hacia ${mejor.d < 0 ? 'ARRIBA' : 'ABAJO'}`)
}
