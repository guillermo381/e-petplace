#!/usr/bin/env node
/**
 * S115-C · «SIEMPRE SE PREGUNTA» — el monto nunca decide si se pregunta.
 *
 * 🔴 SU CASO FUNDANTE ES REAL: el founder pagó un pedido de **$14,95** y nació
 * con consumidor final **sin que nadie le preguntara**. Medido después: no era
 * el tope, era que la despensa **no tenía la sección** (entró en `15cb044e`).
 * *Pero la firma que lo gobierna es la que puede volver a romperse:* «siempre se
 * pregunta si quiere factura con sus datos, cualquiera sea el monto — lo que
 * cambia con el tope es si "Consumidor final" está DISPONIBLE, nunca si se
 * pregunta».
 *
 * ⏪ **SU PRIMERA VERSIÓN ESTABA MAL Y SE CORRIGIÓ EL MISMO DÍA.** Prohibía
 * *cualquier* comparación del total con el tope — y marcó en rojo dos usos
 * **legítimos**: el texto que dice POR QUÉ se piden los datos arriba del tope, y
 * **el freno del cobro**, que es justo lo que el founder pidió construir.
 * *Un gate que da rojo sobre código correcto no se discute: se apaga.* La firma
 * no prohíbe comparar — prohíbe que la comparación **decida si se pregunta**.
 *
 * QUÉ MIDE AHORA:
 *   ① que ningún `return` TEMPRANO de la pieza (los que cortan antes de montar
 *      el selector) dependa del monto: el único legal es el de `perfil`;
 *   ② que las seis superficies monten la sección sin condicionarla al VALOR del
 *      tope (la condición legítima es que el tope se haya LEÍDO y que el total
 *      exista).
 *
 * ⚠️ **Lo que NO mide, declarado:** un ternario JSX que envuelva el selector
 * entero. *Se podría escribir y este gate no lo vería* — mide `return`, que es
 * como se corta de verdad en esta pieza. Su verde tampoco dice que el selector
 * se vea bien ni que el motor respete la elección.
 */
import { readFileSync } from 'node:fs';

/* 🔴 NO CONCLUYENTE ≠ ROJO. Sin el archivo, `readFileSync` lanza y node sale
   con 1 — que se lee como «el producto está mal» cuando es «no pude medir».
   *Un gate que confunde las dos manda a curar lo que no existe.* */
function leer(ruta) {
  try {
    return readFileSync(ruta, 'utf8');
  } catch {
    console.error(
      `verify:siempre-se-pregunta — NO CONCLUYENTE: no pude leer \`${ruta}\`.\n` +
      `   Se corre desde la raíz del repo. Esto NO dice que el producto esté mal.`,
    );
    process.exit(2);
  }
}

const PIEZA = 'apps/cliente/src/components/seccion-facturacion.tsx';
const SUPERFICIES = [
  'apps/cliente/src/components/checkout-reserva.tsx',
  'apps/cliente/src/app/(tabs)/despensa/checkout.tsx',
  'apps/cliente/src/app/(tabs)/explorar/paseo/checkout-paquete.tsx',
  'apps/cliente/src/app/(tabs)/explorar/paseo/checkout-plan.tsx',
  'apps/cliente/src/app/(tabs)/explorar/guarderia/checkout.tsx',
  'apps/cliente/src/app/(tabs)/explorar/adiestramiento/confirmar-programa.tsx',
];

const fallos = [];
let leidos = 0;

/* ① la pieza: ningún `return` temprano decide por el monto.
   El corte real de esta pieza son los `if (...) { ... return ... }` que hay ANTES
   del `return` que monta el selector. El único legal mira `perfil`. */
const pieza = leer(PIEZA);
leidos++;
const montaje = pieza.indexOf('<SelectorFacturacion');
if (montaje === -1) {
  fallos.push(`${PIEZA} · no monta SelectorFacturacion. Sin él no hay nada que preguntar.`);
} else {
  const antes = pieza.slice(0, montaje);
  /* Cada `if (…)` cuyo bloque contenga un `return` antes del montaje. */
  for (const m of antes.matchAll(/if\s*\(([^)]*)\)\s*\{([^}]*)\}/g)) {
    const [, condicion, cuerpo] = m;
    if (!/\breturn\b/.test(cuerpo)) continue;
    if (!/tope|total/i.test(condicion)) continue;
    const linea = antes.slice(0, m.index).split('\n').length;
    fallos.push(
      `${PIEZA}:${linea} · un \`return\` temprano decide por el MONTO (\`if (${condicion.trim()})\`). ` +
      `La firma dice que el monto NUNCA decide si se pregunta — sólo si «Consumidor final» ` +
      `está disponible, y eso lo resuelve SelectorFacturacion con el número que se le pasa.`,
    );
  }
}

/* ② las superficies: el montaje no se condiciona al VALOR del tope. */
for (const ruta of SUPERFICIES) {
  const src = leer(ruta);
  leidos++;
  if (!src.includes('<SeccionFacturacion')) {
    fallos.push(`${ruta} · NO monta SeccionFacturacion. Las seis superficies de cobro la llevan.`);
    continue;
  }
  /* La condición del montaje: legal que mire si el tope se LEYÓ y si el total
     existe; ilegal que mire su VALOR. */
  for (const m of src.matchAll(/\{facturacion\.props === null([^?]*)\?/g)) {
    if (!/[<>]/.test(m[1])) continue;
    const linea = src.slice(0, m.index).split('\n').length;
    fallos.push(`${ruta}:${linea} · el montaje compara el monto (\`${m[1].trim()}\`).`);
  }
}

/* El ancla: si el corpus se encoge, el verde deja de significar algo. */
if (leidos !== SUPERFICIES.length + 1) {
  console.error(`verify:siempre-se-pregunta — NO CONCLUYENTE: leí ${leidos} de ${SUPERFICIES.length + 1}`);
  process.exit(2);
}

if (fallos.length > 0) {
  console.error('verify:siempre-se-pregunta — ROJO\n');
  for (const f of fallos) console.error(`  · ${f}`);
  process.exit(1);
}
console.log(
  `verify:siempre-se-pregunta — VERDE · ${leidos} archivo(s) · las 6 superficies montan la sección ` +
  `y ninguna decide por el monto\n   su verde dice «el monto no decide si se pregunta», JAMÁS «el selector se ve bien».`,
);
