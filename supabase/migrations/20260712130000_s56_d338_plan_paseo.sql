-- ═════════════════════════════════════════════════════════════════════
-- S56-A TAREA 2 — D-338: EL PLAN DE PASEO NACE (candado abierto por el
-- founder en sesión; espec firmada: MODELO_PASEO v1.2 §6/§6.1 +
-- MODELO_FINANCIERO v2.6 Decisión S/regla 7.14 + POLITICAS P14).
--
-- El contrato de la plata (releído antes de escribir, regla de piedra):
--   · UN cobro SIMULADO Y DECLARADO por PERÍODO MENSUAL (patrón de
--     estados de la cita suelta) — JAMÁS un evento económico al cobrar.
--   · Cada cita del plan nace con precio = PRECIO UNITARIO EFECTIVO
--     (total período ÷ N citas) y metadata.pagado_en del período →
--     cerrar_paseo_con_calidad devenga EXACTO sin tocarse (variante b).
--   · v1 sin descuento configurado por el prestador (su superficie es
--     lado B, pendiente): total = precio del bloque × N ⇒ unitario =
--     precio del bloque. La fórmula queda genérica para cuando exista.
--   · Continuidad §6.1 v1.2, alcance v1: UN paseador (el elegido en el
--     flujo suelto); el reparto por día es el peldaño siguiente.
--   · P14: saltar ≥24 h reagenda dentro del período (mismo paseador);
--     <24 h se pierde; pausa = no renovar (un toque); sobrantes al
--     cierre = crédito si renueva / reembolso proporcional SIMULADO
--     declarado si no. aplicar_reembolso() NO se invoca acá: reversa
--     devengos EXISTENTES y el pago del período jamás tocó el ledger —
--     no hay devengos que reversar (7.14: "jamás toca devengos
--     inexistentes"); el reembolso de lo cobrado-simulado se declara en
--     la suscripción (estado_pago + pago_metadata).
--   · Contratación ATÓMICA: si UNA fecha del período no tiene cupo, el
--     plan entero rebota tipado (el cobro nace exacto o no nace).
--   · Cero roce con loyalty (relevado: ninguna función del camino toca
--     transacciones_puntos/otorgar_puntos — D-314 no suena).
--
-- Chasis relevado (0 filas en todo): suscripciones_servicio ya trae
-- tipo 'paseo_mensual', estados (activa/pausada/cancelada/vencida),
-- estado_pago (pendiente/pagado/reembolsado), periodo_inicio/fin,
-- precio_mensual/pagado, proximo_cobro_en, auto_renovar. Le faltaban
-- las columnas del CUÁNDO del plan — nacen acá (tabla vacía: sin
-- backfill que inventar).
--
-- VERDAD FIRME: mueren las policies laterales *_pet_parent_insert de
-- suscripciones_servicio y bonos (un dueño podía fabricarse un plan o
-- bono "pagado" sin pagar — misma puerta trasera que S54 mató en
-- citas). El plan nace SOLO por contratar_plan_paseo. Las policies
-- walkin del PRESTADOR quedan intactas (flujo v2/admin, otro
-- territorio — se revisan con la gobernanza B0).
-- ═════════════════════════════════════════════════════════════════════

-- ── 1. El CUÁNDO del plan vive en la suscripción ──────────────────────
ALTER TABLE public.suscripciones_servicio
  ADD COLUMN IF NOT EXISTS prestador_servicio_id uuid REFERENCES public.prestador_servicios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dias_semana smallint[],
  ADD COLUMN IF NOT EXISTS hora time,
  ADD COLUMN IF NOT EXISTS duracion_minutos integer,
  ADD COLUMN IF NOT EXISTS frecuencia text,
  ADD COLUMN IF NOT EXISTS precio_unitario_efectivo numeric,
  ADD COLUMN IF NOT EXISTS pago_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.suscripciones_servicio.dias_semana IS
  'D-338: días del plan, convención regla 32 (0=Domingo..6=Sábado). Multi-selección de la Hoja.';
COMMENT ON COLUMN public.suscripciones_servicio.precio_unitario_efectivo IS
  'Decisión S: total del período ÷ N citas — la BASE del devengo de cada cita (la cita lo snapshotea en su precio).';
COMMENT ON COLUMN public.suscripciones_servicio.pago_metadata IS
  'Cobros SIMULADOS DECLARADOS del plan (cobros[]/reembolsos[]/avisos) — el pago del período JAMÁS toca el ledger (variante b).';

ALTER TABLE public.suscripciones_servicio
  ADD CONSTRAINT chk_plan_dias_validos CHECK (
    dias_semana IS NULL OR (
      array_length(dias_semana, 1) BETWEEN 1 AND 7
      AND dias_semana <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
    )
  ),
  ADD CONSTRAINT chk_plan_duracion_menu CHECK (
    duracion_minutos IS NULL OR duracion_minutos IN (30,60,120,180,240,300)
  ),
  ADD CONSTRAINT chk_plan_frecuencia CHECK (
    frecuencia IS NULL OR frecuencia IN ('semanal','quincenal','mensual')
  ),
  ADD CONSTRAINT chk_plan_unitario_valido CHECK (
    precio_unitario_efectivo IS NULL OR precio_unitario_efectivo >= 0
  ),
  ADD CONSTRAINT chk_plan_paseo_completo CHECK (
    tipo_servicio <> 'paseo_mensual' OR (
      dias_semana IS NOT NULL AND hora IS NOT NULL AND duracion_minutos IS NOT NULL
      AND frecuencia IS NOT NULL AND precio_unitario_efectivo IS NOT NULL
    )
  );

-- ── 2. Verdad firme: mueren las puertas traseras del dueño ────────────
DROP POLICY IF EXISTS suscr_servicio_pet_parent_insert ON public.suscripciones_servicio;
DROP POLICY IF EXISTS bonos_pet_parent_insert ON public.bonos;

-- ── 3. Helper: las fechas de un período mensual del plan ──────────────
CREATE OR REPLACE FUNCTION public._fechas_periodo_plan(
  p_periodo_inicio date,
  p_dias smallint[],
  p_frecuencia text
)
RETURNS SETOF date
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH candidatas AS (
    SELECT d::date AS fecha,
           EXTRACT(DOW FROM d)::smallint AS dow,
           ((d::date - p_periodo_inicio) / 7) AS semana
    FROM generate_series(
      p_periodo_inicio,
      (p_periodo_inicio + interval '1 month')::date - 1,
      interval '1 day'
    ) AS d
  ),
  del_plan AS (
    SELECT fecha, dow, semana,
           row_number() OVER (PARTITION BY dow ORDER BY fecha) AS n_por_dia
    FROM candidatas
    WHERE dow = ANY (p_dias)
  )
  SELECT fecha FROM del_plan
  WHERE CASE p_frecuencia
    WHEN 'semanal'   THEN true
    WHEN 'quincenal' THEN semana % 2 = 0
    WHEN 'mensual'   THEN n_por_dia = 1
    ELSE false
  END
  ORDER BY fecha;
$function$;

-- ── 4. Helper interno: genera las citas FIRMES de un período ──────────
-- Valida franja + ventana + cupo (motor S55-B2) bajo el advisory lock
-- por prestador+día; si UNA fecha no cabe, levanta tipado con la fecha
-- (la transacción entera aborta: atomicidad del cobro). Cada cita nace
-- confirmada+pagada (el pago fue el del PERÍODO — metadata lo declara),
-- con precio = unitario efectivo (la base del devengo, Decisión S) y el
-- snapshot de dirección del hogar (D-339).
CREATE OR REPLACE FUNCTION public._generar_citas_plan(
  p_suscripcion_id uuid,
  p_periodo_inicio date,
  p_periodo_fin date,
  p_pagado_en timestamptz
)
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
$function$;

-- ── 5. La puerta del dueño: contratar el plan ─────────────────────────
CREATE OR REPLACE FUNCTION public.contratar_plan_paseo(
  p_prestador_id uuid,
  p_servicio_id uuid,
  p_mascota_id uuid,
  p_dias smallint[],
  p_hora time without time zone,
  p_frecuencia text,
  p_auto_renovar boolean DEFAULT true,
  p_fecha_inicio date DEFAULT NULL
)
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

  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos
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

  -- Decisión S: total del período y precio unitario efectivo. v1 sin
  -- descuento configurado por el prestador ⇒ total = bloque × N.
  v_total    := round(v_servicio.precio * v_n, 2);
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
    v_total    := round(v_servicio.precio * v_generadas, 2);
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

-- ── 6. Pausa de un toque (P14d: pausar = no renovar) ──────────────────
CREATE OR REPLACE FUNCTION public.configurar_renovacion_plan(
  p_suscripcion_id uuid,
  p_auto_renovar boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_susc record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_susc FROM suscripciones_servicio WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_susc.id IS NULL THEN
    RAISE EXCEPTION 'plan_no_encontrado' USING ERRCODE = '22023';
  END IF;
  IF v_susc.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'no_es_tu_plan' USING ERRCODE = '42501';
  END IF;
  IF v_susc.estado <> 'activa' THEN
    RAISE EXCEPTION 'plan_no_activo: %', v_susc.estado USING ERRCODE = '22023';
  END IF;

  UPDATE suscripciones_servicio
  SET auto_renovar = p_auto_renovar, updated_at = now()
  WHERE id = p_suscripcion_id;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', p_suscripcion_id, 'auto_renovar', p_auto_renovar);
END;
$function$;

-- ── 7. Saltar una cita del plan (P14a: ≥24 h reagenda en el período) ──
CREATE OR REPLACE FUNCTION public.saltar_cita_plan(
  p_cita_id uuid,
  p_nueva_fecha date,
  p_nueva_hora time without time zone
)
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
$function$;

-- ── 8. El ciclo del período: aviso 72 h · cierre P14a · renovación ────
-- Corre por cron diario. Cada plan se procesa aislado (una excepción no
-- tumba la corrida). El reembolso proporcional es SIMULADO Y DECLARADO
-- en la suscripción — jamás toca el ledger (no hay devengos que
-- reversar: 7.14).
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
        INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
        VALUES (
          v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
          'Tu plan de paseo se renueva pronto',
          'El ' || to_char(v_susc.periodo_fin, 'DD/MM') || ' se renueva tu plan. Si prefieres pausarlo, es un toque desde Mis paseos.',
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
          SELECT ps.id, ps.precio, ps.duracion_minutos INTO v_oferta
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
          v_total    := round(v_oferta.precio * v_n, 2);
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
              ),
              updated_at = now()
          WHERE id = v_susc.id;

          v_n := _generar_citas_plan(v_susc.id, v_inicio, v_fin, v_pagado_en);
          IF v_n = 0 THEN
            RAISE EXCEPTION 'plan_sin_citas';
          END IF;
          -- si el cron corrió tarde y fechas pasadas se descartaron, el
          -- cobro se ajusta a lo REAL generado (jamás cobrar aire)
          SELECT count(*) INTO v_n FROM evento_cita_servicio
          WHERE suscripcion_servicio_id = v_susc.id AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
          IF round(v_oferta.precio * v_n, 2) <> v_total THEN
            v_total    := round(v_oferta.precio * v_n, 2);
            v_unitario := round(v_total / v_n, 2);
            v_cobrado  := greatest(v_total - v_credito, 0);
            UPDATE suscripciones_servicio
            SET precio_mensual = v_total, precio_pagado = v_cobrado,
                precio_unitario_efectivo = v_unitario, updated_at = now()
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
              ) ELSE '{}'::jsonb END,
              updated_at = now()
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
          ),
          updated_at = now()
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
$function$;

-- cron diario 08:00 UTC (03:00 Guayaquil) — higiene; la correctitud no
-- depende del cron (los estados se leen por período, patrón perezoso).
SELECT cron.schedule('cerrar-renovar-planes', '0 8 * * *', 'SELECT cerrar_y_renovar_planes()');

-- ── L-140: ley en dos partes por CADA función nueva ───────────────────
REVOKE ALL ON FUNCTION public._fechas_periodo_plan(date, smallint[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._fechas_periodo_plan(date, smallint[], text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public._generar_citas_plan(uuid, date, date, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._generar_citas_plan(uuid, date, date, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.contratar_plan_paseo(uuid, uuid, uuid, smallint[], time without time zone, text, boolean, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratar_plan_paseo(uuid, uuid, uuid, smallint[], time without time zone, text, boolean, date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.configurar_renovacion_plan(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configurar_renovacion_plan(uuid, boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.saltar_cita_plan(uuid, date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.saltar_cita_plan(uuid, date, time without time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cerrar_y_renovar_planes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_y_renovar_planes() TO service_role;
