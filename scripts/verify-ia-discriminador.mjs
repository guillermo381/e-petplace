/**
 * DISCRIMINADOR · EL CUERPO QUE SALE A ANTHROPIC NO CAMBIO — S113-D, lote 0.
 *
 * Ejerce cada edge sobre DOS arboles (un commit ANTES de migrarla y el arbol de
 * trabajo AHORA) y diffea el cuerpo exacto de la request. Verde = diff vacio, o
 * diff que SOLO agrega cache_control. Cualquier otra cosa es rojo: la migracion
 * movio un prompt, un modelo o un max_tokens, que es justo lo que el lote 0
 * prometio no tocar.
 *
 *   node scripts/verify-ia-discriminador.mjs <sha-antes> [edge ...]
 *
 * Corre aislado en un temp FUERA del repo (deno adentro muta package.json).
 */
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const EDGES = ['extract-vacuna', 'extract-documento', 'estructurar-nota-clinica', 'escribir-presencia']
const shaAntes = process.argv[2]
const pedidas = process.argv.slice(3).filter((a) => !a.startsWith('-'))
const objetivo = pedidas.length ? pedidas : EDGES

if (!shaAntes) {
  console.error('Uso: node scripts/verify-ia-discriminador.mjs <sha-antes> [edge ...]')
  process.exit(2)
}

const PKG = 'package.json'
const huella = () => (existsSync(PKG) ? createHash('sha256').update(readFileSync(PKG)).digest('hex') : null)
const antesPkg = huella()

try { execSync('deno --version', { stdio: 'pipe' }) } catch {
  console.error('\nNO CONCLUYENTE verify:ia-discriminador — `deno` no esta instalado.\n')
  process.exit(2)
}

/** Copia un arbol de functions (de un sha, o del working tree) y captura. */
function capturar(etiqueta, desdeSha, edge, base) {
  const dir = join(base, etiqueta)
  mkdirSync(dir, { recursive: true })
  if (desdeSha) {
    execSync(`git archive ${desdeSha} supabase/functions | tar -x -C ${dir}`, { stdio: 'pipe' })
    cpSync(join(dir, 'supabase/functions'), join(dir, 'functions'), { recursive: true })
  } else {
    cpSync('supabase/functions', join(dir, 'functions'), { recursive: true })
  }
  mkdirSync(join(dir, 'functions', '_captura'), { recursive: true })
  cpSync('scripts/ia/capturar-cuerpo.ts', join(dir, 'functions', '_captura', 'capturar.ts'))
  writeFileSync(join(dir, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))
  const salida = join(dir, `${edge}.json`)
  execFileSync('deno', [
    'run', '--allow-env', '--allow-net', '--allow-read', '--allow-write',
    'functions/_captura/capturar.ts', edge, salida,
  ], { cwd: dir, stdio: 'inherit' })
  return salida
}

let rojos = 0
const base = mkdtempSync(join(tmpdir(), 'epp-disc-'))
try {
  for (const edge of objetivo) {
    console.log(`\n== ${edge} ==`)
    const a = capturar(`antes-${edge}`, shaAntes, edge, base)
    const d = capturar(`despues-${edge}`, null, edge, base)
    const diff = spawnSync('diff', ['-u', a, d], { encoding: 'utf8' })
    if (diff.status === 0) {
      console.log('  DIFF VACIO — el cuerpo es byte a byte el mismo.')
      continue
    }
    const lineas = diff.stdout.split('\n').filter((l) => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'))
    const soloCache = lineas.every((l) => /cache_control|ephemeral|"system"|"type": "text"|"text":|^[+-]\s*[[\]{}],?$/.test(l))
    console.log(diff.stdout)
    if (soloCache) {
      console.log('  DIFF SOLO DE cache_control — permitido por el mandato.')
    } else {
      console.log('  ROJO: el diff toca algo que NO es cache_control.')
      rojos++
    }
  }
} finally {
  rmSync(base, { recursive: true, force: true })
}

if (huella() !== antesPkg) {
  console.error('\nROJO — algo MUTO package.json. El aislamiento fallo.\n')
  process.exit(2)
}
console.log(`\n${rojos === 0 ? 'OK' : 'ROJO'} discriminador — ${rojos} edge(s) con diff fuera de contrato.\n`)
process.exit(rojos === 0 ? 0 : 1)
