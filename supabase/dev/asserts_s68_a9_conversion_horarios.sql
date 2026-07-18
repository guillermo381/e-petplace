-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S68-A9 — la conversión atómica de horarios a por_servicio.
-- Patrón L-073/L-122b: DO imperativo, RAISE final = resultado + ROLLBACK
-- (residuos 0). Actor: el prestador [DEMO S58] Wizard (de580000-…00b1,
-- user 9faf03c3-…) — sin ofertas ni franjas vivas (precondición
-- verificada adentro; si el árbol vivo cambió, aborta honesto).
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_prest uuid := 'de580000-0000-4000-8000-0000000000b1';
  c_user  uuid := '9faf03c3-30a4-45a3-9083-eb6bc20f5684';
  v_emp   uuid;
  v_modo  text;
  v_n     int;
  v_r     jsonb;
  v_res   text := '';
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"9faf03c3-30a4-45a3-9083-eb6bc20f5684","role":"authenticated"}', true);

  -- precondiciones del actor (contra árbol vivo, aborto honesto)
  SELECT modo_horarios INTO v_modo FROM prestadores WHERE id = c_prest;
  SELECT count(*) INTO v_n FROM prestador_horarios WHERE prestador_id = c_prest;
  IF v_modo IS DISTINCT FROM 'universal' OR v_n <> 0 THEN
    RAISE EXCEPTION 'ASSERTS_S68_A9 abort: precondición rota (modo=%, franjas=%)', v_modo, v_n;
  END IF;
  SELECT count(*) INTO v_n FROM prestador_servicios WHERE prestador_id = c_prest AND activo;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ASSERTS_S68_A9 abort: el prestador de assert tiene % ofertas vivas', v_n;
  END IF;
  SELECT pe.id INTO v_emp FROM prestador_empleados pe
  WHERE pe.prestador_id = c_prest AND pe.rol = 'dueño' AND pe.activo LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'ASSERTS_S68_A9 abort: sin titular';
  END IF;

  -- SETUP parcial: 2 franjas generales del titular, AÚN sin ofertas
  INSERT INTO prestador_horarios
    (prestador_id, empleado_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  VALUES
    (c_prest, v_emp, NULL, 1, '09:00', '12:00', 30, 2, true),
    (c_prest, v_emp, NULL, 3, '14:00', '16:00', 60, 1, true);

  -- ── T0: con franjas pero SIN ofertas cobrables → rebote tipado ─────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := convertir_horarios_a_por_servicio();
    v_res := v_res || 'T0 FALLO (convirtió sin servicios); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'sin_servicios_activos%'
      THEN 'T0 OK (sin_servicios_activos); '
      ELSE 'T0 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- SETUP: 3 ofertas de paseo activas (menú canónico; sin gate §14.2)
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
  VALUES (c_prest, 'paseo', 5, 30, true),
         (c_prest, 'paseo', 8, 60, true),
         (c_prest, 'paseo', 12, 120, true);

  -- ── T1: la conversión — 2 generales × 3 servicios = 6 réplicas ─────
  SET LOCAL ROLE authenticated;
  v_r := convertir_horarios_a_por_servicio();
  RESET ROLE;
  SELECT modo_horarios INTO v_modo FROM prestadores WHERE id = c_prest;
  -- byte-igualdad: cada réplica calca día/horas/slot/cupo/persona/activo
  SELECT count(*) INTO v_n
  FROM prestador_horarios h
  JOIN prestador_servicios ps ON ps.id = h.servicio_id AND ps.prestador_id = c_prest
  WHERE h.prestador_id = c_prest
    AND h.empleado_id = v_emp AND h.activo
    AND ((h.dia_semana = 1 AND h.hora_inicio = '09:00' AND h.hora_fin = '12:00'
          AND h.duracion_slot_minutos = 30 AND h.max_citas_por_slot = 2)
      OR (h.dia_semana = 3 AND h.hora_inicio = '14:00' AND h.hora_fin = '16:00'
          AND h.duracion_slot_minutos = 60 AND h.max_citas_por_slot = 1));
  v_res := v_res || CASE
    WHEN (v_r->>'franjas_convertidas')::int = 6
     AND (v_r->>'servicios')::int = 3
     AND v_n = 6
     AND v_modo = 'por_servicio'
     AND NOT EXISTS (SELECT 1 FROM prestador_horarios
                     WHERE prestador_id = c_prest AND servicio_id IS NULL)
    THEN 'T1 OK (6 réplicas byte-iguales, 3 servicios, modo por_servicio, cero generales); '
    ELSE 'T1 FALLO (r=' || v_r::text || ', exactas=' || v_n || ', modo=' || v_modo || '); ' END;

  -- ── T2: idempotencia — segunda llamada rebota tipada ───────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := convertir_horarios_a_por_servicio();
    v_res := v_res || 'T2 FALLO (segunda conversión aceptada); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'sin_franjas_generales%'
      THEN 'T2 OK (idempotencia: sin_franjas_generales); '
      ELSE 'T2 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T3: los guards D-386 siguen VIVOS (no se tocaron) ──────────────
  BEGIN
    INSERT INTO prestador_horarios
      (prestador_id, empleado_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
    VALUES (c_prest, v_emp, NULL, 5, '10:00', '11:00', 30, 1, true);
    v_res := v_res || 'T3 FALLO (general aceptada en por_servicio); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'franja_universal_en_modo_por_servicio%'
      THEN 'T3 OK (guard intacto muerde la general); '
      ELSE 'T3 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── T4: LA VUELTA con las piezas existentes (sin RPC nueva) ────────
  -- espejo de eliminarFranjasPrestador (borra franjas del titular sin
  -- filtrar servicio_id) + elegir_modo_horarios('universal')
  DELETE FROM prestador_horarios
  WHERE prestador_id = c_prest AND empleado_id = v_emp;
  SET LOCAL ROLE authenticated;
  PERFORM elegir_modo_horarios('universal');
  RESET ROLE;
  SELECT modo_horarios INTO v_modo FROM prestadores WHERE id = c_prest;
  v_res := v_res || CASE WHEN v_modo = 'universal'
    THEN 'T4 OK (la vuelta cubierta por piezas existentes); '
    ELSE 'T4 FALLO (modo=' || v_modo || '); ' END;

  RAISE EXCEPTION 'ASSERTS_S68_A9 (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;