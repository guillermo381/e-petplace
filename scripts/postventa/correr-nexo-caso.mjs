/**
 * Runner de `nexo-caso-E.mts`. Su único trabajo es que la medición NO corra
 * dentro del monorepo.
 *
 * 🔴 POR QUÉ EXISTE: `deno`, corrido dentro del repo, ESCRIBE una clave
 * `workspaces` en `package.json` — medido acá el 7-sep-2026, con el archivo
 * mutado y restaurado a mano. *Un arnés que corrompe el repo cada vez que corre
 * es peor que no tener arnés*, y pedirle a quien lo use que se acuerde de
 * copiarlo a mano es la clase de precondición que vive en un comentario y se
 * cumple mientras alguien la lea.
 *
 * Además deja `nodeModulesDir: auto` en el temp: pnpm y deno no comparten la
 * forma de `node_modules`, así que deno resuelve las suyas afuera.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const RAIZ = new URL('../..', import.meta.url).pathname
const huella = () => createHash('sha256').update(readFileSync(join(RAIZ, 'package.json'))).digest('hex')
const antes = huella()

/* Un temp ESTABLE, no uno nuevo por corrida: con `mkdtemp` deno reinstalaba
   supabase-js y sus ocho dependencias en cada llamada. Sigue estando fuera del
   repo, que es lo único que importa para no ensuciarlo. */
const temp = join(tmpdir(), 'epp-nexo-caso')
mkdirSync(temp, { recursive: true })
try {
  cpSync(join(RAIZ, 'supabase/functions'), join(temp, 'functions'), { recursive: true })
  cpSync(join(RAIZ, 'scripts/postventa/nexo-caso-E.mts'), join(temp, 'medir.mts'))
  cpSync(join(RAIZ, 'scripts/nexo/ataques-clinicos-E.json'), join(temp, 'banco.json'))
  writeFileSync(join(temp, 'deno.json'), JSON.stringify({ nodeModulesDir: 'auto' }, null, 2))

  execFileSync('deno', [
    'run', '--allow-read', '--allow-env', '--allow-net', '--allow-run=security',
    '--allow-write', 'medir.mts', ...process.argv.slice(2),
  ], { cwd: temp, stdio: 'inherit', env: { ...process.env, EPP_FN: './functions', EPP_BANCO: './banco.json' } })
} finally {
  // El temp NO se borra: su `node_modules` es lo que hace que la segunda
  // corrida no vuelva a instalar nueve paquetes. Vive en el tmp del sistema.
  if (huella() !== antes) {
    console.error('\n🔴 `package.json` del repo cambió durante la corrida. Revisalo antes de commitear.')
    process.exit(1)
  }
}
