#!/usr/bin/env node
/**
 * S112-B · EL ABANICO NO NACE CON UNA SOLA CLASE.
 *
 * El rojo que nombró el founder tiene DOS mitades y esta gate cubre la que el
 * compilador no puede ver. La otra —que nadie pueda forzarlo desde afuera— la
 * prueba la ausencia de la prop `abierto`, y se verificó con control en rojo.
 *
 * Importa la función REAL: si reimplementara la regla, mediría su propio eco.
 * Salidas: 0 verde · 1 un caso falló · 2 no pude medir.
 */
import { clasesVivas, hayAbanico } from '../packages/ui/src/components/pendientes-vivos.ts'

const di = (s) => process.stdout.write(s + '\n')

/* AUTO-PRUEBA (L-459): si no distingue su rojo, no cuenta un verde.
   Preguntas que cualquier implementación sana contesta igual — no comparten
   supuesto con la que se está midiendo. */
if (typeof hayAbanico !== 'function' || typeof clasesVivas !== 'function') {
  di('ROJO · las funciones no son alcanzables — no pude medir.'); process.exit(2)
}
if (clasesVivas([]).length !== 0) { di('ROJO · auto-prueba: vacío no da vacío.'); process.exit(2) }
if (clasesVivas([{ cuenta: 1 }]).length !== 1) { di('ROJO · auto-prueba: pierde una clase viva.'); process.exit(2) }

const C = (n) => ({ clase: 'carrito', cuenta: n })
const M = (n) => ({ clase: 'mensajes', cuenta: n })
/* S112 · la tercera clase (refugio). El umbral es «dos o más», no «dos». */
const S = (n) => ({ clase: 'solicitudes', cuenta: n })

const casos = [
  ['nada',                        [],              false, 0],
  ['sólo carrito',                [C(3)],          false, 1],
  ['sólo mensajes',               [M(2)],          false, 1],
  ['🔴 carrito + mensajes en 0',  [C(3), M(0)],    false, 1],
  ['🔴 las dos en 0',             [C(0), M(0)],    false, 0],
  ['las dos con algo',            [C(3), M(2)],    true,  2],
  ['negativo no cuenta',          [C(3), M(-1)],   false, 1],
  ['refugio: mensajes + solicitudes', [M(2), S(4)], true,  2],
  ['🔴 refugio sin nada por revisar',  [M(2), S(0)], false, 1],
  ['tres clases: el abanico crece',   [C(1), M(2), S(3)], true, 3],
]

let fallo = 0
for (const [nombre, entrada, esperaAbanico, esperaVivas] of casos) {
  const a = hayAbanico(entrada), v = clasesVivas(entrada).length
  const ok = a === esperaAbanico && v === esperaVivas
  if (!ok) fallo++
  di(`${ok ? '✓' : '✗'} ${nombre} · abanico=${a} (esperado ${esperaAbanico}) · vivas=${v} (esperado ${esperaVivas})`)
}
di(fallo === 0 ? `\n✓ verify:abanico VERDE — ${casos.length}/${casos.length}` : `\n✗ ${fallo} caso(s) fallaron.`)
process.exit(fallo === 0 ? 0 : 1)
