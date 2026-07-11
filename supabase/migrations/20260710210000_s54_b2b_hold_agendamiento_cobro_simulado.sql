-- ═════════════════════════════════════════════════════════════════════
-- S54 / B2(b)+(c) — HOLD DE AGENDA 15 MIN + COBRO SIMULADO (una migración,
-- atómica). PROPUESTA — NO APLICAR sin OK del founder (regla 73).
--
-- Implementa decisiones cerradas founder+arquitecto (arranque S54 B2b/c +
-- enmienda post-T9): reusa el esqueleto v2 (estado_reserva + expira_en +
-- cron expirar-citas-pendientes), formaliza los dos ciclos (estado = cita,
-- estado_reserva = pago), expiración perezosa como correctitud, pago
-- simulado que dispara crear_evento_economico REAL con
-- metadata.pago_simulado=true y monto_kushki_fee=0.
-- serie_id ELIMINADO por enmienda (el mecanismo de serie ya existe:
-- bono_id / suscripcion_servicio_id).
--
-- CORRECCIONES DEL ARQUITECTO (2ª presentación):
--  1. Normalización legacy → estado_reserva NULL (no 'pagada'); invariante
--     'pagada' ⟺ pasó por confirmar_cita_pagada (documentado en §1).
--  2. Snapshot de precio: cita.precio YA EXISTE (relevado) — el hold lo
--     copia de la oferta vigente; confirmación y checkout jamás re-resuelven.
--  3. [VARIANTE (b) — IMPLEMENTADA, sujeta a voto founder] el evento
--     económico migra de confirmar (§6, que ahora PRE-VALIDA sin insertar)
--     a cerrar_paseo_con_calidad (§8), con fecha_devengo=cierre y
--     fecha_cobro_kushki=metadata.pagado_en. Si el voto es (a), §6/§8
--     vuelven a la 1ª presentación.
--  4. DROP de cita_insert_due / cita_insert_guest / cita_update_due (§7);
--     la cancelación del dueño (B5) nacerá como RPC.
--
-- Relevamiento previo (B2.0 + B0 de esta sesión): todos los nombres de
-- columnas, enums, CHECKs, FKs y policies verificados contra la DB viva.
-- ═════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 7 (va primero: curas de seguridad T3, pariente de D-314)
-- B0.d verificado: el admin usa ANON key + sesión authenticated
-- (e-petplace-admin/src/lib/supabase.ts:4) pero NO invoca ninguna de
-- estas funciones (grep en src/: cero llamadas; Liquidaciones.tsx opera
-- sobre seller_liquidaciones). El REVOKE no rompe nada hoy.
-- authenticated invoca el motor SOLO vía confirmar_cita_pagada (DEFINER,
-- owner postgres — el privilegio se evalúa contra el owner).
-- ─────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.crear_evento_economico(
  tipo_evento_economico_enum, revenue_stream_enum, uuid, text, text,
  numeric, numeric, text, uuid, text, timestamptz, timestamptz, text,
  numeric, quien_absorbe_descuento_enum, jsonb, uuid, text
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.generar_liquidacion(
  uuid, text, date, date, uuid, numeric, integer
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.aplicar_reembolso(
  uuid, text, uuid, numeric
) FROM authenticated;

-- Patrón canónico: DEFINER exige search_path fijado (skill epetplace-db).
ALTER FUNCTION public.resolver_fee_aplicable(
  uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz
) SET search_path = public, pg_temp;

ALTER FUNCTION public.audit_fee_configs() SET search_path = public, pg_temp;

-- Cierre de puerta lateral RLS (decisión founder S54): estas 3 policies
-- permitían al dueño (y al invitado anónimo) fabricar o editar citas
-- 'confirmada' sin hold ni pago — rompían la verdad firme. La creación
-- va SOLO por crear_bloqueo_agenda + confirmar_cita_pagada (puerta
-- única); el walk-in del prestador conserva sus policies. La CANCELACIÓN
-- del dueño (B5) nacerá como RPC propia, no como UPDATE directo.
DROP POLICY IF EXISTS cita_insert_due   ON public.evento_cita_servicio;
DROP POLICY IF EXISTS cita_insert_guest ON public.evento_cita_servicio;
DROP POLICY IF EXISTS cita_update_due   ON public.evento_cita_servicio;

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — estado_reserva: normalización + CHECK
-- Valores existentes relevados: solo 'expirada' (3 filas demo).
-- Normalización legacy (corrección arquitecto S54): las citas vividas
-- ANTES del cobro in-app quedan con ciclo de pago NULO — decir 'pagada'
-- sería verosímil-falso (L-139): nunca hubo pago.
--
-- INVARIANTE DEL CATÁLOGO: estado_reserva = 'pagada' ⟺ la cita pasó
-- por confirmar_cita_pagada (único escritor de ese valor). NULL = el
-- ciclo de pago no aplica (legacy / walk-in).
-- ─────────────────────────────────────────────────────────────────────

UPDATE evento_cita_servicio
SET estado_reserva = NULL
WHERE estado IN ('confirmada', 'en_curso', 'completada')
  AND estado_reserva IS NOT NULL;

ALTER TABLE evento_cita_servicio
  ADD CONSTRAINT chk_estado_reserva_valida
  CHECK (estado_reserva IN ('pendiente_pago', 'pagada', 'expirada', 'cancelada'));
-- (columna nullable a propósito: NULL = ciclo de pago no aplica; el
--  CHECK con NULL evalúa unknown y pasa)

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — hold de 15 minutos (default de expira_en era 30 min, v2)
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE evento_cita_servicio
  ALTER COLUMN expira_en SET DEFAULT (now() + interval '15 minutes');

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 4 — RPC obtener_slots_disponibles
-- Disponibilidad DERIVADA: horarios − citas firmes − holds vigentes.
-- SECURITY DEFINER con doble check reportado: la RLS de
-- evento_cita_servicio solo deja ver citas propias (cita_select_due) —
-- un INVOKER subcontaría la ocupación ajena y habilitaría doble reserva.
-- Solo filtra agregados (fecha/hora/cupos), cero datos personales.
-- Regla 32: dia_semana 0=Domingo = EXTRACT(DOW) de Postgres, sin
-- transformaciones. Expiración perezosa: hold vencido NO ocupa.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.obtener_slots_disponibles(
  p_prestador_id uuid,
  p_servicio_id  uuid,   -- prestador_servicios.id (la oferta con precio)
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
  -- Zona horaria del soft launch EC (misma convención que seed_demo_s44).
  -- Multi-país: cuando B-país abra, esto se deriva de country_config.
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
  SELECT s.s_fecha, s.s_hora, s.s_dur, (s.s_cupo - o.ocupados)::int
  FROM slots s
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS ocupados
    FROM evento_cita_servicio c
    WHERE c.prestador_id = p_prestador_id
      AND c.fecha = s.s_fecha
      AND c.hora >= s.s_hora
      -- comparación por época: evita el wrap de medianoche de time+interval
      AND EXTRACT(EPOCH FROM c.hora) < EXTRACT(EPOCH FROM s.s_hora) + s.s_dur * 60
      AND (
        c.estado IN ('confirmada', 'en_curso')                                -- firmes
        OR (c.estado = 'pendiente'                                            -- holds vigentes
            AND c.estado_reserva = 'pendiente_pago'
            AND c.expira_en > now())
      )
  ) o
  WHERE (s.s_cupo - o.ocupados) > 0
    AND (s.s_fecha + s.s_hora) > v_ahora_local     -- no ofrecer el pasado
  ORDER BY 1, 2;
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 5 — RPC crear_bloqueo_agenda (el hold nace acá)
-- Atómica: valida horario + colisiones DENTRO de la transacción bajo
-- pg_advisory_xact_lock(prestador, fecha). Doble check del descarte del
-- constraint de exclusión (reportado): (a) la cita no tiene columna de
-- duración — la duración vive en el horario; (b) max_citas_por_slot > 1
-- es legal (un exclusion constraint prohibiría cupos); (c) filas legacy
-- con horas arbitrarias lo violarían. El advisory lock serializa las
-- reservas del mismo prestador+día: suficiente y sin cambio de schema.
-- INSERT doble (hito eventos_mascota → cita), calcado del flujo real
-- (evento_id es FK RESTRICT y iniciar_atencion_paseo lo exige NOT NULL).
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(
  p_prestador_id uuid,
  p_servicio_id  uuid,   -- prestador_servicios.id
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

  -- Colisión contra firmes + holds vigentes (expiración perezosa).
  SELECT count(*)::int INTO v_ocupados
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.hora >= p_hora
    AND EXTRACT(EPOCH FROM c.hora) < EXTRACT(EPOCH FROM p_hora) + v_horario.dur * 60
    AND (
      c.estado IN ('confirmada', 'en_curso')
      OR (c.estado = 'pendiente' AND c.estado_reserva = 'pendiente_pago' AND c.expira_en > now())
    );
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

  -- 2. La cita nace HOLD: invisible al prestador (el wrapper de agenda
  --    filtra estados firmes — paseo.ts:293) hasta que el pago la confirme.
  --    SNAPSHOT DE PRECIO (corrección arquitecto S54): se copia el precio
  --    VIGENTE de prestador_servicios a cita.precio (columna existente).
  --    Checkout y confirmar_cita_pagada usan ESTE snapshot — jamás
  --    re-resuelven contra la oferta (si el prestador cambia el precio
  --    con un hold vivo, el hold conserva el precio prometido).
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

REVOKE ALL ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 6 — RPC confirmar_cita_pagada (el pago —simulado— confirma)
-- [VARIANTE (b) — corrección arquitecto S54, sujeta a voto founder]
-- El evento económico NO se crea acá: nace en cerrar_paseo_con_calidad
-- (§8) — devengo = cita COMPLETADA y pagada (MODELO_FINANCIERO §2.2/§3:
-- fecha_devengo ≠ fecha_cobro). Acá se PRE-VALIDA el motor SIN insertar
-- (rol activo en cuenta_roles + resolver_fee_aplicable devuelve config):
-- un pago sobre una cuenta que el motor va a rechazar al cierre es un
-- pago que promete mentira.
-- FOR UPDATE sobre la fila de la cita. Chequeo perezoso del hold. La
-- confirmación dispara trg_otorgar_acceso_por_cita_confirmada (acceso
-- prestador→mascota, relevado en B0). El timestamp del pago se guarda
-- en metadata.pagado_en (escape hatch canónico T-S30.1; la columna
-- llegará con la integración Kushki real) y §8 lo vuelca a
-- fecha_cobro_kushki. Usa cita.precio (snapshot §5), jamás re-resuelve.
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirmar_cita_pagada(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_auth      uuid := auth.uid();
  v_cita      record;
  v_cuenta    record;
  v_fee       uuid;
  v_pagado_en timestamptz;
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
  SELECT cc.id, cc.moneda
  INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = v_cita.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
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
  FROM resolver_fee_aplicable(
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

  -- ── Transición doble en el MISMO UPDATE: cita firme + pago simulado
  --    registrado. metadata.pagado_en será fecha_cobro_kushki en §8.
  v_pagado_en := now();
  UPDATE evento_cita_servicio
  SET estado         = 'confirmada',
      estado_reserva = 'pagada',
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
$$;

REVOKE ALL ON FUNCTION public.confirmar_cita_pagada(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────
-- SECCIÓN 8 — Cura T4 + DEVENGO AL CIERRE [variante (b), voto founder]
-- CREATE OR REPLACE con la MISMA firma (sin sobrecarga, L-119 no aplica).
-- Dos cambios respecto del body vivo:
--
-- (1) Cura T4 — la promoción deja de ser no-op silenciosa:
--   en_curso    → completada (camino feliz, E2E S44 intacto)
--   completada  → no-op (idempotente)
--   otro estado → RAISE 'cita_no_promovible: <estado>' (antes: silencio)
--
-- (2) El evento económico nace ACÁ (devengo = cita completada y pagada,
--     MODELO_FINANCIERO §2.2/§3), SOLO si estado_reserva='pagada'
--     (invariante §1: solo confirmar_cita_pagada escribe ese valor):
--   fecha_devengo      = ahora (el cierre)
--   fecha_cobro_kushki = metadata.pagado_en (guardado al confirmar)
--   monto_bruto        = cita.precio (snapshot §5) · kushki_fee = 0
--   metadata.pago_simulado = true · el 15% lo resuelve el motor solo.
--   Guard anti-duplicado por (origen_tipo, origen_id, tipo_evento).
--   Cita legacy (estado_reserva NULL) → CERO evento, CERO error.
--   Si el motor rebota, el cierre entero vuelve atrás (sin ledger a
--   medias ni atención cerrada sin devengo).
-- Doble check E2E S44: sus citas son legacy (reserva NULL post-§1) →
-- el cierre las completa sin evento, igual que hoy.
-- ─────────────────────────────────────────────────────────────────────

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
$function$;
