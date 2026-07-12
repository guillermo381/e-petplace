-- ═════════════════════════════════════════════════════════════════════
-- S55-A B2 — EL MOTOR DE OCUPACIÓN POR VENTANA (decisión founder S55:
-- menú canónico de paseo 30/60/120/180/240/300, máx 300; precio por
-- bloque = filas de prestador_servicios por duración).
--
-- EL BUG (hallazgo Sesión B, relevado literal con pg_get_functiondef):
-- la cita no guardaba duración y _agenda_ocupacion contaba solo citas
-- que EMPIEZAN en la ventana [hora, hora+dur) — una cita de 60' sobre
-- grilla de 30' producía doble-booking parcial (su segunda mitad no
-- ocupaba). crear_bloqueo_agenda validaba franja y cupo solo sobre el
-- slot de INICIO.
--
-- LA CURA:
--   1. evento_cita_servicio.duracion_minutos — SNAPSHOT desde la
--      oferta (como el precio). Backfill: paseo_60min→60, resto→30
--      (el pedido decía "todas 30'"; la seed c002 es de 60' y el
--      backfill respeta el tipo — desvío reportado). NOT NULL con
--      DEFAULT 30: los INSERT ajenos (walk-in de otros repos) ocupan
--      al menos un bloque base — el motor jamás ve NULL.
--   2. _agenda_ocupacion = MÁXIMO de citas SIMULTÁNEAS en algún
--      instante de la ventana (solapamiento real, no "empieza en").
--      Los callers comparan contra el cupo igual que antes — la
--      semántica nueva es la que siempre quisieron decir. Con cupo N,
--      N citas superpuestas son legales (capacidad por slot).
--   3. obtener_slots_disponibles: la ventana COMPLETA de la oferta
--      (ps.duracion_minutos) debe caber en la franja y tener cupo en
--      todo su recorrido; devuelve la duración de la OFERTA.
--   4. crear_bloqueo_agenda: mismas dos validaciones al crear el hold
--      (la carrera la cubre el advisory lock prestador+día existente).
--   5. obtener_paseadores_disponibles NO se toca: su chequeo de franja
--      ya era por ventana completa y la ocupación se cura sola por el
--      helper único.
--
-- INTACTOS (pedido 4): expiración perezosa (mismo predicado del hold
-- vigente), invariante 'pagada' ⟺ confirmar_cita_pagada (esa RPC no se
-- toca), verdad firme del prestador (los filtros de estado no cambian),
-- y el camino de la plata (MODELO_FINANCIERO v2.4: Decisiones Q/R,
-- devengo al cierre — cero contacto).
-- ═════════════════════════════════════════════════════════════════════

-- ── 1. Duración en la cita ──────────────────────────────────────────
ALTER TABLE evento_cita_servicio ADD COLUMN duracion_minutos integer;

UPDATE evento_cita_servicio
   SET duracion_minutos = CASE WHEN tipo_servicio = 'paseo_60min' THEN 60 ELSE 30 END;

ALTER TABLE evento_cita_servicio ALTER COLUMN duracion_minutos SET DEFAULT 30;
ALTER TABLE evento_cita_servicio ALTER COLUMN duracion_minutos SET NOT NULL;
ALTER TABLE evento_cita_servicio
  ADD CONSTRAINT chk_cita_duracion_positiva CHECK (duracion_minutos > 0);

COMMENT ON COLUMN evento_cita_servicio.duracion_minutos IS
  'Snapshot de la duración de la oferta al crear el hold (S55-B2, como precio). DEFAULT 30 = bloque base para inserts que no la declaran (walk-in legacy); el motor de agenda ocupa [hora, hora+duración).';

-- ── 2. Menú canónico de paseo en piedra (decisión founder S55) ──────
-- "más de 5 horas es guardería, no paseo". Solo rige filas de paseo;
-- las duraciones de otros oficios no se legislan acá. Filas vivas
-- relevadas: paseo 30 y 60 — ambas en el menú.
ALTER TABLE prestador_servicios
  ADD CONSTRAINT chk_paseo_duracion_menu
  CHECK (tipo_servicio <> 'paseo' OR duracion_minutos IN (30, 60, 120, 180, 240, 300));

-- ── 3. Ocupación = solapamiento real ────────────────────────────────
-- Máximo de citas simultáneas en algún instante de [p_hora, p_hora+dur).
-- Instantes críticos: el inicio de la ventana y cada inicio de cita
-- solapante dentro de ella (el máximo de una unión de intervalos solo
-- cambia en un borde izquierdo). Aritmética en EPOCH: time + interval
-- envuelve a medianoche y una cita de 300' que termina 24:00 mentiría.
CREATE OR REPLACE FUNCTION public._agenda_ocupacion(
  p_prestador_id uuid, p_fecha date, p_hora time without time zone, p_duracion_minutos integer
)
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
$function$;

-- ── 4. Slots: la ventana completa de la oferta debe caber ───────────
CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(
  p_prestador_id uuid, p_servicio_id uuid, p_desde date, p_hasta date
)
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
  ORDER BY 1, 2;
END;
$function$;

-- ── 5. El hold valida la MISMA ventana que se ofertó ────────────────
CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(
  p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone
)
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
  --    el pago la confirme. SNAPSHOT de precio Y duración (S55-B2).
  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC')
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

-- ── L-140 (ley en dos partes): grants explícitos por función tocada ──
-- CREATE OR REPLACE conserva la ACL, pero la ley exige declararla y
-- verificarla (proacl + sonda en el gate).
REVOKE ALL ON FUNCTION public._agenda_ocupacion(uuid, date, time, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._agenda_ocupacion(uuid, date, time, integer) TO service_role;

REVOKE ALL ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time) TO authenticated, service_role;
