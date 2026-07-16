-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S63 — PROGRAMA DE ADIESTRAMIENTO (T1..T11 + L-140 aparte)
-- Patrón L-073/L-122b: bloque DO imperativo; el RAISE EXCEPTION final
-- porta el resultado Y fuerza el ROLLBACK — residuos 0 por construcción.
-- Ids demo relevados contra DB viva (S63): familia demo de300000-…00fa,
-- titular c5d54e3a-…, Zeus demo de300000-…0a5c, prestador [DEMO S44]
-- Paseos Andres de300000-…00e5 (cuenta activa + rol activo, modo
-- universal). Nada de esto se escribe fuera de la transacción.
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_user      uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  c_mascota   uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_prestador uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_inicio    date;
  v_oferta    uuid;
  v_prog_a    uuid;   -- programa catálogo A (matrícula A, 06:00)
  v_prog_b    uuid;   -- programa catálogo B (atomicidad + vencimiento, 05:00)
  v_paseo_of  uuid;
  v_pc_a      uuid;
  v_pc_b      uuid;
  v_r         jsonb;
  v_n         int;
  v_num       numeric;
  v_txt       text;
  v_cita_s2   uuid;
  v_cita_s3   uuid;
  v_cita_s6   uuid;
  v_bloqueo   uuid;
  v_res       text := '';
