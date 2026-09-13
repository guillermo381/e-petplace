#!/usr/bin/env node
/**
 * HOJA DE CONTACTO DE GLIFOS (S116-B · DIRECCION_ARTE §6b paso 7).
 *
 * 🔴 **NACE PORQUE UNA AFIRMACIÓN DEL LOTE 0 ERA FALSA.** Ese parte cerró
 * su §② diciendo *«no rastericé ninguno … en este entorno no hay
 * rasterizador de SVG»*, y de ahí colgaba que **ningún gate por ícono a
 * 21 px había corrido nunca** — trece glifos vivos con su gate pendiente
 * declarado en el propio registry, algunos desde S82.
 * **`qlmanage` de macOS rasteriza SVG.** Estaba instalado todo el tiempo.
 * *La afirmación no era mentira: era una ausencia no medida, y se leyó
 * igual que una imposibilidad.*
 *
 * QUÉ HACE: traduce los dibujantes JSX del registry a SVG plano, los
 * rasteriza a 21 px (el tamaño de la ley) y a 48 px (donde se juzga el
 * dibujo), y arma una plancha PNG con cada glifo junto a cinco vecinos
 * del set — que es exactamente lo que §6b pide y nadie podía entregar.
 *
 * ⚠️ **SU LÍMITE, DECLARADO Y NO DISIMULADO:** el traductor entiende
 * `<Path>`, `<Circle>`, `<Rect>`, `<G rotation>` y `<Huella>` — las cinco
 * formas que usa el set. **Un glifo que use otra cosa NO se dibuja: se
 * reporta por nombre y sale del montaje.** *Un glifo que falta en la
 * plancha tiene que verse; uno que se dibuja mal se firma.*
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TRAZO = 1.8
const FUENTE = 'packages/ui/src/components/Icono.tsx'

/** Los cuatro óvalos de la primitiva `Huella`, minados de su archivo —
 *  NO copiados a ojo: si cambia allá, este script la dibuja vieja y la
 *  plancha miente. Por eso se leen del archivo. */
function huellaOvalos() {
  const src = readFileSync('packages/ui/src/brand/Huella.tsx', 'utf8')
  const out = []
  const re = /<Ellipse cx=\{([-\d.]+)\} cy=\{([-\d.]+)\} rx=\{([-\d.]+)\} ry=\{([-\d.]+)\}[^/]*?(?:transform="rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)")?\s*\/>/g
  let m
  while ((m = re.exec(src))) {
    out.push({ cx: +m[1], cy: +m[2], rx: +m[3], ry: +m[4], rot: m[5] ? [+m[5], +m[6], +m[7]] : null })
  }
  if (out.length !== 4) throw new Error(`Huella: esperaba 4 óvalos, leí ${out.length}`)
  return out
}
const OVALOS = huellaOvalos()

function huellaSvg({ x, y, escala, color }) {
  const cuerpo = OVALOS.map(o =>
    `<ellipse cx="${o.cx}" cy="${o.cy}" rx="${o.rx}" ry="${o.ry}" fill="${color}"${o.rot ? ` transform="rotate(${o.rot.join(' ')})"` : ''}/>`,
  ).join('')
  return `<g transform="translate(${x} ${y}) scale(${escala})">${cuerpo}</g>`
}

/** Extrae el cuerpo JSX de un dibujante del registry. */
function cuerpoDe(src, nombre) {
  const re = new RegExp(`\\n  ${nombre}: \\(\\{[^}]*\\}\\) => \\(\\n([\\s\\S]*?)\\n  \\),`)
  const m = src.match(re)
  return m ? m[1] : null
}

