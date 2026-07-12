-- =====================================================================
-- S56-A TANDA D-341 + D-342 + precio_plan (pedido literal de la B,
-- regla 76b, + orden founder/arquitecto de la misma tanda).
--
-- D-341 — prestador_bloqueos deja de ser letra muerta: un rango de
-- bloqueo (vacaciones) mata la OFERTA nueva y el HOLD nuevo en sus
-- fechas. Diseno de la B ratificado: _agenda_ocupacion INTACTA (su
-- contrato es CONTEO de ocupacion; el bloqueo es INDISPONIBILIDAD —
-- mezclarlos mataria el error tipado slot_ocupado vs
-- prestador_no_disponible). Helper UNICO _prestador_bloqueado
-- (inclusive ambos extremos, granularidad DIA) para que la semantica
-- jamas diverja entre puertas.
--
-- SEMANTICA (del pedido, ley): el bloqueo NO toca citas ya
-- pagadas/confirmadas dentro del rango — eso es P14/P16 (falla del
-- prestador, credito/reembolso a eleccion), flujo aparte y JAMAS
-- automatico aca. La agenda del prestador sigue mostrando sus firmes.
--
-- ALCANCE AMPLIADO (anclaje semantico, nota 3 del arquitecto): la B
-- relevo 4 callers de _agenda_ocupacion PRE-D-338; hoy son SEIS — los
-- dos del plan entran a la tanda: _generar_citas_plan (el plan no
-- nace sobre vacaciones) y saltar_cita_plan (no se mueve una salida a
-- un dia bloqueado). Bodies reproducidos de pg_get_functiondef REAL.
--
-- precio_plan (contrato B/arquitecto, forma final de la A):
-- prestador_servicios.precio_plan numeric NULL = precio POR SALIDA
-- dentro del plan (el descuento por volumen de Decision S). SIN CHECK
-- relacional contra precio (solo sanidad >= 0): el prestador es dueno
-- de su descuento. NULL = sin descuento (rige el precio del bloque).
-- contratar/renovar usan COALESCE(precio_plan, precio); el aviso 72h
-- DECLARA el precio del periodo nuevo.
--
-- D-342 — higiene de las mismas tablas (verificado literal ANTES de
-- dropear, regla 59): policies duplicadas pb_own/ps_own/ph_own (mismo
-- qual que prestador_*_own, SIN with_check — sobrevive la que lo
-- tiene) + CHECK dia_semana duplicado en prestador_horarios.
-- =====================================================================

-- ── precio_plan: el descuento por volumen del prestador (Decision S) ──
ALTER TABLE public.prestador_servicios
  ADD COLUMN IF NOT EXISTS precio_plan numeric;
ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT chk_precio_plan_valido CHECK (precio_plan IS NULL OR precio_plan >= 0);
COMMENT ON COLUMN public.prestador_servicios.precio_plan IS
  'D-338/S56: precio POR SALIDA dentro del PLAN mensual (descuento por volumen, Decision S). NULL = sin descuento (rige precio). Sin CHECK relacional contra precio: el prestador es dueno de su descuento. Lo configura /servicios (lado B).';

-- ── D-341.0: EL HELPER (unico, semantica del rango en UN lugar) ──────
CREATE FUNCTION public._prestador_bloqueado(p_prestador_id uuid, p_fecha date)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $func$
  SELECT EXISTS (
    SELECT 1
    FROM prestador_bloqueos b
    WHERE b.prestador_id = p_prestador_id
      AND p_fecha BETWEEN b.fecha_inicio AND b.fecha_fin
  );
$func$;

