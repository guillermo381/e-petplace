-- ═════════════════════════════════════════════════════════════════════
-- ASSERTS S68-A1 — reservable en dos niveles · urgencia same-day ·
-- guard verificacion_profesional_pendiente (primer lector §14.2).
-- Patrón L-073/L-122b: DO imperativo; el RAISE final porta el resultado
-- y fuerza ROLLBACK (residuos 0). Ids demo relevados (titular c5d54e3a,
-- Zeus de300000-…0a5c, prestador Andres de300000-…00e5, Wizard S58
-- de580000-…00b1 sin documentos).
-- Post-V0: la franja de assert lleva empleado_id (NOT NULL).
-- ═════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  c_user      uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  c_mascota   uuid := 'de300000-0000-4000-8000-000000000a5c';
  c_prestador uuid := 'de300000-0000-4000-8000-0000000000e5';
  c_wizard    uuid := 'de580000-0000-4000-8000-0000000000b1';
  v_ahora     timestamp := (now() AT TIME ZONE 'America/Guayaquil');
  v_hoy       date;
  v_emp       uuid;
  v_of_tele   uuid;
  v_of_urg    uuid;
  v_ini       timestamp;
  v_hora      time;
  v_r         jsonb;
  v_n         int;
  v_cita      uuid;
  v_res       text := '';
