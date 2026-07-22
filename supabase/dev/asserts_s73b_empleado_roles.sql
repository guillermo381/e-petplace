-- S73-B · ASSERTS post-aplicación de 20260721210000 (regla 68: SET LOCAL
-- ROLE + JWTs REALES; L-151: fixtures que DISCRIMINAN). Todo en UNA
-- transacción con ROLLBACK — residuos 0. Se corre DESPUÉS del OK founder
-- y de aplicar la migración. Resultados a NOTICE; cualquier assert falso
-- levanta EXCEPTION.
--
-- Actores reales (relevados 21-jul, literal en el reporte S73-B):
--   demo-vet    4f572081… → titular (dueño) de Aurora de680000…e5
--   demo-prest  c5d54e3a… → titular de Paseos Andres de300000…e5 (NO de Aurora)
--   diana       c5651de2… → empleada ACTIVA de Satori 2052f109… SIN rol en la hija
BEGIN;

-- ── T1: el titular (vía backfill hija + pata estructural) ES dueño de SU negocio
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT empleado_tiene_rol('de680000-0000-4000-8000-0000000000e5', ARRAY['dueño']) THEN
    RAISE EXCEPTION 'T1: demo-vet debería ser dueño de Aurora';
  END IF;
  RAISE NOTICE 'T1 OK: titular es dueño de su negocio';
END $$;

-- ── T2: el MISMO titular NO tiene rol en un negocio AJENO (discrimina)
DO $$ BEGIN
  IF empleado_tiene_rol('de300000-0000-4000-8000-0000000000e5', ARRAY['dueño','profesional','recepcion']) THEN
    RAISE EXCEPTION 'T2: demo-vet NO debería tener rol alguno en Paseos Andres';
  END IF;
  RAISE NOTICE 'T2 OK: cero rol en negocio ajeno';
END $$;

-- ── T3: titular NO es profesional/recepcion (la hija solo le dio dueño;
--        la pata estructural solo aplica a 'dueño')
DO $$ BEGIN
  IF empleado_tiene_rol('de680000-0000-4000-8000-0000000000e5', ARRAY['profesional','recepcion']) THEN
    RAISE EXCEPTION 'T3: demo-vet no debería ser profesional ni recepcion (sin fila)';
  END IF;
  RAISE NOTICE 'T3 OK: dueño no implica profesional/recepcion';
END $$;

RESET ROLE;

-- ── T4: empleada activa SIN adjudicar → NINGÚN rol (la foto pre-gate:
--        exactamente por esto el gate D-464 espera la adjudicación)
SET LOCAL request.jwt.claims = '{"sub":"c5651de2-2c59-416a-8bd5-e63ed874ce1a","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF empleado_tiene_rol('2052f109-143a-41d1-b338-de8973d8fb20', ARRAY['dueño','profesional','recepcion']) THEN
    RAISE EXCEPTION 'T4: Diana (empleada sin adjudicar) no debería portar rol todavía';
  END IF;
  RAISE NOTICE 'T4 OK: empleado sin adjudicar = cero rol (pre-gate honesto)';
END $$;
RESET ROLE;

-- ── T5: RLS de la hija — el titular de Aurora NO ve filas de roles de
--        OTRO negocio; SÍ ve la suya
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_propias int; v_ajenas int;
BEGIN
  SELECT count(*) INTO v_propias FROM empleado_roles er
  JOIN prestador_empleados pe ON pe.id = er.empleado_id
  WHERE pe.prestador_id = 'de680000-0000-4000-8000-0000000000e5';
  SELECT count(*) INTO v_ajenas FROM empleado_roles er
  JOIN prestador_empleados pe ON pe.id = er.empleado_id
  WHERE pe.prestador_id <> 'de680000-0000-4000-8000-0000000000e5'
    AND pe.user_id <> '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  IF v_propias < 1 THEN RAISE EXCEPTION 'T5a: el dueño no ve su propia fila de rol'; END IF;
  IF v_ajenas <> 0 THEN RAISE EXCEPTION 'T5b: el dueño ve % filas de roles ajenos', v_ajenas; END IF;
  RAISE NOTICE 'T5 OK: RLS de la hija (propias=%, ajenas=0)', v_propias;
END $$;
RESET ROLE;

-- ── T7/T8 (enmienda mesa v2): el gobierno de la hija pasa por el helper.
-- Fixture in-txn (muere con el ROLLBACK): Diana entra como empleada de
-- AURORA — así T7 prueba que el DUEÑO asigna vía policy y T8 que la
-- empleada NO puede auto-asignarse rol (discrimina).
RESET ROLE;
INSERT INTO prestador_empleados (id, prestador_id, user_id, rol, nombre, created_by)
VALUES ('99990000-0000-4000-8000-0000000000f7'::uuid,
        'de680000-0000-4000-8000-0000000000e5',
        'c5651de2-2c59-416a-8bd5-e63ed874ce1a',
        'empleado', 'FIXTURE T7 (rollback)', '4f572081-26a5-4d3b-9d80-25ea751fdc9c');

-- T7: el dueño de Aurora ASIGNA recepcion al fixture (policy INSERT vía helper)
SET LOCAL request.jwt.claims = '{"sub":"4f572081-26a5-4d3b-9d80-25ea751fdc9c","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  INSERT INTO empleado_roles (empleado_id, rol, asignado_por)
  VALUES ('99990000-0000-4000-8000-0000000000f7', 'recepcion', '4f572081-26a5-4d3b-9d80-25ea751fdc9c');
  RAISE NOTICE 'T7 OK: el dueño asigna rol en su negocio (policy vía helper)';
END $$;
RESET ROLE;

-- T8: la empleada NO se auto-asigna 'profesional' (rebota por policy)
SET LOCAL request.jwt.claims = '{"sub":"c5651de2-2c59-416a-8bd5-e63ed874ce1a","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_filas int;
BEGIN
  BEGIN
    INSERT INTO empleado_roles (empleado_id, rol, asignado_por)
    VALUES ('99990000-0000-4000-8000-0000000000f7', 'profesional', 'c5651de2-2c59-416a-8bd5-e63ed874ce1a');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;
  END;
  SELECT count(*) INTO v_filas FROM empleado_roles
  WHERE empleado_id = '99990000-0000-4000-8000-0000000000f7' AND rol = 'profesional';
  IF v_filas <> 0 THEN
    RAISE EXCEPTION 'T8: la empleada se auto-asignó rol';
  END IF;
  RAISE NOTICE 'T8 OK: auto-asignación rebotada';
END $$;
RESET ROLE;

-- ── T6: anon NO ejecuta el helper (L-140 en runtime, además del proacl)
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM empleado_tiene_rol('de680000-0000-4000-8000-0000000000e5', ARRAY['dueño']);
    RAISE EXCEPTION 'T6: anon pudo ejecutar empleado_tiene_rol';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'T6 OK: anon rebotado (insufficient_privilege)';
  END;
END $$;
RESET ROLE;

ROLLBACK; -- residuos 0 (el fixture T7/T8 y la fila de rol de T7 mueren acá)
