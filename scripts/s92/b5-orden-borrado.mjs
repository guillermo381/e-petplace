/**
 * S92-A · B5 — POR QUÉ NO SE PUDO BORRAR DE UNA, Y EN QUÉ ORDEN SÍ.
 *
 * El DELETE sobre `auth.users` abortó (limpio, en transacción) con:
 *   «new row for relation "familia" violates check constraint
 *    "chk_familia_creador_xor"»
 * La FK de `familia.created_by_user_id` es ON DELETE SET NULL, y al ponerlo en
 * NULL la fila deja de cumplir un CHECK del modelo. **No es un obstáculo: es el
 * modelo defendiéndose.** Un borrado que hubiera pasado por arriba de eso
 * habría dejado familias en un estado que la casa declara imposible.
 *
 * Acá se lee la restricción y se mide qué hay que borrar antes.
 */
import { sql, linea } from './lib-s92.mjs';

const chk = await sql(
  `SELECT conname, pg_get_constraintdef(oid) AS def
   FROM pg_constraint WHERE conrelid='public.familia'::regclass AND contype='c'`,
  'b5-chk',
);
linea('\n══ EL CHECK QUE FRENÓ EL BORRADO ══\n');
for (const c of chk) linea(`  ${c.conname}\n     ${c.def}`);

const fks = await sql(
  `SELECT c.conname, c.conrelid::regclass::text AS tabla,
          pg_get_constraintdef(c.oid) AS def
   FROM pg_constraint c
   WHERE c.contype='f'
     AND c.confrelid IN ('auth.users'::regclass)
     AND c.connamespace = 'public'::regnamespace
   ORDER BY 2`,
  'b5-fks',
);
linea(`\n══ FKs de public → auth.users: ${fks.length} ══\n`);
const porAccion = { CASCADE: [], 'SET NULL': [], RESTRICT: [], 'NO ACTION': [], otros: [] };
for (const f of fks) {
  const accion = /ON DELETE CASCADE/.test(f.def)
    ? 'CASCADE'
    : /ON DELETE SET NULL/.test(f.def)
      ? 'SET NULL'
      : /ON DELETE RESTRICT/.test(f.def)
        ? 'RESTRICT'
        : 'NO ACTION';
  porAccion[accion].push(f.tabla);
}
for (const [a, ts] of Object.entries(porAccion)) {
  if (ts.length) linea(`  ON DELETE ${a}: ${ts.length}\n     ${[...new Set(ts)].join(', ')}`);
}

// qué cuelga de las familias de sonda
const dep = await sql(
  `WITH s AS (SELECT id FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev'),
        f AS (SELECT id FROM public.familia WHERE created_by_user_id IN (SELECT id FROM s))
   SELECT 'familias de sonda' AS que, (SELECT count(*)::int FROM f) AS n
   UNION ALL SELECT 'mascotas de esas familias',
     (SELECT count(*)::int FROM public.mascotas WHERE familia_id IN (SELECT id FROM f))
   UNION ALL SELECT 'miembros de esas familias',
     (SELECT count(*)::int FROM public.familia_miembro WHERE familia_id IN (SELECT id FROM f))
   UNION ALL SELECT 'eventos de esas mascotas',
     (SELECT count(*)::int FROM public.eventos WHERE mascota_id IN
        (SELECT id FROM public.mascotas WHERE familia_id IN (SELECT id FROM f)))
   ORDER BY 1`,
  'b5-dep-familias',
);
linea('\n══ QUÉ CUELGA DE LAS FAMILIAS DE SONDA ══\n');
for (const d of dep) linea(`  ${String(d.n).padStart(4)} × ${d.que}`);
linea('');
