-- Asserts D-339 dirección-en-cita (S56-A Tarea 1) — TODO corre en una
-- transacción con ROLLBACK final (0 residuos por construcción). Correr:
--   npx supabase --experimental db query --linked "$(cat supabase/dev/test_d339_direccion_s56.sql)"
-- Éxito = 9 filas OK en el SELECT final (L-081: es el último output).
-- Usa el seed demo (dueño c5d54e3a…, prestador de300000…e5, servicio 30'
-- y franjas sábado del seed S44/S54). Regla 68: ROLE authenticated.

BEGIN;
SET LOCAL request.jwt.claims = '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}';

CREATE TEMP TABLE _res (orden serial, test text, ok boolean, detalle text);
GRANT ALL ON _res TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE _res_orden_seq TO authenticated;

-- Regla 68: el recorrido entero corre como authenticated (RLS real).
SET LOCAL ROLE authenticated;

DO $probar$
DECLARE
  c_prest constant uuid := 'de300000-0000-4000-8000-0000000000e5';
  c_srv30 constant uuid := 'de300000-0000-4000-8000-00000000a5e0';
  c_masc  constant uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_demo  constant uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  v_sab   date;
  r       jsonb;
  v_hold1 uuid;
  v_hold2 uuid;
  v_dir1  uuid;
  v_dir2  uuid;
  v_snap  jsonb;
  n       int;
BEGIN
  v_sab := current_date + (((6 - EXTRACT(DOW FROM current_date)::int) % 7 + 7) % 7);
  IF v_sab <= current_date THEN v_sab := v_sab + 7; END IF;

  -- T1: hold de paseo SIN dirección del hogar → snapshot NULL honesto.
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_sab, '08:00');
  v_hold1 := (r->>'cita_id')::uuid;
  SELECT direccion_snapshot INTO v_snap FROM evento_cita_servicio WHERE id = v_hold1;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T1 hold sin direccion: snapshot NULL honesto', v_snap IS NULL, coalesce(v_snap::text,'NULL'));

  -- T2: guardar_direccion_hogar crea LA fila principal del hogar.
  r := guardar_direccion_hogar('Av. Siempreviva 742', 'Quito', 'La Floresta', 'Portón azul, timbre 2', '593991234567');
  v_dir1 := (r->>'direccion_id')::uuid;
  SELECT count(*) INTO n FROM direcciones_guardadas WHERE user_id = c_demo AND es_principal AND alias = 'Hogar';
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T2 guardar_direccion_hogar crea la principal (alias Hogar)',
          (r->>'ok')::boolean AND v_dir1 IS NOT NULL AND n = 1, r::text);

  -- T3: el PAGO congela la dirección en el hold que nació sin ella.
  r := confirmar_cita_pagada(v_hold1);
  SELECT direccion_snapshot INTO v_snap FROM evento_cita_servicio WHERE id = v_hold1;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T3 pago rellena snapshot NULL (claves fijas)',
          v_snap ? 'direccion' AND v_snap ? 'ciudad' AND v_snap ? 'sector'
          AND v_snap ? 'referencias' AND v_snap ? 'lat' AND v_snap ? 'lon'
          AND v_snap ? 'direccion_id'
          AND v_snap->>'direccion' = 'Av. Siempreviva 742'
          AND (v_snap->>'direccion_id')::uuid = v_dir1,
          coalesce(v_snap::text,'NULL'));

  -- T4: hold nuevo con dirección ya guardada → snapshot al NACER.
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_sab, '08:30');
  v_hold2 := (r->>'cita_id')::uuid;
  SELECT direccion_snapshot INTO v_snap FROM evento_cita_servicio WHERE id = v_hold2;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T4 hold con hogar direccionado nace con snapshot',
          v_snap->>'direccion' = 'Av. Siempreviva 742', coalesce(v_snap::text,'NULL'));

  -- T5: guardar de nuevo = UPSERT sobre LA MISMA fila (jamás duplica).
  r := guardar_direccion_hogar('Calle Nueva 100', 'Quito', NULL, NULL, NULL);
  v_dir2 := (r->>'direccion_id')::uuid;
  SELECT count(*) INTO n FROM direcciones_guardadas WHERE user_id = c_demo AND es_principal;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T5 upsert: misma fila, cero duplicados', v_dir2 = v_dir1 AND n = 1,
          'dir1='||v_dir1||' dir2='||v_dir2||' n='||n);

  -- T6: el snapshot es COPIA congelada — la edición NO tocó la cita T4.
  SELECT direccion_snapshot INTO v_snap FROM evento_cita_servicio WHERE id = v_hold2;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T6 snapshot congelado: editar el hogar no toca la cita',
          v_snap->>'direccion' = 'Av. Siempreviva 742', v_snap->>'direccion');

  -- T7: teléfono con '+' rebota TIPADO (espejo del CHECK, regla 28).
  BEGIN
    r := guardar_direccion_hogar('X', 'Quito', NULL, NULL, '+593991234567');
    INSERT INTO _res(test, ok, detalle) VALUES ('T7 telefono con + rebota tipado', false, 'PUDO');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle)
    VALUES ('T7 telefono con + rebota tipado', SQLERRM LIKE 'telefono_invalido%', SQLERRM);
  END;

  -- T8: dirección vacía rebota tipado.
  BEGIN
    r := guardar_direccion_hogar('   ', 'Quito', NULL, NULL, NULL);
    INSERT INTO _res(test, ok, detalle) VALUES ('T8 direccion vacia rebota tipado', false, 'PUDO');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle)
    VALUES ('T8 direccion vacia rebota tipado', SQLERRM LIKE 'direccion_requerida%', SQLERRM);
  END;

  -- T9: RLS negativa — OTRO user no ve la dirección del demo ni la pisa.
  PERFORM set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}', true);
  SELECT count(*) INTO n FROM direcciones_guardadas;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T9 RLS: otro user ve 0 direcciones (la del demo existe)', n = 0, n::text);
  PERFORM set_config('request.jwt.claims', '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);
END
$probar$;

SELECT orden, test, CASE WHEN ok THEN 'OK' ELSE 'FALLO' END AS resultado, detalle
FROM _res ORDER BY orden;

ROLLBACK;
