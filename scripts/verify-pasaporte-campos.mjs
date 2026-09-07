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
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

/* Un instrumento tiene que poder decir «no»: cualquier argumento que no entienda
   corta en 2 en vez de correr midiendo otra cosa. */
exigirArgumentos(['--control'], 0);

const FIRMADOS = process.env.PASAPORTE_CAMPOS ?? 'docs/loop/PASAPORTE-CAMPOS-FIRMADOS.json';
/* ⚠️ El default era `pasaporte_publico` y esa RPC NUNCA existió: la real es
   `leer_pasaporte(p_token text)` (medida en pg_proc por A, 6-sep). El gate
   quedaba en NO CONCLUYENTE — honesto, pero sin medir nada. E ya lo había
   dejado parametrizable; esto sólo corrige el nombre por defecto.
   *Un gate atado a un nombre mide la convención, no el hecho.* */
const RPC = process.env.PASAPORTE_RPC ?? 'leer_pasaporte';
const di = (s) => console.log(s);

/** Las claves que la RPC declara devolver, leídas de su firma en la base. */
export function camposDeLaRpc(nombre) {
  /* ☠️ ANTES SE LEÍA EL TEXTO DE LA FUNCIÓN CON UN REGEX, Y INFLABA.
     `'([a-z0-9_]+)'\s*,` agarra **cualquier literal seguido de coma**: devolvía
     **23 campos** —con `public`, `minute`, `limite`, `dosis`— donde el objeto
     devuelve **11**. Metía el nombre del esquema, unidades de intervalo y las
     claves de los objetos ANIDADOS. *Un gate de privacidad que infla la lista
     es tan inútil como uno que la achica: no mide la superficie, mide su código.*
     Ahora se le PREGUNTA a la RPC con un token vivo y se leen sus claves de
     primer nivel. Sin token, **NO CONCLUYENTE** — no se inventa una lista. */
  const q = `select (select string_agg(k, ',' order by k)
                     from jsonb_object_keys(public.${nombre}(p.token)) k) as campos
             from pasaporte p where p.revocado_en is null limit 1`;
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) {
    const err = `${r.stdout}${r.stderr}`;
    if (/does not exist|no existe/i.test(err)) return { existe: false, motivo: `la RPC \`${nombre}\` no existe` };
    return { existe: false, motivo: 'no pude consultar la base' };
  }
  let j;
  try { j = JSON.parse(r.stdout.slice(i)); } catch { return { existe: false, motivo: 'respuesta ilegible' }; }
  /* 🔴 EL ERROR VIENE EN JSON Y `indexOf('{')` LO ENCUENTRA IGUAL. Sin esta rama,
     `rows` quedaba `undefined` y el gate reportaba «no hay pasaporte vivo» sobre
     una RPC que **no existe**: control en verde **por el motivo equivocado**. */
  const err = j?.error?.message ?? j?.message ?? '';
  if (err) {
    if (/does not exist|no existe|42883/i.test(err)) return { existe: false, motivo: `la RPC \`${nombre}\` no existe` };
    return { existe: false, motivo: `la base rechazó la consulta: ${String(err).slice(0, 90)}` };
  }
  const filas = j.rows;
  if (!filas?.length) return { existe: false, motivo: 'no hay ningún pasaporte vivo con el que preguntarle a la RPC' };
  const campos = (filas[0].campos ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!campos.length) return { existe: false, motivo: 'la RPC no devolvió claves' };
  return { existe: true, forma: 'claves REALES del objeto', campos };
}

/* Corre sólo si lo invocan a él: importarlo para reusar su juez no puede
   disparar el gate ni su `process.exit()`. Ya me pasó tres veces. */
const ESTE = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
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
if (ESTE) {
if (!rpc.existe) {
  di(`⚠️ NO CONCLUYENTE — ${rpc.motivo}.`);
  di('   La superficie del pasaporte todavía no existe. El gate queda escrito y');
  di('   se pone en verde/rojo el día que la RPC y la lista firmada existan.');
  di('   NO es verde: «no hay campos de más» y «no hay nada que mirar» son');
  di('   distintos, y confundirlos es cómo un gate deja de mirarse.');
  process.exit(2);
}
/* ☠️ ANTES SE QUEDABA EN ROJO ESPERANDO UNA FIRMA, Y ASÍ NO MEDÍA NADA.
   La firma decide si los campos de HOY están bien — eso es del founder y sigue
   pendiente. Pero **hay una pregunta que no necesita firma y es la que se pierde
   mientras se espera: ¿apareció un campo nuevo?** *Un gate detenido hasta que
   alguien firme no protege el día que alguien agregue una columna al `select`.*
   Sin lista firmada, el gate cae a una **LÍNEA BASE medida**, que:
     · se siembra en la primera corrida y lo DICE;
     · detecta cambios desde entonces y los nombra;
     · **no autoriza nada** — su salida repite que nadie firmó. */
const BASE = process.env.PASAPORTE_BASE ?? '.pasaporte-linea-base.json';
let firmados;
let modo;
if (existsSync(FIRMADOS)) {
  firmados = JSON.parse(readFileSync(FIRMADOS, 'utf8')).campos ?? [];
  modo = 'FIRMADA';
} else if (existsSync(BASE)) {
  const b = JSON.parse(readFileSync(BASE, 'utf8'));
  firmados = b.campos ?? [];
  modo = `LÍNEA BASE del ${b.medida_el} — SIN FIRMA`;
} else {
  writeFileSync(BASE, JSON.stringify({
    _que_es: 'Línea base MEDIDA, no firmada. No autoriza estos campos: sólo permite ver si mañana hay uno más.',
    _la_firma_sigue_pendiente: FIRMADOS,
    medida_el: new Date().toISOString().slice(0, 10),
    rpc: RPC, campos: rpc.campos,
  }, null, 2) + '\n');
  di(`⚠️ SEMBRÉ LA LÍNEA BASE con los ${rpc.campos.length} campos que la RPC devuelve HOY (${BASE}).`);
  di('   **Esto NO es una firma y no autoriza ningún campo** — la lista firmada sigue faltando');
  di(`   en ${FIRMADOS}, y es del founder. Lo que esta línea base sí hace, desde ahora:`);
  di('   **decir si aparece un campo nuevo en una página sin sesión.** Esa pregunta no');
  di('   necesitaba firma, y mientras el gate la esperaba no se estaba haciendo.');
  di(`\n   campos medidos: ${rpc.campos.join(', ')}`);
  process.exit(0);
}
const deMas = rpc.campos.filter((c) => !firmados.includes(c));
di(`verify:pasaporte-campos · RPC \`${RPC}\` (${rpc.forma}) · ${rpc.campos.length} campos · contra ${modo}`);
if (deMas.length) {
  di(`\n🔴 ${deMas.length} campo(s) NUEVO(S) salen en una página sin sesión:`);
  for (const c of deMas) di(`   ${c}`);
  process.exit(1);
}
di(`✅ ningún campo fuera de la lista.`);
if (modo !== 'FIRMADA') {
  di('   ⚠️ Esto dice «no cambió desde que lo medí», NO «estos campos están bien».');
  di(`   La firma de los ${rpc.campos.length} campos sigue pendiente y es del founder.`);
}

}
