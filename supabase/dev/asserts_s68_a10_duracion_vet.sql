-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S68-A10 — guard de piso duracion_vet (trigger, cruza catálogo).
-- Patrón L-073/L-122b: DO imperativo, RAISE final = resultado + ROLLBACK
-- (residuos 0). Actores: la clínica demo Aurora (de680000-…00e5, doc
-- aprobado — §14.2 no muerde) para lo médico; el Wizard S58
-- (de580000-…00b1, sin docs) para probar paseo/grooming intocados.
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_vet    uuid := 'de680000-0000-4000-8000-0000000000e5';
  c_wizard uuid := 'de580000-0000-4000-8000-0000000000b1';
  v_of     uuid;
  v_res    text := '';
BEGIN
  -- ── T1: 20' médico LEGAL pasa (y 10', el borde vivo de Satori) ─────
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_vet, 'consulta_general', 20, 20, true)
    RETURNING id INTO v_of;
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_vet, 'vacunacion', 15, 10, true);
    v_res := v_res || 'T1 OK (20'' y 10'' médicos entran); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || 'T1 FALLO (' || SQLERRM || '); ';
  END;

  -- ── T2: 23' rebota duracion_invalida ───────────────────────────────
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_vet, 'urgencia_local', 30, 23, true);
    v_res := v_res || 'T2 FALLO (23'' aceptado); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'duracion_invalida%'
      THEN 'T2 OK (23'' rebota duracion_invalida); '
      ELSE 'T2 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── T3: 5' rebota (bajo el piso aunque sea múltiplo de 5) ──────────
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_vet, 'consulta_especializada', 35, 5, true);
    v_res := v_res || 'T3 FALLO (5'' aceptado); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'duracion_invalida%'
      THEN 'T3 OK (5'' rebota duracion_invalida); '
      ELSE 'T3 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── T4: el UPDATE también muerde (la puerta entera, no solo el alta) ─
  BEGIN
    UPDATE prestador_servicios SET duracion_minutos = 23 WHERE id = v_of;
    v_res := v_res || 'T4 FALLO (update a 23'' aceptado); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'duracion_invalida%'
      THEN 'T4 OK (update a 23'' rebota); '
      ELSE 'T4 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── T5: paseo y grooming INTOCADOS (el guard no cruza oficios) ─────
  BEGIN
    -- paseo 30' legal de su propio menú canónico
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_wizard, 'paseo', 5, 30, true);
    -- grooming 7': VIOLARÍA el piso vet — pasa porque es_medico=false
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_wizard, 'grooming', 12, 7, true);
    v_res := v_res || 'T5 OK (paseo 30'' y grooming 7'' entran: guard solo médico); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || 'T5 FALLO (' || SQLERRM || '); ';
  END;

  RAISE EXCEPTION 'ASSERTS_S68_A10 (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;