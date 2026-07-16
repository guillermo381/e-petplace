-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S63 — VOCABULARIO + RESOLUTOR QUIÉN/QUÉ ADIESTRAMIENTO
-- Patrón L-073/L-122b: DO imperativo; el RAISE final porta el resultado
-- y fuerza el ROLLBACK — residuos 0 por construcción. Nota: las
-- semillas de los catálogos NO son residuo (las depositó la migración
-- 20260715200000, versionada — este guion no las toca).
-- Ids demo relevados S63: titular c5d54e3a-…, Zeus demo de300000-…0a5c,
-- prestador [DEMO S44] Paseos Andres de300000-…00e5.
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_mascota   uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_prestador uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_fecha     date;
  v_oferta    uuid;
  v_prog      uuid;
  v_n         int;
  v_n2        int;
  v_txt       text;
  v_res       text := '';
BEGIN
  v_fecha := v_hoy + 2;

  -- ── T1: semillas del vocabulario — preliminares y bilingües ────────
  SELECT count(*),
         count(*) FILTER (WHERE NOT es_seed_preliminar OR btrim(nombre_familia) = '' OR btrim(nombre_familia_en) = '')
  INTO v_n, v_n2
  FROM cat_objetivos_adiestramiento;
  v_res := v_res || CASE WHEN v_n = 23 AND v_n2 = 0
    THEN 'T1 OK (23 objetivos, todos preliminares y bilingües); '
    ELSE 'T1 FALLO (n=' || v_n || ', rotos=' || v_n2 || '); ' END;

  SELECT count(*), count(*) FILTER (WHERE nivel = 'especialidad') INTO v_n, v_n2
  FROM cat_curriculum_adiestramiento;
  v_res := v_res || CASE WHEN v_n = 19 AND v_n2 = 0
    THEN 'T1b OK (currículum 19, solo escalera troncal); '
    ELSE 'T1b FALLO (n=' || v_n || ', especialidad=' || v_n2 || '); ' END;

  -- ── T2: integridad del currículum ──────────────────────────────────
  BEGIN
    INSERT INTO cat_curriculum_adiestramiento (nivel, objetivo_codigo, sesion_sugerida)
    VALUES ('basico', 'objetivo_inexistente', 1);
    v_res := v_res || 'T2a FALLO (FK no rige); ';
  EXCEPTION WHEN foreign_key_violation THEN
    v_res := v_res || 'T2a OK (FK objetivo); ';
  END;
  BEGIN
    INSERT INTO cat_curriculum_adiestramiento (nivel, objetivo_codigo, sesion_sugerida)
    VALUES ('avanzadisimo', 'sentado', 1);
    v_res := v_res || 'T2b FALLO (nivel inválido entró); ';
  EXCEPTION WHEN check_violation THEN
    v_res := v_res || 'T2b OK (chk nivel); ';
  END;

  -- ── T3: el catálogo se LEE como authenticated y NO se escribe ──────
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento;
  BEGIN
    INSERT INTO cat_objetivos_adiestramiento (codigo, nombre, nombre_familia, nombre_familia_en)
    VALUES ('hackeo', 'x', 'x', 'x');
    v_res := v_res || 'T3 FALLO (authenticated escribió el catálogo); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN v_n = 23
      THEN 'T3 OK (lee 23, escritura rebotada: ' || left(SQLERRM, 40) || '); '
      ELSE 'T3 FALLO (lee ' || v_n || '); ' END;
  END;
  RESET ROLE;

  -- ── SETUP resolutor (in-txn): oferta + programa + franja ───────────
  -- especies_compatibles explícito: el default '[]' (acote vacío) oculta
  -- la oferta — el wizard real lo puebla, acá lo hace el setup
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, nombre_custom, precio, duracion_minutos, activo, especies_compatibles)
  VALUES (c_prestador, 'adiestramiento', '[ASSERT S63] Sesión de adiestramiento', 25, 60, true, '["perro"]'::jsonb)
  RETURNING id INTO v_oferta;
  INSERT INTO prestador_programas (prestador_servicio_id, nivel, nombre, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion)
  VALUES (v_oferta, 'basico', '[ASSERT] Obediencia básica', 6, 100, 45, 60)
  RETURNING id INTO v_prog;
  INSERT INTO prestador_horarios (prestador_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  VALUES (c_prestador, NULL, EXTRACT(DOW FROM v_fecha)::int, '05:00', '08:00', 60, 1, true);

  -- ── T4: el helper devuelve LOS DOS comprables ──────────────────────
  SELECT count(*),
         count(*) FILTER (WHERE comprable = 'programa' AND programa_id = v_prog
                          AND precio = 100 AND n_sesiones = 6 AND vigencia_dias = 45)
  INTO v_n, v_n2
  FROM _adiestramiento_ofertas_cobrables(c_mascota)
  WHERE prestador_servicio_id = v_oferta;
  v_res := v_res || CASE WHEN v_n = 2 AND v_n2 = 1
    THEN 'T4 OK (sesión $25 + programa $100/6/45d); '
    ELSE 'T4 FALLO (filas=' || v_n || ', programa ok=' || v_n2 || '); ' END;

  -- ── T5: 7.13 — sin cuenta activa, la oferta DESAPARECE ─────────────
  -- chk_estado_consistente (relevado L-060): 'suspendida' exige suspendido_en
  UPDATE cuentas_comerciales SET estado = 'suspendida', suspendido_en = now()
  WHERE id = (SELECT cuenta_comercial_id FROM prestadores WHERE id = c_prestador);
  SELECT count(*) INTO v_n FROM _adiestramiento_ofertas_cobrables(c_mascota)
  WHERE prestador_servicio_id = v_oferta;
  UPDATE cuentas_comerciales SET estado = 'activa', activado_en = now(), suspendido_en = NULL
  WHERE id = (SELECT cuenta_comercial_id FROM prestadores WHERE id = c_prestador);
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T5 OK (cuenta suspendida = 0 ofertas, 7.13); '
    ELSE 'T5 FALLO (quedaron ' || v_n || '); ' END;

  -- ── T6: el QUIÉN con disponibilidad real ───────────────────────────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_adiestradores_disponibles(v_fecha, '06:00', c_mascota)
  WHERE prestador_servicio_id = v_oferta;
  -- control a las 03:00: las franjas UNIVERSALES del demo (modo D-386)
  -- aplican a toda oferta y cubren horario diurno — 09:00 SÍ es válida
  SELECT count(*) INTO v_n2 FROM obtener_adiestradores_disponibles(v_fecha, '03:00', c_mascota)
  WHERE prestador_servicio_id = v_oferta;
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 2 AND v_n2 = 0
    THEN 'T6 OK (06:00 en franja = 2 comprables; 03:00 fuera = 0); '
    ELSE 'T6 FALLO (en=' || v_n || ', fuera=' || v_n2 || '); ' END;
  -- (nota: 09:00 devuelve las 2 filas por las franjas universales del
  --  demo — comportamiento CORRECTO del modo universal, no falla)

  -- ── T7: especie — el techo ["perro"] rebota tipado ─────────────────
  UPDATE mascotas SET especie = 'gato' WHERE id = c_mascota;
  BEGIN
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_n FROM obtener_adiestradores_disponibles(v_fecha, '06:00', c_mascota);
    v_res := v_res || 'T7 FALLO (gato resolvió ofertas); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'mascota_no_elegible%'
      THEN 'T7 OK (mascota_no_elegible); ' ELSE 'T7 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;
  UPDATE mascotas SET especie = 'perro' WHERE id = c_mascota;

  -- ── T8: pasado = vacío SIN error (cinturón heredado) ───────────────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_adiestradores_disponibles(v_hoy - 1, '06:00', c_mascota);
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T8 OK (pasado = vacío sin error); '
    ELSE 'T8 FALLO (' || v_n || ' filas); ' END;

  RAISE EXCEPTION 'ASSERTS_S63B_RESULTADO (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;
