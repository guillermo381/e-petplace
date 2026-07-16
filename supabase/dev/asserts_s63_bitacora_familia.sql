-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S63 — BITÁCORA DE LA FAMILIA (§7). Patrón L-073/L-122b: DO
-- imperativo; el RAISE final porta el resultado y fuerza ROLLBACK.
-- Ids demo relevados S63 (titular c5d54e3a-…, Zeus de300000-…0a5c,
-- prestador de300000-…00e5).
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_user      uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  c_mascota   uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_prestador uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_oferta    uuid;
  v_prog      uuid;
  v_pc        uuid;
  v_familia   uuid;
  v_r         jsonb;
  v_n         int;
  v_txt       text;
  v_res       text := '';
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);

  -- ── T1: SIN contexto activo, la bitácora rebota tipado (§7 v1) ─────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := registrar_bitacora_familia(c_mascota, 'hola', '[]'::jsonb);
    v_res := v_res || 'T1 FALLO (entró sin contexto); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'sin_contexto_activo%'
      THEN 'T1 OK (sin_contexto_activo); ' ELSE 'T1 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── SETUP: matrícula activa (contexto §7) ──────────────────────────
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, nombre_custom, precio, duracion_minutos, activo, especies_compatibles)
  VALUES (c_prestador, 'adiestramiento', '[ASSERT S63] Sesión', 25, 60, true, '["perro"]'::jsonb)
  RETURNING id INTO v_oferta;
  INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
  VALUES (v_oferta, 'basico', '[ASSERT] Básico', 6, 100, 45, 60)
  RETURNING id INTO v_prog;
  INSERT INTO prestador_horarios (prestador_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  VALUES (c_prestador, NULL, EXTRACT(DOW FROM v_hoy + 2)::int, '05:00', '08:00', 60, 1, true);
  SET LOCAL ROLE authenticated;
  v_r := contratar_programa(c_prestador, v_oferta, v_prog, c_mascota, v_hoy + 2, '06:00');
  RESET ROLE;
  v_pc := (v_r->>'programa_contratado_id')::uuid;

  -- ── T2: registro feliz — chips de LOS DOS vocabularios + texto ─────
  SET LOCAL ROLE authenticated;
  v_r := registrar_bitacora_familia(
    c_mascota,
    'Hoy se sentó solo antes de comer.',
    '[{"tipo":"objetivo","codigo":"sentado"},{"tipo":"conducta","codigo":"durmio_tranquilo"}]'::jsonb
  );
  RESET ROLE;
  SELECT count(*) INTO v_n FROM evento_bitacora_chips
  WHERE bitacora_id = (v_r->>'bitacora_id')::uuid;
  SELECT em.tipo || '/' || COALESCE((em.datos->>'programa_contratado_id'), 'NULL') || '/' || (em.datos->>'aportado_por_menor')
  INTO v_txt
  FROM eventos_mascota em WHERE em.id = (v_r->>'evento_id')::uuid;
  v_res := v_res || CASE WHEN (v_r->>'ok')::boolean AND v_n = 2
      AND (v_r->>'programa_contratado_id')::uuid = v_pc
      AND v_txt = 'bitacora_familia/' || v_pc::text || '/false'
    THEN 'T2 OK (2 chips de dos vocabularios, ancla al programa, hito en el spine, menor=false); '
    ELSE 'T2 FALLO (chips=' || v_n || ', hito=' || COALESCE(v_txt,'NULL') || '); ' END;

  -- ── T3: vacía y chip inválido rebotan ──────────────────────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := registrar_bitacora_familia(c_mascota, '   ', '[]'::jsonb);
    v_res := v_res || 'T3a FALLO (vacía entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'bitacora_vacia%'
      THEN 'T3a OK (bitacora_vacia); ' ELSE 'T3a FALLO (' || SQLERRM || '); ' END;
  END;
  BEGIN
    v_r := registrar_bitacora_familia(c_mascota, NULL, '[{"tipo":"conducta","codigo":"inventada"}]'::jsonb);
    v_res := v_res || 'T3b FALLO (chip inválido entró); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'chip_invalido%'
      THEN 'T3b OK (chip_invalido); ' ELSE 'T3b FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T4: P5 — el MENOR queda marcado, derivado server-side ──────────
  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = c_mascota;
  UPDATE familia_miembro SET rol = 'menor'
  WHERE familia_id = v_familia AND user_id = c_user AND hasta IS NULL;
  SET LOCAL ROLE authenticated;
  v_r := registrar_bitacora_familia(c_mascota, 'anotación del menor', '[]'::jsonb);
  RESET ROLE;
  UPDATE familia_miembro SET rol = 'adulto_titular'
  WHERE familia_id = v_familia AND user_id = c_user AND hasta IS NULL;
  SELECT aportado_por_menor INTO v_txt FROM evento_bitacora_familia
  WHERE id = (v_r->>'bitacora_id')::uuid;
  v_res := v_res || CASE WHEN v_txt = 'true' AND (v_r->>'aportado_por_menor')::boolean
    THEN 'T4 OK (P5: aportado_por_menor derivado del rol, jamás del cliente); '
    ELSE 'T4 FALLO (menor=' || COALESCE(v_txt,'NULL') || '); ' END;

  -- ── T5: catálogo de conductas sembrado preliminar y bilingüe ───────
  SELECT count(*), count(*) FILTER (WHERE NOT es_seed_preliminar OR btrim(nombre_familia_en) = '')
  INTO v_n, v_txt
  FROM cat_conductas_bitacora;
  v_res := v_res || CASE WHEN v_n = 10 AND v_txt::int = 0
    THEN 'T5 OK (10 conductas preliminares bilingües); '
    ELSE 'T5 FALLO (n=' || v_n || ', rotas=' || v_txt || '); ' END;

  RAISE EXCEPTION 'ASSERTS_S63_BITACORA (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;
