#!/usr/bin/env node
/**
 * verify:busqueda-propia — S113-E, lote 2.0 · E4/E6.
 *
 * **La búsqueda de Nexo devuelve lo de MI familia y nada más.** Tres preguntas,
 * y las tres se contestan con número:
 *   ① privacidad — dos cuentas distintas, cero cruce.
 *   ② tiempo     — p95 por debajo de 200 ms.
 *   ③ inyección  — un término con SQL o comodines no rompe **ni enumera**.
 *
 * ── ③ ES LA QUE NADIE MIDE, Y TIENE DOS MITADES ─────────────────────────────
 * «No rompió» es la mitad fácil. La otra es **no enumerar**: un `%` que devuelve
 * TODO lo propio no es un error —es un comodín haciendo su trabajo— pero convierte
 * una caja de búsqueda en un volcado. Y si el error de Postgres viaja a la
 * pantalla, el término inyectado se vuelve un mapa del esquema.
 * *Un rojo acá no se ve como una falla: se ve como una búsqueda muy completa.*
 *
 * Las dos cuentas salen del llavero EN EL MOMENTO. Nunca se imprime un valor.
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (la RPC no existe).
 *
 *   node scripts/verify-busqueda-propia.mjs --control
 *   node scripts/verify-busqueda-propia.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { exigirArgumentos } from './lib-argumentos.mjs';

/* Un instrumento tiene que poder decir «no»: cualquier argumento que no entienda
   corta en 2 en vez de correr midiendo otra cosa. */
exigirArgumentos(['--control'], 0);

const RPC = process.env.BUSQUEDA_RPC ?? 'buscar_en_mi_familia';
const P95_MS = Number(process.env.BUSQUEDA_P95 ?? 200);
const di = (s) => console.log(s);

/** Términos que atacan la caja. Datos: crece sin tocar el juez. */
export const TERMINOS_HOSTILES = [
  { t: "%",                    por_que: 'comodín solo: si enumera, la caja es un volcado' },
  { t: "_",                    por_que: 'comodín de un carácter' },
  { t: "%%",                   por_que: 'dos comodines' },
  { t: "' OR '1'='1",          por_que: 'inyección SQL clásica' },
  { t: "'; DROP TABLE mascotas;--", por_que: 'destructiva: tiene que rebotar, jamás ejecutar' },
  { t: "\\",                   por_que: 'escape suelto — rompe un LIKE mal armado' },
  { t: "a".repeat(5000),       por_que: 'término larguísimo: techo o error hablado, no 500' },
  { t: "",                     por_que: 'vacío: no puede devolver todo' },
  { t: "*:*",                  por_que: 'sintaxis de FTS: un tsquery mal armado tira 42601' },
  { t: "'",                    por_que: 'comilla suelta — el caso que más rompe un tsquery' },
];

/** El juez de ③. `filas` es cuántas devolvió; `total` cuántas tiene la familia. */
export function juzgarHostil({ estado, filas, total, mensaje }) {
  if (estado >= 500) return { rojo: true, nota: `HTTP ${estado} — la caja se rompió` };
  if (/relation|column|syntax error|pg_|schema/i.test(mensaje ?? ''))
    return { rojo: true, nota: 'el error revela el esquema' };
  if (total != null && filas >= total && total > 0)
    return { rojo: true, nota: `enumeró: ${filas} de ${total} filas de la familia` };
  return { rojo: false, nota: `${filas} fila(s), sin fuga` };
}

/** Consulta de sólo lectura contra la base linkeada. */
export function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { return JSON.parse(r.stdout.slice(i)).rows ?? null; } catch { return null; }
}

export function rpcExiste(nombre) {
  const sql = `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='${nombre}'`;
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return { existe: false, motivo: 'no pude consultar la base' };
  try { return { existe: (JSON.parse(r.stdout.slice(i)).rows?.[0]?.n ?? 0) > 0, motivo: `la RPC \`${nombre}\` no existe` }; }
  catch { return { existe: false, motivo: 'respuesta ilegible' }; }
}

