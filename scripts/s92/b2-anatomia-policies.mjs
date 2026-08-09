/**
 * S92-A · B2 — LA ANATOMÍA DE LAS 37 POLICIES QUE NOMBRAN `prestadores`.
 *
 * D-700 dice que hacen `EXISTS (SELECT 1 FROM prestadores …)` DIRECTO, y que por
 * eso quedan atadas a los grants de COLUMNA de esa tabla: cualquier revoke
 * futuro las rompe todas y el síntoma aparece lejos (un titular que no abre su
 * negocio, un vet que no abre un caso).
 *
 * Antes de escribir un helper hay que saber QUÉ COLUMNAS toca cada una: un
 * helper único solo sirve si el predicado es el mismo. Si hay tres predicados
 * distintos, son tres helpers o ninguno — y eso lo dice la fuente, no la ficha.
 *
 * Corre: node scripts/s92/b2-anatomia-policies.mjs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql, guardar, SALIDA, linea } from './lib-s92.mjs';

const policies = JSON.parse(readFileSync(join(SALIDA, 'b0-policies.json'), 'utf8'));

/** Columnas de `prestadores` que aparecen en una expresión. */
const COLUMNAS = (
  await sql(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='prestadores' ORDER BY 1`,
    'b2-cols',
  )
).map((c) => c.column_name);

function columnasEn(expr) {
  if (!expr) return [];
  return COLUMNAS.filter((c) => new RegExp(`\\b${c}\\b`).test(expr));
}

/** ¿usa un helper, o toca la tabla cruda? */
function forma(expr) {
  if (!expr) return '—';
  const cruda = /from\s+prestadores/i.test(expr);
  const helper = /(user_gestiona_prestador|obtener_mi_prestador|empleado_tiene_rol|es_prestador)/i.test(expr);
  if (cruda && helper) return 'MIXTA (helper + tabla cruda)';
  if (cruda) return 'TABLA CRUDA';
  if (helper) return 'helper';
  return 'menciona sin FROM';
}

const detalle = policies.map((p) => ({
  tabla: p.tablename,
  policy: p.policyname,
  cmd: p.cmd,
  roles: p.roles,
  forma: forma(`${p.qual} ${p.with_check}`),
  columnas: [...new Set([...columnasEn(p.qual), ...columnasEn(p.with_check)])],
  qual: (p.qual || '').replace(/\s+/g, ' ').slice(0, 240),
}));

guardar('b2-anatomia.json', detalle);

const porForma = {};
for (const d of detalle) (porForma[d.forma] ??= []).push(d);

linea('\n══ B2 · ANATOMÍA DE LAS 37 POLICIES ══\n');
for (const [f, lista] of Object.entries(porForma)) {
  linea(`  ${f}: ${lista.length}`);
}

linea('\n  ── LAS QUE TOCAN LA TABLA CRUDA (las de D-700) ──');
const crudas = detalle.filter((d) => d.forma.includes('CRUDA'));
for (const d of crudas) {
  linea(`\n   · ${d.tabla}.${d.policy}  [${d.cmd}] ${d.roles}`);
  linea(`     columnas de prestadores: ${d.columnas.join(', ') || '(ninguna nombrada)'}`);
  linea(`     ${d.qual}`);
}

const frecuencia = {};
for (const d of crudas) for (const c of d.columnas) frecuencia[c] = (frecuencia[c] ?? 0) + 1;
linea('\n  ── COLUMNAS DE `prestadores` DE LAS QUE DEPENDEN ESAS POLICIES ──');
for (const [c, n] of Object.entries(frecuencia).sort((a, b) => b[1] - a[1])) {
  linea(`     ${String(n).padStart(3)} × ${c}`);
}
linea('\n     ↳ un REVOKE sobre cualquiera de estas columnas rompe las policies que la nombran,');
linea('       y el 42501 aparece en una pantalla que no la menciona. Eso es D-700 y L-215.\n');
