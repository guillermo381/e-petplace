-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S68-A7 — los tipos de presupuesto NO entran a la vitrina vet
-- ni con oferta activa sembrada (reservable=false a nivel tipo, S68-A7).
-- Patrón L-073/L-122b: DO imperativo, RAISE final = resultado + ROLLBACK
-- (residuos 0). Actores: Zeus (de300000-…0a5c) y la clínica demo Aurora
-- (de680000-…00e5, doc aprobado — el trigger §14.2 no muerde el INSERT).
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_mascota uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_clinica uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_of      uuid;
  v_n       int;
  v_res     text := '';
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);

  -- SETUP: la clínica siembra una CIRUGÍA activa con precio (el caso que
  -- el hueco latente habría dejado entrar a vitrina).
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
  VALUES (c_clinica, 'cirugia', 250, 120, true)
  RETURNING id INTO v_of;

  -- ── T1: el helper directo NO la oferta ─────────────────────────────
  SELECT count(*) INTO v_n FROM _vet_ofertas_cobrables(c_mascota) o
  WHERE o.tipo_servicio = 'cirugia';
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T1 OK (_vet_ofertas_cobrables no oferta cirugia con oferta activa); '
    ELSE 'T1 FALLO (n=' || v_n || '); ' END;

  -- ── T2: la vitrina del dueño tampoco ───────────────────────────────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_oferta_vet(c_mascota) o
  WHERE o.tipo_servicio = 'cirugia';
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T2 OK (obtener_oferta_vet no la vitrinea); '
    ELSE 'T2 FALLO (n=' || v_n || '); ' END;

  -- ── T3: el hold rebota tipado (la puerta, no solo la vitrina) ──────
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM crear_bloqueo_agenda(c_clinica, v_of, c_mascota,
      (now() AT TIME ZONE 'America/Guayaquil')::date + 1, '10:00', NULL);
    v_res := v_res || 'T3 FALLO (hold aceptado sobre presupuesto); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'servicio_no_reservable%'
      THEN 'T3 OK (hold rebota servicio_no_reservable); '
      ELSE 'T3 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  RAISE EXCEPTION 'ASSERTS_S68_A7 (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;