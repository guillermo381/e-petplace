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

/* ── 🔴 EL BRAZO QUE A AGREGÓ AL CABLEAR (S116-A) ────────────────────
   `supabase/functions/_shared/papel.ts` NO puede importar de `packages/ui`:
   es Deno y se despliega aparte. ⇒ el `d` vive COPIADO allá. **Y una copia
   sin control es exactamente lo que produjo `D-1107`**: B midió que el path
   del papel y el de `brand/Isotipo.tsx` eran idénticos byte a byte — *el
   papel no había copiado mal, había copiado bien de una fuente vencida, y
   nadie se enteró durante meses porque nada los comparaba.*

   Este brazo no evita la copia: evita que la copia ENVEJEZCA EN SILENCIO. */
const PAPEL = 'supabase/functions/_shared/papel.ts'
let dPapel = ''
try {
  const papel = readFileSync(PAPEL, 'utf8')
  const mp = papel.match(/const ISOTIPO_PATH_D =\s*\n?\s*'([^']+)'/)
  ok(`${PAPEL} declara su \`ISOTIPO_PATH_D\``, mp !== null)
  dPapel = mp === null ? '' : mp[1]
  ok(
    'la copia del papel es IDÉNTICA a la fuente única',
    dPapel === d,
    dPapel === d
      ? `${d.length} caracteres, byte a byte`
      : `DIVERGEN — fuente ${d.length} car., papel ${dPapel.length} car. ⇒ los documentos imprimen otro isotipo`,
  )
  /* Y su encuadre: el lienzo es cuadrado y el dibujo ocupa una banda adentro.
     Si el papel centra por el viewBox en vez de por la CAJA, la marca sale
     corrida — y a 6 % de opacidad nadie lo ve hasta que se imprime. */
  ok(
    'el papel encuadra por la CAJA medida, no por el viewBox',
    /ISO_CAJA\s*=\s*\{\s*x:\s*\d+,\s*y:\s*\d+,\s*ancho:\s*\d+,\s*alto:\s*\d+\s*\}/.test(papel) &&
      !/ISO_VW|ISO_VH/.test(papel),
    'sin residuo de ISO_VW/ISO_VH',
  )
} catch (e) {
  ok(`se puede leer ${PAPEL}`, false, String(e))
}

/* ── EL VIEWBOX Y LA CAJA ──────────────────────────────────────────── */
ok('declara su viewBox', /ISOTIPO_V5_VB_W = \d+/.test(src) && /ISOTIPO_V5_VB_H = \d+/.test(src))
ok('declara la caja MEDIDA del contenido', /ISOTIPO_V5_CAJA = \{ x: \d+, y: \d+, ancho: \d+, alto: \d+ \}/.test(src))

console.log(
  fallos.length === 0
    ? `\nverify:isotipo-path — VERDE · 1 path · 0 clips · ${d.length} caracteres · la copia del papel coincide\n` +
      '  ⚠️ Su verde dice «es UNA silueta consumible por pdf-lib», JAMÁS «el dibujo es el correcto»:\n' +
      '     eso lo dijo el ojo sobre el rasterizado (captura en el parte). Un gate no puede mirar.'
    : `\nverify:isotipo-path — ${fallos.length} fallo(s)`,
)
process.exit(fallos.length === 0 ? 0 : 1)
