#!/usr/bin/env node
/**
 * verify:pasaporte-campos — S113-E, sublote 1.3.
 *
 * A3.5 sobre una superficie PÚBLICA: **qué NO ve nadie.** Lee lo que la RPC del
 * pasaporte devuelve de verdad y lo compara contra la lista FIRMADA por la mesa.
 * Si aparece un campo que nadie firmó, ROJO — aunque sea inofensivo. *En una
 * página sin sesión, un campo nuevo no es una mejora: es una decisión de
 * privacidad que alguien tomó sin decirlo.*
 *
 * ── EXISTE ANTES QUE LA SUPERFICIE, Y ESO ES A PROPÓSITO ──────────────────
 * Hoy **la RPC no existe** (medido: cero funciones de pasaporte en la base) y
 * **la lista firmada tampoco**. El gate NO da verde por eso: sale **2, NO
 * CONCLUYENTE**, que es distinto de «no hay campos de más». *Un gate que da
 * verde porque su objeto no existe le enseña a la casa que el silencio es
 * salud, y el día que la superficie nazca ya nadie lo mira.*
 *
 *   node scripts/verify-pasaporte-campos.mjs
 *   node scripts/verify-pasaporte-campos.mjs --control
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const FIRMADOS = process.env.PASAPORTE_CAMPOS ?? 'docs/loop/PASAPORTE-CAMPOS-FIRMADOS.json';
const RPC = process.env.PASAPORTE_RPC ?? 'leer_pasaporte';
const di = (s) => console.log(s);

/** Las claves que la RPC declara devolver, leídas de su firma en la base. */
export function camposDeLaRpc(nombre) {
  const sql = `select pg_get_function_result(p.oid) as res, pg_get_functiondef(p.oid) as def
               from pg_proc p join pg_namespace n on n.oid=p.pronamespace
               where n.nspname='public' and p.proname='${nombre}'`;
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return { existe: false, motivo: 'no pude consultar la base' };
  let filas;
  try { filas = JSON.parse(r.stdout.slice(i)).rows; } catch { return { existe: false, motivo: 'respuesta ilegible' }; }
  if (!filas?.length) return { existe: false, motivo: `la RPC \`${nombre}\` no existe` };

  const res = filas[0].res ?? '';
  // Dos formas: `TABLE(a text, b int)` o un `jsonb` cuyo cuerpo arma las claves.
  const tabla = res.match(/TABLE\(([\s\S]*)\)/i);
  if (tabla) {
    return { existe: true, forma: 'TABLE', campos: tabla[1].split(',').map((x) => x.trim().split(/\s+/)[0]).filter(Boolean) };
  }
  const def = filas[0].def ?? '';
  const claves = [...def.matchAll(/'([a-z0-9_]+)'\s*,/gi)].map((m) => m[1]);
  return { existe: true, forma: 'jsonb (claves leídas del cuerpo)', campos: [...new Set(claves)] };
}

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  const tmp = '.control-pasaporte-campos';
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });

  const comparar = (firmados, devueltos) => devueltos.filter((c) => !firmados.includes(c));

  ok(comparar(['nombre', 'especie'], ['nombre', 'especie']).length === 0,
    'NEGATIVO  lo que coincide con la lista firmada NO es hallazgo');
  const extra = comparar(['nombre', 'especie'], ['nombre', 'especie', 'direccion']);
  ok(extra.length === 1 && extra[0] === 'direccion',
    'POSITIVO  un campo NO firmado sale ROJO y se lo NOMBRA', `(${extra.join(', ')})`);
  ok(comparar(['nombre', 'apellido'], ['nombre']).length === 0,
    'CLASE     un campo firmado que la RPC NO devuelve no es un hallazgo de privacidad');

  // Y el que importa: sin RPC, NO CONCLUYENTE — nunca verde.
  const r = camposDeLaRpc('rpc_que_no_existe_s113e');
  ok(!r.existe, 'POSITIVO  con la RPC ausente el gate NO puede dar verde', `(${r.motivo})`);

  rmSync(tmp, { recursive: true, force: true });
  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ nombra el campo de más, y sin objeto sale NO CONCLUYENTE en vez de verde.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const rpc = camposDeLaRpc(RPC);
if (!rpc.existe) {
  di(`⚠️ NO CONCLUYENTE — ${rpc.motivo}.`);
  di('   La superficie del pasaporte todavía no existe. El gate queda escrito y');
  di('   se pone en verde/rojo el día que la RPC y la lista firmada existan.');
  di('   NO es verde: «no hay campos de más» y «no hay nada que mirar» son');
  di('   distintos, y confundirlos es cómo un gate deja de mirarse.');
  process.exit(2);
}
if (!existsSync(FIRMADOS)) {
  di(`🔴 la RPC \`${RPC}\` EXISTE y la lista firmada NO (${FIRMADOS}).`);
  di('   Una superficie pública sin lista de campos firmada no se puede auditar.');
  process.exit(1);
}
const firmados = JSON.parse(readFileSync(FIRMADOS, 'utf8')).campos ?? [];
const deMas = rpc.campos.filter((c) => !firmados.includes(c));
di(`verify:pasaporte-campos · RPC \`${RPC}\` (${rpc.forma}) · ${rpc.campos.length} campos · ${firmados.length} firmados`);
if (deMas.length) {
  di(`\n🔴 ${deMas.length} campo(s) que NADIE firmó salen en una página sin sesión:`);
  for (const c of deMas) di(`   ${c}`);
  process.exit(1);
}
di(`✅ ningún campo fuera de la lista firmada.`);
