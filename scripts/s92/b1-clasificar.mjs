/**
 * S92-A · B1 — CLASIFICAR LAS 59 DEFINER ALCANZABLES POR anon/PUBLIC (D-701).
 *
 * Una fila por función con su EVIDENCIA DE CONSUMO, para poder etiquetarla:
 *   (a) pública a propósito · (b) de autenticado · (c) interna · (d) sin consumidor
 *
 * NO decide: MIDE. La etiqueta la pone el reporte, mirando estas columnas.
 * En particular, la columna `policies` es la que evita el incidente: si una
 * POLICY llama a la función, revocarle EXECUTE a un rol rompe la policy para
 * ese rol — y el síntoma aparece lejos (L-215).
 *
 * Todo el catálogo en UNA consulta, y todo el código en UN git grep: 59 × 5
 * consultas por CLI serían quince minutos de espera para el mismo dato.
 *
 * Corre: node scripts/s92/b1-clasificar.mjs
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { sql, guardar, RAIZ, SALIDA, linea } from './lib-s92.mjs';
import { join } from 'node:path';

const ejecutar = promisify(execFile);

const definer = JSON.parse(readFileSync(join(SALIDA, 'b0-definer.json'), 'utf8'));
// el nombre pelado, sin firma ni comillas de identificador con ñ
const nombres = [...new Set(definer.map((d) => d.funcion.replace(/\(.*$/, '').replace(/"/g, '')))];

// ── EL CATÁLOGO, en una sola pasada ─────────────────────────────────────────
const lista = nombres.map((n) => `'${n}'`).join(',');

const CONSULTA = `
WITH objetivo AS (SELECT unnest(ARRAY[${lista}]) AS nombre)
SELECT o.nombre,
       -- ¿la llama una POLICY? revocarle EXECUTE al rol ROMPE la policy
       (SELECT count(*) FROM pg_policies pp
         WHERE pp.qual ILIKE '%'||o.nombre||'%' OR pp.with_check ILIKE '%'||o.nombre||'%')::int AS n_policies,
       -- ¿es cuerpo de un TRIGGER?
       (SELECT count(*) FROM pg_trigger t JOIN pg_proc p2 ON p2.oid=t.tgfoid
         WHERE p2.proname=o.nombre AND NOT t.tgisinternal)::int AS n_triggers,
       -- ¿la llama otra función?
       (SELECT count(*) FROM pg_proc p3 JOIN pg_namespace n3 ON n3.oid=p3.pronamespace
         WHERE n3.nspname='public' AND p3.proname <> o.nombre
           AND p3.prosrc ILIKE '%'||o.nombre||'%')::int AS n_llamadores,
       -- ¿está en una vista?
       (SELECT count(*) FROM pg_views v WHERE v.schemaname='public'
          AND v.definition ILIKE '%'||o.nombre||'%')::int AS n_vistas
FROM objetivo o
ORDER BY o.nombre`;

const catalogo = await sql(CONSULTA, 'b1-catalogo');
const porNombre = Object.fromEntries(catalogo.map((c) => [c.nombre, c]));

// ── EL CÓDIGO, en un solo git grep ──────────────────────────────────────────
// `git grep` y no `rg`: rg mutila la línea cuando el término aparece en ella
// (medido S90-B), y git grep acota al árbol versionado, que es lo que se pregunta.
async function grepTodos() {
  const args = ['grep', '-c', '-E', nombres.join('|'), '--', 'packages/api/src', 'apps'];
  try {
    const { stdout } = await ejecutar('git', args, { cwd: RAIZ, maxBuffer: 32 * 1024 * 1024 });
    return stdout;
  } catch {
    return '';
  }
}
await grepTodos();

/** Consumo por función, distinguiendo el TIPO generado del código de verdad. */
async function usosDe(nombre) {
  try {
    const { stdout } = await ejecutar(
      'git',
      ['grep', '-n', '--', nombre, 'packages/api/src', 'apps', 'supabase/functions'],
      { cwd: RAIZ, maxBuffer: 32 * 1024 * 1024 },
    );
    const lineas = stdout.split('\n').filter(Boolean);
    return {
      // database.types.ts es GENERADO: aparecer ahí no es tener consumidor
      real: lineas.filter((l) => !l.includes('database.types.ts')).length,
      soloTipos: lineas.filter((l) => l.includes('database.types.ts')).length,
      muestra: lineas.filter((l) => !l.includes('database.types.ts')).slice(0, 3),
    };
  } catch {
    return { real: 0, soloTipos: 0, muestra: [] };
  }
}

const filas = [];
for (const d of definer) {
  const nombre = d.funcion.replace(/\(.*$/, '').replace(/"/g, '');
  const uso = await usosDe(nombre);
  const cat = porNombre[nombre] ?? { n_policies: 0, n_triggers: 0, n_llamadores: 0, n_vistas: 0 };
  filas.push({
    firma: d.funcion,
    nombre,
    anon: d.tiene_anon,
    publicRol: d.tiene_public,
    search_path_mutable: d.search_path_mutable,
    policies: cat.n_policies,
    triggers: cat.n_triggers,
    llamadores: cat.n_llamadores,
    vistas: cat.n_vistas,
    usoReal: uso.real,
    usoTipos: uso.soloTipos,
    muestra: uso.muestra,
  });
}

guardar('b1-clasificacion.json', filas);

linea('\n══ B1 · LAS 59 DEFINER CON anon/PUBLIC — evidencia de consumo ══\n');
linea('  pol=policies que la llaman · trg=triggers · fn=otras funciones · vis=vistas');
linea('  cod=usos en código REAL (database.types.ts excluido: es generado)');
linea('  sp!=search_path mutable\n');
linea('  ' + 'función'.padEnd(52) + 'pol trg  fn vis  cod  sp!');
linea('  ' + '─'.repeat(78));
for (const f of filas) {
  const marca = f.search_path_mutable ? ' ⚠️' : '';
  linea(
    '  ' +
      f.nombre.slice(0, 51).padEnd(52) +
      String(f.policies).padStart(3) +
      String(f.triggers).padStart(4) +
      String(f.llamadores).padStart(4) +
      String(f.vistas).padStart(4) +
      String(f.usoReal).padStart(5) +
      marca,
  );
}

const sinConsumidor = filas.filter(
  (f) => f.usoReal === 0 && f.policies === 0 && f.triggers === 0 && f.llamadores === 0 && f.vistas === 0,
);
linea(`\n  ── SIN NINGÚN CONSUMIDOR HALLADO: ${sinConsumidor.length} ──`);
for (const f of sinConsumidor) linea(`     · ${f.nombre}`);
linea('\n  (la clase del oráculo: nadie la llama, nadie la busca, y está abierta)\n');
