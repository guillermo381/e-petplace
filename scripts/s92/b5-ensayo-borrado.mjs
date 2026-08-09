/**
 * S92-A · B5 — ENSAYO DEL BORRADO COMPLETO, CON ROLLBACK.
 *
 * El primer intento reveló que la orden «borrar las 64 cuentas» es más grande
 * que su enunciado: borrar el usuario pone en NULL `familia.created_by_user_id`
 * y eso viola `chk_familia_creador_xor` (que exige creador-usuario XOR
 * creador-sistema). O sea que **hay que borrar el árbol de datos de sonda, no
 * solo las filas de auth** — 64 familias y 48 mascotas cuelgan de ellas.
 *
 * Antes de comprometer un borrado en cascada de ese tamaño se ENSAYA: la misma
 * secuencia exacta, dentro de una transacción que termina en ROLLBACK. Si el
 * ensayo pasa, la corrida real es la misma con COMMIT. Si falla, falla contra
 * datos que vuelven solos.
 *
 * Corre: node scripts/s92/b5-ensayo-borrado.mjs
 */
import { sql, linea } from './lib-s92.mjs';

const ENSAYO = `
BEGIN;
CREATE TEMP TABLE r(paso text, n int) ON COMMIT DROP;

DO $$
DECLARE v int;
BEGIN
  CREATE TEMP TABLE _sondas ON COMMIT DROP AS
    SELECT id FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev';
  SELECT count(*) INTO v FROM _sondas; INSERT INTO r VALUES ('0_sondas', v);

  CREATE TEMP TABLE _fams ON COMMIT DROP AS
    SELECT id FROM public.familia WHERE created_by_user_id IN (SELECT id FROM _sondas);
  SELECT count(*) INTO v FROM _fams; INSERT INTO r VALUES ('1_familias', v);

  CREATE TEMP TABLE _masc ON COMMIT DROP AS
    SELECT id FROM public.mascotas WHERE familia_id IN (SELECT id FROM _fams);
  SELECT count(*) INTO v FROM _masc; INSERT INTO r VALUES ('2_mascotas', v);

  -- el orden: lo que cuelga de la mascota, después la mascota, después la
  -- familia y sus miembros, y recién al final la cuenta de auth.
  DELETE FROM public.eventos WHERE mascota_id IN (SELECT id FROM _masc);
  GET DIAGNOSTICS v = ROW_COUNT; INSERT INTO r VALUES ('3_eventos_borrados', v);

  DELETE FROM public.mascotas WHERE id IN (SELECT id FROM _masc);
  GET DIAGNOSTICS v = ROW_COUNT; INSERT INTO r VALUES ('4_mascotas_borradas', v);

  DELETE FROM public.familia_miembro WHERE familia_id IN (SELECT id FROM _fams);
  GET DIAGNOSTICS v = ROW_COUNT; INSERT INTO r VALUES ('5_miembros_borrados', v);

  DELETE FROM public.familia WHERE id IN (SELECT id FROM _fams);
  GET DIAGNOSTICS v = ROW_COUNT; INSERT INTO r VALUES ('6_familias_borradas', v);

  DELETE FROM auth.users WHERE id IN (SELECT id FROM _sondas);
  GET DIAGNOSTICS v = ROW_COUNT; INSERT INTO r VALUES ('7_cuentas_borradas', v);

  -- el brazo que protege lo real
  SELECT count(*) INTO v FROM auth.users WHERE email NOT LIKE 's91d-%@epetplace.dev';
  INSERT INTO r VALUES ('8_no_sondas_restantes', v);
END $$;

SELECT paso, n FROM r ORDER BY paso;
ROLLBACK;`;

linea('\n══ B5 · ENSAYO DEL BORRADO (termina en ROLLBACK) ══\n');
try {
  const filas = await sql(ENSAYO, 'b5-ensayo');
  for (const f of filas) linea(`  ${f.paso.padEnd(24)} ${f.n}`);
  const noSondas = filas.find((f) => f.paso.startsWith('8_'))?.n;
  linea(
    noSondas === 150
      ? '\n  ✅ EL ENSAYO PASA de punta a punta y las 150 cuentas reales quedan intactas.\n     La corrida real es esta misma secuencia con COMMIT.\n'
      : `\n  ⚠️ las no-sondas quedaron en ${noSondas} y debían ser 150.\n`,
  );
} catch (e) {
  linea('  🔴 EL ENSAYO NO PASA — y por eso se ensaya. Motivo:\n');
  const m = String(e.sqlStderr ?? e.message);
  const err = m.match(/ERROR:[^\\]*/)?.[0] ?? m.slice(0, 400);
  linea(`     ${err}\n`);
  linea('  Nada se borró: la transacción no llegó al COMMIT.\n');
}

const sigue = await sql(
  `SELECT count(*)::int AS n FROM auth.users WHERE email LIKE 's91d-%@epetplace.dev'`,
  'b5-post-ensayo',
);
linea(`  control post-ensayo — sondas que siguen vivas: ${sigue[0].n} (esperado 64: el ensayo NO borra)\n`);
