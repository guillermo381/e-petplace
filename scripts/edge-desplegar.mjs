#!/usr/bin/env node
/**
 * edge:desplegar — despliega una edge Y DEJA CONSTANCIA de qué desplegó.
 *
 * 🔴 EXISTE PORQUE `supabase functions deploy` no deja rastro comparable: la
 *    plataforma guarda SU hash de bundle, que no se puede reproducir acá. Sin
 *    constancia propia, «¿la que corre es la del repo?» sólo se puede contestar
 *    con un proxy de fechas — y el proxy tiene un falso positivo estructural,
 *    porque en esta casa el orden normal es desplegar, verificar y commitear.
 *
 * Uso:  node scripts/edge-desplegar.mjs fiscal-emitir [otra ...]
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { firmaDeEdge } from './lib-edge-firma.mjs';

const RAIZ = resolve(new URL('..', import.meta.url).pathname);
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (!slugs.length) { console.error('uso: node scripts/edge-desplegar.mjs <slug> [slug ...]'); process.exit(2); }

const sh = (c, a, o = {}) => execFileSync(c, a, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore','pipe','pipe'], ...o });

let head = null, limpio = null;
try {
  head = sh('git', ['rev-parse', 'HEAD']).trim();
  limpio = sh('git', ['status', '--porcelain']).trim() === '';
} catch { /* sin git: se registra null y se ve */ }

const sql = [];
for (const slug of slugs) {
  const f = firmaDeEdge(RAIZ, slug);
  if (!f) { console.error(`✗ ${slug}: no existe supabase/functions/${slug}/index.ts`); process.exit(2); }

  console.log(`\n→ ${slug} · ${f.archivos} archivos · firma ${f.firma.slice(0, 12)}…`);
  if (limpio === false) {
    /* No se frena: a veces hay que desplegar para verificar antes de commitear.
       Lo que NO puede pasar es que después nadie sepa que fue así. */
    console.log('  ⚠️  árbol SUCIO: la firma es real pero no corresponde a ningún commit.');
  }
  sh('npx', ['supabase', 'functions', 'deploy', slug, '--use-api'], { stdio: ['ignore','inherit','inherit'] });

  sql.push(`insert into public.edge_despliegues (slug, firma, archivos, git_head, arbol_limpio, desplegado_por)
 values ('${slug}', '${f.firma}', ${f.archivos}, ${head ? `'${head}'` : 'null'}, ${limpio === null ? 'null' : limpio}, 'edge-desplegar.mjs')
 on conflict (slug) do update set firma=excluded.firma, archivos=excluded.archivos,
   git_head=excluded.git_head, arbol_limpio=excluded.arbol_limpio,
   desplegado_por=excluded.desplegado_por, desplegado_en=now();`);
}

import { writeFileSync } from 'node:fs';
const tmp = `/tmp/edge-firma-${Date.now()}.sql`;
writeFileSync(tmp, sql.join('\n'));
sh('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', tmp]);
console.log(`\n✓ ${slugs.length} desplegada(s) y registrada(s). \`pnpm verify:edge-desplegada\` ya las puede medir exacto.`);
