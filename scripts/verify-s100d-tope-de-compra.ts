/**
 * PUNTO 20 (S100d) · «PEDÍ 3 Y HAY 1» — el tope se decide en la puerta.
 *
 * Corre: `npx tsx scripts/verify-s100d-tope-de-compra.ts`
 *
 * 🔴 IMPORTA LA FUNCIÓN QUE LA PANTALLA USA (`decidirTope`). Si re-escribiera
 * la regla adentro mediría su propio eco.
 *
 * ⚠️ LO QUE **NO** DICE, para que nadie lea su verde de más: mide una función
 * pura. **No dice que las tres puertas la llamen** —eso lo dice leer el
 * montaje— ni que el aviso se lea bien en un teléfono. Al cerrar S100d, dos de
 * las tres puertas (vitrina y ficha) son de C y **todavía no la montan**.
 */

import { decidirTope } from '../apps/cliente/src/lib/despensa/tope-de-compra';

let ok = 0;
let fallo = 0;

function pruebo(nombre: string, real: unknown, esperado: unknown): void {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) {
    ok += 1;
    console.log(`  ✅ ${nombre}`);
  } else {
    fallo += 1;
    console.log(`  🔴 ${nombre}\n     esperado ${JSON.stringify(esperado)}\n     real     ${JSON.stringify(real)}`);
  }
}

console.log('\n── EL CASO DEL FOUNDER ──');
pruebo(
  '🔴 pedí 3 y hay 1 ⇒ acotado a 1',
  decidirTope(3, 1),
  { clase: 'acotado', cantidad: 1 },
);
pruebo('pedí 1 y hay 1 ⇒ entra', decidirTope(1, 1), { clase: 'entra', cantidad: 1 });

console.log('\n── AGOTADO vs SIN MEDIR: la distinción que Ley 13 exige ──');
pruebo('el motor dijo 0 ⇒ agotado', decidirTope(2, 0), { clase: 'agotado' });
pruebo(
  '🔴 la consulta FALLÓ (null) ⇒ sin_medir y PASA lo pedido, jamás agotado',
  decidirTope(2, null),
  { clase: 'sin_medir', cantidad: 2 },
);
pruebo(
  '🔴 un fallo de red con cantidad alta NO se convierte en agotado',
  decidirTope(50, null),
  { clase: 'sin_medir', cantidad: 50 },
);

console.log('\n── LO QUE NO SE LE HACE AL CARRITO DE LA FAMILIA ──');
pruebo(
  '🔴 el motor devuelve MÁS de lo pedido ⇒ manda lo pedido (no se sube solo)',
  decidirTope(2, 500),
  { clase: 'entra', cantidad: 2 },
);
pruebo(
  'pedir 0 no es un veredicto de stock ⇒ sin_medir',
  decidirTope(0, 0),
  { clase: 'sin_medir', cantidad: 0 },
);
pruebo(
  'pedir negativo tampoco inventa un agotado',
  decidirTope(-3, 0),
  { clase: 'sin_medir', cantidad: -3 },
);

console.log('\n── BORDES ──');
pruebo('mucho pedido, poco stock ⇒ acota al stock', decidirTope(99, 7), {
  clase: 'acotado',
  cantidad: 7,
});
pruebo('justo en el límite ⇒ entra', decidirTope(7, 7), { clase: 'entra', cantidad: 7 });

console.log(`\n${fallo === 0 ? '✅' : '🔴'} ${ok}/${ok + fallo}\n`);
process.exit(fallo === 0 ? 0 : 1);
