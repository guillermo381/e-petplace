/**
 * S92-A · B3 — ¿QUIÉN ESCRIBE LAS CUATRO TABLAS SIN RLS?
 *
 * Antes de revocar hay que saber quién las alimenta, porque la cura barata acá
 * es la peligrosa (S90 lo dejó escrito): revocar el SELECT de `cat_paises`
 * dejaría a la gente sin poder registrarse, y el typecheck no diría nada.
 *
 * Se pregunta por: triggers que las escriben, funciones que las mencionan, y
 * consumidores en el árbol versionado.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql, RAIZ, linea } from './lib-s92.mjs';

const ejecutar = promisify(execFile);
const TABLAS = ['_traza_promocion_e164', 'cat_bancos', 'cat_paises', 'cat_tipos_documento_titular', 'consentimientos', 'audit_log'];

for (const t of TABLAS) {
  linea(`\n══ ${t} ══`);

  const fns = await sql(
    `SELECT p.oid::regprocedure::text AS funcion, p.prosecdef AS definer
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosrc ILIKE '%${t}%' ORDER BY 1`,
    `qe-fn-${t}`,
  );
  const escriben = fns.filter((f) => true);
  linea(`  funciones que la mencionan: ${fns.length}${fns.length ? '' : '  ← nadie la escribe desde el motor'}`);
  for (const f of escriben.slice(0, 12)) linea(`     · ${f.funcion}${f.definer ? ' [DEFINER]' : ''}`);

  const trg = await sql(
    `SELECT c.relname AS tabla, t2.tgname AS trigger FROM pg_trigger t2
     JOIN pg_class c ON c.oid=t2.tgrelid WHERE c.relname='${t}' AND NOT t2.tgisinternal`,
    `qe-trg-${t}`,
  );
  linea(`  triggers propios: ${trg.length}`);

  try {
    const { stdout } = await ejecutar('git', ['grep', '-n', '--', t, 'packages/api/src', 'apps', 'supabase/functions'], {
      cwd: RAIZ,
      maxBuffer: 16 * 1024 * 1024,
    });
    const l = stdout.split('\n').filter(Boolean).filter((x) => !x.includes('database.types.ts'));
    linea(`  consumidores en código (sin tipos generados): ${l.length}`);
    for (const x of l.slice(0, 6)) linea(`     · ${x.slice(0, 130)}`);
  } catch {
    linea('  consumidores en código: 0');
  }
}
linea('');
