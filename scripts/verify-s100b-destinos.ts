/**
 * VERIFICA G-03 y G-10 — el destino no ofrece especies imposibles, y la
 * pregunta se hace una sola vez cuando puede.
 *
 * 🔴 EL INSTRUMENTO IMPORTA LA FUNCIÓN QUE LA PANTALLA USA. No re-escribe el
 * filtro: si mañana alguien cambia `destinosAdmitidos`, este test cambia con
 * él. *Un test que reimplementa la regla mide su propio eco.*
 *
 * Corre:  npx tsx scripts/verify-s100b-destinos.ts
 */

import {
  destinoComunDelCarrito,
  destinosAdmitidos,
  type DestinoPosible,
} from '../apps/cliente/src/lib/despensa/destinos';

let ok = 0;
let fallo = 0;

function assert(nombre: string, condicion: boolean, detalle: string) {
  if (condicion) {
    ok++;
    console.log(`  ✅ ${nombre}`);
  } else {
    fallo++;
    console.log(`  ❌ ${nombre} — ${detalle}`);
  }
}

/** La familia del gate del founder, tal cual la reportó la medición de B:
 *  Thor y Zeus (perros) · Jack (gato) · Sol (pez) · Lolo (conejo) · Flip (loro). */
const FAMILIA: DestinoPosible[] = [
  { id: 'thor', especie: 'perro' },
  { id: 'zeus', especie: 'perro' },
  { id: 'jack', especie: 'gato' },
  { id: 'sol', especie: 'pez' },
  { id: 'lolo', especie: 'conejo' },
  { id: 'flip', especie: 'loro' },
];

console.log('\n🔴 G-03 · EL CASO EXACTO DEL GATE (Pro Pac Ultimates, alimento de PERRO)');
{
  const admitidos = destinosAdmitidos(FAMILIA, ['perro']);
  const ids = admitidos.map((d) => d.id).sort();
  assert(
    'alimento de perro ofrece SOLO los dos perros',
    JSON.stringify(ids) === JSON.stringify(['thor', 'zeus']),
    `ofreció ${JSON.stringify(ids)}`,
  );
  // EL DISCRIMINADOR: sin el filtro este mismo caso devolvía SEIS. Si alguien
  // desarma la regla, esta línea es la que lo dice.
  assert(
    'NO ofrece gato, pez, conejo ni loro (el defecto del gate)',
    !admitidos.some((d) => ['jack', 'sol', 'lolo', 'flip'].includes(d.id)),
    `se coló ${JSON.stringify(admitidos.map((d) => d.id))}`,
  );
  assert(
    'el filtro DESCARTA de verdad (6 → 2), no devuelve la lista entera',
    FAMILIA.length === 6 && admitidos.length === 2,
    `esperaba 2 de 6, dio ${admitidos.length}`,
  );
}

console.log('\n🟢 SIN RESTRICCIÓN DECLARADA — `[]` es «no se declaró», jamás «ninguna»');
{
  const admitidos = destinosAdmitidos(FAMILIA, []);
  assert(
    'una cama sin especie declarada sirve para toda la casa (6 de 6)',
    admitidos.length === 6,
    `dio ${admitidos.length} — leer [] como «ninguna» vacía el selector en silencio`,
  );
}

console.log('\n🟢 MULTI-ESPECIE — un producto para perro Y gato ofrece los tres');
{
  const admitidos = destinosAdmitidos(FAMILIA, ['perro', 'gato']).map((d) => d.id).sort();
  assert(
    'ofrece Thor, Zeus y Jack',
    JSON.stringify(admitidos) === JSON.stringify(['jack', 'thor', 'zeus']),
    `dio ${JSON.stringify(admitidos)}`,
  );
}

console.log('\n🟡 LA ESPECIE QUE LA FAMILIA NO TIENE — lista vacía, y es correcta');
{
  const admitidos = destinosAdmitidos(FAMILIA, ['caballo']);
  assert(
    'comida de caballo no ofrece a nadie',
    admitidos.length === 0,
    `ofreció ${JSON.stringify(admitidos.map((d) => d.id))}`,
  );
  // Ese vacío es lo que dispara la invitación de §5.2 en la pantalla; acá solo
  // se prueba que la regla no inventa un destino para salvar el hueco.
}

console.log('\n🔴 G-10 · LA PREGUNTA ÚNICA — cuándo se puede y cuándo mentiría');
{
  const dosDePerro = destinoComunDelCarrito(FAMILIA, [['perro'], ['perro']]);
  assert(
    'dos productos de perro ⇒ UNA sola pregunta (Thor y Zeus)',
    dosDePerro !== null && dosDePerro.length === 2,
    `dio ${dosDePerro === null ? 'null' : String(dosDePerro.length)}`,
  );

  const perroYAve = destinoComunDelCarrito(FAMILIA, [['perro'], ['loro']]);
  assert(
    'comida de perro + comida de ave ⇒ NO hay pregunta común (se reparte sola)',
    perroYAve === null,
    'devolvió una lista común, y ninguna respuesta sería verdad para los dos',
  );

  const conSinRestriccion = destinoComunDelCarrito(FAMILIA, [['perro'], []]);
  assert(
    'alimento de perro + una cama sin especie ⇒ tampoco hay común (2 ≠ 6)',
    conSinRestriccion === null,
    'igualó dos conjuntos distintos',
  );

  const soloUno = destinoComunDelCarrito(FAMILIA, [['perro']]);
  assert(
    'un solo producto ⇒ pregunta única',
    soloUno !== null && soloUno.length === 2,
    'no resolvió el caso de un ítem',
  );

  const carritoVacio = destinoComunDelCarrito(FAMILIA, []);
  assert('carrito vacío ⇒ null, sin reventar', carritoVacio === null, 'no manejó el vacío');

  const familiaSinPerros = destinoComunDelCarrito(
    [{ id: 'flip', especie: 'loro' }],
    [['perro'], ['perro']],
  );
  assert(
    'dos productos de perro sin perros en casa ⇒ null (no hay a quién preguntarle)',
    familiaSinPerros === null,
    'ofreció una pregunta común sobre una lista vacía',
  );
}

console.log(`\n${fallo === 0 ? '✅ VERDE' : '🔴 ROJO'} — ${ok} verdes · ${fallo} fallos\n`);
process.exit(fallo === 0 ? 0 : 1);