/** JSX → SVG plano. Devuelve null si encuentra una forma que no entiende. */
function traducir(cuerpo, { tinta, huella }) {
  const piezas = []
  let desconocido = null
  const t = `fill="none" stroke="${tinta}" stroke-width="${TRAZO}" stroke-linecap="round" stroke-linejoin="round"`

  // <G rotation={N} origin="a, b"> … </G>
  const g = cuerpo.match(/<G rotation=\{([-\d.]+)\} origin="([^"]+)">([\s\S]*?)<\/G>/)
  const cerrarG = g ? `</g>` : ''
  const abrirG = g ? `<g transform="rotate(${g[1]} ${g[2].replace(',', '')})">` : ''
  const trabajo = g ? g[3] : cuerpo

  for (const m of trabajo.matchAll(/<Path\s+d="([^"]+)"\s*\{\.\.\.trazo\([^)]*\)\}\s*\/>/g)) {
    piezas.push(`<path d="${m[1]}" ${t}/>`)
  }
  for (const m of trabajo.matchAll(/<Path\s*\n\s*d="([^"]+)"\s*\n\s*\{\.\.\.trazo\([^)]*\)\}\s*\n\s*\/>/g)) {
    piezas.push(`<path d="${m[1]}" ${t}/>`)
  }
  for (const m of trabajo.matchAll(/<Circle cx=\{([-\d.]+)\} cy=\{([-\d.]+)\} r=\{([-\d.]+)\}\s*\{\.\.\.trazo\([^)]*\)\}\s*\/>/g)) {
    piezas.push(`<circle cx="${m[1]}" cy="${m[2]}" r="${m[3]}" ${t}/>`)
  }
  for (const m of trabajo.matchAll(/<Rect x=\{([-\d.]+)\} y=\{([-\d.]+)\} width=\{([-\d.]+)\} height=\{([-\d.]+)\} rx=\{([-\d.]+)\}\s*\{\.\.\.trazo\([^)]*\)\}\s*\/>/g)) {
    piezas.push(`<rect x="${m[1]}" y="${m[2]}" width="${m[3]}" height="${m[4]}" rx="${m[5]}" ${t}/>`)
  }
  /* 🔴 **`SIN_HUELLA=1` dibuja el set como lo va a RENDERIZAR LA CASA v5.**
   * Desde S116-B lote 2b la huella la apaga `resolverHuella` cuando
   * `accent.formaV5` está encendido (letra §1.1), así que una hoja que las
   * pinte **estaría mostrando un glifo que el cliente no va a ver**. *Una
   * hoja de contacto que no muestra lo que sale en pantalla no es una hoja
   * de contacto: es un dibujo del registry.*
   * Sin el flag las sigue pintando, que es lo correcto para juzgar los
   * glifos del PRESTADOR — ahí la huella vive. */
  if (process.env.SIN_HUELLA !== '1') {
    for (const m of trabajo.matchAll(/<Huella color=\{huella\} x=\{([-\d.]+)\} y=\{([-\d.]+)\} escala=\{([-\d.]+)\}\s*\/>/g)) {
      piezas.push(huellaSvg({ x: +m[1], y: +m[2], escala: +m[3], color: huella }))
    }
  } else {
    for (const _ of trabajo.matchAll(/<Huella[^/]*\/>/g)) { /* apagada por la casa */ }
  }
  // lo que quede sin traducir se declara, no se ignora
  const restante = trabajo.replace(/<Path[\s\S]*?\/>|<Circle[\s\S]*?\/>|<Rect[\s\S]*?\/>|<Huella[\s\S]*?\/>|<>|<\/>|\s/g, '')
  if (restante.length) desconocido = restante.slice(0, 60)
  if (!piezas.length) return { svg: null, desconocido: desconocido ?? '(vacío)' }
  return { svg: abrirG + piezas.join('') + cerrarG, desconocido }
}

// ── CLI ─────────────────────────────────────────────────────────────
const nombres = process.argv.slice(2)
if (!nombres.length) {
  console.error('uso: node scripts/hoja-de-contacto-glifos.mjs <glifo> [glifo…]')
  process.exit(2)
}

const src = readFileSync(FUENTE, 'utf8')
const TMP = '/tmp/hoja-glifos'
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