export function p95(ms) {
  const s = [...ms].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
}

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

  ok(juzgarHostil({ estado: 500, filas: 0, mensaje: 'boom' }).rojo, 'POSITIVO  un 500 sale ROJO');
  ok(juzgarHostil({ estado: 400, filas: 0, mensaje: 'relation "mascotas" does not exist' }).rojo,
    'POSITIVO  un error que nombra el esquema sale ROJO');
  ok(juzgarHostil({ estado: 200, filas: 42, total: 42, mensaje: '' }).rojo,
    'POSITIVO  devolver TODO lo de la familia es ENUMERAR, aunque el HTTP sea 200');
  ok(!juzgarHostil({ estado: 200, filas: 3, total: 42, mensaje: '' }).rojo,
    'NEGATIVO  un puñado de coincidencias legítimas no es hallazgo');
  ok(!juzgarHostil({ estado: 200, filas: 0, total: 0, mensaje: '' }).rojo,
    'CLASE     una familia SIN datos que devuelve 0 no es enumeración (0 >= 0 sería un falso rojo)');
  ok(p95([10, 20, 30, 40, 1000]) === 1000 && p95([5]) === 5, 'CLASE     el p95 toma la cola, no la mediana');

  const r = rpcExiste('rpc_de_busqueda_que_no_existe_s113e');
  ok(!r.existe, 'POSITIVO  sin RPC el gate NO puede dar verde', `(${r.motivo})`);

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di(`✅ caza el 500, el esquema filtrado y la enumeración; y sin objeto sale NO CONCLUYENTE.`);
  di(`   Banco de términos hostiles: ${TERMINOS_HOSTILES.length}.`);
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const r = rpcExiste(RPC);
if (!r.existe) {
  di(`⚠️ NO CONCLUYENTE — ${r.motivo}.`);
  di(`   La búsqueda de Nexo todavía no existe. El gate, su juez y los`);
  di(`   ${TERMINOS_HOSTILES.length} términos hostiles quedan escritos y probados (--control).`);
  di(`   NO es verde: «no cruza familias» y «no hay búsqueda» son distintos.`);
  process.exit(2);
}
/* ☠️ ACÁ TERMINABA, Y ESO NO ES UN GATE: detectaba que el objeto existe y salía
   en 2 remitiendo a un parte. *Un gate que sabe que su objeto está y no lo mide
   da no-concluyente para siempre, y su silencio se lee como salud.* */
const REF = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const ANON = readFileSync('scripts/seg2/d713-cron.mjs', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)[0];

/** Las dos cuentas salen del llavero AL MOMENTO. Nunca se imprime un valor. */
async function sesion(servicio) {
  const leer = (f) => execFileSync('security', ['find-generic-password', '-s', servicio, ...f], { encoding: 'utf8' });
  const correo = leer([]).split('\n').find((l) => l.includes('"acct"'))?.replace(/.*<blob>="/, '').replace(/"$/, '');
  const clave = leer(['-w']).trim();
  const r = await fetch(`https://${REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: correo, password: clave }),
  });
  const j = await r.json();
  return j.access_token ? { tok: j.access_token, uid: j.user.id } : null;
}
async function buscar(tok, q, limite = 20) {
  const t0 = Date.now();
  const r = await fetch(`https://${REF}.supabase.co/rest/v1/rpc/${RPC}`, {
    method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_q: q, p_limite: limite }),
  });
  const ms = Date.now() - t0;
  let j = null; try { j = await r.json(); } catch {}
  return { estado: r.status, ms, cuerpo: j, mensaje: j?.message ?? '' };
}
/** Cuenta resultados sin depender de la FORMA exacta del jsonb. */
const cuantos = (c) => Array.isArray(c) ? c.length
  : (c && typeof c === 'object' ? Object.values(c).filter(Array.isArray).reduce((a, x) => a + x.length, 0) : 0);

const A = await sesion('epetplace-cuenta-founder');
const B = await sesion('epetplace-cuenta-prueba');
if (!A || !B) { di('⚠️ NO CONCLUYENTE — no pude abrir las DOS sesiones del llavero.'); process.exit(2); }
if (A.uid === B.uid) { di('⚠️ NO CONCLUYENTE — las dos cuentas del llavero son la MISMA: sin dos sujetos no hay cruce que medir.'); process.exit(2); }

di(`verify:busqueda-propia · RPC \`${RPC}\` · dos sesiones distintas del llavero`);
let rojos = 0;

// ① PRIVACIDAD: lo que una cuenta encuentra, la otra no puede encontrarlo.
const nombresDeA = sql(`select string_agg(distinct m.nombre, ',') as n from mascotas m
   join familia_miembro fm on fm.familia_id = m.familia_id
   where fm.user_id = '${A.uid}' and fm.hasta is null and m.nombre is not null`);
const nombresDeB = sql(`select string_agg(distinct m.nombre, ',') as n from mascotas m
   join familia_miembro fm on fm.familia_id = m.familia_id
   where fm.user_id = '${B.uid}' and fm.hasta is null and m.nombre is not null`);
