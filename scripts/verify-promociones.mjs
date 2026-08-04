#!/usr/bin/env node
/**
 * LAS CONDICIONES DE PROMOCIÓN SE CUENTAN SOLAS, O NO SON CONDICIONES
 * (S86 — D-645, firma de mesa).
 *
 * QUÉ LO PARIÓ, y es el caso entero: el HOY del prestador declaraba en
 * un comentario *"su día en `packages/i18n` llega con el TERCER
 * consumidor"*. **La letra estaba bien escrita, era exacta, y para
 * cuando alguien la cobró había SEIS sitios con la misma llamada.**
 *
 *   > **Una condición de promoción que vive en un comentario de UNA de
 *   > las copias solo la lee quien ya está mirando esa copia** — es
 *   > decir, la persona que ya decidió no promoverla. *No es una
 *   > condición: es una intención.*
 *
 * Y su modo de falla es EL SILENCIO (L-192): nadie recibe un rojo
 * cuando nace la cuarta copia. El typecheck la aprueba —es código
 * correcto—, el lint no la ve —no viola ninguna regla de estilo— y la
 * pantalla funciona. **Solo se descubre cuando alguien la busca.**
 *
 * POR QUÉ ES RATCHET Y NO UMBRAL DURO, declarado: al escribir este
 * guard el umbral YA estaba pasado —9 ocurrencias vivas—, y migrar las
 * seis pantallas restantes en la misma tanda habría metido un refactor
 * grande adentro de una sesión con una regresión abierta en el HOY.
 * **Un guard que nace rojo se apaga el mismo día.** El ratchet hace lo
 * único honesto: congela la deuda medida, DEJA VER lo que falta, y
 * pone rojo si CRECE. Baja el número, baja el baseline; nunca al revés.
 *
 * Exit 0 = ninguna promoción declarada creció.
 * Exit 1 = alguna creció (o el baseline quedó viejo hacia arriba).
 * Exit 2 = no pudo medir (L-197: sin dato no se opina).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Cada fila es una PIEZA YA PROMOVIDA con su patrón crudo. El baseline
 * es lo que quedaba SIN migrar el día que se promovió — con nombre y
 * apellido, para que nadie tenga que adivinar qué falta.
 */
const PROMOCIONES = [
  {
    id: 'diaSemanaCorto',
    casa: 'packages/i18n/src/fechas.ts',
    ley: 'D-645 · la condición decía "TERCER consumidor" y se cobró con SEIS',
    // El patrón crudo que la pieza reemplaza.
    patron: /weekday:\s*['"]short['"]/g,
    raices: ['apps/prestador/src', 'apps/cliente/src'],
    baseline: 9,
    pendientes: [
      'apps/prestador/src/app/(tabs)/index.tsx — el HOY (NO se tocó: tenía una regresión abierta y un refactor ahí confunde el diagnóstico)',
      'apps/cliente/src/app/(tabs)/explorar/{veterinaria,grooming,adiestramiento,paseo}/index.tsx — las cuatro tiras del CUÁNDO (apps/cliente sin dueño declarado en S86)',
    ],
  },
];

function* fuentes(dir) {
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entradas) {
    if (e === 'node_modules' || e === '.git' || e === 'dist') continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* fuentes(p);
    else if (/\.(ts|tsx)$/.test(e)) yield p;
  }
}

let rojo = false;

for (const p of PROMOCIONES) {
  let n = 0;
  const sitios = [];
  let vistos = 0;
  for (const raiz of p.raices) {
    for (const f of fuentes(join(RAIZ, raiz))) {
      vistos++;
      const src = readFileSync(f, 'utf8');
      const m = src.match(p.patron);
      if (m) {
        n += m.length;
        sitios.push(`${f.slice(RAIZ.length + 1)} (${m.length})`);
      }
    }
  }

  // L-197: cero archivos leídos NO es "todo limpio" — es no pude medir.
  if (vistos === 0) {
    console.error(`✗ ${p.id}: CERO archivos leídos en ${p.raices.join(', ')}. No es verde: es que no sé.`);
    process.exit(2);
  }

  const estado = n > p.baseline ? '🔴 CRECIÓ' : n < p.baseline ? '🟢 BAJÓ' : '·  igual';
  console.log(`${estado}  ${p.id} — ${n} ocurrencia(s) crudas · baseline ${p.baseline}`);
  console.log(`        casa: ${p.casa}`);
  console.log(`        ${p.ley}`);
  for (const s of sitios) console.log(`        · ${s}`);

  if (n > p.baseline) {
    rojo = true;
    console.error(`        ✗ NACIÓ UNA COPIA NUEVA de algo que YA está promovido.`);
    console.error(`          La pieza existe en ${p.casa}: se importa, no se re-escribe.`);
  } else if (n < p.baseline) {
    console.log(`        ⚠️  BAJÓ: actualizá \`baseline\` a ${n} en este archivo — el ratchet solo sirve si se aprieta.`);
  }
  if (p.pendientes.length) {
    console.log('        PENDIENTES declarados (no son rojo, son deuda VISIBLE):');
    for (const d of p.pendientes) console.log(`          - ${d}`);
  }
}

if (rojo) {
  console.error('\n✗ verify-promociones EN ROJO.');
  process.exit(1);
}
console.log('\n✓ verify-promociones VERDE — ninguna promoción declarada creció.');
