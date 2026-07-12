-- Asserts del motor de ocupación por ventana (S55-B2) — TODO corre en
-- una transacción con ROLLBACK final: fixtures y holds evaporan (0
-- residuos por construcción). Correr con:
--   npx supabase --experimental db query --linked "$(cat supabase/dev/test_motor_ocupacion_s55.sql)"
-- Éxito = 14 filas OK en el SELECT final (L-081: es el último output).

BEGIN;
SET LOCAL request.jwt.claims = '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}';

CREATE TEMP TABLE _res (orden serial, test text, ok boolean, detalle text);

-- fixtures (evaporan con el ROLLBACK): ofertas 120/240/300 del prestador
-- demo + franja domingo con CUPO 2 (capacidad simultánea)
INSERT INTO prestador_servicios (id, prestador_id, tipo_servicio, precio, duracion_minutos, activo) VALUES
  ('aaaa0000-0000-4000-8000-000000000120', 'de300000-0000-4000-8000-0000000000e5', 'paseo', 20, 120, true),
  ('aaaa0000-0000-4000-8000-000000000240', 'de300000-0000-4000-8000-0000000000e5', 'paseo', 40, 240, true),
  ('aaaa0000-0000-4000-8000-000000000300', 'de300000-0000-4000-8000-0000000000e5', 'paseo', 50, 300, true);
