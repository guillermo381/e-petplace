-- ═════════════════════════════════════════════════════════════════════
-- S56-A TAREA 1 — D-339: dirección-en-cita v1 (decisión founder S56).
--
-- La cita de paseo no registraba DÓNDE ocurre (hallazgo B S55): el
-- paseador confirmado no sabía a qué puerta llegar sin WhatsApp.
-- v1 firmada: la dirección del HOGAR vive en `direcciones_guardadas`
-- (existente, RLS dir_own probada, vacía al migrar) y la cita lleva
-- SNAPSHOT congelado al crear el hold (patrón precio/duración S54/S55).
--
-- Piezas:
--   1. evento_cita_servicio.direccion_snapshot jsonb — claves fijas
--      {direccion_id, direccion, ciudad, sector, referencias, lat, lon}.
--      NULL honesto: cita histórica, cita no-paseo, u hogar sin
--      dirección al momento (backfill NO se inventa).
--   2. Índice UNIQUE parcial: UNA dirección principal por user (la
--      tabla está vacía — el invariante nace sin conflicto posible).
--   3. _direccion_hogar_snapshot(user) — helper interno del snapshot.
--   4. guardar_direccion_hogar(...) — upsert de la dirección principal
--      del hogar, SECURITY INVOKER (la RLS dir_own ES la puerta,
--      patrón registrar_vacunas_de_carnet).
--   5. crear_bloqueo_agenda — snapshotea la dirección en citas de
--      categoría paseo al nacer el hold (firma intacta, cero zombie).
--   6. confirmar_cita_pagada — si el hold nació sin dirección y el
--      checkout la capturó, el PAGO la congela (COALESCE: un snapshot
--      existente JAMÁS se pisa).
--
-- El snapshot es COPIA: editar la dirección del hogar después no toca
-- citas ya creadas. La atención del prestador lee la fila de la cita
-- (contrato con la Sesión B: el dato está en la fila; ella lo pinta).
-- ═════════════════════════════════════════════════════════════════════

-- 1. La columna del snapshot (nullable = backfill honesto NULL).
ALTER TABLE public.evento_cita_servicio
  ADD COLUMN IF NOT EXISTS direccion_snapshot jsonb;

COMMENT ON COLUMN public.evento_cita_servicio.direccion_snapshot IS
  'D-339 (S56): snapshot CONGELADO de la dirección del hogar al crear el hold (o al pagar, si el checkout la capturó). Claves fijas: direccion_id, direccion, ciudad, sector, referencias, lat, lon (presentes siempre; null sin dato). Solo citas de categoría paseo. NULL = cita histórica, no-paseo, u hogar sin dirección. Editar direcciones_guardadas NO toca este snapshot.';

-- 2. UNA dirección principal por user (la tabla está vacía: nace limpio).
CREATE UNIQUE INDEX IF NOT EXISTS uq_direcciones_principal_por_user
  ON public.direcciones_guardadas (user_id)
  WHERE es_principal;

-- 3. Helper interno: la dirección principal del user como snapshot jsonb.
CREATE OR REPLACE FUNCTION public._direccion_hogar_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'direccion_id', d.id,
    'direccion',    d.direccion,
    'ciudad',       d.ciudad,
    'sector',       d.sector,
    'referencias',  d.referencias,
    'lat',          d.lat,
    'lon',          d.lon
  )
  FROM direcciones_guardadas d
  WHERE d.user_id = p_user_id AND d.es_principal
  LIMIT 1;
$function$;

-- 4. La puerta de escritura del dueño: upsert de la dirección del hogar.
--    SECURITY INVOKER: la RLS dir_own (user_id = auth.uid()) es la puerta.
CREATE OR REPLACE FUNCTION public.guardar_direccion_hogar(
  p_direccion   text,
  p_ciudad      text,
  p_sector      text DEFAULT NULL,
  p_referencias text DEFAULT NULL,
  p_telefono    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  -- Espejo tipado del CHECK direcciones_guardadas_telefono_sin_plus
  -- (regla 28: E.164 sin '+'; el error tipado gana al constraint crudo).
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO direcciones_guardadas AS d
    (user_id, alias, direccion, ciudad, sector, referencias, telefono, es_principal)
  VALUES
    (v_auth, 'Hogar', btrim(p_direccion), btrim(p_ciudad),
     NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
     NULLIF(btrim(p_telefono), ''), true)
  ON CONFLICT (user_id) WHERE es_principal
  DO UPDATE SET
    direccion   = EXCLUDED.direccion,
    ciudad      = EXCLUDED.ciudad,
    sector      = EXCLUDED.sector,
    referencias = EXCLUDED.referencias,
    telefono    = EXCLUDED.telefono
  RETURNING d.id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'direccion_id', v_id,
    'snapshot', _direccion_hogar_snapshot(v_auth)
  );
END;
$function$;

-- 5. crear_bloqueo_agenda: el hold de paseo nace con el snapshot
--    (misma firma — L-119 sin sobrecarga zombie; cuerpo S55-B2 intacto
--    salvo las líneas marcadas D-339).
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
$function$;

-- 6. confirmar_cita_pagada: si el hold nació sin dirección y el checkout
--    la capturó, el pago la congela (COALESCE — jamás pisa un snapshot).
--    Misma firma; cuerpo S54 intacto salvo las líneas marcadas D-339.
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

  -- D-339: hold de paseo que nació sin dirección + checkout que la
  -- capturó = el pago la congela. Un snapshot existente NO se pisa.
  IF v_cita.direccion_snapshot IS NULL AND EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'paseo'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
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

-- ── L-140: ley en dos partes — REVOKE explícito + GRANT mínimo por
--    función NUEVA (las reemplazadas conservan su ACL; se re-declara
--    igual: el REVOKE genérico no alcanza y el CREATE solo tampoco).
REVOKE ALL ON FUNCTION public._direccion_hogar_snapshot(uuid) FROM PUBLIC, anon;
-- Helper INVOKER: para authenticated la RLS dir_own ES la puerta (pasarle
-- otro user_id devuelve NULL — cero filtración). Lo necesitan
-- guardar_direccion_hogar (INVOKER) y las DEFINER del motor (como owner).
GRANT EXECUTE ON FUNCTION public._direccion_hogar_snapshot(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirmar_cita_pagada(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) TO authenticated, service_role;
