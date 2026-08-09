/**
 * S92-BIS · LIMPIEZA DE LOS FIXTURES `seg2-*`.
 *
 * El arranque lo pide explícito: «se limpian dentro de la sesión — el residuo
 * de sondas ya costó una decisión de founder en S92». Así que las cuentas que
 * esta sesión creó se van con ella.
 *
 * Mismo protocolo que S92 usó con las 64 sondas: conteo antes/después, guards
 * que abortan si el patrón atrapa un número distinto del censado, y verificación
 * de que ninguna cuenta real se toca.
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

const antes = await sql(
  `SELECT count(*)::int AS total,
          count(*) FILTER (WHERE email LIKE 'seg2-%@epetplace.dev')::int AS fixtures,
          count(*) FILTER (WHERE email NOT LIKE 'seg2-%@epetplace.dev')::int AS resto
   FROM auth.users`,
  'lf-antes',
);
linea('\n══ LIMPIEZA DE FIXTURES `seg2-*` ══\n');
linea(`  ANTES: total ${antes[0].total} · fixtures ${antes[0].fixtures} · resto ${antes[0].resto}`);

const lista = await sql(
  `SELECT email FROM auth.users WHERE email LIKE 'seg2-%@epetplace.dev' ORDER BY created_at`,
  'lf-lista',
);
for (const l of lista) linea(`     · ${l.email}`);

const SQL = `
DO $limpieza$
DECLARE v_n int; v_resto_antes int; v_resto_despues int; v_borradas int;
BEGIN
  SELECT count(*) FILTER (WHERE email LIKE 'seg2-%@epetplace.dev'),
         count(*) FILTER (WHERE email NOT LIKE 'seg2-%@epetplace.dev')
    INTO v_n, v_resto_antes FROM auth.users;

  IF v_n = 0 THEN RAISE NOTICE 'nada que limpiar'; RETURN; END IF;

  -- las familias que hayan quedado colgando, con la misma vía que S92 usó:
  -- el XOR de procedencia exige mover las dos columnas juntas
  UPDATE public.familia
     SET created_by_user_id = NULL, created_by_sistema = 'fixture_seg2_purgado'
   WHERE created_by_user_id IN (SELECT id FROM auth.users WHERE email LIKE 'seg2-%@epetplace.dev');

  UPDATE public.eventos_mascota
     SET creado_por_sistema = COALESCE(creado_por_sistema, 'fixture_seg2_purgado')
   WHERE creado_por_user_id IN (SELECT id FROM auth.users WHERE email LIKE 'seg2-%@epetplace.dev');

  DELETE FROM auth.users WHERE email LIKE 'seg2-%@epetplace.dev';
  GET DIAGNOSTICS v_borradas = ROW_COUNT;

  SELECT count(*) FILTER (WHERE email NOT LIKE 'seg2-%@epetplace.dev')
    INTO v_resto_despues FROM auth.users;

  IF v_borradas <> v_n THEN
    RAISE EXCEPTION 'GUARD: se borraron % y habia % — ABORTA', v_borradas, v_n;
  END IF;
  IF v_resto_despues <> v_resto_antes THEN
    RAISE EXCEPTION 'GUARD: las cuentas NO-fixture pasaron de % a % — ABORTA', v_resto_antes, v_resto_despues;
  END IF;
  RAISE NOTICE 'OK — % fixtures borrados · el resto intacto en %', v_borradas, v_resto_despues;
END
$limpieza$;

SELECT count(*)::int AS total,
       count(*) FILTER (WHERE email LIKE 'seg2-%@epetplace.dev')::int AS fixtures,
       count(*) FILTER (WHERE email NOT LIKE 'seg2-%@epetplace.dev')::int AS resto
FROM auth.users;`;

const despues = await sql(`BEGIN;\n${SQL}\nCOMMIT;`, 'lf-borrado');
linea(`\n  DESPUÉS: total ${despues[0].total} · fixtures ${despues[0].fixtures} · resto ${despues[0].resto}`);

const ok = despues[0].fixtures === 0 && despues[0].resto === antes[0].resto;
linea(
  ok
    ? `\n  ✅ ${antes[0].fixtures} fixtures borrados · las ${despues[0].resto} cuentas reales INTACTAS · residuo 0\n`
    : '\n  🔴 los números no cierran\n',
);
guardarSeg2('limpieza-fixtures.json', { antes: antes[0], despues: despues[0], lista: lista.map((l) => l.email) });
