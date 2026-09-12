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
 * QUÉ MIDE, y es lo que su verde puede sostener:
 *   ① que la pieza NO tenga una rama que decida montar el selector por el monto;
 *   ② que las seis superficies de cobro monten la sección sin condicionarla al
 *      tope (la condición legítima es que el tope se haya LEÍDO, y el total
 *      exista — no su valor).
 *
 * ⚠️ Lo que su verde NO dice: que el selector se vea bien, ni que el motor
 * respete la elección. Eso es del aparato y del motor.
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

/* ① la pieza: ninguna comparación del total contra el tope que decida montar. */
const pieza = leer(PIEZA);
leidos++;
const COMPARA = /total\s*[<>]=?\s*tope|tope\s*[<>]=?\s*total|sobreElTope|bajoElTope/g;
for (const m of pieza.matchAll(COMPARA)) {
  const linea = pieza.slice(0, m.index).split('\n').length;
  fallos.push(
    `${PIEZA}:${linea} · compara el total con el tope (\`${m[0]}\`). La firma dice que ` +
    `el monto NUNCA decide si se pregunta — sólo si «Consumidor final» está disponible, ` +
    `y eso lo resuelve SelectorFacturacion con el número que se le pasa.`,
  );
}

/* ② las superficies: el montaje no se condiciona al VALOR del tope. */
for (const ruta of SUPERFICIES) {
  const src = leer(ruta);
  leidos++;
  if (!src.includes('<SeccionFacturacion')) {
    fallos.push(`${ruta} · NO monta SeccionFacturacion. Las seis superficies de cobro la llevan.`);
    continue;
  }
  for (const m of src.matchAll(COMPARA)) {
    const linea = src.slice(0, m.index).split('\n').length;
    fallos.push(`${ruta}:${linea} · condiciona por el monto (\`${m[0]}\`).`);
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
