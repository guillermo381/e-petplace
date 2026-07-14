-- ============================================================================
-- S60-A1 — LA RESERVA DE GROOMING DEL DUEÑO: el QUÉ HORA / QUIÉN
-- grooming-aware + declarar_talla_pelaje (patrón P19 aplicado a §3 del
-- MODELO_GROOMING).
--
-- Condiciones del visto del arquitecto (L-144, S60):
-- (1) GEMELAS ≠ FORK DEL MOTOR: capas delgadas sobre los MISMOS helpers
--     (_agenda_ocupacion, _prestador_bloqueado, _mascota_elegible_servicio,
--     ventana completa, cupo, 7.13). Las RPCs del paseo CERRADO quedan
--     INTACTAS — esta migración no toca ninguna función existente.
--     La enumeración de la grilla (que en las RPCs del paseo vive inline)
--     acá se extrae a UN helper interno (_inicios_disponibles_prestador)
--     para que las dos gemelas grooming no se dupliquen ENTRE SÍ; la
--     matemática de ocupación sigue viviendo en _agenda_ocupacion.
-- (2) El QUIÉN devuelve precio y duración YA RESUELTOS server-side
--     (servicio × talla del perfil + extra si pelaje largo — MODELO_GROOMING
--     §2/§6). El cliente pinta, jamás calcula. La resolución espeja la del
--     congelador (crear_bloqueo_agenda, S59-A5) SIN tocarlo: el assert T5
--     cruza gemela vs congelador para que no puedan divergir en silencio.
-- (3) declarar_talla_pelaje sirve las DOS superficies (Hoja de reserva y
--     edición del perfil): UPSERT semántico — §3 manda "editables siempre".
-- (4) El DÓNDE viaja en el QUIÉN (prestadores.direccion/ciudad, solo
--     lectura; NULL honesto — el hueco de los seeds se reporta, no se
--     inventa).
--
-- L-140 desde el nacimiento: REVOKE PUBLIC/anon en TODAS las funciones de
-- esta migración + sonda proacl en la verificación.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Helper interno: inicios disponibles de UN prestador+servicio+duración.
--    Una sola verdad de grilla para las dos gemelas grooming: franja activa
--    del día (general o del servicio — regla 32: dia_semana 0=Domingo),
--    ventana COMPLETA dentro de la franja, cupo libre en todo el recorrido
--    (_agenda_ocupacion), futuro local (tz D-320) y vacaciones (D-341).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._inicios_disponibles_prestador(
  p_prestador_id     uuid,
  p_servicio_id      uuid,
  p_fecha            date,
  p_duracion_minutos integer
)
RETURNS TABLE(hora time without time zone)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

-- ----------------------------------------------------------------------------
-- 2) Helper interno: las ofertas grooming COBRABLES resueltas para UNA
--    mascota. Resuelve precio (talla del PERFIL + extra si pelaje largo) y
--    duración (servicio × talla) — espejo de la resolución del congelador
--    (S59-A5). Filtra 7.13 (cuenta activa), prestador activo, techo del
--    tipo y el ACOTE del groomer (especies_compatibles). Sin talla en el
--    perfil no devuelve filas (los públicos rebotan talla_no_declarada
--    ANTES de llegar acá).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._grooming_ofertas_cobrables(p_mascota_id uuid)
RETURNS TABLE(
  prestador_id          uuid,
  prestador_servicio_id uuid,
  prestador_nombre      text,
  tipo_servicio         text,
  servicio_nombre       text,
  precio                numeric,
  duracion_minutos      integer,
  direccion             text,
  ciudad                text
)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    ps.tipo_servicio,
    COALESCE(ps.nombre_custom, ts.nombre),
    pst.precio
      + CASE WHEN m.pelaje = 'largo'
             THEN COALESCE(pr.grooming_extra_pelaje_largo, 0)
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
$$;