-- L-140: interna del motor como _agenda_ocupacion (las puertas son DEFINER).
REVOKE EXECUTE ON FUNCTION public._prestador_bloqueado(uuid, date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._prestador_bloqueado(uuid, date) TO service_role;

CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(p_prestador_id uuid, p_servicio_id uuid, p_desde date, p_hasta date)
 RETURNS TABLE(fecha date, hora time without time zone, duracion_minutos integer, cupos_restantes integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dur int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde OR (p_hasta - p_desde) > 60 THEN
    RAISE EXCEPTION 'rango_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- La duración de la OFERTA manda la ventana (S55-B2): un slot se
  -- oferta solo si [hora, hora+duración) cabe entero.
  SELECT ps.duracion_minutos INTO v_dur
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_dur IS NULL OR v_dur <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH dias AS (
    SELECT d::date AS dia
    FROM generate_series(p_desde::timestamp, p_hasta::timestamp, interval '1 day') AS d
  ),
  slots AS (
    SELECT
      di.dia AS s_fecha,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      COALESCE(h.max_citas_por_slot, 1) AS s_cupo
    FROM prestador_horarios h
    JOIN dias di ON EXTRACT(DOW FROM di.dia)::int = h.dia_semana          -- regla 32
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
  )
  SELECT s.s_fecha, s.s_hora, v_dur,
         (s.s_cupo - _agenda_ocupacion(p_prestador_id, s.s_fecha, s.s_hora, v_dur))::int
  FROM slots s
  WHERE
    -- la ventana entera cabe en SU franja (no cruza el fin ni el hueco)
    EXTRACT(EPOCH FROM s.s_hora)::int + v_dur * 60 <= EXTRACT(EPOCH FROM s.s_fin)::int
    -- cupo libre en TODO el recorrido de la ventana (solapamiento real)
    AND (s.s_cupo - _agenda_ocupacion(p_prestador_id, s.s_fecha, s.s_hora, v_dur)) > 0
    AND (s.s_fecha + s.s_hora) > v_ahora_local
    AND NOT _prestador_bloqueado(p_prestador_id, s.s_fecha)   -- D-341
  ORDER BY 1, 2;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obtener_inicios_paseo_disponibles(p_fecha date, p_duracion_minutos integer)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT DISTINCT s.s_hora
  FROM (
    SELECT
      pr.id AS s_prestador,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      COALESCE(h.max_citas_por_slot, 1) AS s_cupo
    FROM prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
    JOIN prestador_horarios h    ON h.prestador_id = pr.id
                                AND h.activo
                                AND h.duracion_slot_minutos > 0
                                AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
                                AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int  -- regla 32
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE ps.activo
      AND ps.duracion_minutos = p_duracion_minutos
  ) s
  WHERE
    -- la ventana entera cabe en SU franja
    EXTRACT(EPOCH FROM s.s_hora)::int + p_duracion_minutos * 60 <= EXTRACT(EPOCH FROM s.s_fin)::int
    -- cupo libre en TODO el recorrido (motor S55-B2)
    AND (s.s_cupo - _agenda_ocupacion(s.s_prestador, p_fecha, s.s_hora, p_duracion_minutos)) > 0
    AND (p_fecha + s.s_hora) > v_ahora_local
    AND NOT _prestador_bloqueado(s.s_prestador, p_fecha)      -- D-341
  ORDER BY 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  -- Ventana en el pasado: resultado VACÍO sin error (la UI ya filtra las
  -- horas de hoy; esto es el cinturón, no el mensaje).
  IF (p_fecha + p_hora) <= v_ahora_local THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.precio,
    ps.duracion_minutos
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  WHERE ps.activo
    AND ps.duracion_minutos = p_duracion_minutos
    AND NOT _prestador_bloqueado(pr.id, p_fecha)              -- D-341
    AND EXISTS (
      -- La franja CONTIENE la ventana [hora, hora+duración], alineada a
      -- la grilla (regla 32: dia_semana 0=Domingo = EXTRACT(DOW), sin
      -- transformaciones) y con cupo tras la colisión (helper único).
      SELECT 1
      FROM prestador_horarios h
      WHERE h.prestador_id = pr.id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
        AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + p_duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
        AND _agenda_ocupacion(pr.id, p_fecha, p_hora, p_duracion_minutos)
            < COALESCE(h.max_citas_por_slot, 1)
    )
  ORDER BY 5, 3;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_horario     record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_expira      timestamptz;
  v_direccion   jsonb;   -- D-339
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- S55-B2: la duración de la oferta entra al snapshot junto al precio.
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente en la fecha (vacaciones) no
  -- recibe holds nuevos. Antes de validar franja: el error dice la
  -- verdad (prestador_no_disponible, no fuera_de_horario).
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- Serializa reservas concurrentes del mismo prestador+día.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- La VENTANA COMPLETA cae en una franja activa, alineada a la grilla
  -- (S55-B2: antes solo el slot de inicio — el bug del doble-booking).
  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32: 0=Domingo
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- Colisión por VENTANA contra firmes + holds vigentes (helper único).
  v_ocupados := _agenda_ocupacion(p_prestador_id, p_fecha, p_hora, v_servicio.duracion_minutos);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;

  SELECT cte.eje_jtbd, cte.visibilidad_default
  INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: en citas de categoría paseo, la dirección del hogar entra al
  -- snapshot al nacer el hold. NULL honesto si el hogar aún no la tiene
  -- (el checkout la captura UNA vez y el pago la congela).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  -- 1. Hito padre (evento_id es FK RESTRICT; el flujo de atención lo exige).
  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  -- 2. La cita nace HOLD: invisible al prestador (verdad firme) hasta que
  --    el pago la confirme. SNAPSHOT de precio Y duración (S55-B2) y de
  --    dirección del hogar (D-339, S56).
  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion
  ) RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'duracion_minutos', v_servicio.duracion_minutos,
    'fecha', p_fecha,
    'hora', p_hora
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public._generar_citas_plan(p_suscripcion_id uuid, p_periodo_inicio date, p_periodo_fin date, p_pagado_en timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_susc      record;
  v_fecha     date;
  v_horario   record;
  v_ocupados  int;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento_id uuid;
  v_direccion jsonb;
  v_n         int := 0;
  v_ahora     timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = p_suscripcion_id;
  IF v_susc.id IS NULL THEN
    RAISE EXCEPTION 'plan_no_encontrado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = v_susc.mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_susc.user_id);

  FOR v_fecha IN SELECT * FROM _fechas_periodo_plan(p_periodo_inicio, v_susc.dias_semana, v_susc.frecuencia)
  LOOP
    IF (v_fecha + v_susc.hora) <= v_ahora THEN
      CONTINUE;  -- el arranque del plan jamás fabrica citas en el pasado
    END IF;

    -- D-341: el plan tampoco nace sobre las vacaciones del paseador.
    IF _prestador_bloqueado(v_susc.prestador_id, v_fecha) THEN
      RAISE EXCEPTION 'prestador_no_disponible: %', v_fecha USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('agenda:' || v_susc.prestador_id::text || ':' || v_fecha::text, 0)
    );

    -- La ventana completa cabe en una franja activa, alineada (S55-B2).
    SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
    INTO v_horario
    FROM prestador_horarios h
    WHERE h.prestador_id = v_susc.prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int          -- regla 32
      AND v_susc.hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM v_susc.hora)::int + v_susc.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (v_susc.hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    LIMIT 1;
    IF v_horario.dur IS NULL THEN
      RAISE EXCEPTION 'fuera_de_horario: %', v_fecha USING ERRCODE = '22023';
    END IF;

    v_ocupados := _agenda_ocupacion(v_susc.prestador_id, v_fecha, v_susc.hora, v_susc.duracion_minutos);
    IF v_ocupados >= v_horario.cupo THEN
      RAISE EXCEPTION 'fecha_sin_cupo: %', v_fecha USING ERRCODE = '22023';
    END IF;

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
      creado_por_user_id, datos, visibilidad, country_code
    ) VALUES (
      v_susc.mascota_id, 'cita_servicio', v_eje, (v_fecha + v_susc.hora), v_susc.prestador_id,
      v_susc.user_id,
      jsonb_build_object('origen', 'plan_paseo', 'suscripcion_servicio_id', p_suscripcion_id),
      v_visib, COALESCE(v_country, 'EC')
    ) RETURNING id INTO v_evento_id;

    INSERT INTO evento_cita_servicio (
      evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
      fecha, hora, precio, duracion_minutos, estado, estado_reserva,
      expira_en, country_code, suscripcion_servicio_id, direccion_snapshot, metadata
    ) VALUES (
      v_evento_id, v_susc.user_id, v_susc.mascota_id, v_susc.prestador_id,
      (SELECT ps.tipo_servicio FROM prestador_servicios ps WHERE ps.id = v_susc.prestador_servicio_id),
      v_fecha, v_susc.hora, v_susc.precio_unitario_efectivo, v_susc.duracion_minutos,
      'confirmada', 'pagada',
      NULL, COALESCE(v_country, 'EC'), p_suscripcion_id, v_direccion,
      jsonb_build_object('origen', 'plan', 'pago_simulado', true, 'pagado_en', p_pagado_en,
                         'periodo_inicio', p_periodo_inicio, 'periodo_fin', p_periodo_fin)
    );

    v_n := v_n + 1;
  END LOOP;

  RETURN v_n;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.saltar_cita_plan(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_susc     record;
  v_horario  record;
  v_ocupados int;
  v_ahora    timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_nueva_fecha IS NULL OR p_nueva_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- P14(c): con <24 h la cita se pierde — no hay reagenda automática.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'aviso_tarde' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_cita.suscripcion_servicio_id;
  -- dentro del MISMO período y jamás al pasado
  IF p_nueva_fecha < v_susc.periodo_inicio OR p_nueva_fecha >= v_susc.periodo_fin THEN
    RAISE EXCEPTION 'fuera_del_periodo' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover una salida a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_susc.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET fecha = p_nueva_fecha,
      hora = p_nueva_hora,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'reagendada_de', jsonb_build_object('fecha', v_cita.fecha, 'hora', v_cita.hora),
        'reagendada_en', now()
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  UPDATE eventos_mascota
  SET fecha_evento = (p_nueva_fecha + p_nueva_hora)
  WHERE id = v_cita.evento_id;

  RETURN jsonb_build_object(
    'ok', true, 'cita_id', p_cita_id,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.contratar_plan_paseo(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_dias smallint[], p_hora time without time zone, p_frecuencia text, p_auto_renovar boolean DEFAULT true, p_fecha_inicio date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_cuenta    record;
  v_fee       uuid;
  v_dias      smallint[];
  v_inicio    date;
  v_fin       date;
  v_n         int;
  v_total     numeric(14,2);
  v_unitario  numeric(14,2);
  v_susc_id   uuid;
  v_pagado_en timestamptz := now();
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_precio_unidad numeric;   -- COALESCE(precio_plan, precio) — Decisión S
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_frecuencia IS NULL OR p_frecuencia NOT IN ('semanal','quincenal','mensual') THEN
    RAISE EXCEPTION 'frecuencia_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  -- días normalizados (sin duplicados, orden natural, convención regla 32)
  SELECT array_agg(DISTINCT d ORDER BY d) INTO v_dias
  FROM unnest(COALESCE(p_dias, ARRAY[]::smallint[])) AS d
  WHERE d BETWEEN 0 AND 6;
  IF v_dias IS NULL OR array_length(v_dias, 1) IS NULL THEN
    RAISE EXCEPTION 'dias_invalidos' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.precio_plan, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL OR v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0
     OR v_servicio.precio IS NULL OR v_servicio.precio < 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- un plan activo por mascota+prestador (el hub muestra UNO)
  IF EXISTS (
    SELECT 1 FROM suscripciones_servicio s
    WHERE s.mascota_id = p_mascota_id AND s.prestador_id = p_prestador_id
      AND s.tipo_servicio = 'paseo_mensual' AND s.estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'plan_duplicado' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  --    confirmar_cita_pagada): un cobro que el motor rechazará al
  --    cierre es un cobro que promete mentira.
  SELECT cc.id, cc.estado INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = p_prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    (SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id),
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- el período arranca en la primera fecha del plan (desde mañana)
  v_inicio := COALESCE(p_fecha_inicio, v_hoy_local + 1);
  IF v_inicio <= v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  SELECT min(f) INTO v_inicio FROM _fechas_periodo_plan(v_inicio, v_dias, 'semanal') f;
  IF v_inicio IS NULL THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;
  v_fin := (v_inicio + interval '1 month')::date;

  SELECT count(*) INTO v_n FROM _fechas_periodo_plan(v_inicio, v_dias, p_frecuencia);
  IF v_n = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- Decisión S: el descuento por volumen del prestador vive en
  -- prestador_servicios.precio_plan (precio POR SALIDA dentro del plan;
  -- NULL = sin descuento, rige el precio del bloque suelto).
  v_precio_unidad := COALESCE(v_servicio.precio_plan, v_servicio.precio);
  v_total    := round(v_precio_unidad * v_n, 2);
  v_unitario := round(v_total / v_n, 2);

  -- UN cobro simulado DECLARADO por el período (jamás toca el ledger).
  INSERT INTO suscripciones_servicio (
    user_id, mascota_id, prestador_id, prestador_servicio_id, empleado_id,
    tipo_servicio, estado, estado_pago, periodo_inicio, periodo_fin,
    precio_mensual, precio_pagado, proximo_cobro_en, auto_renovar,
    dias_semana, hora, duracion_minutos, frecuencia, precio_unitario_efectivo,
    country_code, activado_en, pago_metadata
  ) VALUES (
    v_auth, p_mascota_id, p_prestador_id, v_servicio.id, NULL,
    'paseo_mensual', 'activa', 'pagado', v_inicio, v_fin,
    v_total, v_total, v_fin, COALESCE(p_auto_renovar, true),
    v_dias, p_hora, v_servicio.duracion_minutos, p_frecuencia, v_unitario,
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    now(),
    jsonb_build_object('cobros', jsonb_build_array(jsonb_build_object(
      'periodo_inicio', v_inicio, 'periodo_fin', v_fin,
      'total', v_total, 'credito_aplicado', 0, 'cobrado', v_total,
      'pagado_en', v_pagado_en, 'pago_simulado', true
    )))
  ) RETURNING id INTO v_susc_id;

  -- las citas del período, firmes, con el motor de ventana (atómico:
  -- si una fecha no cabe, TODO el plan rebota y el cobro no nace)
  v_generadas := _generar_citas_plan(v_susc_id, v_inicio, v_fin, v_pagado_en);
  IF v_generadas = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- si el filtro de pasado descartó fechas, el cobro se ajusta a lo REAL
  IF v_generadas <> v_n THEN
    v_total    := round(v_precio_unidad * v_generadas, 2);
    v_unitario := round(v_total / v_generadas, 2);
    UPDATE suscripciones_servicio
    SET precio_mensual = v_total, precio_pagado = v_total,
        precio_unitario_efectivo = v_unitario,
        pago_metadata = jsonb_build_object('cobros', jsonb_build_array(jsonb_build_object(
          'periodo_inicio', v_inicio, 'periodo_fin', v_fin,
          'total', v_total, 'credito_aplicado', 0, 'cobrado', v_total,
          'pagado_en', v_pagado_en, 'pago_simulado', true
        )))
    WHERE id = v_susc_id;
    UPDATE evento_cita_servicio SET precio = v_unitario
    WHERE suscripcion_servicio_id = v_susc_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'suscripcion_id', v_susc_id,
    'periodo_inicio', v_inicio,
    'periodo_fin', v_fin,
    'citas_generadas', v_generadas,
    'total_periodo', v_total,
    'precio_unitario_efectivo', v_unitario,
    'auto_renovar', COALESCE(p_auto_renovar, true),
    'pagado_en', v_pagado_en
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cerrar_y_renovar_planes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_susc       record;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_sobrantes  int;
  v_credito    numeric(14,2);
  v_oferta     record;
  v_inicio     date;
  v_fin        date;
  v_n          int;
  v_total      numeric(14,2);
  v_unitario   numeric(14,2);
  v_cobrado    numeric(14,2);
  v_pagado_en  timestamptz;
  v_aviso_key  text;
  v_precio_prox numeric;
  v_n_prox     int;
  v_avisados   int := 0;
  v_renovados  int := 0;
  v_vencidos   int := 0;
  v_errores    int := 0;
BEGIN
  FOR v_susc IN
    SELECT * FROM suscripciones_servicio
    WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
    ORDER BY periodo_fin
    FOR UPDATE
  LOOP
    BEGIN
      -- (a) AVISO 72 h antes de renovar — UNA noticia serena (LOYALTY §6-7).
      v_aviso_key := 'aviso72h_' || v_susc.periodo_fin::text;
      IF v_susc.auto_renovar
         AND v_susc.periodo_fin - 3 <= v_hoy AND v_hoy < v_susc.periodo_fin
         AND NOT (v_susc.pago_metadata ? v_aviso_key) THEN
        -- el aviso DECLARA el precio del período nuevo (contrato B/arquitecto
        -- S56): oferta vigente (precio_plan si existe) × salidas estimadas.
        SELECT COALESCE(ps.precio_plan, ps.precio) INTO v_precio_prox
        FROM prestador_servicios ps
        WHERE ps.id = v_susc.prestador_servicio_id AND ps.activo;
        SELECT count(*) INTO v_n_prox
        FROM _fechas_periodo_plan(v_susc.periodo_fin, v_susc.dias_semana, v_susc.frecuencia);
        INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
        VALUES (
          v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
          'Tu plan de paseo se renueva pronto',
          'El ' || to_char(v_susc.periodo_fin, 'DD/MM') || ' se renueva tu plan'
            || CASE WHEN v_precio_prox IS NOT NULL AND v_n_prox > 0
                    THEN ' por $' || round(v_precio_prox * v_n_prox, 2)
                    ELSE '' END
            || '. Si prefieres pausarlo, es un toque desde Mis paseos. (Pago simulado — fase de pruebas.)',
          jsonb_build_object('subtipo', 'plan_renovacion_72h', 'suscripcion_servicio_id', v_susc.id),
          'pet_parent'
        );
        UPDATE suscripciones_servicio
        SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
        WHERE id = v_susc.id;
        v_avisados := v_avisados + 1;
      END IF;

      -- (b) CIERRE del período vencido.
      IF v_susc.periodo_fin <= v_hoy THEN
        -- sobrantes = citas pagadas sin ejecutar al cierre (P14a)
        SELECT count(*) INTO v_sobrantes
        FROM evento_cita_servicio c
        WHERE c.suscripcion_servicio_id = v_susc.id
          AND c.estado = 'confirmada'
          AND c.fecha >= v_susc.periodo_inicio AND c.fecha < v_susc.periodo_fin;
        v_credito := round(COALESCE(v_susc.precio_unitario_efectivo, 0) * v_sobrantes, 2);

        UPDATE evento_cita_servicio
        SET estado = 'cancelada',
            metadata = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('motivo', 'cierre_periodo_plan', 'cerrada_en', now()),
            updated_at = now()
        WHERE suscripcion_servicio_id = v_susc.id
          AND estado = 'confirmada'
          AND fecha >= v_susc.periodo_inicio AND fecha < v_susc.periodo_fin;

        IF v_susc.auto_renovar THEN
          -- re-snapshot de la oferta VIGENTE (Decisión S: cobro en cada renovación)
          SELECT ps.id, ps.precio, ps.precio_plan, ps.duracion_minutos INTO v_oferta
          FROM prestador_servicios ps
          WHERE ps.id = v_susc.prestador_servicio_id AND ps.activo;

          IF v_oferta.id IS NULL THEN
            RAISE EXCEPTION 'servicio_no_disponible';
          END IF;

          v_inicio := v_susc.periodo_fin;
          v_fin := (v_inicio + interval '1 month')::date;
          SELECT count(*) INTO v_n FROM _fechas_periodo_plan(v_inicio, v_susc.dias_semana, v_susc.frecuencia);
          IF v_n = 0 THEN
            RAISE EXCEPTION 'plan_sin_citas';
          END IF;
          v_total    := round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2);
          v_unitario := round(v_total / v_n, 2);
          v_cobrado  := greatest(v_total - v_credito, 0);
          v_pagado_en := now();

          UPDATE suscripciones_servicio
          SET periodo_inicio = v_inicio,
              periodo_fin = v_fin,
              precio_mensual = v_total,
              precio_pagado = v_cobrado,
              precio_unitario_efectivo = v_unitario,
              duracion_minutos = v_oferta.duracion_minutos,
              proximo_cobro_en = v_fin,
              ultima_actividad_en = now(),
              pago_metadata = pago_metadata || jsonb_build_object(
                'cobros', COALESCE(pago_metadata->'cobros', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                  'periodo_inicio', v_inicio, 'periodo_fin', v_fin,
                  'total', v_total, 'credito_aplicado', v_credito, 'cobrado', v_cobrado,
                  'pagado_en', v_pagado_en, 'pago_simulado', true
                ))
              )
          WHERE id = v_susc.id;

          v_n := _generar_citas_plan(v_susc.id, v_inicio, v_fin, v_pagado_en);
          IF v_n = 0 THEN
            RAISE EXCEPTION 'plan_sin_citas';
          END IF;
          -- si el cron corrió tarde y fechas pasadas se descartaron, el
          -- cobro se ajusta a lo REAL generado (jamás cobrar aire)
          SELECT count(*) INTO v_n FROM evento_cita_servicio
          WHERE suscripcion_servicio_id = v_susc.id AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
          IF round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2) <> v_total THEN
            v_total    := round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2);
            v_unitario := round(v_total / v_n, 2);
            v_cobrado  := greatest(v_total - v_credito, 0);
            UPDATE suscripciones_servicio
            SET precio_mensual = v_total, precio_pagado = v_cobrado,
                precio_unitario_efectivo = v_unitario
            WHERE id = v_susc.id;
            UPDATE evento_cita_servicio SET precio = v_unitario
            WHERE suscripcion_servicio_id = v_susc.id AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
          END IF;

          INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
          VALUES (
            v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
            'Tu plan de paseo se renovó',
            'Nuevo período hasta el ' || to_char(v_fin, 'DD/MM') ||
              CASE WHEN v_credito > 0 THEN '. Te acreditamos $' || v_credito || ' de citas sin usar.' ELSE '.' END ||
              ' (Pago simulado — fase de pruebas.)',
            jsonb_build_object('subtipo', 'plan_renovado', 'suscripcion_servicio_id', v_susc.id),
            'pet_parent'
          );
          v_renovados := v_renovados + 1;
        ELSE
          -- P14a/P14d: sin renovación — reembolso proporcional SIMULADO declarado
          UPDATE suscripciones_servicio
          SET estado = 'vencida',
              estado_pago = CASE WHEN v_credito > 0 THEN 'reembolsado' ELSE estado_pago END,
              pago_metadata = pago_metadata || CASE WHEN v_credito > 0 THEN jsonb_build_object(
                'reembolsos', COALESCE(pago_metadata->'reembolsos', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                  'monto', v_credito, 'citas', v_sobrantes,
                  'motivo', 'p14_reembolso_proporcional_no_renovacion',
                  'simulado', true, 'aplicado_en', now()
                ))
              ) ELSE '{}'::jsonb END
          WHERE id = v_susc.id;

          IF v_credito > 0 THEN
            INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
            VALUES (
              v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
              'Tu plan de paseo terminó',
              'Quedaron ' || v_sobrantes || ' salidas sin usar: te corresponde un reembolso de $' || v_credito || '. (Pago simulado — fase de pruebas.)',
              jsonb_build_object('subtipo', 'plan_vencido_reembolso', 'suscripcion_servicio_id', v_susc.id),
              'pet_parent'
            );
          END IF;
          v_vencidos := v_vencidos + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- una renovación imposible NO puede matar la corrida: el plan
      -- vence honesto, los sobrantes se declaran, el dueño se entera.
      v_errores := v_errores + 1;
      UPDATE suscripciones_servicio
      SET estado = 'vencida',
          pago_metadata = pago_metadata || jsonb_build_object(
            'renovacion_fallida', jsonb_build_object('error', SQLERRM, 'en', now())
          )
      WHERE id = v_susc.id AND periodo_fin <= v_hoy;
      INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
      VALUES (
        v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
        'No pudimos renovar tu plan de paseo',
        'La agenda del paseador cambió y el nuevo período no se pudo armar. Tu plan quedó sin renovarse — puedes rearmarlo desde Mis paseos.',
        jsonb_build_object('subtipo', 'plan_renovacion_fallida', 'suscripcion_servicio_id', v_susc.id),
        'pet_parent'
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'renovados', v_renovados,
    'vencidos', v_vencidos, 'errores', v_errores, 'corrida_en', now()
  );
END;
$function$
;

-- ── D-342: higiene (duplicados verificados literales pre-drop) ───────
DROP POLICY IF EXISTS pb_own ON public.prestador_bloqueos;
DROP POLICY IF EXISTS ps_own ON public.prestador_servicios;
DROP POLICY IF EXISTS ph_own ON public.prestador_horarios;
ALTER TABLE public.prestador_horarios
  DROP CONSTRAINT IF EXISTS chk_prestador_horarios_dia_semana_rango;

