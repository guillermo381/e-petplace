-- Asserts D-348 (S56-A): gate de pertenencia en resolver_fee_aplicable.
-- Correr: npx supabase --experimental db query --linked -f supabase/dev/test_d348_fee_gate_s56.sql
-- Éxito = 4 filas OK (L-081). Todo en transacción con ROLLBACK.

BEGIN;
CREATE TEMP TABLE _res (orden serial, test text, ok boolean, detalle text);
GRANT ALL ON _res TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE _res_orden_seq TO authenticated;

DO $probar$
DECLARE
  c_prest  constant uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_cuenta uuid;
  v_owner  uuid;
  v_fee    uuid;
  n        int;
BEGIN
  SELECT pr.cuenta_comercial_id, cc.owner_profile_id INTO v_cuenta, v_owner
  FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = c_prest;

  -- T1 (a): el DUEÑO de la cuenta sigue resolviendo su fee.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT rfa.fee_config_id INTO v_fee
  FROM resolver_fee_aplicable(v_cuenta, 'prestador_servicios'::tipo_actor_enum, 'EC',
        'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T1 dueño de la cuenta resuelve su fee', v_fee IS NOT NULL, coalesce(v_fee::text,'NULL'));

  -- T2 (b): un authenticated AJENO rebota tipado.
  PERFORM set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}', true);
  BEGIN
    SELECT rfa.fee_config_id INTO v_fee
    FROM resolver_fee_aplicable(v_cuenta, 'prestador_servicios'::tipo_actor_enum, 'EC',
          'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa;
    INSERT INTO _res(test, ok, detalle) VALUES ('T2 ajeno rebota cuenta_ajena', false, 'PUDO — fuga de fee');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle)
    VALUES ('T2 ajeno rebota cuenta_ajena', SQLERRM LIKE 'cuenta_ajena%', SQLERRM);
  END;

  -- T3: la interna NO es ejecutable por authenticated (privilegio).
  BEGIN
    SELECT count(*) INTO n
    FROM _resolver_fee_aplicable(v_cuenta, 'prestador_servicios'::tipo_actor_enum, 'EC',
          'transaccional'::revenue_stream_enum, 'cita', NULL, now());
    INSERT INTO _res(test, ok, detalle) VALUES ('T3 interna cerrada a authenticated', false, 'PUDO ejecutar');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T3 interna cerrada a authenticated', true, 'permission denied');
  END;

  EXECUTE 'RESET ROLE';

  -- T4 (c, camino motor): la interna resuelve como owner (postgres) —
  -- el camino que usan crear_evento_economico / confirmar_cita_pagada.
  PERFORM set_config('request.jwt.claims', '', true);
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(v_cuenta, 'prestador_servicios'::tipo_actor_enum, 'EC',
        'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T4 camino interno del motor resuelve', v_fee IS NOT NULL, coalesce(v_fee::text,'NULL'));
END
$probar$;

SELECT orden, test, CASE WHEN ok THEN 'OK' ELSE 'FALLO' END AS resultado, detalle
FROM _res ORDER BY orden;

ROLLBACK;