-- ----------------------------------------------------------------------------
-- 3) obtener_oferta_grooming — el selector de SERVICIO del dueño: qué se
--    puede comprar HOY (Baño / Baño+corte realmente ofertados por groomers
--    cobrables) y desde qué precio PARA SU MASCOTA (talla ya resuelta).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_oferta_grooming(p_mascota_id uuid)
RETURNS TABLE(
  tipo_servicio   text,
  servicio_nombre text,
  desde_precio    numeric,
  varia           boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
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
  SELECT
    o.tipo_servicio,
    ts.nombre,               -- voz canónica del selector (no la custom por groomer)
    MIN(o.precio),
    MIN(o.precio) <> MAX(o.precio)
  FROM _grooming_ofertas_cobrables(p_mascota_id) o
  JOIN tipos_servicio ts ON ts.codigo = o.tipo_servicio
  GROUP BY o.tipo_servicio, ts.nombre
  ORDER BY MIN(o.precio);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4) obtener_inicios_grooming_disponibles — el QUÉ HORA cruzado (unión entre
--    todos los groomers cobrables). La duración NO es parámetro: es la
--    CONSECUENCIA de servicio × talla del perfil, POR groomer (cada uno
--    declaró la suya — un inicio se oferta si la ventana de ESE groomer cabe).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_inicios_grooming_disponibles(
  p_fecha         date,
  p_tipo_servicio text,
  p_mascota_id    uuid
)
RETURNS TABLE(hora time without time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
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
  FROM _grooming_ofertas_cobrables(p_mascota_id) o
  CROSS JOIN LATERAL _inicios_disponibles_prestador(
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
  ) i
  WHERE o.tipo_servicio = p_tipo_servicio
  ORDER BY 1;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5) obtener_groomers_disponibles — el QUIÉN con el precio RESUELTO
--    server-side (condición 2 del visto): precio por talla + extra si pelaje
--    largo, duración de la combinación, y el DÓNDE (dirección/ciudad de la
--    sede, solo lectura, NULL honesto). El cliente pinta, jamás calcula.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_groomers_disponibles(
  p_fecha         date,
  p_hora          time without time zone,
  p_tipo_servicio text,
  p_mascota_id    uuid
)
RETURNS TABLE(
  prestador_id          uuid,
  prestador_servicio_id uuid,
  prestador_nombre      text,
  servicio_nombre       text,
  precio                numeric,
  duracion_minutos      integer,
  direccion             text,
  ciudad                text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
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
    o.ciudad
  FROM _grooming_ofertas_cobrables(p_mascota_id) o
  WHERE o.tipo_servicio = p_tipo_servicio
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6) declarar_talla_pelaje — la pregunta única de §3 (patrón P19: molde de
--    responder_socializacion_paseo). Sirve las DOS superficies (Hoja de la
--    reserva Y edición desde el perfil): UPSERT semántico, "editables
--    siempre". El server jamás adivina; acá el server tampoco frena — a
--    diferencia de la social, declarar SIEMPRE continúa.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.declarar_talla_pelaje(
  p_mascota_id uuid,
  p_talla      text,
  p_pelaje     text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth uuid := auth.uid();
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- espejo de los CHECKs de mascotas (talla/pelaje) con error TIPADO
  IF p_talla IS NULL OR p_talla NOT IN ('S', 'M', 'L') THEN
    RAISE EXCEPTION 'talla_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_pelaje IS NULL OR p_pelaje NOT IN ('normal', 'largo') THEN
    RAISE EXCEPTION 'pelaje_invalido' USING ERRCODE = '22023';
  END IF;

  UPDATE mascotas
  SET talla = p_talla, pelaje = p_pelaje, updated_at = now()
  WHERE id = p_mascota_id;

  RETURN jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'talla', p_talla,
    'pelaje', p_pelaje
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7) L-140 — ley de las dos partes, sin excepción. Los helpers internos no
--    los ejecuta NINGÚN rol de cliente (los consumen las RPCs DEFINER).
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public._inicios_disponibles_prestador(uuid, uuid, date, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._grooming_ofertas_cobrables(uuid) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_inicios_grooming_disponibles(date, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_inicios_grooming_disponibles(date, text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.declarar_talla_pelaje(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.declarar_talla_pelaje(uuid, text, text) TO authenticated;