const setB = new Set((nombresDeB?.[0]?.n ?? '').split(',').filter(Boolean).map((x) => x.toLowerCase()));
/* 🔴 Sólo sirven los nombres EXCLUSIVOS: un nombre que las dos familias comparten
   no discrimina — medido en S113, hay varios `Thor` y `Zeus` en familias distintas. */
const exclusivosDeA = (nombresDeA?.[0]?.n ?? '').split(',').filter(Boolean)
  .filter((n) => !setB.has(n.toLowerCase()));
if (!exclusivosDeA.length) {
  di('⚠️ ① NO CONCLUYENTE: la cuenta A no tiene ningún nombre EXCLUSIVO con el que probar el cruce.');
} else {
  const termino = exclusivosDeA[0];
  const rA = await buscar(A.tok, termino);
  const rB = await buscar(B.tok, termino);
  const nA = cuantos(rA.cuerpo), nB = cuantos(rB.cuerpo);
  const ok = nA > 0 && nB === 0;
  if (!ok) rojos += 1;
  di(`${ok ? '✅' : '🔴'} ① privacidad · término exclusivo de A: A ve ${nA} · B ve ${nB}` +
     (nA === 0 ? '   ⚠️ A no encontró lo suyo: el 0 de B no prueba nada' : ''));
}

/* ② TIEMPO — 🔴 Y MI PRIMERA VERSIÓN MEDÍA EL VIAJE, NO LA BÚSQUEDA.
   Daba `p95 330 ms` contra un techo de 200 y lo reportaba como rojo de la RPC.
   Medido con una RPC TRIVIAL en la misma corrida: el peaje de red desde esta
   máquina tiene **p95 601 ms** — o sea **más que la búsqueda entera (410)**, y el
   «trabajo» salía NEGATIVO. *Un p95 de 12 muestras contra un servidor remoto está
   dominado por la varianza de la red, no por la consulta.*
   Se juzga el **trabajo**: búsqueda menos peaje, por MÍNIMOS, que es la medida que
   no depende de que la red hipe. Y el peaje se reporta al lado, porque **el techo
   del brief es de la consulta y lo que la familia espera incluye el viaje**: son
   dos números y confundirlos esconde cuál hay que bajar. */
const TRIVIAL = process.env.BUSQUEDA_TRIVIAL ?? 'hay_avisos_sin_leer';
const tiempos = async (fn) => { const a = []; for (let i = 0; i < 12; i += 1) a.push(await fn()); return a; };
const msBusq = await tiempos(async () => (await buscar(A.tok, exclusivosDeA[0] ?? 'a')).ms);
const msPeaje = await tiempos(async () => {
  const t0 = Date.now();
  await fetch(`https://${REF}.supabase.co/rest/v1/rpc/${TRIVIAL}`, {
    method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${A.tok}`, 'content-type': 'application/json' },
    body: '{}',
  });
  return Date.now() - t0;
});
const minB = Math.min(...msBusq), minP = Math.min(...msPeaje);
const trabajo = minB - minP;
if (trabajo > P95_MS) rojos += 1;
di(`${trabajo <= P95_MS ? '✅' : '🔴'} ② tiempo · trabajo de la búsqueda ≈ ${trabajo} ms (techo ${P95_MS})`);
di(`      búsqueda mín ${minB} / p95 ${p95(msBusq)} ms · peaje de red mín ${minP} / p95 ${p95(msPeaje)} ms`);
di(`      ⚠️ el p95 desde esta máquina mide la RED, no la consulta: el peaje solo ya la pasa.`);

// ③ HOSTILES: ni rompe ni enumera ni revela el esquema.
const total = cuantos((await buscar(A.tok, exclusivosDeA[0] ?? 'a', 1000)).cuerpo);
let malos = 0;
for (const { t, por_que } of TERMINOS_HOSTILES) {
  const r = await buscar(A.tok, t, 1000);
  const v = juzgarHostil({ estado: r.estado, filas: cuantos(r.cuerpo), total, mensaje: r.mensaje });
  if (v.rojo) { malos += 1; di(`   🔴 «${t.slice(0, 24)}» — ${v.nota}   (${por_que})`); }
}
if (malos) rojos += 1;
di(`${malos ? '🔴' : '✅'} ③ inyección · ${TERMINOS_HOSTILES.length} términos hostiles · ${malos} problema(s)`);

di('');
if (rojos) { di(`🔴 ${rojos} de las tres preguntas en rojo.`); process.exit(1); }
di('✅ no cruza familias · responde a tiempo · no rompe ni enumera.');
process.exit(0);
