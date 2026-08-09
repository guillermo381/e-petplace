/**
 * S92-A · B5 — QUÉ CUELGA DE UNA MASCOTA, medido del catálogo.
 * Se pregunta al catálogo por TODAS las FK que apuntan a `mascotas`, con su
 * ON DELETE. Así el orden de borrado sale de la estructura y no de mi memoria
 * (que en esta sesión ya falló cinco veces con nombres de columna).
 */
import { sql, linea } from './lib-s92.mjs';

const fks = await sql(
  `SELECT c.conrelid::regclass::text AS tabla,
          a.attname AS columna,
          CASE c.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
               WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
   FROM pg_constraint c
   JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
   WHERE c.contype='f' AND c.confrelid = 'public.mascotas'::regclass
   ORDER BY 3, 1`,
  'b5-fk-mascotas',
);

linea(`\n══ FKs que apuntan a `+'`mascotas`'+`: ${fks.length} ══\n`);
const porAccion = {};
for (const f of fks) (porAccion[f.on_delete] ??= []).push(`${f.tabla}.${f.columna}`);
for (const [a, ts] of Object.entries(porAccion)) {
  linea(`  ON DELETE ${a}  (${ts.length})`);
  for (const t of ts) linea(`     · ${t}`);
}

const bloquean = (porAccion['RESTRICT'] ?? []).concat(porAccion['NO ACTION'] ?? []);
linea(`\n  ⚠️ las que BLOQUEAN el borrado (RESTRICT / NO ACTION): ${bloquean.length}`);
linea('     esas son las que hay que vaciar antes, en ese orden.\n');
