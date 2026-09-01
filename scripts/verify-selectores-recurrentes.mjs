#!/usr/bin/env node
/* S109-B · EL GATE DE `D-984` — LA ENUMERACIÓN DE SUJETOS RECURRENTES.
 *
 * 🔴 POR QUÉ ESTE GATE EXISTE Y POR QUÉ NO PUEDE VIVIR EN SQL NI EN TS SOLO:
 *    `pagos-cobro-recurrente` **nombra sus selectores uno por uno**. Un selector
 *    nuevo en la base no rompe nada: la edge simplemente **no lo llama**, y el
 *    cron devuelve `ok:true` sin haber cobrado ese sujeto.
 *    *El olvido no da síntoma — da un conjunto más chico, que se lee igual que
 *    «no había nada que cobrar».*
 *
 * 🔴 Y SE MIDIÓ EN CARNE PROPIA: `mensualidades_vencidas_pendientes` nació en
 *    S108-B2 y **la edge nunca la llamó**. El timbre de guardería postea a una
 *    edge que no conoce su selector ⇒ el día que se encienda la llave, el cron
 *    suena, la edge corre sus dos de siempre y **la mensualidad no se cobra**,
 *    sin error. La ficha `D-984` decía «disparo: antes de que nazca un sexto
 *    recurrente» — **se disparó con el TERCERO, el mismo día que se escribió.**
 *
 * El defecto cruza SQL y TS, así que el gate tiene que ver los dos lados: le
 * pregunta a la BASE qué selectores existen y al ARCHIVO cuáles consume.
 *
 *   node scripts/verify-selectores-recurrentes.mjs
 *
 * ═══ ⚠️ LO QUE SU VERDE **NO** DICE — medido ═══════════════════════════════
 * · **No prueba que los selectores FUNCIONEN.** Verifica que la edge itere el
 *   catálogo y que ninguno esté hardcodeado; jamás corre uno. *Un selector que
 *   devuelve basura pasa este gate.*
 * · **No prueba que el cron llame a la edge.** Si el reloj está apagado o su
 *   comando quedó viejo, este gate sigue verde — y el lazo no cobra a nadie.
 * · **Mide los 3 selectores VIVOS de hoy.** Si alguien agrega un recurrente y no
 *   lo registra en `selectores_recurrentes_vivos()`, el gate no lo extraña: mide
 *   contra el catálogo, y el catálogo es lo que se olvidó de actualizar.
 * · **Lee el ARCHIVO, no la edge desplegada** — un `main` curado con una versión
 *   vieja arriba sale verde acá.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/* 🔴 DOS RAÍCES, Y NO ES UN DETALLE: la primera versión leía el ARCHIVO desde
 *    el worktree principal con una ruta fija. Corriendo desde una rama, el gate
 *    evaluaba el árbol de OTRO — y dio dos verdes sobre un `main` que sí nombra
 *    los selectores, mientras la rama bajo cambio no nombraba ninguno.
 *    *Medir un árbol y llamarlo el estado del que estás cambiando es la misma
 *    familia que medir la propia rama y llamarla `main`.*
 *    ⇒ El CÓDIGO se lee del repo donde vive este script; los SECRETOS siguen
 *    saliendo del worktree principal, que es el único que los tiene. */
const AQUI = new URL('..', import.meta.url).pathname;   // el repo de este script
const SECRETOS = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const EDGE = 'supabase/functions/pagos-cobro-recurrente/index.ts';

const env = Object.fromEntries(
  readFileSync(`${SECRETOS}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const SERVICE = readFileSync(`${SECRETOS}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!env.EXPO_PUBLIC_SUPABASE_URL || !SERVICE) {
  console.error('🔴 falta un secreto — el gate NO concluye (y eso no es verde)');
  process.exit(2);
}
const db = createClient(env.EXPO_PUBLIC_SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

/* La BASE es el catálogo: no hay una segunda lista que mantener a mano.
   *Una lista escrita al lado de la verdad es la que se olvida.* */
const { data: sel, error } = await db.rpc('selectores_recurrentes_vivos');
if (error) { console.error('🔴 no pude leer los selectores:', error.message); process.exit(2); }

const fuente = readFileSync(`${AQUI}${EDGE}`, 'utf8');

/* 🔴 LA PREGUNTA CAMBIÓ PORQUE LA ARQUITECTURA CAMBIÓ, y se declara para que
 *    nadie lo lea como un gate ablandado para pasar.
 *    ANTES la edge nombraba cada selector, así que la pregunta correcta era
 *    «¿lo nombra?». AHORA los ITERA desde el catálogo, y bajo esa forma
 *    **«selector huérfano» es inexpresable**: todos se llaman, siempre.
 *    ⇒ La pregunta pasa a ser la que hoy puede fallar: **¿de verdad itera, y
 *    no quedó ninguno cableado a mano?** Un `db.rpc('<selector>')` suelto es la
 *    regresión exacta, y este gate la caza.
 *    *Un gate cuya pregunta ya no puede fallar no es estricto: es decorativo.* */
const itera = /rpc\(\s*['"`]selectores_recurrentes_vivos['"`]/.test(fuente);
const aMano = (sel ?? []).filter((s) =>
  new RegExp(`rpc\\(\\s*['"\`]${s.selector}['"\`]`).test(fuente));

console.log(`selectores recurrentes en la base: ${(sel ?? []).length}`);
for (const s of sel ?? []) console.log(`  · ${s.selector}  (sujeto: ${s.sujeto})`);
console.log(`\nitera el catálogo: ${itera ? '✓ sí' : '🔴 NO'}`);
console.log(`cableados a mano:  ${aMano.length === 0 ? '✓ ninguno' : '🔴 ' + aMano.map((x) => x.selector).join(', ')}`);

if (!itera) {
  console.error('\n🔴 La edge NO itera `selectores_recurrentes_vivos`.');
  console.error('   Con la enumeración a mano, un selector nuevo no se llama y el cron');
  console.error('   devuelve ok:true sin cobrar ese sujeto — que se lee igual que');
  console.error('   «no había nada que cobrar». Es `D-984`.');
  process.exit(1);
}
if (aMano.length) {
  console.error(`\n🔴 ${aMano.length} selector(es) cableados a mano además del catálogo.`);
  console.error('   Se van a llamar DOS veces, y el que se agregue mañana ninguna.');
  process.exit(1);
}
console.log('\n✓ el lazo itera el catálogo y ninguno quedó cableado a mano');
