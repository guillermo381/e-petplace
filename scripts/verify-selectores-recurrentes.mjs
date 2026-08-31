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
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const EDGE = 'supabase/functions/pagos-cobro-recurrente/index.ts';

const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const SERVICE = readFileSync(`${RAIZ}/supabase/dev/.env.local`, 'utf8')
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

const fuente = readFileSync(`${RAIZ}/${EDGE}`, 'utf8');
const huerfanos = (sel ?? []).filter((s) => !fuente.includes(`'${s.selector}'`));

console.log(`selectores recurrentes en la base: ${(sel ?? []).length}`);
for (const s of sel ?? []) {
  const ok = fuente.includes(`'${s.selector}'`);
  console.log(`  ${ok ? '✓' : '🔴'} ${s.selector.padEnd(36)} ${ok ? 'consumido por la edge' : 'NADIE LO LLAMA'}`);
}

if (huerfanos.length) {
  console.error(`\n🔴 ${huerfanos.length} selector(es) que la base tiene y la edge NO consume.`);
  console.error('   El cron va a devolver ok:true sin cobrar ese sujeto — y eso se lee');
  console.error('   igual que «no había nada que cobrar». Cablealos en', EDGE);
  process.exit(1);
}
console.log('\n✓ todos los selectores recurrentes tienen quien los llame');
