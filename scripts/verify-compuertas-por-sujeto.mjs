#!/usr/bin/env node
/**
 * ═══ EL CENSO DE COMPUERTAS, DE DOS LADOS ══════════════════════════════════
 *
 * 🔴 DE DÓNDE SALE. Un cobro real (`DF-2108181`, $90) mostró que
 * `verificar_compuerta_programa` existía, funcionaba, y **`pagos-cobro` nunca le
 * preguntaba.** La plata se movió y el acto 2 se cayó con
 * `programa_excede_vigencia`.
 *
 * > **Abrir una puerta nueva obliga a cablear su COMPUERTA, no sólo su desglose
 * > y su pertenencia.**
 *
 * *Y la lección no alcanza escrita: la escribí en S108-B2 curando la mensualidad
 * y la volví a romper en S109 abriendo el programa. **El más expuesto a repetir
 * la lección es el que acaba de pagarla, porque cree que ya la sabe.***
 *
 * POR QUÉ DOS LADOS. Ninguno solo alcanza: la base sabe qué compuerta le
 * corresponde a cada sujeto y **no puede ver si alguien la llama**; el archivo
 * sabe a quién llama y **no puede saber a quién debería.** El defecto vivía
 * justo en el medio, que es donde ningún typecheck mira.
 *
 * PRUEBA DE QUE DISCRIMINA (`L-437`: «rebotó» no es una medición):
 *   · sobre `pagos-cobro` ANTERIOR a la cura → 🔴 programa sin llamador
 *   · sobre el de hoy                        → ✅ programa cableado
 * Se corre con `--archivo <ruta>` para apuntarlo a una versión vieja.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/* El ÁRBOL se lee de donde vive ESTE archivo — nunca de una raíz fija: la
   primera versión del gate hermano apuntaba al worktree primario y sus dos ✓
   eran del estado de `main`, no del propio. Los SECRETOS sí viven en el
   primario, porque no se trackean. */
const AQUI = new URL('..', import.meta.url).pathname;
const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const env = Object.fromEntries(
  readFileSync(`${SEC}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!env.EXPO_PUBLIC_SUPABASE_URL || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(2); }
const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

const i = process.argv.indexOf('--archivo');
const ruta = i > -1 ? process.argv[i + 1] : `${AQUI}supabase/functions/pagos-cobro/index.ts`;
const fuente = ruta.startsWith('git:')
  ? execSync(`git show ${ruta.slice(4)}`, { cwd: AQUI }).toString()
  : readFileSync(ruta, 'utf8');

console.log(`\n═══ CENSO DE COMPUERTAS · edge leída de: ${ruta}\n`);
/* ═══ ⚠️ LO QUE SU VERDE **NO** DICE — medido, no supuesto ══════════════════
   Un gate que no declara su frontera se lee como si midiera todo, y **su
   silencio se cobra en cada corrida**. Lo que este censo NO mira:

   · **La compuerta puede estar MAL.** Sólo verifica que exista y que la edge la
     llame — jamás si su veredicto es correcto. *Una compuerta que siempre dice
     que sí pasa este gate en verde.*
   · **Mide UNA edge: `pagos-cobro`.** `pagos-deuna-solicitud` cobra los mismos
     sujetos por el otro riel y **no está en este censo** — y ese riel nunca
     corrió (`por_deuna = 0`), así que su hueco no tiene síntoma.
   · **Mide 6 de 7 sujetos.** `recurrencia` queda fuera por `cobrable_por_checkout
     = false`: la cobra el lazo recurrente, no un checkout. Su compuerta existe y
     **este gate no verifica que el lazo la llame.**
   · **Dos sujetos declaran no tener compuerta** —`cita` y `bono`— y el gate
     ACEPTA esa declaración sin cuestionarla: *si mañana la cita necesita una, el
     gate seguiría verde.*
   · **Lee el ARCHIVO, no la edge desplegada.** Un `main` correcto con una edge
     vieja arriba sale verde acá. Lo que prueba el despliegue es leer la versión
     del objeto, y eso este gate no lo hace. */

const { data: censo, error } = await admin.rpc('verificar_censo_de_compuertas');
if (error) { console.error('🔴 el censo no respondió:', error.message); process.exit(2); }
if (!censo?.length) { console.error('🔴 el censo vino vacío'); process.exit(2); }

const fallas = [];
for (const s of censo) {
  if (!s.existe) {
    fallas.push(`${s.codigo}: declara «${s.compuerta}» y esa función NO existe`);
    console.log(`🔴 ${s.codigo.padEnd(24)} compuerta declarada inexistente`);
    continue;
  }
  if (!s.debe_llamarla) {
    console.log(`   ${s.codigo.padEnd(24)} ${s.compuerta ? 'no se cobra por checkout' : 'sin compuerta, declarado'}`);
    continue;
  }
  const llamada = fuente.includes(s.compuerta);
  if (!llamada) fallas.push(`${s.codigo}: su compuerta «${s.compuerta}» existe y la edge NO la llama`);
  console.log(`${llamada ? '✅' : '🔴'} ${s.codigo.padEnd(24)} ${s.compuerta}`);
}

if (fallas.length) {
  console.log(`\n🔴 ${fallas.length} sujeto(s) con compuerta sin llamador:`);
  for (const f of fallas) console.log(`   · ${f}`);
  console.log('\nUn freno que sólo puede actuar cuando la plata ya se movió no evita');
  console.log('vender lo que no se tiene: obliga a devolverlo.\n');
  process.exit(1);
}
console.log('\n✅ todo sujeto cobrable por checkout llama a su compuerta antes de mover plata\n');
