/**
 * S92-A · B2 — EL DISCRIMINADOR DE D-700: ¿el helper de verdad DESATA la policy
 * de los grants de columna?
 *
 * Todo lo anterior prueba que la migración no rompió nada. Eso es necesario y
 * **no alcanza**: una policy reescrita que siguiera atada a los grants sería un
 * cambio cosmético con acta de cura. La pregunta que decide si D-700 se pagó es
 * otra: *si mañana alguien revoca `estado` de `prestadores`, ¿la vitrina
 * sobrevive?*
 *
 * Se contesta produciendo el incidente de S91 EN CHIQUITO y adentro de una
 * transacción que hace ROLLBACK:
 *   ① REVOKE del grant de columna
 *   ② se evalúa la policy como `authenticated` (SET LOCAL ROLE, regla 68)
 *   ③ ROLLBACK — nada persiste
 *
 * Contra la policy VIEJA (predicado crudo) eso daba 42501. Contra la nueva
 * tiene que seguir devolviendo filas. Ese contraste ES el pago de la deuda.
 *
 * Corre: node scripts/s92/b2-discriminador.mjs
 */

import { sql, linea } from './lib-s92.mjs';

/**
 * Se prueba con `prestador_zonas` (policy YA migrada) y, en el mismo run, con
 * una policy de control que sigue con el predicado crudo — para que el verde no
 * se pueda leer como «acá nada se rompe nunca».
 */
const PRUEBA = `
BEGIN;
CREATE TEMP TABLE r(k text, v text) ON COMMIT DROP;

-- (1) el incidente de S91, en chiquito: se le quita a authenticated la columna
--     de la que el predicado VIEJO dependia.
REVOKE SELECT (estado) ON public.prestadores FROM authenticated;

DO $$
DECLARE n int;
BEGIN
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- (a) POLICY MIGRADA — usa prestador_activo(): NO deberia depender de estado
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.prestador_zonas' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('a_migrada_zonas', 'PASA · devolvió ' || n || ' filas');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('a_migrada_zonas', 'ROMPE · ' || left(SQLERRM, 90));
  END;

  EXECUTE 'SET LOCAL ROLE authenticated';
  -- (b) OTRA MIGRADA — prestador_servicios
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.prestador_servicios' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('b_migrada_servicios', 'PASA · devolvió ' || n || ' filas');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('b_migrada_servicios', 'ROMPE · ' || left(SQLERRM, 90));
  END;

  EXECUTE 'SET LOCAL ROLE authenticated';
  -- (c) CONTROL — una lectura que SÍ toca la columna revocada. Tiene que romper:
  --     si esto pasara, el REVOKE no habría hecho efecto y (a) y (b) no probarían nada.
  BEGIN
    EXECUTE 'SELECT count(*) FROM (SELECT estado FROM public.prestadores LIMIT 1) z' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('c_control_columna', 'PASA ⚠️ (el REVOKE no hizo efecto: la prueba no vale)');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('c_control_columna', 'ROMPE ✅ esperado · ' || left(SQLERRM, 70));
  END;
END $$;

SELECT k, v FROM r ORDER BY k;
ROLLBACK;`;

const filas = await sql(PRUEBA, 'b2-discriminador');

linea('\n══ B2 · DISCRIMINADOR DE D-700 — ¿el helper desata la policy del grant? ══\n');
linea('  Se revoca SELECT(estado) sobre `prestadores` y se evalúan las policies.');
linea('  Todo dentro de una transacción con ROLLBACK: residuo 0 por construcción.\n');
for (const f of filas) linea(`   ${f.k.padEnd(22)} ${f.v}`);

const migradas = filas.filter((f) => f.k.startsWith('a_') || f.k.startsWith('b_'));
const control = filas.find((f) => f.k.startsWith('c_'));
const ok = migradas.every((m) => m.v.startsWith('PASA')) && control?.v.startsWith('ROMPE');

linea(
  ok
    ? '\n  ✅ D-700 PAGADA EN SU PUNTO EXACTO: la columna se revocó de verdad (el control rompió)\n     y las policies migradas siguieron respondiendo. Ya no dependen de los grants.\n'
    : '\n  🔴 El discriminador no cierra: revisar arriba cuál brazo no hizo lo suyo.\n',
);

// y el residuo, medido y no supuesto
const resto = await sql(
  `SELECT count(*)::int AS n FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores' AND column_name='estado'
     AND grantee='authenticated' AND privilege_type='SELECT'`,
  'b2-residuo',
);
linea(`  residuo tras el ROLLBACK — grant SELECT(estado) a authenticated: ${resto[0].n} (esperado 1)\n`);
