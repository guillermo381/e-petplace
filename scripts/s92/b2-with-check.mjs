/**
 * S92-A · B2 — los `with_check` completos de las policies de INSERT/UPDATE.
 * La anatomía anterior mostró `qual` y varias salieron vacías: en INSERT el
 * predicado vive en `with_check`. Sin verlo, un helper se diseñaría contra
 * medio conjunto.
 */
import { sql, linea, guardar } from './lib-s92.mjs';

const filas = await sql(
  `SELECT tablename, policyname, cmd,
          COALESCE(qual,'(sin qual)') AS qual,
          COALESCE(with_check,'(sin with_check)') AS with_check
   FROM pg_policies
   WHERE (qual ILIKE '%prestadores%' OR with_check ILIKE '%prestadores%')
     AND cmd IN ('INSERT','UPDATE','ALL')
   ORDER BY tablename, policyname`,
  'b2-withcheck',
);
guardar('b2-with-check.json', filas);

linea('\n══ WITH CHECK de las policies de escritura que nombran `prestadores` ══\n');
for (const f of filas) {
  linea(`· ${f.tablename}.${f.policyname} [${f.cmd}]`);
  linea(`    qual      : ${f.qual.replace(/\s+/g, ' ').slice(0, 220)}`);
  linea(`    with_check: ${f.with_check.replace(/\s+/g, ' ').slice(0, 220)}`);
  linea('');
}