BEGIN
  v_inicio := v_hoy + 2;

  -- ── SETUP (superuser, in-txn) ──────────────────────────────────────
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, nombre_custom, precio, duracion_minutos, activo)
  VALUES (c_prestador, 'adiestramiento', '[ASSERT S63] Adiestramiento', 25, 60, true)
  RETURNING id INTO v_oferta;

  -- franjas universales (modo=universal relevado) que cubren las dos
  -- DOW usadas: la del arranque y la del día siguiente (reagenda +1d)
  INSERT INTO prestador_horarios (prestador_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  VALUES
    (c_prestador, NULL, EXTRACT(DOW FROM v_inicio)::int,     '05:00', '08:00', 60, 1, true),
    (c_prestador, NULL, EXTRACT(DOW FROM v_inicio + 1)::int, '05:00', '08:00', 60, 1, true);

  INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
  VALUES (v_oferta, 'basico', '[ASSERT] Obediencia basica', 6, 100, 45, 60)
  RETURNING id INTO v_prog_a;
  INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
  VALUES (v_oferta, 'especialidad', '[ASSERT] Correa sin tiron', 6, 120, 45, 60)
  RETURNING id INTO v_prog_b;

  -- ── T10: CHECKs del catálogo ───────────────────────────────────────
  BEGIN
    INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias)
    VALUES (v_oferta, 'basico', '[ASSERT] vigencia corta', 6, 100, 10);
    v_res := v_res || 'T10a FALLO (vigencia<cadencia entró); ';
  EXCEPTION WHEN check_violation THEN
    v_res := v_res || 'T10a OK (chk vigencia_cubre_cadencia); ';
  END;
  BEGIN
    INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
    VALUES (v_oferta, 'basico', '[ASSERT] duracion 50', 6, 100, 45, 50);
    v_res := v_res || 'T10b FALLO (paso de 15 no rige); ';
  EXCEPTION WHEN check_violation THEN
    v_res := v_res || 'T10b OK (chk duracion pasos 15); ';
  END;

  -- ── T11: el programa solo cuelga del oficio ────────────────────────
  SELECT ps.id INTO v_paseo_of FROM prestador_servicios ps
  JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
  WHERE ps.prestador_id = c_prestador AND ts.categoria = 'paseo' AND ps.activo LIMIT 1;
  IF v_paseo_of IS NOT NULL THEN
    BEGIN
      INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias)
      VALUES (v_paseo_of, 'basico', '[ASSERT] fuera de oficio', 6, 100, 45);
      v_res := v_res || 'T11 FALLO (programa sobre paseo entró); ';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM LIKE 'programa_fuera_de_oficio%' THEN
        v_res := v_res || 'T11 OK (programa_fuera_de_oficio); ';
      ELSE
        v_res := v_res || 'T11 FALLO (' || SQLERRM || '); ';
      END IF;
    END;
  ELSE
    v_res := v_res || 'T11 SKIP (sin oferta paseo); ';
  END IF;

  -- claims del titular demo (los RPC son DEFINER; el gate lee auth.uid())
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);

  -- ── T1: contratar happy — 6 sesiones EN ORDEN, semanales, cubiertas ─
  SET LOCAL ROLE authenticated;
  v_r := contratar_programa(c_prestador, v_oferta, v_prog_a, c_mascota, v_inicio, '06:00');
  RESET ROLE;
  v_pc_a := (v_r->>'programa_contratado_id')::uuid;

  SELECT count(*) INTO v_n FROM evento_cita_servicio
  WHERE programa_contratado_id = v_pc_a AND estado = 'confirmada' AND estado_reserva = 'pagada';
  SELECT count(*) INTO v_num FROM (
    SELECT sesion_numero, fecha,
           fecha - lag(fecha) OVER (ORDER BY sesion_numero) AS paso
    FROM evento_cita_servicio WHERE programa_contratado_id = v_pc_a
  ) x WHERE x.paso IS DISTINCT FROM 7 AND x.sesion_numero > 1;
  IF v_n = 6 AND v_num = 0 THEN
    v_res := v_res || 'T1 OK (6 firmes+pagadas, k=1..6, paso 7d); ';
  ELSE
    v_res := v_res || 'T1 FALLO (n=' || v_n || ', pasos rotos=' || v_num || '); ';
  END IF;

  -- T1b: la suma de precios == precio del programa (la última absorbe)
  SELECT sum(precio), max(precio) FILTER (WHERE sesion_numero = 6) INTO v_num, v_txt
  FROM evento_cita_servicio WHERE programa_contratado_id = v_pc_a;
  IF v_num = 100.00 AND v_txt::numeric = 16.65 THEN
    v_res := v_res || 'T1b OK (sum=100.00, ultima=16.65 residuo); ';
  ELSE
    v_res := v_res || 'T1b FALLO (sum=' || v_num || ', ultima=' || v_txt || '); ';
  END IF;

  -- ── T2: duplicado del mismo programa+mascota rebota ────────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := contratar_programa(c_prestador, v_oferta, v_prog_a, c_mascota, v_inicio + 1, '05:00');
    v_res := v_res || 'T2 FALLO (duplicado entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'programa_duplicado%'
      THEN 'T2 OK (programa_duplicado); ' ELSE 'T2 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T3: especie manda desde la DB (§2: solo perros) ────────────────
  UPDATE mascotas SET especie = 'gato' WHERE id = c_mascota;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := contratar_programa(c_prestador, v_oferta, v_prog_b, c_mascota, v_inicio, '05:00');
    v_res := v_res || 'T3 FALLO (gato entró a adiestramiento); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'mascota_no_elegible%'
      THEN 'T3 OK (mascota_no_elegible); ' ELSE 'T3 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;
  UPDATE mascotas SET especie = 'perro' WHERE id = c_mascota;

  -- ── T4: ATOMICIDAD — vacaciones en la semana 3 tumban TODO ─────────
  INSERT INTO prestador_bloqueos (prestador_id, fecha_inicio, fecha_fin, motivo)
  VALUES (c_prestador, v_inicio + 14, v_inicio + 14, '[ASSERT] vacaciones')
  RETURNING id INTO v_bloqueo;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := contratar_programa(c_prestador, v_oferta, v_prog_b, c_mascota, v_inicio, '05:00');
    v_res := v_res || 'T4 FALLO (programa nació sobre vacaciones); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'prestador_no_disponible%'
      THEN 'T4 OK (rebote en sesión 3' ELSE 'T4 FALLO (' || SQLERRM || ')' END;
  END;
  RESET ROLE;
  SELECT count(*) INTO v_n FROM programas_contratados WHERE programa_id = v_prog_b;
  v_res := v_res || CASE WHEN v_n = 0 THEN ', matrícula 0 = atómico); ' ELSE ', FALLO matrícula quedó=' || v_n || '); ' END;
  DELETE FROM prestador_bloqueos WHERE id = v_bloqueo;

  -- ── T5: reagendar la sesión 3 (+1 día, entre vecinas) ──────────────
  SELECT id INTO v_cita_s3 FROM evento_cita_servicio WHERE programa_contratado_id = v_pc_a AND sesion_numero = 3;
  SET LOCAL ROLE authenticated;
  v_r := reagendar_sesion_programa(v_cita_s3, v_inicio + 15, '06:00');
  RESET ROLE;
  SELECT count(*) INTO v_n FROM evento_cita_servicio c
  JOIN eventos_mascota em ON em.id = c.evento_id
  WHERE c.id = v_cita_s3 AND c.fecha = v_inicio + 15
    AND em.fecha_evento = (v_inicio + 15 + time '06:00');
  v_res := v_res || CASE WHEN v_n = 1 THEN 'T5 OK (s3 movida, evento sincronizado); '
                         ELSE 'T5 FALLO; ' END;

  -- ── T6a: el orden no se cruza — s2 después de s3 rebota ────────────
  SELECT id INTO v_cita_s2 FROM evento_cita_servicio WHERE programa_contratado_id = v_pc_a AND sesion_numero = 2;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := reagendar_sesion_programa(v_cita_s2, v_inicio + 16, '06:00');
    v_res := v_res || 'T6a FALLO (s2 cruzó a s3); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'orden_programa_violado%'
      THEN 'T6a OK (orden_programa_violado); ' ELSE 'T6a FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T6b: la vigencia acota la reagenda ─────────────────────────────
  SELECT id INTO v_cita_s6 FROM evento_cita_servicio WHERE programa_contratado_id = v_pc_a AND sesion_numero = 6;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := reagendar_sesion_programa(v_cita_s6, v_hoy + 46, '06:00');
    v_res := v_res || 'T6b FALLO (salió de vigencia); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'fuera_de_vigencia%'
      THEN 'T6b OK (fuera_de_vigencia); ' ELSE 'T6b FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T7: GUARD DURO — cerrar s2 con s1 abierta rebota (en la fuente) ─
  BEGIN
    UPDATE evento_cita_servicio SET estado = 'completada' WHERE id = v_cita_s2;
    v_res := v_res || 'T7 FALLO (s2 cerró con s1 abierta); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'sesion_anterior_abierta%'
      THEN 'T7 OK (sesion_anterior_abierta); ' ELSE 'T7 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── T8: cierre EN ORDEN 1..6 pasa y la matrícula se completa sola ──
  UPDATE evento_cita_servicio SET estado = 'completada'
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 1;
  UPDATE evento_cita_servicio SET estado = 'completada'
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 2;
  UPDATE evento_cita_servicio SET estado = 'no_show'      -- el no_show también es cierre (Decisión T)
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 3;
  -- de a una: un UPDATE multi-fila podría procesar la 5 antes que la 4
  -- y el propio guard lo rebotaría (el orden es fila a fila)
  UPDATE evento_cita_servicio SET estado = 'completada'
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 4;
  UPDATE evento_cita_servicio SET estado = 'completada'
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 5;
  SELECT estado INTO v_txt FROM programas_contratados WHERE id = v_pc_a;
  IF v_txt <> 'activo' THEN
    v_res := v_res || 'T8 FALLO (se completó antes de la 6: ' || v_txt || '); ';
  END IF;
  UPDATE evento_cita_servicio SET estado = 'completada'
  WHERE programa_contratado_id = v_pc_a AND sesion_numero = 6;
  SELECT estado INTO v_txt FROM programas_contratados WHERE id = v_pc_a;
  v_res := v_res || CASE WHEN v_txt = 'completado'
    THEN 'T8 OK (orden 1..6 pasa, matrícula completado sola); '
    ELSE 'T8 FALLO (estado=' || v_txt || '); ' END;

  -- ── T9: VIGENCIA VENCIDA — cancela, declara reembolso con motivo ───
  SET LOCAL ROLE authenticated;
  v_r := contratar_programa(c_prestador, v_oferta, v_prog_b, c_mascota, v_inicio, '05:00');
  RESET ROLE;
  v_pc_b := (v_r->>'programa_contratado_id')::uuid;
  UPDATE programas_contratados SET vigencia_hasta = v_hoy - 1 WHERE id = v_pc_b;

  v_r := vencer_programas_adiestramiento();

  SELECT count(*) INTO v_n FROM evento_cita_servicio
  WHERE programa_contratado_id = v_pc_b AND estado = 'cancelada';
  SELECT pc.estado || '/' || pc.estado_pago || '/' || COALESCE(pc.motivo_vencimiento, 'NULL') || '/' ||
         COALESCE((pc.pago_metadata->'reembolsos'->0->>'monto'), 'NULL')
  INTO v_txt FROM programas_contratados pc WHERE pc.id = v_pc_b;
  v_res := v_res || CASE WHEN v_n = 6 AND v_txt = 'vencido/reembolsado/sin_uso/120.00'
    THEN 'T9 OK (6 canceladas, vencido/reembolsado/sin_uso/$120 declarado); '
    ELSE 'T9 FALLO (canceladas=' || v_n || ', ' || v_txt || '); ' END;

  RAISE EXCEPTION 'ASSERTS_S63_RESULTADO (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;
