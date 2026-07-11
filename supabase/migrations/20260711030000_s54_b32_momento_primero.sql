-- ═════════════════════════════════════════════════════════════════════
-- S54 B3.2 — MOMENTO-PRIMERO (decisión founder, gate pantalla 1).
-- PROPUESTA — NO APLICAR sin OK del founder (regla 73).
--
-- 1. Helper interno _agenda_ocupacion: LA lógica de colisión (firmes +
--    holds vigentes con expiración perezosa) extraída a UNA sola copia.
--    Doble check del diseño: crear_bloqueo_agenda y la RPC nueva son
--    consultas puntuales (1 llamada); obtener_slots_disponibles la llama
--    por slot (≤ 16 slots/día × rango — costo de un count indexado por
--    llamada, aceptable a esta escala y elimina la 3ª copia del predicado).
-- 2. obtener_paseadores_disponibles(fecha, hora, duración): la consulta
--    INVERTIDA del mismo motor + regla founder S54: cuenta comercial
--    'activa' (no se oferta quien no puede cobrar).
-- 3. obtener_oferta_paseo(): la oferta derivada pasa a RPC DEFINER con
--    el MISMO criterio de cuenta activa — la RLS de cuentas_comerciales
--    es solo-owner y el wrapper no puede filtrar por cuenta del lado
--    cliente (relevado 11-Jul). El wrapper obtenerOfertaPaseo se
--    recablea a esta RPC (también alimenta el selector de duración del
--    paso CUÁNDO: solo duraciones que EXISTEN).
-- 4. crear_bloqueo_agenda y obtener_slots_disponibles re-emitidos con
--    la MISMA firma (L-119 no aplica) usando el helper — cero copias
--    duplicadas de la colisión.
-- ═════════════════════════════════════════════════════════════════════

-- ── 1 · Helper interno de ocupación (LA copia única de la colisión) ─────
-- INVOKER a propósito: solo lo llaman funciones DEFINER (corre como
-- postgres y ve todas las citas). Sin EXECUTE para roles de cliente.

CREATE OR REPLACE FUNCTION public._agenda_ocupacion(
  p_prestador_id uuid,
  p_fecha        date,
  p_hora         time,
  p_duracion_minutos integer
) RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)::int
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.hora >= p_hora
    AND EXTRACT(EPOCH FROM c.hora) < EXTRACT(EPOCH FROM p_hora) + p_duracion_minutos * 60
    AND (
      c.estado IN ('confirmada', 'en_curso')                               -- firmes
      OR (c.estado = 'pendiente'                                           -- holds vigentes
          AND c.estado_reserva = 'pendiente_pago'
          AND c.expira_en > now())                                         -- expiración perezosa
    );
$$;

REVOKE ALL ON FUNCTION public._agenda_ocupacion(uuid, date, time, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._agenda_ocupacion(uuid, date, time, integer) TO service_role;

-- ── 2 · RPC obtener_paseadores_disponibles — el QUIÉN para una ventana ──

CREATE OR REPLACE FUNCTION public.obtener_paseadores_disponibles(
  p_fecha            date,
  p_hora             time,
  p_duracion_minutos integer
)
RETURNS TABLE (
  prestador_id          uuid,
  prestador_servicio_id uuid,
  prestador_nombre      text,
  servicio_nombre       text,
  precio                numeric,
  duracion_minutos      integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.obtener_paseadores_disponibles(date, time, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time, integer) TO authenticated, service_role;

-- ── 3 · RPC obtener_oferta_paseo — la oferta derivada, criterio completo ─

CREATE OR REPLACE FUNCTION public.obtener_oferta_paseo()
RETURNS TABLE (
  prestador_servicio_id uuid,
  prestador_id          uuid,
  prestador_nombre      text,
  servicio_nombre       text,
  descripcion           text,
  duracion_minutos      integer,
  precio                numeric,
  especies_compatibles  jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    ps.id,
    pr.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.descripcion,
    COALESCE(ps.duracion_minutos, ts.duracion_default_minutos, 30),
    ps.precio,
    ps.especies_compatibles
  FROM prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  WHERE ps.activo
  ORDER BY 3, 4;
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_oferta_paseo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_oferta_paseo() TO authenticated, service_role;

-- ── 4a · crear_bloqueo_agenda re-emitida: la colisión sale del helper ───
-- MISMA firma; cambia SOLO el bloque de conteo de ocupación.

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(
  p_prestador_id uuid,
  p_servicio_id  uuid,
  p_mascota_id   uuid,
  p_fecha        date,
  p_hora         time
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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

  SELECT ps.id, ps.tipo_servicio, ps.precio
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- Serializa reservas concurrentes del mismo prestador+día.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- El slot debe caer en una franja activa, entero y alineado a la grilla.
  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32: 0=Domingo
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + h.duracion_slot_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- Colisión contra firmes + holds vigentes (helper único S54-B3.2).
  v_ocupados := _agenda_ocupacion(p_prestador_id, p_fecha, p_hora, v_horario.dur);
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
  --    el pago la confirme. SNAPSHOT de precio (checkout usa ESTE valor).
  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, estado, estado_reserva, expira_en, country_code
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, 'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'fecha', p_fecha,
    'hora', p_hora
  );
END;
$$;

-- ── 4b · obtener_slots_disponibles re-emitida con el helper ─────────────

CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(
  p_prestador_id uuid,
  p_servicio_id  uuid,
  p_desde        date,
  p_hasta        date
)
RETURNS TABLE (fecha date, hora time, duracion_minutos integer, cupos_restantes integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');
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
  IF NOT EXISTS (
    SELECT 1 FROM prestador_servicios ps
    WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo
  ) THEN
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
      h.duracion_slot_minutos AS s_dur,
      COALESCE(h.max_citas_por_slot, 1) AS s_cupo
    FROM prestador_horarios h
    JOIN dias di ON EXTRACT(DOW FROM di.dia)::int = h.dia_semana
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
  )
  SELECT s.s_fecha, s.s_hora, s.s_dur,
         (s.s_cupo - _agenda_ocupacion(p_prestador_id, s.s_fecha, s.s_hora, s.s_dur))::int
  FROM slots s
  WHERE (s.s_cupo - _agenda_ocupacion(p_prestador_id, s.s_fecha, s.s_hora, s.s_dur)) > 0
    AND (s.s_fecha + s.s_hora) > v_ahora_local
  ORDER BY 1, 2;
END;
$$;
