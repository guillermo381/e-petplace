/**
 * S92-A · B2 — DISCRIMINADOR de las 12 policies del titular.
 *
 * El primer discriminador revocó `estado` y probó las de vitrina. Éstas
 * dependían de OTRA columna: `user_id`. Se repite el experimento con la columna
 * que les corresponde — porque «probé una y ando bien» es justamente el verde
 * sobre el lugar equivocado que L-211 prohíbe.
 *
 * Todo dentro de transacción con ROLLBACK.
 */
import { sql, linea } from './lib-s92.mjs';

const PRUEBA = `
BEGIN;
CREATE TEMP TABLE r(k text, v text) ON COMMIT DROP;

REVOKE SELECT (user_id) ON public.prestadores FROM authenticated;

DO $$
DECLARE n int;
BEGIN
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.bonos' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('a_migrada_bonos', 'PASA · ' || n || ' filas');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('a_migrada_bonos', 'ROMPE · ' || left(SQLERRM, 80));
  END;

  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.suscripciones_servicio' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('b_migrada_suscripciones', 'PASA · ' || n || ' filas');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('b_migrada_suscripciones', 'ROMPE · ' || left(SQLERRM, 80));
  END;

  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.prestador_fotos' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('c_migrada_fotos', 'PASA · ' || n || ' filas');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('c_migrada_fotos', 'ROMPE · ' || left(SQLERRM, 80));
  END;

  EXECUTE 'SET LOCAL ROLE authenticated';
  -- CONTROL: una policy COMPUESTA que NO se migró y sigue con el predicado crudo.
  -- Tiene que ROMPER: es la prueba de que el REVOKE hizo efecto y de que la
  -- diferencia la hace el helper, no el azar.
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.prestador_atencion_log' INTO n;
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('d_control_sin_migrar', 'PASA ⚠️ · ' || n || ' filas (no discrimina)');
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    INSERT INTO r VALUES ('d_control_sin_migrar', 'ROMPE ✅ esperado · ' || left(SQLERRM, 70));
  END;
END $$;

SELECT k, v FROM r ORDER BY k;
ROLLBACK;`;

const filas = await sql(PRUEBA, 'b2-discr-titular');

linea('\n══ DISCRIMINADOR · las 12 del titular (se revoca `user_id`) ══\n');
for (const f of filas) linea(`   ${f.k.padEnd(26)} ${f.v}`);

const migradas = filas.filter((f) => /^[abc]_/.test(f.k));
const control = filas.find((f) => f.k.startsWith('d_'));
linea(
  migradas.every((m) => m.v.startsWith('PASA')) && control?.v.startsWith('ROMPE')
    ? '\n  ✅ Las migradas sobreviven al revoke de `user_id`; la NO migrada rompe.\n     El contraste prueba que la diferencia la hace el helper.\n'
    : '\n  ⚠️ Leer arriba: algún brazo no hizo lo esperado.\n',
);

const resto = await sql(
  `SELECT count(*)::int AS n FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores' AND column_name='user_id'
     AND grantee='authenticated' AND privilege_type='SELECT'`,
  'b2-residuo2',
);
linea(`  residuo tras ROLLBACK — grant SELECT(user_id) a authenticated: ${resto[0].n} (esperado 1)\n`);
