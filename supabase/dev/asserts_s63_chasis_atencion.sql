-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S63 — CHASIS DE ATENCIÓN ADIESTRAMIENTO (ciclo E2E in-txn)
-- Patrón L-073/L-122b: DO imperativo; el RAISE final porta el resultado
-- y fuerza el ROLLBACK — residuos 0 por construcción (incluye el
-- devengo de prueba: el evento económico también rollbackea).
-- Ids demo relevados S63: titular c5d54e3a-… (dueño Y prestador demo),
-- Zeus demo de300000-…0a5c, prestador [DEMO S44] de300000-…00e5.
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_mascota   uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_prestador uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_inicio    date;
  v_oferta    uuid;
  v_prog      uuid;
  v_pc        uuid;
  v_cita_s1   uuid;
  v_cita_s3   uuid;
  v_adi       uuid;
  v_adi3      uuid;
  v_r         jsonb;
  v_n         int;
  v_num       numeric;
  v_txt       text;
  v_res       text := '';
BEGIN
  v_inicio := v_hoy + 2;

  -- ── SETUP: oferta + programa + franja + matrícula (motor probado) ──
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, nombre_custom, precio, duracion_minutos, activo, especies_compatibles)
  VALUES (c_prestador, 'adiestramiento', '[ASSERT S63] Sesión', 25, 60, true, '["perro"]'::jsonb)
  RETURNING id INTO v_oferta;
  INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
  VALUES (v_oferta, 'basico', '[ASSERT] Obediencia básica', 6, 100, 45, 60)
  RETURNING id INTO v_prog;
  INSERT INTO prestador_horarios (prestador_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  VALUES (c_prestador, NULL, EXTRACT(DOW FROM v_inicio)::int, '05:00', '08:00', 60, 1, true);

  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := contratar_programa(c_prestador, v_oferta, v_prog, c_mascota, v_inicio, '06:00');
  RESET ROLE;
  v_pc := (v_r->>'programa_contratado_id')::uuid;
  SELECT id INTO v_cita_s1 FROM evento_cita_servicio WHERE programa_contratado_id = v_pc AND sesion_numero = 1;
  SELECT id INTO v_cita_s3 FROM evento_cita_servicio WHERE programa_contratado_id = v_pc AND sesion_numero = 3;

  -- ── T1: gate temporal — la sesión futura NO se inicia ──────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := iniciar_atencion_adiestramiento(v_cita_s1, NULL);
    v_res := v_res || 'T1 FALLO (inició cita futura); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'cita_aun_no_ocurre%'
      THEN 'T1 OK (cita_aun_no_ocurre); ' ELSE 'T1 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T2: iniciar la sesión 1 (traída a HOY in-txn) ──────────────────
  UPDATE evento_cita_servicio SET fecha = v_hoy WHERE id = v_cita_s1;
  SET LOCAL ROLE authenticated;
  v_r := iniciar_atencion_adiestramiento(v_cita_s1, NULL);
  RESET ROLE;
  v_adi := (v_r->>'adiestramiento_id')::uuid;
  SELECT estado INTO v_txt FROM evento_cita_servicio WHERE id = v_cita_s1;
  v_res := v_res || CASE WHEN v_adi IS NOT NULL AND v_txt = 'en_curso'
    THEN 'T2 OK (tres capas creadas, cita en_curso); '
    ELSE 'T2 FALLO (estado=' || v_txt || '); ' END;

  -- ── T3: piso de calidad + vocabulario + trabajado≠alcanzado ────────
  SET LOCAL ROLE authenticated;
  BEGIN
    v_r := registrar_objetivo_adiestramiento(v_adi, 'objetivo_falso', false, NULL);
    v_res := v_res || 'T3a FALLO (objetivo inválido entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'objetivo_invalido%'
      THEN 'T3a OK (objetivo_invalido); ' ELSE 'T3a FALLO (' || SQLERRM || '); ' END;
  END;
  v_r := registrar_objetivo_adiestramiento(v_adi, 'sentado', false, 'primeros intentos');
  v_r := registrar_objetivo_adiestramiento(v_adi, 'sentado', true, NULL);   -- upsert: pasa a ALCANZADO
  v_r := registrar_objetivo_adiestramiento(v_adi, 'atencion_contacto_visual', false, NULL);
  RESET ROLE;
  SELECT count(*), count(*) FILTER (WHERE alcanzado) INTO v_n, v_num
  FROM evento_adiestramiento_objetivos WHERE adiestramiento_id = v_adi;
  v_res := v_res || CASE WHEN v_n = 2 AND v_num = 1
    THEN 'T3 OK (2 trabajados, 1 alcanzado vía upsert, nota conservada); '
    ELSE 'T3 FALLO (filas=' || v_n || ', alcanzados=' || v_num || '); ' END;

  -- ── T4: clips — tope duro 3 + path del prestador ───────────────────
  SET LOCAL ROLE authenticated;
  BEGIN
    v_r := registrar_clip_adiestramiento(v_adi, c_prestador || '/clip4.mp4', 4, 20, NULL);
    v_res := v_res || 'T4a FALLO (orden 4 entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'clip_tope_superado%'
      THEN 'T4a OK (clip_tope_superado); ' ELSE 'T4a FALLO (' || SQLERRM || '); ' END;
  END;
  BEGIN
    v_r := registrar_clip_adiestramiento(v_adi, 'otro-prestador/clip.mp4', 1, 20, NULL);
    v_res := v_res || 'T4b FALLO (path ajeno entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'clip_path_invalido%'
      THEN 'T4b OK (clip_path_invalido); ' ELSE 'T4b FALLO (' || SQLERRM || '); ' END;
  END;
  v_r := registrar_clip_adiestramiento(v_adi, c_prestador || '/s1-clip1.mp4', 1, 22, 'el quieto');
  BEGIN
    v_r := registrar_clip_adiestramiento(v_adi, c_prestador || '/s1-clip1b.mp4', 1, 20, NULL);
    v_res := v_res || 'T4c FALLO (orden duplicado entró); ';
  EXCEPTION WHEN unique_violation THEN
    v_res := v_res || 'T4c OK (UNIQUE orden por sesión); ';
  END;
  RESET ROLE;

  -- ── T5: cerrar exige TERMINAR primero; terminar NO exige captura ───
  SET LOCAL ROLE authenticated;
  BEGIN
    v_r := cerrar_atencion_adiestramiento(v_adi, NULL, NULL);
    v_res := v_res || 'T5a FALLO (cerró en_curso); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'atencion_no_terminada%'
      THEN 'T5a OK (atencion_no_terminada); ' ELSE 'T5a FALLO (' || SQLERRM || '); ' END;
  END;
  v_r := terminar_atencion_adiestramiento(v_adi);   -- §12.6: sin captura exigida
  v_res := v_res || CASE WHEN (v_r->>'estado') = 'terminada'
    THEN 'T5 OK (terminada SIN captura exigida §12.6); ' ELSE 'T5 FALLO; ' END;
  RESET ROLE;

  -- ── T6: cierre con calidad → devengo variante (b) exacto ───────────
  SET LOCAL ROLE authenticated;
  v_r := cerrar_atencion_adiestramiento(v_adi, 'Zeus trabajó increíble hoy.',
    'Practiquen el sentado 5 minutos por día, antes de la comida.');
  RESET ROLE;
  SELECT count(*), COALESCE(max(ee.monto_bruto), 0) INTO v_n, v_num
  FROM eventos_economicos ee
  WHERE ee.origen_tipo = 'cita' AND ee.origen_id = v_cita_s1 AND ee.tipo_evento = 'cita_pagada';
  SELECT ecs.estado || '/' || a.estado || '/' || COALESCE(left(g.instrucciones_familia, 10), 'NULL')
  INTO v_txt
  FROM evento_cita_servicio ecs
  JOIN evento_atencion a ON a.cita_id = ecs.id AND a.familia = 'adiestramiento'
  JOIN eventos_mascota_adiestramiento g ON g.evento_atencion_id = a.id
  WHERE ecs.id = v_cita_s1;
  v_res := v_res || CASE WHEN v_n = 1 AND v_num = 16.67 AND v_txt = 'completada/cerrada_con_calidad/Practiquen'
    THEN 'T6 OK (devengo $16.67 en ledger, completada, cerrada, instrucciones en head); '
    ELSE 'T6 FALLO (devengos=' || v_n || ', monto=' || v_num || ', ' || v_txt || '); ' END;

  -- ── T7: piso vacío rebota + el cierre NO sortea el guard de orden ──
  -- (la sesión 2 sigue 'confirmada' — abierta; la 3 se intenta cerrar)
  UPDATE evento_cita_servicio SET fecha = v_hoy WHERE id = v_cita_s3;
  SET LOCAL ROLE authenticated;
  v_r := iniciar_atencion_adiestramiento(v_cita_s3, NULL);
  v_adi3 := (v_r->>'adiestramiento_id')::uuid;
  -- T7a: piso de calidad vacío (el subbloque revierte también el
  -- terminar — la atención vuelve a en_curso para el paso siguiente)
  BEGIN
    v_r := terminar_atencion_adiestramiento(v_adi3);
    v_r := cerrar_atencion_adiestramiento(v_adi3, NULL, NULL);
    v_res := v_res || 'T7a FALLO (cerró sin piso); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'calidad_falta_objetivo%'
      THEN 'T7a OK (calidad_falta_objetivo); ' ELSE 'T7a FALLO (' || SQLERRM || '); ' END;
  END;
  -- T7b: con piso completo, el cierre de la 3 rebota EN LA FUENTE por
  -- la 2 abierta — el RPC no reimplementa el guard NI lo sortea
  v_r := registrar_objetivo_adiestramiento(v_adi3, 'echado', true, NULL);
  v_r := registrar_nota_adiestramiento(v_adi3, 'sesión adelantada de prueba', NULL);
  BEGIN
    v_r := terminar_atencion_adiestramiento(v_adi3);
    v_r := cerrar_atencion_adiestramiento(v_adi3, NULL, NULL);
    v_res := v_res || 'T7b FALLO (cerró la 3 con la 2 abierta); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'sesion_anterior_abierta%'
      THEN 'T7b OK (guard duro en la fuente frenó el cierre k con k−1 abierta); '
      ELSE 'T7b FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T8: EL PARTE — forma narrativa, voz de familia, progresión ─────
  SET LOCAL ROLE authenticated;
  v_r := obtener_parte_adiestramiento(v_cita_s1);
  RESET ROLE;
  -- dominados_n = 2: sentado (s1 cerrada) + echado (s3 en curso, T7) —
  -- la progresión lee el programa AL DÍA, correcto por diseño
  IF (v_r->'sesion'->>'numero')::int = 1 AND (v_r->'sesion'->>'de')::int = 6
     AND jsonb_array_length(v_r->'objetivos') = 2
     AND jsonb_array_length(v_r->'clips') = 1
     AND (v_r->'progresion'->>'dominados_n')::int = 2
     AND (v_r->'progresion'->>'del_programa_n')::int = 8
     AND (v_r->'progresion'->>'nivel') = 'basico'
     AND v_r->'progresion'->'dominados' @> '[{"codigo":"sentado"}]'::jsonb
     AND (v_r->>'instrucciones_familia') LIKE 'Practiquen%'
  THEN
    v_res := v_res || 'T8 OK (parte: sesión 1 de 6, 2 trabajados, 1 clip, progresión 2 de 8 básico con voz de familia, instrucciones); ';
  ELSE
    v_res := v_res || 'T8 FALLO (' || left(v_r::text, 300) || '); ';
  END IF;

  -- ── T9: memorial APAGA la progresión (LOYALTY §7.1 estructural) ────
  UPDATE mascotas SET estado_vida = 'fallecida' WHERE id = c_mascota;
  SET LOCAL ROLE authenticated;
  v_r := obtener_parte_adiestramiento(v_cita_s1);
  RESET ROLE;
  UPDATE mascotas SET estado_vida = 'activa' WHERE id = c_mascota;
  v_res := v_res || CASE WHEN v_r->'progresion' = 'null'::jsonb
    THEN 'T9 OK (memorial: progresion NULL, el parte factual queda); '
    ELSE 'T9 FALLO (progresion=' || left((v_r->'progresion')::text, 80) || '); ' END;

  -- ── T10: parte de atención NO cerrada rebota ───────────────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := obtener_parte_adiestramiento(v_cita_s3);
    v_res := v_res || 'T10 FALLO (parte de sesión abierta); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'parte_no_disponible%'
      THEN 'T10 OK (parte_no_disponible); ' ELSE 'T10 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  RAISE EXCEPTION 'ASSERTS_S63C_RESULTADO (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;
