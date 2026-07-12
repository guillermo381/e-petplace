-- Verificación D-341 (pedido LITERAL de la B, S56) + asserts A6-A8 de la
-- A (ampliación semántica: los callers del plan + precio_plan). Un solo
-- RUN, termina en ROLLBACK. Éxito = la última fila dice
-- 'D-341 VERDE: A1-A5 (+A6-A8)'. Correr:
--   npx supabase --experimental db query --linked -f supabase/dev/test_d341_bloqueos_s56.sql
BEGIN;

DO $$
DECLARE
  v_prestador uuid; v_servicio uuid; v_dur int;
  v_dueno uuid;     v_mascota uuid;
  v_fecha date;     v_fecha2 date;    v_hora time;
  v_base1 int;      v_base2 int;      v_ini_base int;
  v_n int;          v_bloqueo uuid;   v_err text;
BEGIN
  -- Setup 1: un prestador ofertable REAL
  SELECT pr.id, ps.id, ps.duracion_minutos INTO v_prestador, v_servicio, v_dur
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN prestador_servicios ps ON ps.prestador_id = pr.id AND ps.activo AND ps.tipo_servicio = 'paseo'
  WHERE pr.estado = 'activo'
    AND EXISTS (SELECT 1 FROM prestador_horarios h
                WHERE h.prestador_id = pr.id AND h.activo AND h.duracion_slot_minutos > 0
                  AND (h.servicio_id IS NULL OR h.servicio_id = ps.id))
  LIMIT 1;
  IF v_prestador IS NULL THEN RAISE EXCEPTION 'SETUP: no hay prestador ofertable'; END IF;

  -- Setup 2: un dueño con mascota propia (para el hold)
  SELECT m.id, m.user_id INTO v_mascota, v_dueno
  FROM mascotas m WHERE m.user_id IS NOT NULL LIMIT 1;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'SETUP: no hay mascota con dueño'; END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role', 'authenticated')::text, true);

  -- Setup 3: primera fecha futura con franja + su fecha espejo (+7 = mismo DOW)
  SELECT d::date INTO v_fecha
  FROM generate_series(current_date + 1, current_date + 14, interval '1 day') AS d
  WHERE EXISTS (SELECT 1 FROM prestador_horarios h
                WHERE h.prestador_id = v_prestador AND h.activo
                  AND h.dia_semana = EXTRACT(DOW FROM d)::int)
  ORDER BY 1 LIMIT 1;
  IF v_fecha IS NULL THEN RAISE EXCEPTION 'SETUP: sin franja en 14 días'; END IF;
  v_fecha2 := v_fecha + 7;

  -- Baselines SIN bloqueo
  SELECT count(*) INTO v_base1 FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha,  v_fecha);
  SELECT count(*) INTO v_base2 FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha2, v_fecha2);
  SELECT count(*) INTO v_ini_base FROM obtener_inicios_paseo_disponibles(v_fecha, v_dur);
  IF v_base1 = 0 THEN RAISE EXCEPTION 'SETUP: baseline sin slots en %', v_fecha; END IF;
  SELECT hora INTO v_hora FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha, v_fecha) LIMIT 1;
  SELECT count(*) INTO v_n FROM obtener_paseadores_disponibles(v_fecha, v_hora, v_dur) p
   WHERE p.prestador_id = v_prestador;
  IF v_n = 0 THEN RAISE EXCEPTION 'SETUP: el prestador no aparece en el QUIÉN a las %', v_hora; END IF;

  -- EL BLOQUEO BAJO PRUEBA
  INSERT INTO prestador_bloqueos (prestador_id, fecha_inicio, fecha_fin, motivo)
  VALUES (v_prestador, v_fecha, v_fecha, 'ASSERT D-341 — muere con el ROLLBACK')
  RETURNING id INTO v_bloqueo;

  -- A1: el bloqueo mata la oferta del día ENTERA
  SELECT count(*) INTO v_n FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha, v_fecha);
  IF v_n <> 0 THEN RAISE EXCEPTION 'A1 FALLO: % slots ofertados dentro del bloqueo', v_n; END IF;

  -- A2: los inicios agregados jamás CRECEN, y el QUIÉN pierde al prestador
  SELECT count(*) INTO v_n FROM obtener_inicios_paseo_disponibles(v_fecha, v_dur);
  IF v_n > v_ini_base THEN RAISE EXCEPTION 'A2 FALLO: inicios crecieron con el bloqueo'; END IF;
  SELECT count(*) INTO v_n FROM obtener_paseadores_disponibles(v_fecha, v_hora, v_dur) p
   WHERE p.prestador_id = v_prestador;
  IF v_n <> 0 THEN RAISE EXCEPTION 'A2b FALLO: el prestador bloqueado sigue en el QUIÉN'; END IF;

  -- A3: el hold dentro del bloqueo muere con el error TIPADO
  BEGIN
    PERFORM crear_bloqueo_agenda(v_prestador, v_servicio, v_mascota, v_fecha, v_hora);
    RAISE EXCEPTION 'A3 FALLO: el hold entró con el prestador bloqueado';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE 'prestador_no_disponible%' THEN
      RAISE EXCEPTION 'A3 FALLO: error inesperado: %', v_err;
    END IF;
  END;

  -- A4: FUERA del rango nada cambia (misma franja, +7 días)
  SELECT count(*) INTO v_n FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha2, v_fecha2);
  IF v_n <> v_base2 THEN RAISE EXCEPTION 'A4 FALLO: el bloqueo tocó una fecha fuera del rango'; END IF;

  -- A6 (ampliación A): el PLAN no nace sobre el bloqueo — contratar con
  -- el día bloqueado adentro rebota tipado y no persiste NADA.
  BEGIN
    PERFORM contratar_plan_paseo(v_prestador, v_servicio, v_mascota,
      ARRAY[EXTRACT(DOW FROM v_fecha)::smallint], v_hora, 'semanal', true, v_fecha);
    RAISE EXCEPTION 'A6 FALLO: el plan entró sobre el bloqueo';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE 'prestador_no_disponible%' THEN
      RAISE EXCEPTION 'A6 FALLO: error inesperado: %', v_err;
    END IF;
  END;
  SELECT count(*) INTO v_n FROM suscripciones_servicio WHERE prestador_id = v_prestador;
  IF v_n <> 0 THEN RAISE EXCEPTION 'A6 FALLO: quedó suscripción a medias'; END IF;

  -- A7 (ampliación A): precio_plan rige el total del plan (fuera del bloqueo)
  UPDATE prestador_servicios SET precio_plan = 1.50 WHERE id = v_servicio;
  DECLARE
    v_r jsonb;
  BEGIN
    SELECT contratar_plan_paseo(v_prestador, v_servicio, v_mascota,
      ARRAY[EXTRACT(DOW FROM v_fecha2)::smallint], v_hora, 'semanal', true, v_fecha2) INTO v_r;
    IF (v_r->>'precio_unitario_efectivo')::numeric <> 1.50 THEN
      RAISE EXCEPTION 'A7 FALLO: unitario % en vez de precio_plan 1.50', v_r->>'precio_unitario_efectivo';
    END IF;
    IF (v_r->>'total_periodo')::numeric <> round(1.50 * (v_r->>'citas_generadas')::int, 2) THEN
      RAISE EXCEPTION 'A7 FALLO: total no es precio_plan × N';
    END IF;
  END;

  -- A8 (ampliación A): mover una salida a un día bloqueado rebota tipado
  DECLARE
    v_cita uuid;
  BEGIN
    SELECT id INTO v_cita FROM evento_cita_servicio
    WHERE prestador_id = v_prestador AND suscripcion_servicio_id IS NOT NULL AND estado = 'confirmada'
    ORDER BY fecha DESC LIMIT 1;
    BEGIN
      PERFORM saltar_cita_plan(v_cita, v_fecha, v_hora);
      RAISE EXCEPTION 'A8 FALLO: la salida se movió a un día bloqueado';
    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE 'prestador_no_disponible%' AND v_err NOT LIKE 'fuera_del_periodo%' AND v_err NOT LIKE 'aviso_tarde%' THEN
        RAISE EXCEPTION 'A8 FALLO: error inesperado: %', v_err;
      END IF;
      IF v_err NOT LIKE 'prestador_no_disponible%' THEN
        -- la fecha bloqueada cayó fuera del período o <24h: probar el
        -- helper directo para no dejar A8 sin dientes
        IF NOT _prestador_bloqueado(v_prestador, v_fecha) THEN
          RAISE EXCEPTION 'A8 FALLO: helper no ve el bloqueo';
        END IF;
      END IF;
    END;
  END;

  -- A5: borrado el bloqueo, el día vuelve al baseline EXACTO
  DELETE FROM prestador_bloqueos WHERE id = v_bloqueo;
  SELECT count(*) INTO v_n FROM obtener_slots_disponibles(v_prestador, v_servicio, v_fecha, v_fecha);
  IF v_n <> v_base1 THEN RAISE EXCEPTION 'A5 FALLO: no volvió al baseline (% vs %)', v_n, v_base1; END IF;

  RAISE NOTICE 'D-341 VERDE: A1-A5 (prestador %, fecha %)', v_prestador, v_fecha;
END $$;

-- Marcador visible para el CLI (el NOTICE no viaja): esta fila SOLO
-- aparece si el DO de arriba terminó sin excepción.
SELECT 'D-341 VERDE: A1-A5 (+A6-A8)' AS resultado;

ROLLBACK;
