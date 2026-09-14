/**
 * ═══════════════════════════════════════════════════════════════════════
 * **EL CONTROL DEL PATH DEL ISOTIPO (S116-B lote 7 · `D-1107`).**
 *
 * A midió que el SVG del ilustrador tiene **268 paths y 229 clipPaths** y que
 * **no le sirve a `pdf-lib`**: su `drawSvgPath` toma UN `d` y lo dibuja — no
 * resuelve clips, no compone capas, no tiene noción de z-order.
 *
 * ⇒ este control prueba lo que la mesa pide confirmar: **que lo que se
 * entregó es UNA silueta y no el archivo del ilustrador con otro nombre.**
 *
 * ⚠️ **Lo que mide y lo que NO:** mide que el `d` es **un solo path, sin
 * clips, sin múltiples rellenos y cerrado**. **NO mide que el dibujo sea
 * bonito ni que sea el isotipo correcto** — eso lo dijo el ojo sobre el
 * rasterizado, y está en la captura del parte. *Un gate no puede mirar.*
 * ═══════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from 'node:fs'

const RUTA = 'packages/ui/src/brand/isotipo-v5-path.ts'
const FUENTE = 'packages/ui/assets/marca/isotipo.svg'
const src = readFileSync(RUTA, 'utf8')
const svg = readFileSync(FUENTE, 'utf8')

const fallos = []
const ok = (que, cond, detalle) => {
  console.log(`  ${cond ? '✓' : '✗'}  ${que}${detalle === undefined ? '' : ` — ${detalle}`}`)
  if (!cond) fallos.push(que)
}

/* ── LO QUE ENTRÓ ──────────────────────────────────────────────────── */
const m = src.match(/export const ISOTIPO_V5_PATH =\s*\n?\s*'([^']+)'/)
ok('el archivo exporta UN `ISOTIPO_V5_PATH`', m !== null)
const d = m === null ? '' : m[1]

ok('es UNA sola cadena `d`', (src.match(/ISOTIPO_V5_PATH/g) ?? []).length === 1, 'una definición, un uso en el export')
ok('NO trae markup: ni `<path`, ni `<g`, ni `clip`', !/<path|<g\b|clip/i.test(d))
ok('arranca en un `M` y cierra en `Z`', /^M/i.test(d.trim()) && /z\s*$/i.test(d.trim()), `${d.length} caracteres`)

/* Un `d` con subpaths es legal y necesario —el isotipo tiene huecos—, pero
   tiene que ser UN path: lo que `pdf-lib` no soporta son varios ELEMENTOS. */
const subpaths = (d.match(/M/gi) ?? []).length
ok('tiene subpaths (los huecos del dibujo) dentro de UN path', subpaths >= 1, `${subpaths} subpath(s) en un solo \`d\``)

/* ── EL CONTRASTE CON LA FUENTE, que es lo que la mesa pide confirmar ── */
const paths = (svg.match(/<path\b/g) ?? []).length
const clips = (svg.match(/<clipPath\b/g) ?? []).length
ok(
  'el SVG del ilustrador NO se entregó tal cual',
  paths > 100 && clips > 100 && !src.includes('clipPath'),
  `la fuente tiene ${paths} paths y ${clips} clipPaths; lo entregado, 1 path y 0 clips`,
)

/* ── EL VIEWBOX Y LA CAJA ──────────────────────────────────────────── */
ok('declara su viewBox', /ISOTIPO_V5_VB_W = \d+/.test(src) && /ISOTIPO_V5_VB_H = \d+/.test(src))
ok('declara la caja MEDIDA del contenido', /ISOTIPO_V5_CAJA = \{ x: \d+, y: \d+, ancho: \d+, alto: \d+ \}/.test(src))

console.log(
  fallos.length === 0
    ? `\nverify:isotipo-path — VERDE · 1 path · 0 clips · ${d.length} caracteres\n` +
      '  ⚠️ Su verde dice «es UNA silueta consumible por pdf-lib», JAMÁS «el dibujo es el correcto»:\n' +
      '     eso lo dijo el ojo sobre el rasterizado (captura en el parte). Un gate no puede mirar.'
    : `\nverify:isotipo-path — ${fallos.length} fallo(s)`,
)
process.exit(fallos.length === 0 ? 0 : 1)
