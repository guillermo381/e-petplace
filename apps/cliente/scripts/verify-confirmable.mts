/**
 * ⭐ **LA REGLA DEL BLOQUEANTE, PROBADA DONDE SÍ SE PUEDE** (S113-C · 1.1.2).
 *
 * El estado que el founder vio —filas sin fecha— **no se puede producir desde
 * la UI**: la extracción no las devuelve con los carnets de prueba y la Hoja de
 * edición exige fecha. Así que la regla se prueba en su función pura, con sus
 * dos rojos y su verde.
 *
 * 🔴 Su primera obligación es **dar rojo**: si `faltaParaConfirmar` devolviera
 * siempre `null`, el bloqueante volvería y este gate lo aprobaría.
 */
import { faltaParaConfirmar } from '../src/lib/carnet/confirmable.ts';

const casos: Array<[string, boolean]> = [
  ['sin fecha ⇒ no se puede confirmar', faltaParaConfirmar({ nombre: 'Rabia', fecha_aplicada: null }) === 'fecha'],
  ['fecha vacía cuenta igual que ausente', faltaParaConfirmar({ nombre: 'Rabia', fecha_aplicada: '  ' }) === 'fecha'],
  ['sin nombre ⇒ falta el nombre PRIMERO', faltaParaConfirmar({ nombre: null, fecha_aplicada: null }) === 'nombre'],
  ['nombre en blanco cuenta como ausente', faltaParaConfirmar({ nombre: '   ', fecha_aplicada: '2026-01-01' }) === 'nombre'],
  ['completa ⇒ se puede confirmar', faltaParaConfirmar({ nombre: 'Rabia', fecha_aplicada: '2026-01-01' }) === null],
];

let fallos = 0;
for (const [nombre, ok] of casos) {
  if (ok) console.log(`  ok · ${nombre}`);
  else {
    fallos += 1;
    console.log(`ROJO · ${nombre}`);
  }
}
console.log(fallos === 0 ? `VERDE · ${casos.length} casos, 0 fallos.` : `ROJO · ${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
