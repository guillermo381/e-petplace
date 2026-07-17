CREATE OR REPLACE FUNCTION public._agenda_ocupacion(p_prestador_id uuid, p_fecha date, p_hora time without time zone, p_duracion_minutos integer, p_excluir_cita uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  WITH ocupantes AS (
    SELECT EXTRACT(EPOCH FROM c.hora)::bigint                                    AS ini,
           EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60          AS fin
    FROM evento_cita_servicio c
    WHERE c.prestador_id = p_prestador_id
      AND c.fecha = p_fecha
      AND c.id IS DISTINCT FROM p_excluir_cita   -- D-349: la cita que se
      -- está moviendo no se cuenta a sí misma como ocupante
      AND (
        c.estado IN ('confirmada', 'en_curso')                                   -- firmes
        OR (c.estado = 'pendiente'                                               -- holds vigentes
            AND c.estado_reserva = 'pendiente_pago'
            AND c.expira_en > now())                                             -- expiración perezosa
      )
      -- solapa la ventana pedida: ini < fin_ventana AND fin > ini_ventana
      AND EXTRACT(EPOCH FROM c.hora)::bigint
          < EXTRACT(EPOCH FROM p_hora)::bigint + p_duracion_minutos * 60
      AND EXTRACT(EPOCH FROM c.hora)::bigint + c.duracion_minutos * 60
          > EXTRACT(EPOCH FROM p_hora)::bigint
  ),
  instantes AS (
    SELECT EXTRACT(EPOCH FROM p_hora)::bigint AS t
    UNION
    SELECT o.ini FROM ocupantes o
    WHERE o.ini > EXTRACT(EPOCH FROM p_hora)::bigint
  )
  SELECT COALESCE(MAX(n), 0)::int
  FROM (
    SELECT (SELECT count(*) FROM ocupantes o WHERE o.ini <= i.t AND o.fin > i.t) AS n
    FROM instantes i
  ) conteos;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._inicios_disponibles_prestador(p_prestador_id uuid, p_servicio_id uuid, p_fecha date, p_duracion_minutos integer)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT s.s_hora
  FROM (
    SELECT
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      COALESCE(h.max_citas_por_slot, 1) AS s_cupo
    FROM prestador_horarios h
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
  ) s
  WHERE p_duracion_minutos > 0
    -- la ventana entera cabe en SU franja
    AND EXTRACT(EPOCH FROM s.s_hora)::int + p_duracion_minutos * 60
        <= EXTRACT(EPOCH FROM s.s_fin)::int
    -- cupo libre en TODO el recorrido (motor S55-B2, helper único)
    AND (s.s_cupo - _agenda_ocupacion(p_prestador_id, p_fecha, s.s_hora, p_duracion_minutos)) > 0
    AND (p_fecha + s.s_hora) > (now() AT TIME ZONE 'America/Guayaquil')
    AND NOT _prestador_bloqueado(p_prestador_id, p_fecha);
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._prestador_bloqueado(p_prestador_id uuid, p_fecha date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM prestador_bloqueos b
    WHERE b.prestador_id = p_prestador_id
      AND p_fecha BETWEEN b.fecha_inicio AND b.fecha_fin
  );
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_adiestradores_disponibles(p_fecha date, p_hora time without time zone, p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, comprable text, programa_id uuid, nombre text, nivel text, n_sesiones integer, vigencia_dias integer, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- §1bis/§2: el techo de especie rebota tipado ANTES de resolver
  -- ('adiestramiento' es el único código del oficio hoy; el filtro por
  -- fila de abajo cubre códigos futuros).
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- Ventana en el pasado: resultado VACÍO sin error (cinturón, espejo
  -- del QUIÉN del paseo/grooming — la UI ya filtra las horas de hoy).
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
    o.tipo_servicio, o.comprable, o.programa_id, o.nombre,
    o.nivel, o.n_sesiones, o.vigencia_dias,
    o.precio, o.duracion_minutos, o.direccion, o.ciudad
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  WHERE _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.comprable, o.precio, o.nombre;
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_groomers_disponibles(p_fecha date, p_hora time without time zone, p_tipo_servicio text, p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text, precio_base numeric, extra_pelaje numeric, recargo_domicilio numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = p_tipo_servicio AND ts.categoria = 'grooming' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;
  -- Ventana en el pasado: resultado VACÍO sin error (cinturón, espejo del
  -- QUIÉN del paseo — la UI ya filtra las horas de hoy).
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad,
    -- S61 D-392: EL DESGLOSE server-side (el checkout lo DECLARA, jamás
    -- lo calcula): base por talla + extra pelaje aplicado + recargo.
    -- precio == precio_base + extra_pelaje + recargo_domicilio (mismos
    -- CASE del helper — una sola aritmética, la del server).
    (SELECT pst.precio FROM prestador_servicio_tallas pst
      WHERE pst.prestador_servicio_id = o.prestador_servicio_id
        AND pst.talla = v_talla),
    CASE WHEN (SELECT m.pelaje FROM mascotas m WHERE m.id = p_mascota_id) = 'largo'
         THEN COALESCE((SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END,
    CASE WHEN p_modalidad = 'domicilio'
         THEN COALESCE((SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  WHERE o.tipo_servicio = p_tipo_servicio
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_inicios_adiestramiento_disponibles(p_fecha date, p_mascota_id uuid, p_comprable text DEFAULT NULL::text)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_comprable IS NOT NULL AND p_comprable NOT IN ('sesion','programa') THEN
    RAISE EXCEPTION 'comprable_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- fecha enteramente en el pasado: vacío sin error (cinturón heredado)
  IF p_fecha < (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT i.hora
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  CROSS JOIN LATERAL _inicios_disponibles_prestador(
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
  ) i
  WHERE (p_comprable IS NULL OR o.comprable = p_comprable)
    AND _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    -- hoy: solo horas por delante (espejo del cinturón del QUIÉN)
    AND (p_fecha + i.hora) > (now() AT TIME ZONE 'America/Guayaquil')
  ORDER BY 1;
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_inicios_grooming_disponibles(p_fecha date, p_tipo_servicio text, p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(hora time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = p_tipo_servicio AND ts.categoria = 'grooming' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT DISTINCT i.hora
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  CROSS JOIN LATERAL _inicios_disponibles_prestador(
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
  ) i
  WHERE o.tipo_servicio = p_tipo_servicio
  ORDER BY 1;
END;
$function$


-- ============================================================

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


-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, duracion_minutos integer)
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
    -- D-375: el precio del plan viaja al dueño — espejo EXACTO de lo que
    -- el server de cobro resuelve (COALESCE en contratar_plan_paseo);
    -- NULL honesto = sin descuento de plan, rige el precio del bloque.
    ps.precio_plan,
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


-- ============================================================

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


-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text)
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
  v_modalidad   text;    -- S61 D-392: la modalidad del grooming ('local'/'domicilio')
  -- S59-A5: resolución grooming por talla (MODELO_GROOMING §2/§6)
  v_talla          text;
  v_pelaje         text;
  v_precio_talla   numeric;
  v_duracion_talla int;
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
  -- S61 D-392: las modalidades entran al record (el guard las lee)
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos, ps.atiende_local, ps.atiende_domicilio
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma — el NO registrado bloquea
  -- la reserva; NULL NO bloquea (dispara la pregunta única en la UI).
  -- Condicionado a paseo: este chasis lo comparten otros servicios
  -- (grooming hereda la reserva entera, MODELO_GROOMING §7).
  IF EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
     )
     AND NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  -- S59-A5 (MODELO_GROOMING §2/§6): el GROOMING cotiza por TALLA del
  -- PERFIL + extra fijo del groomer si el pelaje es largo, y su
  -- duración es la de la combinación servicio × talla — se resuelve
  -- ACÁ (server-side, antes de validar ventana/cupo con la duración
  -- real) y se CONGELA como snapshot en la cita, mismo patrón que el
  -- paseo. El flat de prestador_servicios queda como fallback SOLO
  -- para paseo. El server JAMÁS adivina: sin talla declarada, rebota
  -- tipado (la UI pregunta antes — flujo futuro).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'grooming'
  ) THEN
    SELECT m.talla, m.pelaje INTO v_talla, v_pelaje
    FROM mascotas m WHERE m.id = p_mascota_id;
    IF v_talla IS NULL THEN
      RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
    END IF;
    SELECT pst.precio, pst.duracion_minutos
    INTO v_precio_talla, v_duracion_talla
    FROM prestador_servicio_tallas pst
    WHERE pst.prestador_servicio_id = v_servicio.id AND pst.talla = v_talla;
    IF v_precio_talla IS NULL OR v_duracion_talla IS NULL THEN
      -- una oferta grooming ACTIVA sin esa talla viola el invariante de
      -- las 3 tallas (trigger diferido S59-A3) — dato roto: no se adivina.
      RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_pelaje = 'largo' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    -- S61 D-392: LA MODALIDAD del grooming — default 'local' (v1 era
    -- solo local; el default preserva a todo caller viejo). El recargo
    -- clona el camino del extra de pelaje: server-side, ANTES del
    -- congelado — el snapshot de la cita YA lo trae sumado.
    v_modalidad := COALESCE(p_modalidad, 'local');
    IF v_modalidad NOT IN ('local', 'domicilio') THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' AND NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'local' AND NOT v_servicio.atiende_local THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_servicio.precio := v_precio_talla;
    v_servicio.duracion_minutos := v_duracion_talla;
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente en la fecha (vacaciones) no
  -- recibe holds nuevos.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

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

  -- D-339: dirección del hogar al snapshot del hold (NULL honesto).
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  )
  -- S61 D-392: el grooming A DOMICILIO hereda D-339 VERBATIM — mismo
  -- snapshot NULL-honesto en el hold; el guard duro vive en el pago.
  OR v_modalidad = 'domicilio' THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot, modalidad
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion,
    -- S61 D-392: grooming porta 'local'/'domicilio'; el resto conserva
    -- su valor legacy ('presencial' — 46 filas relevadas, no se pisa).
    COALESCE(v_modalidad, 'presencial')
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


-- ============================================================

CREATE OR REPLACE FUNCTION public._generar_citas_programa(p_programa_contratado_id uuid, p_fecha_inicio date, p_hora time without time zone, p_pagado_en timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prog      record;
  v_tipo_srv  text;
  v_k         int;
  v_fecha     date;
  v_horario   record;
  v_ocupados  int;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento_id uuid;
  v_direccion jsonb;
  v_precio    numeric(14,2);
BEGIN
  SELECT * INTO v_prog FROM programas_contratados WHERE id = p_programa_contratado_id;
  IF v_prog.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_encontrado' USING ERRCODE = '22023';
  END IF;

  SELECT ps.tipo_servicio INTO v_tipo_srv
  FROM prestador_servicios ps WHERE ps.id = v_prog.prestador_servicio_id;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = v_prog.mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_prog.user_id);

  FOR v_k IN 1..v_prog.n_sesiones LOOP
    v_fecha := p_fecha_inicio + ((v_k - 1) * 7);

    -- la vigencia congelada debe cubrir el calendario completo
    IF v_fecha > v_prog.vigencia_hasta THEN
      RAISE EXCEPTION 'programa_excede_vigencia: %', v_fecha USING ERRCODE = '22023';
    END IF;

    -- D-341: el programa tampoco nace sobre las vacaciones del adiestrador.
    IF _prestador_bloqueado(v_prog.prestador_id, v_fecha) THEN
      RAISE EXCEPTION 'prestador_no_disponible: %', v_fecha USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('agenda:' || v_prog.prestador_id::text || ':' || v_fecha::text, 0)
    );

    -- La ventana completa cabe en una franja activa, alineada (S55-B2).
    SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
    INTO v_horario
    FROM prestador_horarios h
    WHERE h.prestador_id = v_prog.prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM v_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_prog.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    LIMIT 1;
    IF v_horario.dur IS NULL THEN
      RAISE EXCEPTION 'fuera_de_horario: %', v_fecha USING ERRCODE = '22023';
    END IF;

    v_ocupados := _agenda_ocupacion(v_prog.prestador_id, v_fecha, p_hora, v_prog.duracion_minutos, NULL);
    IF v_ocupados >= v_horario.cupo THEN
      RAISE EXCEPTION 'fecha_sin_cupo: %', v_fecha USING ERRCODE = '22023';
    END IF;

    -- la ÚLTIMA sesión absorbe el residuo: sum(precios) == precio_total
    IF v_k = v_prog.n_sesiones THEN
      v_precio := v_prog.precio_total - v_prog.precio_unitario_efectivo * (v_prog.n_sesiones - 1);
    ELSE
      v_precio := v_prog.precio_unitario_efectivo;
    END IF;

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
      creado_por_user_id, datos, visibilidad, country_code
    ) VALUES (
      v_prog.mascota_id, 'cita_servicio', v_eje, (v_fecha + p_hora), v_prog.prestador_id,
      v_prog.user_id,
      jsonb_build_object('origen', 'programa_adiestramiento',
                         'programa_contratado_id', p_programa_contratado_id,
                         'sesion_numero', v_k),
      v_visib, COALESCE(v_country, 'EC')
    ) RETURNING id INTO v_evento_id;

    INSERT INTO evento_cita_servicio (
      evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
      fecha, hora, precio, duracion_minutos, estado, estado_reserva,
      expira_en, country_code, programa_contratado_id, sesion_numero,
      direccion_snapshot, metadata
    ) VALUES (
      v_evento_id, v_prog.user_id, v_prog.mascota_id, v_prog.prestador_id, v_tipo_srv,
      v_fecha, p_hora, v_precio, v_prog.duracion_minutos,
      'confirmada', 'pagada',
      NULL, COALESCE(v_country, 'EC'), p_programa_contratado_id, v_k,
      v_direccion,
      jsonb_build_object('origen', 'programa', 'pago_simulado', true, 'pagado_en', p_pagado_en,
                         'n_sesiones', v_prog.n_sesiones)
    );
  END LOOP;

  RETURN v_prog.n_sesiones;
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.contratar_programa(p_prestador_id uuid, p_servicio_id uuid, p_programa_id uuid, p_mascota_id uuid, p_fecha_inicio date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_programa  record;
  v_cuenta    record;
  v_fee       uuid;
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_pagado_en timestamptz := now();
  v_vigencia  date;
  v_unitario  numeric(14,2);
  v_pc_id     uuid;
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_hora IS NULL OR p_fecha_inicio IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  -- §12.2: todas al comprar — el arranque jamás en el pasado ni hoy
  -- (el gate temporal del cierre exige aire entre compra y sesión 1).
  IF p_fecha_inicio <= v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'adiestramiento' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- §1bis heredado (F3 S57): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  SELECT pp.* INTO v_programa
  FROM prestador_programas pp
  WHERE pp.id = p_programa_id AND pp.prestador_servicio_id = p_servicio_id AND pp.activo;
  IF v_programa.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- una matrícula ACTIVA del mismo programa por mascota
  IF EXISTS (
    SELECT 1 FROM programas_contratados pc
    WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'programa_duplicado' USING ERRCODE = '22023';
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

  -- vigencia congelada A LA FECHA DE COMPRA (decisión founder S63)
  v_vigencia := v_hoy_local + v_programa.vigencia_dias;
  v_unitario := round(v_programa.precio_programa / v_programa.n_sesiones, 2);

  -- UN cobro simulado DECLARADO por el programa entero (jamás el ledger).
  INSERT INTO programas_contratados (
    programa_id, user_id, mascota_id, prestador_id, prestador_servicio_id,
    n_sesiones, precio_total, precio_unitario_efectivo, duracion_minutos,
    vigencia_hasta, estado, estado_pago, country_code, pago_metadata
  ) VALUES (
    p_programa_id, v_auth, p_mascota_id, p_prestador_id, p_servicio_id,
    v_programa.n_sesiones, v_programa.precio_programa, v_unitario,
    v_programa.duracion_minutos_sesion,
    v_vigencia, 'activo', 'pagado',
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    jsonb_build_object('cobros', jsonb_build_array(jsonb_build_object(
      'total', v_programa.precio_programa,
      'n_sesiones', v_programa.n_sesiones,
      'pagado_en', v_pagado_en, 'pago_simulado', true
    )))
  ) RETURNING id INTO v_pc_id;

  -- las N sesiones, firmes y EN ORDEN, con el motor de ventana
  -- (atómico: si una no cabe, TODO el programa rebota y el cobro no nace)
  v_generadas := _generar_citas_programa(v_pc_id, p_fecha_inicio, p_hora, v_pagado_en);
  IF v_generadas <> v_programa.n_sesiones THEN
    RAISE EXCEPTION 'programa_incompleto' USING ERRCODE = '22023';  -- defensivo: no debería ocurrir
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'programa_contratado_id', v_pc_id,
    'n_sesiones', v_programa.n_sesiones,
    'primera_sesion', p_fecha_inicio,
    'ultima_sesion', p_fecha_inicio + ((v_programa.n_sesiones - 1) * 7),
    'vigencia_hasta', v_vigencia,
    'precio_total', v_programa.precio_programa,
    'precio_unitario_efectivo', v_unitario,
    'pagado_en', v_pagado_en
  );
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.confirmar_cita_pagada(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_cita      record;
  v_cuenta    record;
  v_fee       uuid;
  v_pagado_en timestamptz;
  v_direccion jsonb;   -- D-339
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'no_es_tu_cita' USING ERRCODE = '42501';
  END IF;
  IF v_cita.estado = 'confirmada' AND v_cita.estado_reserva = 'pagada' THEN
    RAISE EXCEPTION 'cita_ya_confirmada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'pendiente' OR v_cita.estado_reserva <> 'pendiente_pago' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, v_cita.estado_reserva
      USING ERRCODE = '22023';
  END IF;

  -- Expiración perezosa: un hold vencido se trata como inexistente.
  IF v_cita.expira_en IS NOT NULL AND v_cita.expira_en <= now() THEN
    RAISE EXCEPTION 'hold_expirado' USING ERRCODE = '22023';
  END IF;

  IF v_cita.prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_prestador' USING ERRCODE = '22023';
  END IF;
  -- Snapshot de §5; cita_sin_precio queda para holds legacy malformados.
  IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
    RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero (SIN insertar) ─────────────
  SELECT cc.id, cc.moneda, cc.estado
  INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = v_cita.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;

  -- Tanda S54-B (a): la cuenta debe estar ACTIVA — pagar contra una
  -- cuenta pendiente/suspendida/cerrada promete una liquidación que
  -- generar_liquidacion rechaza (§7.11).
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios'
      AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;

  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    p_cuenta_comercial_id => v_cuenta.id,
    p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
    p_country_code        => v_cita.country_code,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_tipo_origen         => 'cita',
    p_categoria_origen    => NULL,
    p_fecha_referencia    => now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- D-339: hold que nació sin dirección + checkout que la capturó = el
  -- pago la congela. Un snapshot existente NO se pisa. S61 D-392: el
  -- grooming A DOMICILIO hereda el mecanismo VERBATIM.
  IF v_cita.direccion_snapshot IS NULL AND (
    EXISTS (
      SELECT 1 FROM tipos_servicio ts
      WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'paseo'
    )
    OR v_cita.modalidad = 'domicilio'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  -- S61 D-392, EL GUARD: la cita a DOMICILIO no se paga sin dirección —
  -- la promesa "el groomer sabe a dónde ir" es del MOTOR, no de la UI.
  IF v_cita.modalidad = 'domicilio'
     AND v_cita.direccion_snapshot IS NULL
     AND v_direccion IS NULL THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;

  -- ── Transición doble en el MISMO UPDATE: cita firme + pago simulado
  --    registrado. metadata.pagado_en será fecha_cobro_kushki en el cierre.
  v_pagado_en := now();
  UPDATE evento_cita_servicio
  SET estado         = 'confirmada',
      estado_reserva = 'pagada',
      direccion_snapshot = COALESCE(direccion_snapshot, v_direccion),   -- D-339
      metadata       = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('pagado_en', v_pagado_en, 'pago_simulado', true),
      updated_at     = now()
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'confirmada',
    'estado_reserva', 'pagada',
    'pagado_en', v_pagado_en
  );
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.reagendar_cita_suelta(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_horario  record;
  v_ocupados int;
  v_servicio_id uuid;
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
  -- SUELTO = ni plan ni paquete (esos tienen P14 y P16 con sus RPCs).
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- P18(c): con <2 h el paseo se pierde — ya no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '2 hours' THEN
    RAISE EXCEPTION 'ventana_vencida' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: mover a un día bloqueado del paseador rebota.
  IF _prestador_bloqueado(v_cita.prestador_id, p_nueva_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_cita.prestador_id::text || ':' || p_nueva_fecha::text, 0)
  );

  -- La oferta del tipo de la cita (para franjas atadas a servicio); la
  -- duración que manda es la SNAPSHOTEADA en la cita (S55-B2).
  SELECT ps.id INTO v_servicio_id
  FROM prestador_servicios ps
  WHERE ps.prestador_id = v_cita.prestador_id
    AND ps.tipo_servicio = v_cita.tipo_servicio
    AND ps.duracion_minutos = v_cita.duracion_minutos
    AND ps.activo
  LIMIT 1;

  SELECT h.duracion_slot_minutos AS dur, COALESCE(h.max_citas_por_slot, 1) AS cupo
  INTO v_horario
  FROM prestador_horarios h
  WHERE h.prestador_id = v_cita.prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = v_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349 curada de nacimiento: la propia cita no ocupa su ventana vieja.
  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id);
  IF v_ocupados >= v_horario.cupo THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- Re-snapshot de fecha/hora; el pago viaja con la cita (P18a). La
  -- franja vieja queda libre sola: la ocupación lee fecha/hora nuevas.
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


-- ============================================================

CREATE OR REPLACE FUNCTION public.reagendar_sesion_programa(p_cita_id uuid, p_nueva_fecha date, p_nueva_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth     uuid := auth.uid();
  v_cita     record;
  v_prog     record;
  v_horario  record;
  v_ocupados int;
  v_prev     timestamp;
  v_next     timestamp;
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
  IF v_cita.programa_contratado_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_programa' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- P14(c): con <24 h la sesión se pierde — no hay reagenda automática.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'aviso_tarde' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_prog FROM programas_contratados WHERE id = v_cita.programa_contratado_id FOR UPDATE;
  IF v_prog.estado <> 'activo' THEN
    RAISE EXCEPTION 'programa_no_activo: %', v_prog.estado USING ERRCODE = '22023';
  END IF;

  -- dentro de la VIGENCIA y jamás al pasado
  IF p_nueva_fecha > v_prog.vigencia_hasta THEN
    RAISE EXCEPTION 'fuera_de_vigencia' USING ERRCODE = '22023';
  END IF;
  IF (p_nueva_fecha + p_nueva_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- GUARD DE ORDEN (§1: la sesión 3 no es intercambiable con la 7) —
  -- la fecha nueva de la sesión k queda ESTRICTAMENTE entre la fecha
  -- vigente de k−1 y la de k+1 (las canceladas no acotan).
  SELECT max(c.fecha + c.hora) INTO v_prev
  FROM evento_cita_servicio c
  WHERE c.programa_contratado_id = v_cita.programa_contratado_id
    AND c.sesion_numero < v_cita.sesion_numero
    AND c.estado <> 'cancelada';
  SELECT min(c.fecha + c.hora) INTO v_next
  FROM evento_cita_servicio c
  WHERE c.programa_contratado_id = v_cita.programa_contratado_id
    AND c.sesion_numero > v_cita.sesion_numero
    AND c.estado <> 'cancelada';
  IF (v_prev IS NOT NULL AND (p_nueva_fecha + p_nueva_hora) <= v_prev)
     OR (v_next IS NOT NULL AND (p_nueva_fecha + p_nueva_hora) >= v_next) THEN
    RAISE EXCEPTION 'orden_programa_violado' USING ERRCODE = '22023';
  END IF;

  -- D-341: tampoco se reagenda sobre las vacaciones del adiestrador.
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
    AND (h.servicio_id IS NULL OR h.servicio_id = v_prog.prestador_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_nueva_fecha)::int      -- regla 32
    AND p_nueva_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_nueva_hora)::int + v_cita.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_nueva_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  LIMIT 1;
  IF v_horario.dur IS NULL THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  -- D-349: la propia cita se excluye del conteo de ocupación.
  v_ocupados := _agenda_ocupacion(v_cita.prestador_id, p_nueva_fecha, p_nueva_hora, v_cita.duracion_minutos, p_cita_id);
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
    'sesion_numero', v_cita.sesion_numero,
    'fecha', p_nueva_fecha, 'hora', p_nueva_hora
  );
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._trg_programa_cierre_en_orden()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.programa_contratado_id IS NOT NULL
     AND NEW.estado IN ('completada','no_show')
     AND NEW.estado IS DISTINCT FROM OLD.estado
     AND EXISTS (
       SELECT 1 FROM evento_cita_servicio c
       WHERE c.programa_contratado_id = NEW.programa_contratado_id
         AND c.sesion_numero < NEW.sesion_numero
         AND c.estado NOT IN ('completada','no_show','cancelada')
     )
  THEN
    RAISE EXCEPTION 'sesion_anterior_abierta' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.cerrar_atencion_adiestramiento(p_adiestramiento_id uuid, p_mensaje_familia text DEFAULT NULL::text, p_instrucciones_familia text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_now timestamptz := now();
  v_atencion_id uuid;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
  v_tiene_objetivo boolean; v_tiene_nota_clip boolean;
BEGIN
  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _adiestramiento_atencion_terminada(p_adiestramiento_id);
  SELECT evento_atencion_id INTO v_atencion_id FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;

  -- piso de calidad del oficio (§5): ≥1 objetivo trabajado…
  SELECT EXISTS (SELECT 1 FROM evento_adiestramiento_objetivos WHERE adiestramiento_id = p_adiestramiento_id) INTO v_tiene_objetivo;
  IF NOT v_tiene_objetivo THEN
    RAISE EXCEPTION 'calidad_falta_objetivo: cerrar con calidad requiere al menos un objetivo trabajado' USING ERRCODE = '22023';
  END IF;
  -- …+ ≥1 nota o clip (la captura JAMÁS es obligatoria — §12.6)
  SELECT EXISTS (SELECT 1 FROM evento_adiestramiento_notas WHERE adiestramiento_id = p_adiestramiento_id)
    OR EXISTS (SELECT 1 FROM evento_adiestramiento_clips WHERE adiestramiento_id = p_adiestramiento_id) INTO v_tiene_nota_clip;
  IF NOT v_tiene_nota_clip THEN
    RAISE EXCEPTION 'calidad_falta_nota_o_clip: cerrar con calidad requiere al menos una nota conductual o un clip' USING ERRCODE = '22023';
  END IF;

  -- las INSTRUCCIONES PARA LA FAMILIA (§5) viven en el head del oficio
  IF p_instrucciones_familia IS NOT NULL THEN
    UPDATE eventos_mascota_adiestramiento
    SET instrucciones_familia = p_instrucciones_familia, updated_at = v_now
    WHERE id = p_adiestramiento_id;
  END IF;

  -- cerrar la atención
  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = v_atencion_id;

  -- completar el turno + DEVENGO — espejo LITERAL de cerrar_grooming_
  -- con_calidad (incluye la cura S54-T4: sin no-op silencioso). La
  -- promoción dispara el guard duro de orden del programa EN LA FUENTE.
  SELECT cita_id INTO v_cita_id FROM evento_atencion WHERE id = v_atencion_id;
  IF v_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_id FOR UPDATE;
    IF v_cita.estado = 'en_curso' THEN
      UPDATE evento_cita_servicio SET estado = 'completada', updated_at = now()
      WHERE id = v_cita_id;
    ELSIF v_cita.estado = 'completada' THEN
      NULL;  -- idempotente: el turno ya estaba completado
    ELSE
      RAISE EXCEPTION 'cita_no_promovible: %', COALESCE(v_cita.estado, 'cita_inexistente')
        USING ERRCODE = '22023';
    END IF;

    -- DEVENGO AL CIERRE [variante (b)]: solo citas CUBIERTAS
    -- (invariante 'pagada', CUATRO escritores). Legacy (NULL) pasa.
    IF v_cita.estado_reserva = 'pagada'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'cita'
           AND ee.origen_id = v_cita_id
           AND ee.tipo_evento = 'cita_pagada'
       )
    THEN
      IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
        RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
      END IF;

      SELECT cc.id, cc.moneda INTO v_cuenta
      FROM prestadores pr
      JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_prestador_id;
      IF v_cuenta.id IS NULL THEN
        RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
      END IF;

      v_evento_econ := crear_evento_economico(
        p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
        p_revenue_stream      => 'transaccional'::revenue_stream_enum,
        p_cuenta_comercial_id => v_cuenta.id,
        p_country_code        => v_cita.country_code,
        p_moneda              => v_cuenta.moneda,
        p_monto_bruto         => v_cita.precio,
        p_monto_kushki_fee    => 0,   -- simulación honesta
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_atencion_adiestramiento')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'adiestramiento_id', p_adiestramiento_id,
    'estado', 'cerrada_con_calidad', 'cerrada_en', v_now,
    'evento_economico_id', v_evento_econ
  );
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.cerrar_grooming_con_calidad(p_grooming_id uuid, p_mensaje_familia text DEFAULT NULL::text, p_proxima_sesion date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text; v_now timestamptz := now(); v_atencion_id uuid;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
  v_tiene_servicio boolean; v_recibir boolean; v_entregar boolean; v_tiene_nota_foto boolean;
BEGIN
  -- guard estricto: solo 'terminada' (antes _editable_en_cierre aceptaba cerrada_con_pendiente, DM-S35.8 eliminado)
  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _grooming_atencion_terminada(p_grooming_id);
  SELECT evento_atencion_id INTO v_atencion_id FROM eventos_mascota_grooming WHERE id = p_grooming_id;

  -- guards de calidad (piso obligatorio §8, intactos)
  SELECT EXISTS (SELECT 1 FROM evento_grooming_servicios_aplicados WHERE grooming_id = p_grooming_id) INTO v_tiene_servicio;
  IF NOT v_tiene_servicio THEN RAISE EXCEPTION 'calidad_falta_servicio: cerrar con calidad requiere al menos un servicio aplicado' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_recibir')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'recibir') INTO v_recibir;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_entregar')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'entregar') INTO v_entregar;
  IF NOT v_recibir THEN RAISE EXCEPTION 'calidad_falta_estado_recibir: cerrar con calidad requiere estado al recibir (foto u observacion)' USING ERRCODE = '22023'; END IF;
  IF NOT v_entregar THEN RAISE EXCEPTION 'calidad_falta_estado_entregar: cerrar con calidad requiere estado al entregar (foto u observacion)' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_notas WHERE grooming_id = p_grooming_id)
    OR EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id) INTO v_tiene_nota_foto;
  IF NOT v_tiene_nota_foto THEN RAISE EXCEPTION 'calidad_falta_nota_o_foto: cerrar con calidad requiere al menos una nota o foto' USING ERRCODE = '22023'; END IF;

  -- PIEZA 1 (S60-A3, pedido literal de la B): la próxima sesión SUGERIDA
  -- se escribe en la fila del OFICIO antes de cerrar — una fecha, jamás
  -- una cita (§8). NULL = el cierre no toca la sugerencia previa.
  IF p_proxima_sesion IS NOT NULL THEN
    UPDATE eventos_mascota_grooming
    SET proxima_sesion_sugerida = p_proxima_sesion
    WHERE id = p_grooming_id;
  END IF;

  -- cerrar la atención
  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = v_atencion_id;

  -- completar el turno + DEVENGO — espejo LITERAL de cerrar_paseo_con_
  -- calidad (S59 §10.2; incluye la cura S54-T4: sin no-op silencioso)
  SELECT cita_id INTO v_cita_id FROM evento_atencion WHERE id = v_atencion_id;
  IF v_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_id FOR UPDATE;
    IF v_cita.estado = 'en_curso' THEN
      UPDATE evento_cita_servicio SET estado = 'completada', updated_at = now()
      WHERE id = v_cita_id;
    ELSIF v_cita.estado = 'completada' THEN
      NULL;  -- idempotente: el turno ya estaba completado
    ELSE
      RAISE EXCEPTION 'cita_no_promovible: %', COALESCE(v_cita.estado, 'cita_inexistente')
        USING ERRCODE = '22023';
    END IF;

    -- DEVENGO AL CIERRE [variante (b)]: solo citas pagadas por
    -- confirmar_cita_pagada (invariante §1). Legacy (NULL) pasa de largo.
    IF v_cita.estado_reserva = 'pagada'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'cita'
           AND ee.origen_id = v_cita_id
           AND ee.tipo_evento = 'cita_pagada'
       )
    THEN
      IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
        RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
      END IF;

      SELECT cc.id, cc.moneda INTO v_cuenta
      FROM prestadores pr
      JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_prestador_id;
      IF v_cuenta.id IS NULL THEN
        RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
      END IF;

      v_evento_econ := crear_evento_economico(
        p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
        p_revenue_stream      => 'transaccional'::revenue_stream_enum,
        p_cuenta_comercial_id => v_cuenta.id,
        p_country_code        => v_cita.country_code,
        p_moneda              => v_cuenta.moneda,
        p_monto_bruto         => v_cita.precio,
        p_monto_kushki_fee    => 0,   -- simulación honesta: no inventamos fee
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_grooming_con_calidad')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'grooming_id', p_grooming_id, 'estado', 'cerrada_con_calidad', 'cerrada_en', v_now, 'evento_economico_id', v_evento_econ,
    'proxima_sesion_sugerida', p_proxima_sesion);
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public.cerrar_paseo_con_calidad(p_atencion_id uuid, p_mensaje_familia text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_now timestamptz := now(); v_paseo_id uuid; v_tiene_novedad boolean;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
BEGIN
  SELECT id INTO v_paseo_id FROM eventos_mascota_paseo WHERE evento_atencion_id = p_atencion_id;
  IF v_paseo_id IS NULL THEN RAISE EXCEPTION 'atencion_sin_oficio_paseo' USING ERRCODE = '22023'; END IF;

  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_en_estados(p_atencion_id, ARRAY['terminada']);

  SELECT EXISTS (SELECT 1 FROM evento_paseo_novedades WHERE paseo_id = v_paseo_id) INTO v_tiene_novedad;
  IF NOT v_tiene_novedad THEN RAISE EXCEPTION 'falta_novedad_paseo: cerrar con calidad requiere el parte del perro' USING ERRCODE = '22023'; END IF;

  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = p_atencion_id;

  -- completar el turno (D-268) — cura S54-T4: sin no-op silencioso
  SELECT cita_id INTO v_cita_id FROM evento_atencion WHERE id = p_atencion_id;
  IF v_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_id FOR UPDATE;
    IF v_cita.estado = 'en_curso' THEN
      UPDATE evento_cita_servicio SET estado = 'completada', updated_at = now()
      WHERE id = v_cita_id;
    ELSIF v_cita.estado = 'completada' THEN
      NULL;  -- idempotente: el turno ya estaba completado
    ELSE
      RAISE EXCEPTION 'cita_no_promovible: %', COALESCE(v_cita.estado, 'cita_inexistente')
        USING ERRCODE = '22023';
    END IF;

    -- DEVENGO AL CIERRE [variante (b)]: solo citas pagadas por
    -- confirmar_cita_pagada (invariante §1). Legacy (NULL) pasa de largo.
    IF v_cita.estado_reserva = 'pagada'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'cita'
           AND ee.origen_id = v_cita_id
           AND ee.tipo_evento = 'cita_pagada'
       )
    THEN
      IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
        RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
      END IF;

      SELECT cc.id, cc.moneda INTO v_cuenta
      FROM prestadores pr
      JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_prestador_id;
      IF v_cuenta.id IS NULL THEN
        RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
      END IF;

      v_evento_econ := crear_evento_economico(
        p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
        p_revenue_stream      => 'transaccional'::revenue_stream_enum,
        p_cuenta_comercial_id => v_cuenta.id,
        p_country_code        => v_cita.country_code,
        p_moneda              => v_cuenta.moneda,
        p_monto_bruto         => v_cita.precio,
        p_monto_kushki_fee    => 0,   -- simulación honesta: no inventamos fee
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_paseo_con_calidad')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'paseo_id', v_paseo_id, 'estado', 'cerrada_con_calidad', 'cerrada_en', v_now, 'evento_economico_id', v_evento_econ);
END;
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._adiestramiento_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, comprable text, programa_id uuid, nombre text, nivel text, n_sesiones integer, vigencia_dias integer, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- la SESIÓN SUELTA (precio único del adiestrador, §4 — sin matriz)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'sesion', NULL::uuid,
    COALESCE(ps.nombre_custom, ts.nombre),
    NULL::text, NULL::integer, NULL::integer,
    ps.precio, ps.duracion_minutos,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    -- el adiestrador ACOTA (patrón §5 grooming): NULL = rige el techo del tipo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)

  UNION ALL

  -- el PROGRAMA (precio propio, jamás N×sesión — §4)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'programa', pp.id,
    pp.nombre,
    pp.nivel, pp.n_sesiones, pp.vigencia_dias,
    pp.precio_programa, pp.duracion_minutos_sesion,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_programas pp
  JOIN prestador_servicios ps ON ps.id = pp.prestador_servicio_id AND ps.activo
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
  WHERE m.id = p_mascota_id
    AND pp.activo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._grooming_ofertas_cobrables(p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    ps.tipo_servicio,
    COALESCE(ps.nombre_custom, ts.nombre),
    pst.precio
      + CASE WHEN m.pelaje = 'largo'
             THEN COALESCE(pr.grooming_extra_pelaje_largo, 0)
             ELSE 0 END
      -- S61 D-392: el recargo por domicilio, MISMO camino que el extra
      + CASE WHEN p_modalidad = 'domicilio'
             THEN COALESCE(pr.grooming_recargo_domicilio, 0)
             ELSE 0 END,
    pst.duracion_minutos,
    pr.direccion,
    pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio
                              AND ts.categoria = 'grooming' AND ts.activo
  JOIN prestador_servicio_tallas pst ON pst.prestador_servicio_id = ps.id
                                    AND pst.talla = m.talla
  WHERE m.id = p_mascota_id
    AND ps.activo
    -- el groomer ACOTA (§5): NULL = sin acote, rige el techo del tipo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
    -- S61 D-392: la MODALIDAD elegida filtra la oferta
    AND CASE WHEN p_modalidad = 'domicilio' THEN ps.atiende_domicilio ELSE ps.atiende_local END
$function$


-- ============================================================

CREATE OR REPLACE FUNCTION public._mascota_elegible_servicio(p_mascota_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(
    (SELECT ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie
       FROM mascotas m
       LEFT JOIN tipos_servicio ts ON ts.codigo = p_tipo_servicio
      WHERE m.id = p_mascota_id),
    false  -- mascota inexistente: jamás elegible
  );
$function$
