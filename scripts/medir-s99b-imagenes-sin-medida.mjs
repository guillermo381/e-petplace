/**
 * S99-B · CARRIL R (mitad 2) — IMÁGENES SIN MEDIDA EXPLÍCITA.
 *
 * Una imagen sin ancho y alto resueltos ANTES de que llegue el pixel
 * ocupa 0 y después empuja: el layout salta cuando la foto entra. Acá se
 * mide qué `<Image` declara su caja y cuál la deja al azar del asset.
 *
 * CUENTA COMO MEDIDA (las tres formas legítimas de la casa):
 *   · width/height numéricos o '100%'
 *   · flex:1 DENTRO de un padre con medida (se resuelve leyendo, se marca
 *     `revisar` y no `sin medida` — el instrumento no adivina padres)
 *   · StyleSheet/const externo referenciado por nombre → `revisar`
 *
 * Es un instrumento de MEDICIÓN, no un gate: no rompe el build.
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const archivos = execSync(
  `grep -rl "<Image" --include="*.tsx" apps/prestador/src apps/cliente/src packages/ui/src | grep -v gallery`,
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean)

let conMedida = 0
const revisar = []
const sinMedida = []

for (const ruta of archivos) {
  /** ⚠️ L-170 COBRADA EN ESTE MISMO INSTRUMENTO (S99-B, primera corrida):
   *  sin esto, `FichaPrestador` daba DOS rojos que eran `<Image>` escritas
   *  DENTRO de comentarios — uno de ellos una LÁPIDA que dice, literal,
   *  «acá vivía una <Image>». *El censo lee los comentarios como código si
   *  se lo permitís*, y la lápida de una pieza borrada es la trampa más
   *  cara: nombra exactamente lo que uno busca. */
  const src = readFileSync(ruta, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')) // bloque: conserva las líneas
    .replace(/^\s*\/\/.*$/gm, '') // línea
  const lineas = src.split('\n')
  lineas.forEach((l, i) => {
    if (!/<Image\b/.test(l)) return
    // el bloque de la etiqueta: hasta el primer '/>' o '>' de cierre
    let bloque = ''
    for (let j = i; j < Math.min(i + 22, lineas.length); j++) {
      bloque += lineas[j] + '\n'
      if (/\/>|^\s*>\s*$/.test(lineas[j]) && j > i) break
      if (j === i && /\/>/.test(lineas[j])) break
    }
    const ref = `${ruta}:${i + 1}`
    const tieneNumeros =
      /width:\s*(['"]?\d|['"]100%|[A-Za-z_])/.test(bloque) && /height:\s*(['"]?\d|['"]100%|[A-Za-z_])/.test(bloque)
    const tieneFlex = /flex:\s*1/.test(bloque)
    const styleExterno = /style=\{(?!\{)/.test(bloque) && !tieneNumeros

    if (tieneNumeros) conMedida++
    else if (tieneFlex || styleExterno) revisar.push(ref)
    else sinMedida.push(ref)
  })
}

console.log('S99-B · CARRIL R — imágenes con caja declarada\n')
console.log(`  ✅ con medida explícita : ${conMedida}`)
console.log(`  🟡 a revisar (flex/estilo externo — el padre decide): ${revisar.length}`)
revisar.forEach((r) => console.log(`       · ${r}`))
console.log(`  🔴 sin medida en la etiqueta: ${sinMedida.length}`)
sinMedida.forEach((r) => console.log(`       · ${r}`))
console.log('')
process.exitCode = 0
