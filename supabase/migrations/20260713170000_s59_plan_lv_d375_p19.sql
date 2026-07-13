-- ════════════════════════════════════════════════════════════════════
-- S59-A2 — MIGRACIÓN ÚNICA (pedido S59-A2 Tarea 1, letra firmada S59)
--
-- (a) GUARD PLAN L-V (MODELO_PASEO v1.5 §6.1, regla DURA): los días del
--     plan mensual quedan restringidos a lunes-viernes — guard nativo en
--     contratar_plan_paseo (error catalogable `plan_dia_no_laborable`) +
--     CHECK chk_plan_dias_laborables en suscripciones_servicio. La
--     renovación (cerrar_y_renovar_planes) regenera desde dias_semana
--     ya persistidos: el CHECK la protege estructuralmente — no necesita
--     guard propio (declarado). PUNTO DE REVERSIÓN (§6.1): si el founder
--     pasa a default-con-excepción, el guard se relaja a default y este
--     CHECK cae.
--     Nota D-355: contratar_plan_paseo se reescribe NATIVA completa
--     (la transformación anclada de 20260713010000 queda absorbida) —
--     cierra D-355.
-- (b) PLAN DEMO cf59a466 a L-V: las 4 citas de SÁBADO futuras se retiran
--     con el mecanismo del plan (patrón cierre_periodo_plan: estado→
--     cancelada + motivo en metadata; el ledger NO las conoce — devengo
--     solo al cierre; JAMÁS delete). El cobro simulado se ajusta a lo
--     real (patrón del ajuste de contratar). Data DEMO declarada.
-- (c) D-375: obtener_paseadores_disponibles suma precio_plan al RETURNS
--     (espejo COALESCE del server de cobro — muere el verosímil-falso
--     de la PlanHoja). DROP+CREATE por cambio de RETURNS (L-119).
-- (d) P19 (POLITICAS v1.7): estructura del consentimiento de paseo
--     grupal — mascotas.paseo_social_ok (editable, NULL = sin responder)
--     + tabla paseo_social_negativas (el NO consultable: mascota,
--     familia, fecha) + RPC responder_socializacion_paseo (escritor
--     único del par columna+registro).
-- ════════════════════════════════════════════════════════════════════

-- ── (b) PRIMERO la data (el CHECK de (a) exige el árbol limpio) ──────
DO $mig$
DECLARE
  v_susc_id   uuid := 'cf59a466-0c3f-46ba-8d97-ec9fef883ba1';
  v_susc      record;
  v_retiradas int;
  v_ajuste    numeric(14,2);
BEGIN
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = v_susc_id;
  IF v_susc.id IS NULL THEN
    RAISE NOTICE 'plan demo % ausente — nada que migrar', v_susc_id;
    RETURN;
  END IF;

  -- retiro de las citas de fin de semana FUTURAS y confirmadas, con el
  -- mecanismo del plan (mismo shape que cierre_periodo_plan)
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'migracion_plan_lv_s59',
        'demo', true,
        'cancelada_en', now()),
      updated_at = now()
  WHERE suscripcion_servicio_id = v_susc_id
    AND estado = 'confirmada'
    AND EXTRACT(DOW FROM fecha)::int IN (0, 6);
  GET DIAGNOSTICS v_retiradas = ROW_COUNT;

  v_ajuste := round(COALESCE(v_susc.precio_unitario_efectivo, 0) * v_retiradas, 2);

  UPDATE suscripciones_servicio
  SET dias_semana    = ARRAY(SELECT d FROM unnest(dias_semana) d WHERE d BETWEEN 1 AND 5 ORDER BY d)::smallint[],
      precio_mensual = precio_mensual - v_ajuste,
      precio_pagado  = precio_pagado  - v_ajuste,
      pago_metadata  = pago_metadata || jsonb_build_object(
        'migracion_lv_s59', jsonb_build_object(
          'citas_retiradas', v_retiradas,
          'ajuste', -v_ajuste,
          'pago_simulado', true,
          'demo', true,
          'migrada_en', now()))
  WHERE id = v_susc_id;

  RAISE NOTICE 'plan demo %: % citas de finde retiradas, ajuste -%', v_susc_id, v_retiradas, v_ajuste;
END
$mig$;

-- ── (a) el CHECK estructural (protege también la renovación) ─────────
ALTER TABLE suscripciones_servicio
  ADD CONSTRAINT chk_plan_dias_laborables
  CHECK (
    tipo_servicio <> 'paseo_mensual'
    OR dias_semana IS NULL
    OR dias_semana <@ ARRAY[1,2,3,4,5]::smallint[]
  );