BEGIN
  v_hoy := v_ahora::date;
  PERFORM set_config('request.jwt.claims',
    '{"sub":"c5d54e3a-cf1a-45c6-8605-dfd826b022ee","role":"authenticated"}', true);

  SELECT pe.id INTO v_emp FROM prestador_empleados pe
  WHERE pe.prestador_id = c_prestador AND pe.rol = 'dueño' AND pe.activo LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'ASSERTS_S68_A1 abort: el prestador demo no tiene titular';
  END IF;

  -- ── T1: SIN doc aprobado, activar oferta de tipo con gate rebota ───
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_prestador, 'telemedicina', 15, 20, true);
    v_res := v_res || 'T1 FALLO (activó sin doc profesional); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'verificacion_profesional_pendiente%'
      THEN 'T1 OK (verificacion_profesional_pendiente); '
      ELSE 'T1 FALLO (' || SQLERRM || '); ' END;
  END;

  -- ── SETUP: doc profesional APROBADO in-txn (ciclo admin simulado) ──
  INSERT INTO prestador_documentos (prestador_id, tipo, nombre, archivo_url, estado, revisado_en)
  VALUES (c_prestador, 'titulo_profesional', '[ASSERT S68] Título', 'assert/titulo.pdf', 'aprobado', now());

  -- ── T2: CON doc aprobado, la misma oferta ENTRA (ambos sentidos) ───
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_prestador, 'telemedicina', 15, 20, true)
    RETURNING id INTO v_of_tele;
    v_res := v_res || 'T2 OK (con doc aprobado la oferta entra); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || 'T2 FALLO (' || SQLERRM || '); ';
  END;

  -- ── T3: telemedicina ACTIVA no aparece en la vitrina vet ───────────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_oferta_vet(c_mascota) o
  WHERE o.tipo_servicio = 'telemedicina';
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T3 OK (telemedicina activa fuera de vitrina); '
    ELSE 'T3 FALLO (telemedicina en vitrina, n=' || v_n || '); ' END;

  -- ── T4: el HOLD sobre telemedicina rebota servicio_no_reservable ───
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := crear_bloqueo_agenda(c_prestador, v_of_tele, c_mascota, v_hoy + 1, '10:00', NULL);
    v_res := v_res || 'T4 FALLO (hold aceptado sobre no-reservable); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'servicio_no_reservable%'
      THEN 'T4 OK (hold rebota servicio_no_reservable); '
      ELSE 'T4 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T5: los SLOTS sobre telemedicina rebotan servicio_no_reservable ─
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM * FROM obtener_slots_disponibles(c_prestador, v_of_tele, v_hoy, v_hoy + 7);
    v_res := v_res || 'T5 FALLO (slots servidos sobre no-reservable); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'servicio_no_reservable%'
      THEN 'T5 OK (slots rebotan servicio_no_reservable); '
      ELSE 'T5 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── SETUP urgencia: oferta urgencia_local del prestador demo ───────
  INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
  VALUES (c_prestador, 'urgencia_local', 25, 30, true)
  RETURNING id INTO v_of_urg;

  -- ── T6: hold de urgencia para MAÑANA rebota urgencia_solo_hoy ──────
  BEGIN
    SET LOCAL ROLE authenticated;
    v_r := crear_bloqueo_agenda(c_prestador, v_of_urg, c_mascota, v_hoy + 1, '10:00', NULL);
    v_res := v_res || 'T6 FALLO (urgencia aceptada para mañana); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'urgencia_solo_hoy%'
      THEN 'T6 OK (urgencia_solo_hoy); '
      ELSE 'T6 FALLO (' || SQLERRM || '); ' END;
  END;
  RESET ROLE;

  -- ── T7/T8: same-day feliz + la urgencia pagada no viaja a otro día ─
  -- la alineación del slot es RELATIVA a hora_inicio de la franja, no
  -- al reloj: la franja de assert nace en ahora+15' exacto y el hold
  -- entra en su primer slot. Solo se saltea pegado a medianoche
  -- (necesita +30' de ventana antes de 23:59).
  v_ini := date_trunc('minute', v_ahora) + interval '15 minutes';
  v_hora := v_ini::time;
  IF v_ini::date <> v_hoy OR v_hora > '23:29'::time THEN
    v_res := v_res || 'T7 SKIP (corrida cerca de medianoche); T8 SKIP; ';
  ELSE
    INSERT INTO prestador_horarios
      (prestador_id, empleado_id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
    VALUES
      (c_prestador, v_emp, NULL, EXTRACT(DOW FROM v_hoy)::int, v_hora, '23:59'::time, 30, 1, true);

    BEGIN
      SET LOCAL ROLE authenticated;
      v_r := crear_bloqueo_agenda(c_prestador, v_of_urg, c_mascota, v_hoy, v_hora, NULL);
      v_cita := (v_r->>'cita_id')::uuid;
      v_r := confirmar_cita_pagada(v_cita);
      v_res := v_res || CASE WHEN (v_r->>'estado_reserva') = 'pagada'
        THEN 'T7 OK (urgencia HOY: hold + pago simulado e2e); '
        ELSE 'T7 FALLO (estado_reserva=' || COALESCE(v_r->>'estado_reserva','NULL') || '); ' END;
    EXCEPTION WHEN OTHERS THEN
      v_res := v_res || 'T7 FALLO (' || SQLERRM || '); ';
    END;
    RESET ROLE;

    IF v_cita IS NOT NULL THEN
      BEGIN
        SET LOCAL ROLE authenticated;
        v_r := reagendar_cita_suelta(v_cita, v_hoy + 1, v_hora);
        v_res := v_res || 'T8 FALLO (urgencia reagendada a mañana); ';
      EXCEPTION WHEN OTHERS THEN
        v_res := v_res || CASE WHEN SQLERRM LIKE 'urgencia_solo_hoy%'
          THEN 'T8 OK (reagenda rebota urgencia_solo_hoy); '
          ELSE 'T8 FALLO (' || SQLERRM || '); ' END;
      END;
      RESET ROLE;
    END IF;
  END IF;

  -- ── T9: la vitrina vet dice urgencia con reserva_solo_hoy=true ─────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n FROM obtener_oferta_vet(c_mascota) o
  WHERE o.tipo_servicio = 'urgencia_local' AND o.reserva_solo_hoy;
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 1
    THEN 'T9 OK (urgencia en vitrina, declarada solo-hoy); '
    ELSE 'T9 FALLO (n=' || v_n || '); ' END;

  -- ── T10: inicios vet de urgencia para MAÑANA = vacío (cinturón) ────
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n
  FROM obtener_inicios_vet_disponibles(v_hoy + 1, 'urgencia_local', c_mascota);
  RESET ROLE;
  v_res := v_res || CASE WHEN v_n = 0
    THEN 'T10 OK (inicios de urgencia mañana: vacío); '
    ELSE 'T10 FALLO (n=' || v_n || '); ' END;

  -- ── T11: el guard es del TIPO, no del código — y no molesta a los
  --         tipos sin gate (prestador Wizard S58, cero documentos) ────
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_wizard, 'consulta_general', 20, 30, true);
    v_res := v_res || 'T11a FALLO (consulta activada sin doc); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || CASE WHEN SQLERRM LIKE 'verificacion_profesional_pendiente%'
      THEN 'T11a OK (consulta_general gateada); '
      ELSE 'T11a FALLO (' || SQLERRM || '); ' END;
  END;
  BEGIN
    INSERT INTO prestador_servicios (prestador_id, tipo_servicio, precio, duracion_minutos, activo)
    VALUES (c_wizard, 'paseo', 5, 30, true);
    v_res := v_res || 'T11b OK (paseo sin gate entra); ';
  EXCEPTION WHEN OTHERS THEN
    v_res := v_res || 'T11b FALLO (' || SQLERRM || '); ';
  END;

  RAISE EXCEPTION 'ASSERTS_S68_A1 (ROLLBACK forzado, residuos 0): %', v_res;
END;
$$;