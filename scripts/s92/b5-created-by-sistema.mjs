/**
 * S92-A · B5 — ¿qué acepta `familia.created_by_sistema`?
 *
 * El XOR del modelo dice: creador-usuario XOR creador-sistema. O sea que el
 * modelo YA CONTEMPLA una familia sin usuario creador, siempre que declare qué
 * sistema la creó. Esa es la vía para borrar las cuentas sin arrastrar 40
 * tablas de datos que nadie pidió borrar.
 */
import { sql, linea } from './lib-s92.mjs';

const col = await sql(
  `SELECT data_type, is_nullable FROM information_schema.columns
   WHERE table_schema='public' AND table_name='familia' AND column_name='created_by_sistema'`,
  'b5-cbs-col',
);
linea(`\n  created_by_sistema : ${col[0]?.data_type} (nullable=${col[0]?.is_nullable})`);

const chks = await sql(
  `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
   WHERE conrelid='public.familia'::regclass AND contype='c'
     AND pg_get_constraintdef(oid) ILIKE '%created_by_sistema%'`,
  'b5-cbs-chk',
);
linea('\n  CHECKs que lo mencionan:');
for (const c of chks) linea(`     ${c.conname}: ${c.def}`);

const valores = await sql(
  `SELECT created_by_sistema, count(*)::int AS n FROM public.familia
   WHERE created_by_sistema IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`,
  'b5-cbs-val',
);
linea(`\n  valores en uso hoy: ${valores.length}`);
for (const v of valores) linea(`     ${String(v.n).padStart(4)} × «${v.created_by_sistema}»`);
linea('');
