-- S61-A6 — D-392: DOMICILIO DEL LADO DEL DUEÑO (letra firmada founder
-- S61 + arquitecto): la modalidad se elige en el QUÉ; groomer con UNA
-- modalidad = no se pregunta; el precio CONGELADO suma el recargo;
-- dirección-en-cita para domicilio (herencia D-339 VERBATIM);
-- la OCUPACIÓN no se toca (_agenda_ocupacion sigue global, intacta).
--
-- Cirugía: _grooming_ofertas_cobrables gana p_modalidad (filtro por
-- ps.atiende_* + el recargo clona el camino del extra de pelaje) y sus
-- TRES consumidoras públicas la pasan; el congelador valida modalidad,
-- suma recargo ANTES del snapshot y la cita PORTA su modalidad; el
-- pago hereda D-339 (re-snapshot) + guard duro direccion_requerida.
-- L-119: DROP explícito de toda firma que cambia (cero zombis).
-- L-140: REVOKE/GRANT en todas las recreadas + helper interno cerrado.

-- ── 0 · el CHECK de modalidad aprende 'local' (relevado: el legacy
-- ya conocía 'domicilio'; 'presencial' queda para las 46 filas viejas
-- y los oficios que no declaran — conviven, declarado) ───────────────
ALTER TABLE public.evento_cita_servicio
  DROP CONSTRAINT evento_cita_servicio_modalidad_check;
ALTER TABLE public.evento_cita_servicio
  ADD CONSTRAINT evento_cita_servicio_modalidad_check
  CHECK (modalidad = ANY (ARRAY['presencial'::text, 'telemedicina'::text, 'domicilio'::text, 'emergencia_movil'::text, 'local'::text]));

-- ── 1 · el helper: modalidad + recargo (espejo del extra) ───────────
DROP FUNCTION IF EXISTS public._grooming_ofertas_cobrables(uuid);
CREATE FUNCTION public._grooming_ofertas_cobrables(p_mascota_id uuid, p_modalidad text DEFAULT 'local')
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
$function$;

-- ── 2 · la oferta del dueño: expone modalidades + recargo desde ─────
DROP FUNCTION IF EXISTS public.obtener_oferta_grooming(uuid);
CREATE FUNCTION public.obtener_oferta_grooming(p_mascota_id uuid, p_modalidad text DEFAULT 'local')
 RETURNS TABLE(tipo_servicio text, servicio_nombre text, desde_precio numeric, varia boolean, atiende_local boolean, atiende_domicilio boolean, recargo_domicilio_desde numeric)
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
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- techo de plataforma perro+gato (§5): la UI filtra, la DB manda
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'grooming') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  -- las modalidades del AGREGADO se computan SIN el filtro de modalidad
  -- (el selector del QUÉ necesita saber si existen ambas aunque la
  -- elegida sea una); recargo_domicilio_desde = MIN entre los groomers
  -- que atienden domicilio (v1: agregado declarado, no por groomer).
  WITH mods AS (
    SELECT ps.tipo_servicio AS tipo,
           bool_or(ps.atiende_local)      AS m_local,
           bool_or(ps.atiende_domicilio)  AS m_domicilio,
           MIN(COALESCE(pr.grooming_recargo_domicilio, 0))
             FILTER (WHERE ps.atiende_domicilio) AS m_recargo_desde
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts2      ON ts2.codigo = ps.tipo_servicio
                                AND ts2.categoria = 'grooming' AND ts2.activo
    JOIN prestador_servicio_tallas pst ON pst.prestador_servicio_id = ps.id
                                      AND pst.talla = m.talla
    WHERE m.id = p_mascota_id
      AND ps.activo
      AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
    GROUP BY ps.tipo_servicio
  )
  SELECT
    o.tipo_servicio,
    ts.nombre,               -- voz canónica del selector (no la custom por groomer)
    MIN(o.precio),
    MIN(o.precio) <> MAX(o.precio),
    mods.m_local,
    mods.m_domicilio,
    mods.m_recargo_desde
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  JOIN tipos_servicio ts ON ts.codigo = o.tipo_servicio
  JOIN mods ON mods.tipo = o.tipo_servicio
  GROUP BY o.tipo_servicio, ts.nombre, mods.m_local, mods.m_domicilio, mods.m_recargo_desde
  ORDER BY MIN(o.precio);
END;
$function$;

-- ── 3 · los inicios: la modalidad viaja ─────────────────────────────
DROP FUNCTION IF EXISTS public.obtener_inicios_grooming_disponibles(date, text, uuid);
CREATE FUNCTION public.obtener_inicios_grooming_disponibles(p_fecha date, p_tipo_servicio text, p_mascota_id uuid, p_modalidad text DEFAULT 'local')
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
$function$;

-- ── 4 · el QUIÉN: filtra por modalidad, el precio YA trae recargo ───
DROP FUNCTION IF EXISTS public.obtener_groomers_disponibles(date, time without time zone, text, uuid);
CREATE FUNCTION public.obtener_groomers_disponibles(p_fecha date, p_hora time without time zone, p_tipo_servicio text, p_mascota_id uuid, p_modalidad text DEFAULT 'local')
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
$function$;

-- ── 5 · EL CONGELADOR (verbatim del body relevado + injertos D-392) ─
DROP FUNCTION IF EXISTS public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone);
CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL)
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
$function$;

-- ── 6 · el pago: D-339 heredado + guard duro del domicilio ──────────

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
$function$;

-- ── 7 · L-140: privilegios de TODAS las recreadas ───────────────────
REVOKE ALL ON FUNCTION public._grooming_ofertas_cobrables(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.obtener_oferta_grooming(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.obtener_inicios_grooming_disponibles(date, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_inicios_grooming_disponibles(date, text, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text) TO authenticated;
REVOKE ALL ON FUNCTION public.confirmar_cita_pagada(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) TO authenticated;

COMMENT ON COLUMN public.evento_cita_servicio.modalidad IS
  'S61 D-392: grooming escribe ''local''/''domicilio'' (el hold la porta); el valor legacy ''presencial'' (pre-S61) se conserva en las filas viejas y en los oficios que aún no declaran modalidad.';
