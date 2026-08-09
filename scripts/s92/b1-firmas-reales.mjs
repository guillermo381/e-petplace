/**
 * S92-A · los nombres REALES, medidos — porque adivinarlos produjo dos rojos
 * falsos en el verde de la tanda 1 (un parámetro y una tabla inventados).
 */
import { sql, linea } from './lib-s92.mjs';

const fns = await sql(
  `SELECT p.proname, pg_get_function_arguments(p.oid) AS args
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('test_marca_nombre','test_marca_metadata','mi_email')
   ORDER BY 1`,
  'firmas',
);
linea('\nFIRMAS REALES:');
for (const f of fns) linea(`  ${f.proname}(${f.args})`);

const tablas = await sql(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' AND table_name ILIKE '%famili%' ORDER BY 1`,
  'tablas-familia',
);
linea('\nTABLAS DE FAMILIA:');
for (const t of tablas) linea(`  ${t.table_name}`);

const cols = await sql(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='familia_miembro' ORDER BY ordinal_position`,
  'cols-familia',
).catch(() => []);
if (cols.length) {
  linea('\nCOLUMNAS de familia_miembro:');
  linea('  ' + cols.map((c) => c.column_name).join(', '));
}
linea('');
