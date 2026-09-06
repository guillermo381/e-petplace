/**
 * GATE · la edge `coach` (S113-D, lote 2.0).
 * Aislado en un temp FUERA del repo (deno adentro muta package.json, L-490).
 * Sin `deno`, NO CONCLUYENTE en rojo — jamás verde.
 *   node scripts/verify-coach.mjs
 */
import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const PKG = 'package.json'
const huella = () => (existsSync(PKG) ? createHash('sha256').update(readFileSync(PKG)).digest('hex') : null)
const antes = huella()
try { execSync('deno --version', { stdio: 'pipe' }) } catch {
  console.error('\nNO CONCLUYENTE verify:coach-parte — `deno` no está instalado.\n'); process.exit(2)
}
const base = mkdtempSync(join(tmpdir(), 'epp-cparte-parte-'))
let codigo = 1
try {
  cpSync('supabase/functions', join(base, 'functions'), { recursive: true })
  mkdirSync(join(base, 'functions', '_prueba-coach-parte'), { recursive: true })
  cpSync('scripts/ia/prueba-coach-parte.ts', join(base, 'functions', '_prueba-coach-parte', 'prueba.ts'))
  writeFileSync(join(base, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))
  execFileSync('deno', ['run', '--allow-env', '--allow-net', '--allow-read', 'functions/_prueba-coach-parte/prueba.ts'],
    { cwd: base, stdio: 'inherit' })
  codigo = 0
} catch { codigo = 1 } finally { rmSync(base, { recursive: true, force: true }) }
if (huella() !== antes) { console.error('\nROJO — algo MUTÓ package.json.\n'); process.exit(2) }
process.exit(codigo)
