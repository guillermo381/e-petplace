/**
 * GATE · CONTRATO DE `extract-vacuna` v2 (S113-D, lote 1.0).
 * Aislado en un temp FUERA del repo (deno adentro muta package.json, L-490).
 * Sin `deno`, NO CONCLUYENTE en rojo — jamás verde.
 *   node scripts/verify-carnet-v2.mjs
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
  console.error('\nNO CONCLUYENTE verify:carnet-v2 — `deno` no está instalado.\n'); process.exit(2)
}
const base = mkdtempSync(join(tmpdir(), 'epp-carnet-'))
let codigo = 1
try {
  cpSync('supabase/functions', join(base, 'functions'), { recursive: true })
  mkdirSync(join(base, 'functions', '_prueba-carnet'), { recursive: true })
  cpSync('scripts/ia/prueba-carnet-v2.ts', join(base, 'functions', '_prueba-carnet', 'prueba.ts'))
  cpSync('scripts/ia/fixture-carnet-real-docA.json', join(base, 'functions', '_prueba-carnet', 'fixture-carnet-real-docA.json'))
  cpSync('scripts/ia/fixture-carnet-real-docB.json', join(base, 'functions', '_prueba-carnet', 'fixture-carnet-real-docB.json'))
  writeFileSync(join(base, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))
  execFileSync('deno', ['run', '--allow-env', '--allow-net', '--allow-read', 'functions/_prueba-carnet/prueba.ts'],
    { cwd: base, stdio: 'inherit' })
  codigo = 0
} catch { codigo = 1 } finally { rmSync(base, { recursive: true, force: true }) }
if (huella() !== antes) { console.error('\nROJO — algo MUTÓ package.json.\n'); process.exit(2) }
process.exit(codigo)
