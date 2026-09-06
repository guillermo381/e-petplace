#!/usr/bin/env node
/**
 * censo-anonimo — S113-E, sublote 1.3 · QUÉ VE HOY ALGUIEN SIN SESIÓN.
 *
 * ── POR QUÉ NO ALCANZA CONTAR GRANTS ──────────────────────────────────────
 * `anon` tiene grant de SELECT sobre 226 tablas. **Eso no es acceso**: la RLS
 * decide las filas, y una tabla con grant y sin policy permisiva devuelve cero.
 * Al revés también: una policy `{public}` sin grant no alcanza nada. *Contar
 * grants da candidatos; el veredicto sale de PREGUNTAR como anónimo.*
 *
 * Este censo pide **una fila** de cada tabla con la `anon` —que es pública y
 * viaja en cada bundle— y anota qué devuelve. Sólo lectura, cero escritura.
 *
 * ⚠️ Y no imprime NINGÚN dato: sólo cuántas filas y qué columnas. *Un censo de
 * exposición que copia lo expuesto a un archivo es el mismo problema con otro
 * nombre.*
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REF = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const URL_BASE = `https://${REF}.supabase.co`;
const di = (s) => console.log(s);

/** La `anon`: pública por diseño, leída del repo (D-1013). */
function claveAnon() {
  const f = 'scripts/seg2/d713-cron.mjs';
  const m = readFileSync(f, 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (!m) throw new Error(`no encontré la anon en ${f}. PARA.`);
  const rol = JSON.parse(Buffer.from(m[0].split('.')[1], 'base64url').toString('utf8')).role;
  if (rol !== 'anon') throw new Error(`role=${rol}, no anon. PARA.`);
  return m[0];
}

const sql = `select distinct table_name from information_schema.role_table_grants
             where table_schema='public' and grantee='anon' and privilege_type='SELECT' order by table_name`;
const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 1 << 24 });
const tablas = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'))).rows.map((x) => x.table_name);
const anon = claveAnon();
di(`censo anónimo · ${tablas.length} tablas con grant de SELECT para anon\n`);

const abiertas = [], vacias = [], negadas = [], raras = [];
for (const t of tablas) {
  const res = await fetch(`${URL_BASE}/rest/v1/${encodeURIComponent(t)}?select=*&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  if (res.status === 200) {
    const j = await res.json();
    // Se guardan los NOMBRES de columna, jamás los valores.
    if (Array.isArray(j) && j.length) abiertas.push({ tabla: t, columnas: Object.keys(j[0]) });
    else vacias.push(t);
  } else if (res.status === 401 || res.status === 403) negadas.push(t);
  else raras.push({ tabla: t, status: res.status });
}

mkdirSync('.censo', { recursive: true });
const salida = {
  generado_el: new Date().toISOString(),
  advertencia: 'Se registran NOMBRES de columna, nunca valores. Un censo de exposición que copia lo expuesto es el mismo problema con otro nombre.',
  n_con_grant: tablas.length,
  n_devuelven_filas: abiertas.length,
  n_vacias_o_sin_policy: vacias.length,
  n_negadas: negadas.length,
  abiertas, negadas, raras,
};
writeFileSync('.censo/anonimo.json', JSON.stringify(salida, null, 2));

di(`  🔴 DEVUELVEN FILAS a un anónimo:  ${abiertas.length}`);
for (const a of abiertas) di(`       ${a.tabla.padEnd(38)} ${a.columnas.length} columnas`);
di(`\n  ·  con grant pero SIN filas (RLS cierra o tabla vacía): ${vacias.length}`);
di(`  ·  negadas (401/403):                                   ${negadas.length}`);
if (raras.length) di(`  ·  otros códigos: ${raras.map((x) => `${x.tabla}=${x.status}`).join(', ')}`);
di(`\n  → .censo/anonimo.json`);
