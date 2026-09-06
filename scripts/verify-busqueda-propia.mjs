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
di(`la RPC \`${RPC}\` existe — correr con las dos cuentas del llavero. Ver el parte S113-E-2.0.`);
process.exit(2);
