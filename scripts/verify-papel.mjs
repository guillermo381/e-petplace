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
  console.error('\nNO CONCLUYENTE verify:papel — `deno` no está instalado.\n'); process.exit(2)
}
const base = mkdtempSync(join(tmpdir(), 'epp-papel-parte-'))
let codigo = 1
try {
  cpSync('supabase/functions', join(base, 'functions'), { recursive: true })
  mkdirSync(join(base, 'functions', '_prueba-papel'), { recursive: true })
  cpSync('scripts/ia/prueba-papel.ts', join(base, 'functions', '_prueba-papel', 'prueba.ts'))
  /* 🔴 EL HELPER VIAJA CON EL ARNÉS. Los arneses declaran su objeto
     (`declararObjeto`) desde el lote 3, y estos runners copiaban SÓLO el
     arnés: el import moría con `Module not found` en la copia temporal.
     *Una ley que se cumple en el archivo y se rompe al correrlo no rige.* */
  cpSync('scripts/ia/declarar-objeto.ts', join(base, 'functions', '_prueba-papel', 'declarar-objeto.ts'))
  writeFileSync(join(base, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))
  execFileSync('deno', ['run', '--allow-env', '--allow-net', '--allow-read', 'functions/_prueba-papel/prueba.ts'],
    { cwd: base, stdio: 'inherit' })
  codigo = 0
} catch { codigo = 1 } finally { rmSync(base, { recursive: true, force: true }) }
if (huella() !== antes) { console.error('\nROJO — algo MUTÓ package.json.\n'); process.exit(2) }
process.exit(codigo)