-- ── (a) contratar_plan_paseo NATIVA con el guard L-V (cierra D-355) ──
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

  -- §6.1 v1.5 (founder S59, regla DURA): EL PLAN ES DE LUNES A VIERNES.
  -- Los fines de semana se pasean suelto o por paquete. PUNTO DE
  -- REVERSIÓN declarado: si el founder pasa a default-con-excepción,
  -- este guard se relaja a default (y chk_plan_dias_laborables cae).
  IF EXISTS (SELECT 1 FROM unnest(v_dias) d WHERE d NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'plan_dia_no_laborable' USING ERRCODE = '22023';
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

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
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
$function$;

-- misma firma → los grants vigentes se conservan; el REVOKE se re-afirma
-- igual (L-140: cinturón y tirador).
REVOKE EXECUTE ON FUNCTION public.contratar_plan_paseo(uuid, uuid, uuid, smallint[], time without time zone, text, boolean, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratar_plan_paseo(uuid, uuid, uuid, smallint[], time without time zone, text, boolean, date) TO authenticated;

-- ── (c) D-375: precio_plan al RETURNS de obtener_paseadores_disponibles
-- Cambio de RETURNS TABLE ⇒ DROP + CREATE (L-119). Sin callers en DB
-- (pg_proc prosrc relevado: cero); caller TS = agendamiento.ts (se
-- actualiza en la misma tanda).
DROP FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer);

CREATE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
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
$function$;

-- L-140: el DROP+CREATE renace con el EXECUTE default de anon — se mata.
REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) TO authenticated;

-- ── (d) P19: el consentimiento del paseo grupal ──────────────────────
-- La respuesta vive EDITABLE en el perfil (NULL = aún sin responder);
-- el NO queda CONSULTABLE en su registro (mascota, familia, fecha) —
-- insumo de la decisión paseo personalizado vs derivación a entrenador.
ALTER TABLE mascotas ADD COLUMN paseo_social_ok boolean;
COMMENT ON COLUMN mascotas.paseo_social_ok IS
  'P19 (S59): ¿se lleva bien paseando con otros perros? NULL = sin responder (la pregunta única salta en la primera reserva). Editable por la familia vía responder_socializacion_paseo.';

CREATE TABLE paseo_social_negativas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id   uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  familia_id   uuid NOT NULL REFERENCES familia(id) ON DELETE CASCADE,
  country_code text NOT NULL DEFAULT 'EC',
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE paseo_social_negativas IS
  'P19 (S59): registro de los NO a la pregunta de socialización del paseo grupal — cada NO (también los re-NO tras editar) deja fila. Decide si nace la oferta de paseo personalizado o la derivación a entrenador.';

ALTER TABLE paseo_social_negativas ENABLE ROW LEVEL SECURITY;
-- lectura: la familia ve lo suyo; el admin consulta el agregado.
CREATE POLICY psn_select ON paseo_social_negativas
  FOR SELECT TO authenticated
  USING (is_admin() OR user_tiene_acceso_a_mascota(mascota_id));
-- escritura: SOLO vía la RPC (DEFINER) — sin policy de INSERT/UPDATE/DELETE.

CREATE FUNCTION public.responder_socializacion_paseo(p_mascota_id uuid, p_ok boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth    uuid := auth.uid();
  v_mascota record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_ok IS NULL THEN
    RAISE EXCEPTION 'respuesta_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT id, familia_id, country_code INTO v_mascota
  FROM mascotas WHERE id = p_mascota_id;
  IF v_mascota.familia_id IS NULL THEN
    -- la pregunta única vive en el flujo de reserva de una familia; una
    -- mascota sin familia no llega acá por producto — el guard es honesto.
    RAISE EXCEPTION 'mascota_sin_familia' USING ERRCODE = '22023';
  END IF;

  UPDATE mascotas
  SET paseo_social_ok = p_ok, updated_at = now()
  WHERE id = p_mascota_id;

  -- el NO se registra SIEMPRE (P19): también el re-NO tras editar.
  IF NOT p_ok THEN
    INSERT INTO paseo_social_negativas (mascota_id, familia_id, country_code)
    VALUES (p_mascota_id, v_mascota.familia_id, COALESCE(v_mascota.country_code, 'EC'));
  END IF;

  RETURN jsonb_build_object('ok', true, 'mascota_id', p_mascota_id, 'paseo_social_ok', p_ok);
END;
$function$;

-- L-140: toda función nueva nace con EXECUTE para anon — se mata.
REVOKE EXECUTE ON FUNCTION public.responder_socializacion_paseo(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.responder_socializacion_paseo(uuid, boolean) TO authenticated;
