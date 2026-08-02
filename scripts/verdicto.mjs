#!/usr/bin/env node
/**
 * verdicto — EL ÉXITO DEJA DE SER SILENCIOSO (S84-B8 ①).
 *
 * EL PROBLEMA QUE RESUELVE, y no es el que parecía. Dos pistas leyeron
 * `$?` después de un pipe el mismo día y las dos reportaron un EXIT=0
 * falso. La lectura obvia era "cuidado con los pipes" — L-191 ya lo
 * decía y no alcanzó. La causa raíz está un piso más abajo: **`tsc` no
 * dice NADA cuando pasa** (medido: 0 bytes, exit 0). Con salida vacía,
 * "pasó" y "lo truncó el `head`" SE VEN IGUAL, y el segundo se cita
 * después como verificación.
 *
 * Es L-192 al revés: no un fallo silencioso, sino un ÉXITO silencioso.
 * Y contra eso una regla no sirve — el constructo vive en shell efímero
 * que no deja artefacto en el repo (medido: CERO `$?` en shell
 * commiteado, cero `.sh`; el hook usa `|| {}` en todas sus
 * verificaciones). Una regla de lint ahí solo podría dispararse contra
 * su propio fixture, que es la regla decorativa que L-192 prohíbe.
 *
 * LA CURA ES DE FORMA, NO DE MEMORIA: que el verdicto SE IMPRIMA. Una
 * línea impresa sobrevive a cualquier pipe, a cualquier `head`, y a
 * cualquiera que la copie a un reporte. Si no aparece la línea, no hubo
 * verificación — y eso sí se ve.
 *
 *   node scripts/verdicto.mjs                 → los tres tsc + el lint
 *   node scripts/verdicto.mjs packages/ui     → solo ese tsc
 *
 * El exit code SIGUE siendo correcto (1 si algo falló): esto no
 * reemplaza al hook, que es el gate real y corre los comandos él mismo.
 * Esto arregla el REPORTE, que es lo que viaja al acta.
 */

import { execSync } from 'node:child_process'

const PAQUETES = ['packages/ui', 'apps/cliente', 'apps/prestador']
const pedidos = process.argv.slice(2)
const objetivo = pedidos.length > 0 ? pedidos : PAQUETES

let fallos = 0
const linea = (ok, que, detalle) => {
  console.log(`${ok ? '✓' : '✗'} ${que.padEnd(24)} ${detalle}`)
  if (!ok) fallos++
}

for (const p of objetivo) {
  try {
    execSync('npx tsc --noEmit', { cwd: p, stdio: 'pipe' })
    linea(true, `tsc ${p}`, '0 errores')
  } catch (e) {
    const salida = `${e.stdout ?? ''}${e.stderr ?? ''}`
    const n = salida.split('\n').filter((l) => l.includes('error TS')).length
    linea(false, `tsc ${p}`, `${n} error(es) — corré el tsc para verlos`)
  }
}

if (pedidos.length === 0) {
  try {
    execSync('node scripts/verify-diseno.mjs', { stdio: 'pipe' })
    linea(true, 'verify:diseno', 'VERDE')
  } catch {
    linea(false, 'verify:diseno', 'EN ROJO — corré el lint para ver cuáles')
  }
}

console.log(fallos === 0 ? '\nVERDICTO: TODO VERDE' : `\nVERDICTO: ${fallos} EN ROJO`)
process.exit(fallos === 0 ? 0 : 1)