const TINTA = '#1C1D20'
const HUELLA = '#D10788'
const FONDO = '#FFFFFF'
const faltan = []
const hechos = []

for (const n of nombres) {
  const cuerpo = cuerpoDe(src, n)
  if (!cuerpo) { faltan.push([n, 'sin dibujante en el registry']); continue }
  const { svg, desconocido } = traducir(cuerpo, { tinta: TINTA, huella: HUELLA })
  if (!svg) { faltan.push([n, `no traducible: ${desconocido}`]); continue }
  if (desconocido) faltan.push([n, `traducido PARCIAL, sobró: ${desconocido}`])
  hechos.push([n, svg])
}

/* LA PLANCHA VA EN GRILLA Y NO EN LISTA, y lo decidió una medición: la
 * primera salió en una columna de 20 filas ⇒ 2184 px de alto, y
 * **`qlmanage` escala por el lado MAYOR**, así que el PNG salió recortado
 * a los primeros seis glifos **sin fallar ni avisar**. *Un montaje que
 * corta en silencio es peor que ninguno: los catorce que faltaban no se
 * veían como faltantes, se veían como si no existieran.*
 * En grilla el aspecto queda ~1:1 y entra entera — que es la condición de
 * §6b: **el founder la mira en UNA pasada.** */
const COLS = 4
const CELDA_W = 160
const CELDA_H = 92
const cols = Math.min(COLS, hechos.length)
const rows = Math.ceil(hechos.length / cols)
const ancho = cols * CELDA_W + 24
const alto = rows * CELDA_H + 40

const celdas = hechos.map(([n, svg], i) => {
  const cx = 12 + (i % cols) * CELDA_W
  const cy = 28 + Math.floor(i / cols) * CELDA_H
  const glifo = (x, y, px) =>
    `<g transform="translate(${x} ${y}) scale(${px / 24})">${svg}</g>`
  return (
    glifo(cx + 18, cy + 14, 21) +
    glifo(cx + 62, cy + 2, 48) +
    `<text x="${cx + 8}" y="${cy + 72}" font-family="Helvetica" font-size="11" fill="#1C1D20">${n}</text>` +
    `<line x1="${cx + 4}" y1="${cy + 82}" x2="${cx + CELDA_W - 8}" y2="${cy + 82}" stroke="#1C1D20" stroke-opacity=".1"/>`
  )
})
const titulo = process.env.TITULO ?? 'hoja de contacto · 21 px y 48 px'
const plancha =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">` +
  `<rect width="${ancho}" height="${alto}" fill="${FONDO}"/>` +
  `<text x="12" y="18" font-family="Helvetica" font-size="12" fill="#1C1D20" opacity=".65">${titulo}  —  izquierda 21 px (la ley §2.9) · derecha 48 px</text>` +
  celdas.join('') + '</svg>'

const svgPath = join(TMP, 'plancha.svg')
writeFileSync(svgPath, plancha)
const salida = process.env.SALIDA ?? 'docs/loop/capturas-s116-b'
const archivo = process.env.ARCHIVO ?? 'hoja-de-contacto.png'
mkdirSync(salida, { recursive: true })
// `-s` fija el lado MAYOR ⇒ se le pasa el máximo, o el PNG sale recortado.
execFileSync('qlmanage', ['-t', '-s', String(Math.max(ancho, alto)), '-o', TMP, svgPath], { stdio: 'ignore' })
execFileSync('cp', [join(TMP, 'plancha.svg.png'), join(salida, archivo)])

console.log(`glifos en la plancha: ${hechos.length}/${nombres.length}  (${cols}×${rows}, ${ancho}×${alto})`)
for (const [n, por] of faltan) console.log(`  ⚠ ${n}: ${por}`)
console.log(`plancha → ${salida}/${archivo}`)
process.exit(faltan.some(([, p]) => !p.startsWith('traducido PARCIAL')) ? 1 : 0)