INSERT INTO prestador_horarios (prestador_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
VALUES ('de300000-0000-4000-8000-0000000000e5', 0, '08:00', '12:00', 30, 2, true);

DO $probar$
DECLARE
  c_prest constant uuid := 'de300000-0000-4000-8000-0000000000e5';
  c_srv30 constant uuid := 'de300000-0000-4000-8000-00000000a5e0';
  c_masc  constant uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_f120  constant uuid := 'aaaa0000-0000-4000-8000-000000000120';
  c_f240  constant uuid := 'aaaa0000-0000-4000-8000-000000000240';
  c_f300  constant uuid := 'aaaa0000-0000-4000-8000-000000000300';
  v_sab date;
  v_dom date;
  r jsonb;
  v_hold120 uuid;
  v_arr time[];
  n int;
BEGIN
  v_sab := current_date + (((6 - EXTRACT(DOW FROM current_date)::int) % 7 + 7) % 7);
  IF v_sab <= current_date THEN v_sab := v_sab + 7; END IF;
  v_dom := v_sab + 1;

  -- T4a: la oferta 240' solo arranca donde la ventana entera cabe en su
  -- franja (sáb 08-12 y 14-18 → solo 08:00 y 14:00)
  SELECT array_agg(hora ORDER BY hora), count(*) INTO v_arr, n
  FROM obtener_slots_disponibles(c_prest, c_f240, v_sab, v_sab);
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T4a 240min: solo arranques donde cabe entera (08:00 y 14:00)',
          v_arr = ARRAY['08:00','14:00']::time[], array_to_string(v_arr, ','));

  -- T4b: 300' no cabe en NINGUNA franja demo (max 4h) → cero oferta
  SELECT count(*) INTO n FROM obtener_slots_disponibles(c_prest, c_f300, v_sab, v_sab);
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T4b 300min: cero slots si no cabe entera', n = 0, n::text);

  -- T4c/T4d: el QUIEN respeta la ventana (9:00+240 no cabe; 8:00+240 si)
  SELECT count(*) INTO n FROM obtener_paseadores_disponibles(v_sab, '09:00', 240) p WHERE p.prestador_id = c_prest;
  INSERT INTO _res(test, ok, detalle) VALUES ('T4c paseadores 09:00x240: demo excluido (no cabe)', n = 0, n::text);
  SELECT count(*) INTO n FROM obtener_paseadores_disponibles(v_sab, '08:00', 240) p WHERE p.prestador_id = c_prest;
  INSERT INTO _res(test, ok, detalle) VALUES ('T4d paseadores 08:00x240: demo ofertado', n = 1, n::text);

  -- T1: hold de 120' a las 09:00 con snapshot de duracion
  r := crear_bloqueo_agenda(c_prest, c_f120, c_masc, v_sab, '09:00');
  v_hold120 := (r->>'cita_id')::uuid;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T1 hold 120min: snapshot duracion en retorno y fila',
          (r->>'duracion_minutos')::int = 120
          AND (SELECT duracion_minutos FROM evento_cita_servicio WHERE id = v_hold120) = 120,
          r->>'duracion_minutos');

  -- T1b: la ventana [09:00,11:00) bloquea SUS 4 slots de 30' y nada mas
  SELECT array_agg(hora ORDER BY hora) INTO v_arr
  FROM obtener_slots_disponibles(c_prest, c_srv30, v_sab, v_sab)
  WHERE hora < '12:00'::time;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T1b la cita 120min bloquea sus 4 slots de 30',
          v_arr = ARRAY['08:00','08:30','11:00','11:30']::time[], array_to_string(v_arr, ','));

  -- T2: 30' ADENTRO de la ventana ajena (10:00, cupo 1) → slot_ocupado
  BEGIN
    r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_sab, '10:00');
    INSERT INTO _res(test, ok, detalle) VALUES ('T2 30min dentro de ventana ajena rebota', false, 'PUDO — doble booking');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T2 30min dentro de ventana ajena rebota', SQLERRM LIKE 'slot_ocupado%', SQLERRM);
  END;

  -- T2b control: 30' FUERA de la ventana (11:00) → pasa
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_sab, '11:00');
  INSERT INTO _res(test, ok, detalle) VALUES ('T2b 30min fuera de la ventana pasa', (r->>'ok')::boolean, r->>'cita_id');

  -- T5: el hold vencido NO ocupa (pre-cron: sigue pendiente/pendiente_pago)
  UPDATE evento_cita_servicio SET expira_en = now() - interval '1 minute' WHERE id = v_hold120;
  SELECT array_agg(hora ORDER BY hora) INTO v_arr
  FROM obtener_slots_disponibles(c_prest, c_srv30, v_sab, v_sab)
  WHERE hora >= '09:00'::time AND hora <= '10:30'::time;
  INSERT INTO _res(test, ok, detalle)
  VALUES ('T5 hold vencido libera sus 4 slots',
          v_arr = ARRAY['09:00','09:30','10:00','10:30']::time[], array_to_string(v_arr, ','));

  -- T3: CUPO 2 (domingo fixture): dos citas superpuestas legales, la tercera rebota
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_dom, '09:00');
  INSERT INTO _res(test, ok, detalle) VALUES ('T3a cupo2: primera 09:00 pasa', (r->>'ok')::boolean, r->>'cita_id');
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_dom, '09:00');
  INSERT INTO _res(test, ok, detalle) VALUES ('T3b cupo2: segunda 09:00 pasa (2 legales)', (r->>'ok')::boolean, r->>'cita_id');
  BEGIN
    r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_dom, '09:00');
    INSERT INTO _res(test, ok, detalle) VALUES ('T3c cupo2: tercera rebota', false, 'PUDO — cupo violado');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T3c cupo2: tercera rebota', SQLERRM LIKE 'slot_ocupado%', SQLERRM);
  END;

  -- T3d: una ventana 120' [08:00,10:00) que CRUZA el slot lleno (09:00 con 2) rebota
  BEGIN
    r := crear_bloqueo_agenda(c_prest, c_f120, c_masc, v_dom, '08:00');
    INSERT INTO _res(test, ok, detalle) VALUES ('T3d ventana que cruza slot lleno rebota', false, 'PUDO');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(test, ok, detalle) VALUES ('T3d ventana que cruza slot lleno rebota', SQLERRM LIKE 'slot_ocupado%', SQLERRM);
  END;

  -- T3e: y una 30' a las 08:00 domingo pasa (el slot lleno es 09:00, no 08:00)
  r := crear_bloqueo_agenda(c_prest, c_srv30, c_masc, v_dom, '08:00');
  INSERT INTO _res(test, ok, detalle) VALUES ('T3e cupo2: 08:00 sigue libre para 30min', (r->>'ok')::boolean, r->>'cita_id');
END
$probar$;

SELECT orden, CASE WHEN ok THEN 'OK' ELSE 'FALLO' END AS estado, test, detalle FROM _res ORDER BY orden;
ROLLBACK;
