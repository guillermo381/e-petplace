/**
 * EL CONTROL DE LA VALIDACIÓN DE CORREO (S115-B).
 *
 * 🔴 **Su caso fundante es REAL y tiene fecha: `karina charry@gmail.com`**, que
 * en S105 entró con un espacio y murió veinte minutos después en una cola que
 * nadie leía. Ese caso es el primer positivo de abajo, y **si algún día deja de
 * dar rojo, el defecto volvió**.
 *
 * Mide el ARCHIVO REAL, no una copia del regex.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
let fuente
try {
  fuente = readFileSync(join(raiz, 'packages/ui/src/components/correo.ts'), 'utf8')
} catch {
  console.error('✗ ANCLA ROTA — no encontré `correo.ts`. Un cero acá diría «no medí».')
  process.exit(2)
}
const js = fuente.replace(/: string\b/g, '').replace(/: boolean\b/g, '').replace(/^export type[\s\S]*?$/gm, '')
const { esCorreoValido } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

let fallos = 0, corridas = 0
const decir = (ok, que) => { corridas += 1; if (!ok) { fallos += 1; console.error(`  ✗ ${que}`) } }

console.log('① 🔴 EL CASO REAL DE S105 — el que entró y no debía')
decir(!esCorreoValido('karina charry@gmail.com'), 'ACEPTÓ «karina charry@gmail.com» — el espacio volvió a pasar')

console.log('② ESPACIOS, en todas sus formas')
for (const t of ['a b@c.com', 'a@b c.com', ' a@b.com', 'a@b.com ', 'a@b.com\t', 'a\n@b.com']) {
  decir(!esCorreoValido(t), `aceptó «${JSON.stringify(t)}» — tiene espacio`)
}

console.log('③ FORMA MÍNIMA — lo que debe rechazar')
for (const t of ['', '@', 'a@', '@b.com', 'a@b', 'a@b.', 'a@.b', 'a@b..c', 'sin-arroba.com', 'a@@b.com']) {
  decir(!esCorreoValido(t), `aceptó «${t}»`)
}

console.log('④ LOS QUE SÍ DEBEN PASAR — un validador que rechaza todo también «rechaza el espacio»')
for (const t of ['karina@gmail.com', 'a@b.co', 'nombre.apellido@sub.dominio.com',
                 'con+etiqueta@gmail.com', 'guillo381@gmail.com', 'facturacion@shyris.ec']) {
  decir(esCorreoValido(t), `RECHAZÓ «${t}», que es válido`)
}

console.log()
if (fallos > 0) { console.error(`verify:correo — ROJO · ${fallos} de ${corridas}`); process.exit(1) }
console.log(`verify:correo — VERDE · ${corridas} comprobaciones sobre el archivo REAL`)
console.log('   su verde dice «tiene forma de correo y no tiene espacios», JAMÁS «el buzón existe» — eso sólo lo prueba un envío que no rebota.')
