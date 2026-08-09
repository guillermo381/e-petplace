/**
 * S92-A · B1 — EL ROJO PRODUCIDO DE LAS 59. (v2 — la v1 se equivocó, ver abajo.)
 *
 * ── EL ERROR DE LA v1, DECLARADO PORQUE ES LA LECCIÓN ────────────────────────
 * La v1 llamó a las 59 con `{}` y leyó los `404 PGRST202` como «rebote de
 * NEGOCIO ⇒ el permiso pasó». **Es falso.** PGRST202 lo emite PostgREST al no
 * encontrar una firma que matchee los argumentos: **la llamada nunca llega a
 * Postgres**, así que no dice absolutamente nada sobre EXECUTE. La v1 declaró
 * «59 ABIERTAS» con 52 de esos 59 sin medir.
 *
 * Es exactamente L-211 escrita por quien vino a cazarla: *un assert se juzga
 * por la pregunta que contesta, jamás por su color.* Un rojo por razón falsa se
 * lee igual que un rojo verdadero — y si uno le cree, cura lo que no era.
 *
 * ── LO QUE MIDE LA v2 ────────────────────────────────────────────────────────
 * ① `has_function_privilege('anon', firma, 'EXECUTE')` — LA pregunta exacta de
 *    D-701, contestada por el catálogo. Es el veredicto de permiso.
 * ② Camino real CON LOS NOMBRES DE PARÁMETRO REALES (leídos de
 *    `pg_get_function_arguments`), para confirmar que PostgREST la expone y que
 *    el catálogo no miente. Acá el discriminador de S90 sí aplica:
 *      · «permission denied for function» ⇒ el gate cortó.
 *      · cualquier otro error, o 200 ⇒ el permiso PASÓ.
 *
 * ── LA SALVAGUARDA ───────────────────────────────────────────────────────────
 * Las VOLATILE (pueden mutar) y la que devenga dinero NO se invocan: su permiso
 * se lee del catálogo y se dice que es del catálogo. Un permiso medido por
 * catálogo es una respuesta honesta; un INSERT en producción para probar un
 * punto, no.
 *
 * Corre: node scripts/s92/b1-rojos.mjs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rpc, sql, guardar, SALIDA, linea } from './lib-s92.mjs';

const filas = JSON.parse(readFileSync(join(SALIDA, 'b1-clasificacion.json'), 'utf8'));

// firma + argumentos con nombre + volatilidad, todo del catálogo
const META = await sql(
  `SELECT p.oid::regprocedure::text AS firma,
          p.proname AS nombre,
          pg_get_function_arguments(p.oid) AS args,
          p.provolatile AS volatilidad,
          has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_execute,
          (p.prosrc ~* '(insert|update|delete)\\s') AS parece_mutadora
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef`,
  'b1-meta',
);
const porFirma = Object.fromEntries(META.map((m) => [m.firma, m]));

/** Un valor imposible por tipo, para que ningún cuerpo prospere. */
function valorImposible(tipo) {
  const t = tipo.toLowerCase();
  if (t.includes('uuid')) return '00000000-0000-0000-0000-000000000000';
  if (t.includes('jsonb') || t.includes('json')) return {};
  if (t.includes('[]')) return [];
  if (t.includes('int') || t.includes('numeric') || t.includes('double') || t.includes('smallint')) return 0;
  if (t.includes('bool')) return false;
  if (t.includes('date') || t.includes('timestamp')) return '1900-01-01';
  if (t.includes('time')) return '00:00:00';
  return '__s92_imposible__';
}

/** Nombres REALES de parámetro — sin esto PostgREST rebota por firma y no mide nada. */
function argsDe(m) {
  if (!m.args || !m.args.trim()) return {};
  const out = {};
  for (const parte of m.args.split(',')) {
    const trozos = parte.trim().split(/\s+/);
    if (trozos.length < 2) return null; // argumento sin nombre ⇒ no se puede llamar por PostgREST
    const nombre = trozos[0].replace(/^"|"$/g, '');
    if (['IN', 'OUT', 'INOUT', 'VARIADIC'].includes(nombre.toUpperCase())) return null;
    out[nombre] = valorImposible(trozos.slice(1).join(' '));
  }
  return out;
}

const resultados = [];
for (const f of filas) {
  const m = porFirma[f.firma];
  if (!m) {
    resultados.push({ ...f, permisoAnon: null, modo: 'no hallada en catálogo', confirmacion: '—' });
    continue;
  }
  const mutadora = m.volatilidad === 'v' && m.parece_mutadora;
  const esTrigger = f.triggers > 0;
  const args = argsDe(m);

  let confirmacion = '(no invocada)';
  let motivo = '';
  if (mutadora || esTrigger || args === null) {
    motivo = esTrigger ? 'trigger' : args === null ? 'args sin nombre' : 'VOLATILE mutadora';
  } else {
    const r = await rpc(f.nombre, args);
    const denegado = /permission denied for function/i.test(r.cuerpo);
    confirmacion = denegado
      ? `AUTH cortó (${r.status})`
      : r.status === 404 && /PGRST202/.test(r.cuerpo)
        ? 'PGRST202 — firma no resuelta, NO MIDE'
        : `PERMISO PASÓ (${r.status}) ${r.cuerpo.slice(0, 70)}`;
  }

  resultados.push({
    ...f,
    permisoAnon: m.anon_execute,
    permisoAuth: m.auth_execute,
    mutadora,
    esTrigger,
    modo: motivo ? `catálogo (${motivo})` : 'catálogo + camino real',
    confirmacion,
  });
}

guardar('b1-rojos.json', resultados);

const abiertas = resultados.filter((r) => r.permisoAnon === true);
const confirmadas = resultados.filter((r) => r.confirmacion.startsWith('PERMISO PASÓ'));

linea('\n══ B1 · ROJO PRODUCIDO (v2) — ¿tiene `anon` EXECUTE sobre las 59? ══\n');
linea(`  La pregunta que contesta: has_function_privilege('anon', f, 'EXECUTE')`);
linea(`  ABIERTAS a anon en el catálogo: ${abiertas.length} / ${resultados.length}`);
linea(`  De ésas, CONFIRMADAS por camino real (ejecutaron de verdad): ${confirmadas.length}`);
linea(`  El resto no se invocó (trigger / mutadora / args sin nombre) y se dice.\n`);

linea('  ── CONFIRMADAS POR CAMINO REAL — anon ejecutó de verdad ──');
for (const r of confirmadas) linea(`   🔴 ${r.nombre.padEnd(46)} ${r.confirmacion}`);

linea('\n  ── ABIERTAS por catálogo, NO invocadas (salvaguarda declarada) ──');
for (const r of abiertas.filter((x) => x.modo.startsWith('catálogo (')))
  linea(`   🔴 ${r.nombre.padEnd(46)} ${r.modo}`);

const sinMedir = resultados.filter((r) => r.confirmacion.includes('NO MIDE'));
if (sinMedir.length) {
  linea('\n  ── invocadas pero PGRST202 (no midió el camino; vale el catálogo) ──');
  for (const r of sinMedir) linea(`   ·  ${r.nombre.padEnd(46)} anon_execute=${r.permisoAnon}`);
}
linea('');
