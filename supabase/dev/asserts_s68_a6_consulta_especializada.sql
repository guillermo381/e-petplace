-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S68-A6 — `consulta_especializada`: los lectores V2 lo toman
-- SOLOS (categoria='veterinario' + reservable), sin tocar ningún body.
-- Patrón L-073/L-122b: DO imperativo, RAISE final = resultado + ROLLBACK
-- (residuos 0). Actores: Zeus (de300000-…0a5c, titular c5d54e3a) y la
-- clínica demo Aurora (de680000-…00e5 — cuenta activa + doc aprobado:
-- el trigger §14.2 no muerde el INSERT del assert).
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_mascota uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_clinica uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_n       int;
  v_fila    record;
  v_res     text := '';
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);

  -- ── T1: SIN oferta, el tipo NO aparece en la vitrina vet ───────────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_oferta_vet(c_mascota) o
  WHERE o.tipo_servicio = 'consulta_especializada';
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T1 OK (sin oferta no aparece); '
    ELSE 'T1 FALLO (aparece sin oferta, n=' || v_n || '); ' END;

  -- ── SETUP: la clínica demo activa el comprable con precio ──────────
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
  VALUES (c_clinica, 'consulta_especializada', 35, 45, true);

  -- ── T2: CON oferta activa, el tipo aparece — sin tocar lectores ────
  SET LOCAL ROLE authenticated;
  SELECT o.* INTO v_fila FROM obtener_oferta_vet(c_mascota) o
  WHERE o.tipo_servicio = 'consulta_especializada';
  RESET ROLE;
  v_res := v_res || CASE
    WHEN v_fila.tipo_servicio = 'consulta_especializada'
     AND v_fila.desde_precio = 35
     AND v_fila.reserva_solo_hoy = false
    THEN 'T2 OK (aparece: desde $' || v_fila.desde_precio || ', solo_hoy=' || v_fila.reserva_solo_hoy || '); '
    ELSE 'T2 FALLO (' || COALESCE(v_fila.tipo_servicio, 'NULL') || '/' || COALESCE(v_fila.desde_precio::text, 'NULL') || '); ' END;

  -- ── T3: el QUIÉN también lo resuelve (helper único, fecha futura sin
  --        franjas de Aurora aún = 0 filas es legal; el assert es que la
  --        RPC ACEPTA el tipo, no que haya agenda) ─────────────────────
  BEGIN
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_n
    FROM obtener_inicios_vet_disponibles(
      (now() AT TIME ZONE 'America/Guayaquil')::date + 1, 'consulta_especializada', c_mascota);
    v_res := v_res || 'T3 OK (inicios acepta el tipo; n=' || v_n || ' sin franjas de la clínica: legal); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || 'T3 FALLO (' || SQLERRM || '); ';
  END;
  RESET ROLE;

  RAISE EXCEPTION 'ASSERTS_S68_A6 (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;