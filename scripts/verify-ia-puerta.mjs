/**
 * GATE · LA PUERTA ÚNICA DE LA IA (`_shared/ia`) — S113-D, lote 0.
 *
 * Corre `scripts/ia/prueba-llamar-modelo.ts` con un proveedor FALSO: prueba el
 * camino feliz y **produce cada rojo a propósito** (500 con reintentos, 4xx sin
 * reintento, JSON roto, truncado, rechazo, timeout), y comprueba que cada uno
 * escribe su fila en `ia_uso` con los tokens del `usage` real.
 *
 * ── ⚠️ EL AISLAMIENTO NO ES OPCIONAL (mismo motivo que `verify-edge-deno`) ──
 * `deno` dentro del monorepo **muta el `package.json`** (le escribe una clave
 * `workspaces` leyendo el `pnpm-workspace.yaml` vecino). Por eso todo corre
 * sobre una COPIA en un temp FUERA del repo. El repo no se toca.
 *
 * ── ⚠️ SIN `deno` NO DA VERDE ──
 * Sale NO CONCLUYENTE en rojo, jamás verde (L-197 · L-333).
 *
 *   node scripts/verify-ia-puerta.mjs
 */
import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const PKG = 'package.json'
const huella = () => (existsSync(PKG) ? createHash('sha256').update(readFileSync(PKG)).digest('hex') : null)
const antes = huella()

try {
  execSync('deno --version', { stdio: 'pipe' })
} catch {
  console.error('\nNO CONCLUYENTE verify:ia-puerta — `deno` no está instalado.')
  console.error('  Un gate que se saltea en silencio cuando le falta su herramienta')
  console.error('  es peor que no tenerlo. Instalá deno y volvé a correr.\n')
  process.exit(2)
}

const base = mkdtempSync(join(tmpdir(), 'epp-ia-'))
let codigo = 1
try {
  cpSync('supabase/functions', join(base, 'functions'), { recursive: true })
  mkdirSync(join(base, 'functions', '_prueba-ia'), { recursive: true })
  // El arnés se copia DENTRO de functions/ para que su `../_shared/ia/mod.ts`
  // resuelva igual que resuelve desde una edge real.
  cpSync('scripts/ia/prueba-llamar-modelo.ts', join(base, 'functions', '_prueba-ia', 'prueba.ts'))
  writeFileSync(join(base, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }))

  execFileSync('deno', ['run', '--allow-env', '--allow-net', '--allow-read', 'functions/_prueba-ia/prueba.ts'], {
    cwd: base,
    stdio: 'inherit',
  })
  codigo = 0
} catch {
  codigo = 1
} finally {
  rmSync(base, { recursive: true, force: true })
}

if (huella() !== antes) {
  console.error('\nROJO verify:ia-puerta — algo MUTÓ package.json. El aislamiento falló.\n')
  process.exit(2)
}
process.exit(codigo)
