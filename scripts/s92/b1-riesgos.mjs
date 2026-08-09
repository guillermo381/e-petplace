/**
 * S92-A · B1 — LOS DOS RIESGOS QUE PUEDEN CONVERTIR UN REVOKE EN UN INCIDENTE.
 *
 * ── RIESGO ① · UNA POLICY QUE APLICA A `anon` Y LLAMA A LA FUNCIÓN ───────────
 * `is_admin()` aparece en 239 policies. Si alguna de esas policies aplica al rol
 * `public`/`anon`, revocarle EXECUTE a `anon` NO la vuelve más segura: la
 * ROMPE, y el rebote es 42501 al EVALUAR la policy. El síntoma aparece lejos.
 * Esto es exactamente L-215, y es la razón de ser del censo previo.
 *
 * ── RIESGO ② · EL PORTAL LEGADO COMPARTE ESTA DB (regla 69) ──────────────────
 * `git grep` sobre ESTE monorepo no ve el legado. Una función «sin consumidor»
 * acá puede tenerlo allá — y varias de las 19 sin consumidor tienen olor a
 * legado (`use_beta_invite`, `validate_beta_access`, `get_country_config`,
 * `log_analytics_event`, `encontrar_prestador_emergencia`).
 *
 * Un REVOKE decidido sin estas dos mediciones es una apuesta, no una cura.
 *
 * Corre: node scripts/s92/b1-riesgos.mjs
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sql, guardar, SALIDA, linea } from './lib-s92.mjs';

const ejecutar = promisify(execFile);

const filas = JSON.parse(readFileSync(join(SALIDA, 'b1-clasificacion.json'), 'utf8'));
const nombres = [...new Set(filas.map((f) => f.nombre))];

// ─── RIESGO ① · ¿alguna policy que las llama alcanza al rol anon/public? ─────
const lista = nombres.map((n) => `'${n}'`).join(',');
const POLICIES_ANON = `
WITH objetivo AS (SELECT unnest(ARRAY[${lista}]) AS nombre)
SELECT o.nombre, pp.schemaname, pp.tablename, pp.policyname, pp.cmd, pp.roles::text AS roles
FROM objetivo o
JOIN pg_policies pp
  ON (pp.qual ILIKE '%'||o.nombre||'%' OR pp.with_check ILIKE '%'||o.nombre||'%')
WHERE pp.roles::text ILIKE '%anon%' OR pp.roles::text = '{public}'
ORDER BY o.nombre, pp.tablename, pp.policyname`;

const policiesRiesgo = await sql(POLICIES_ANON, 'b1-policies-anon');

// panorama: TODAS las policies del proyecto que alcanzan a anon/public
const TODAS_ANON = `
SELECT schemaname, tablename, policyname, cmd, roles::text AS roles
FROM pg_policies
WHERE roles::text ILIKE '%anon%' OR roles::text = '{public}'
ORDER BY tablename, policyname`;
const todasAnon = await sql(TODAS_ANON, 'b1-todas-anon');

// ─── RIESGO ② · el legado y los repos vecinos que comparten esta DB ──────────
const VECINOS = [
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-prestadores',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-admin',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-v2',
  '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-sistema-pruebas',
];

async function usoEnVecino(repo, nombre) {
  if (!existsSync(repo)) return 0;
  try {
    const { stdout } = await ejecutar('git', ['grep', '-c', '--', nombre], {
      cwd: repo,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout.split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}

const enLegado = [];
for (const n of nombres) {
  const porRepo = {};
  let total = 0;
  for (const r of VECINOS) {
    const c = await usoEnVecino(r, n);
    if (c > 0) porRepo[r.split('/').pop()] = c;
    total += c;
  }
  if (total > 0) enLegado.push({ nombre: n, porRepo, total });
}

guardar('b1-policies-riesgo.json', policiesRiesgo);
guardar('b1-uso-legado.json', enLegado);

linea('\n══ B1 · LOS DOS RIESGOS, MEDIDOS ══\n');

linea(`① POLICIES que alcanzan a anon/public Y llaman a una de las 59: ${policiesRiesgo.length}`);
if (policiesRiesgo.length === 0) {
  linea('   ✅ NINGUNA. Revocar EXECUTE a `anon` no puede romper una policy por esta vía.');
  linea('      (la pregunta que contesta: ¿hay policy evaluada como anon que dependa de estas funciones?)');
} else {
  for (const p of policiesRiesgo) linea(`   🔴 ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles} → ${p.nombre}`);
}
linea(`\n   Contexto: el proyecto tiene ${todasAnon.length} policies que alcanzan a anon/public en total.`);
for (const p of todasAnon.slice(0, 30)) linea(`      · ${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`);
if (todasAnon.length > 30) linea(`      … y ${todasAnon.length - 30} más`);

linea(`\n② USO EN LOS REPOS VECINOS que comparten esta DB (regla 69): ${enLegado.length} de ${nombres.length}`);
if (enLegado.length === 0) {
  linea('   (ninguna aparece en los repos vecinos)');
} else {
  for (const e of enLegado) {
    linea(`   · ${e.nombre.padEnd(46)} ${JSON.stringify(e.porRepo)}`);
  }
}
linea('');
