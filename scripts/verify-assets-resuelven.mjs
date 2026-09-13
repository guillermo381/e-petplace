#!/usr/bin/env node
/**
 * verify:assets-resuelven — UN ASSET EN EL REPO NO ES UN ASSET EN LA APP.
 *
 * POR QUÉ EXISTE, con el caso que lo parió (S116-B lote 2): B ingirió los
 * personajes como `perro@3x.png` y **Metro no los resolvió** — «Unable to
 * resolve "../../assets/personajes/perro@3x.png"». El sufijo `@nx` no es
 * parte del nombre: es la DENSIDAD, así que Metro busca el archivo BASE y
 * toma `@3x` como variante; con sólo la variante, no encuentra nada.
 * **El lote 1 pasó typecheck, `verify:diseno` y `verify:contrast` con ese
 * defecto adentro. Lo encontró el primer bundle.**
 *
 * LAS DOS PREGUNTAS, y son distintas — por eso el gate tiene dos brazos:
 *   ① ¿el archivo que el `require()` nombra EXISTE en disco?      (estático)
 *   ② ¿Metro lo RESUELVE y lo empaqueta?                          (export)
 * ① caza el require a un archivo inexistente; ② caza el caso `@3x`, donde
 * el archivo existe y el bundle igual no lo tiene. **Ninguna de las dos la
 * hace el typecheck**: un `require()` de asset es una string para TS.
 *
 * ALCANCE DECLARADO: mide los `require()` de `packages/ui/src` y `apps/<app>/src`
 * que apunten a `assets/`. NO mide imports dinámicos, ni assets que se
 * resuelvan por variable, ni los que carga el nativo. Su verde dice «los
 * requires literales resuelven», jamás «no falta ningún asset».
 *
 * ⚠️ NO VA AL PRE-COMMIT: el brazo ② corre `expo export` (~1-2 min). Va al
 *    RITUAL DEL CANDIDATO, al lado de verify:edge-deno, por la misma razón
 *    (un hook lento se saltea por costumbre y volvemos al mismo lugar).
 *
 * USO:
 *   node scripts/verify-assets-resuelven.mjs                → ① y ② (corre el export)
 *   node scripts/verify-assets-resuelven.mjs --dist <dir>   → ② sobre un export ya hecho
 *   node scripts/verify-assets-resuelven.mjs --solo-existen → sólo ①, en segundos
 *
 * SALIDAS: 0 verde · 1 rojo · 2 NO CONCLUYENTE (no pudo medir).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

const di = (s) => process.stdout.write(s + '\n')
const RAIZ = process.cwd()
const args = process.argv.slice(2)
const DIST = args.includes('--dist') ? args[args.indexOf('--dist') + 1] : null
const SOLO_EXISTEN = args.includes('--solo-existen')

/* ── el censo: `require('…assets/…')` en el código de piezas y pantallas ── */
const RE = /require\(\s*'([^']*assets\/[^']*)'\s*\)/g
function tsx(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) tsx(p, out)
    else if (/\.(tsx|ts)$/.test(e)) out.push(p)
  }
  return out
}
const fuentes = [join(RAIZ, 'packages/ui/src'), join(RAIZ, 'apps/cliente/src'), join(RAIZ, 'apps/prestador/src')]
  .flatMap((d) => tsx(d))
if (fuentes.length === 0) { di('ROJO · cero archivos de código — no pude medir.'); process.exit(2) }

/* ── AUTO-PRUEBA: si no puede ver un require, su cero no vale (L-459) ── */
const sonda = (t) => [...t.matchAll(new RegExp(RE.source, 'g'))].length
if (sonda("require('../../assets/x/y.png')") !== 1) { di('ROJO · auto-prueba: no ve un require de asset.'); process.exit(2) }
if (sonda("require('react')") !== 0) { di('ROJO · auto-prueba: cuenta un require que no es de asset.'); process.exit(2) }

const pedidos = []           // {desde, spec, abs}
for (const f of fuentes) {
  const t = readFileSync(f, 'utf8')
  for (const m of t.matchAll(new RegExp(RE.source, 'g'))) {
    pedidos.push({ desde: relative(RAIZ, f), spec: m[1], abs: resolve(dirname(f), m[1]) })
  }
}
if (pedidos.length === 0) { di('ROJO · cero require() de assets — el censo no puede estar vacío.'); process.exit(2) }

/* ── ① ¿EXISTE EL ARCHIVO? ─────────────────────────────────────────────── */
const faltan = pedidos.filter((p) => !existsSync(p.abs))
di(`verify:assets-resuelven · ${pedidos.length} require(s) de asset en ${fuentes.length} archivos`)
if (faltan.length) {
  di('')
  di(`🔴 ① ${faltan.length} require(s) apuntan a un archivo QUE NO EXISTE:`)
  for (const f of faltan) di(`   · ${f.desde}\n       → ${f.spec}`)
  di('')
  di('  El typecheck no lo ve: para TS un require de asset es una string.')
  di('  En la app esto revienta al bundlear, no al compilar.')
  process.exit(1)
}
di(`  ① los ${pedidos.length} archivos existen en disco ✓`)
if (SOLO_EXISTEN) { di('  (--solo-existen: el brazo ② no corrió)'); process.exit(0) }

/* ── ② ¿METRO LOS RESUELVE Y LOS EMPAQUETA? ────────────────────────────── */
let dist = DIST
if (!dist) {
  dist = join(mkdtempSync(join(tmpdir(), 'assets-gate-')), 'dist')
  di(`  ② corriendo expo export (tarda 1-2 min)…`)
  try {
    execSync(`npx expo export --platform android --output-dir ${dist}`,
      { cwd: join(RAIZ, 'apps/cliente'), stdio: 'pipe' })
  } catch (e) {
    di('')
    di('🔴 ② EL EXPORT FALLÓ — un asset no resuelve, o el bundle está roto:')
    di(String(e.stderr || e.stdout || e).split('\n').filter((l) => /resolve|error/i.test(l)).slice(0, 5).map((l) => '   ' + l.trim()).join('\n'))
    process.exit(1)
  }
}
const meta = join(dist, 'metadata.json')
if (!existsSync(meta)) { di(`ROJO · no hay metadata.json en ${dist} — no pude medir.`); process.exit(2) }

const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex')
const enBundle = new Set()
for (const a of JSON.parse(readFileSync(meta, 'utf8')).fileMetadata.android.assets) {
  const p = join(dist, a.path)
  if (existsSync(p)) enBundle.add(md5(p))
}
/* un require puede expandirse a varias densidades: basta que la BASE esté */
const noEmpaquetados = pedidos.filter((p) => !enBundle.has(md5(p.abs)))
di(`  ② ${enBundle.size} assets en el manifest del export`)
if (noEmpaquetados.length) {
  di('')
  di(`🔴 ② ${noEmpaquetados.length} asset(s) EXISTEN en el repo y NO están en el bundle:`)
  for (const f of noEmpaquetados) di(`   · ${f.spec}   (desde ${f.desde})`)
  di('')
  di('  Un asset en el repo no es un asset en la app: Metro sólo empaqueta')
  di('  lo alcanzable desde el grafo, y `@3x` en el nombre es una DENSIDAD,')
  di('  no parte del nombre.')
  process.exit(1)
}
di('')
di(`✓ verify:assets-resuelven VERDE · ${pedidos.length} de ${pedidos.length} requires resuelven y viajan en el bundle.`)
process.exit(0)
