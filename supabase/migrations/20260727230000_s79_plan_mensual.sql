-- ═════════════════════════════════════════════════════════════════════
-- S79-A · LA REFORMA DEL PRECIO DEL PLAN (decisión founder + 2
-- enmiendas de mesa; tamaño aprobado sobre
-- docs/relevamientos/2026-07-27-s79a-t8-plan-mensual-tamano.md).
--
-- EL MODELO: el plan es SUSCRIPCIÓN MENSUAL. El precio es del PERÍODO,
-- no de la cita — si la familia usa 5 salidas de 20, paga el mes.
--   · NACE prestador_servicios.precio_mensual_plan (NULL honesto = el
--     prestador NO ofrece plan).
--   · ENMIENDA ① de mesa: contratar REBOTA TIPADO (plan_no_ofrecido)
--     si es NULL — sin precio declarado no se contrata (la ley del
--     radio). MUERE por omisión el COALESCE(precio_plan, precio) — la
--     conducta "plan al precio suelto × N", que ES el modelo per-cita
--     jubilado.
--   · precio_plan SE JUBILA del camino de cobro: tras esta migración,
--     CERO funciones leen la columna (la lectora emite NULL literal
--     por compat — abajo). La columna y sus 2 valores vivos NO se
--     traducen (nadie puede saber qué quiso decir el 60-sobre-10
--     medido); su DROP es futuro, con el retiro del último bundle
--     pre-reforma.
--   · LA TRANSICIÓN DEL RETURNS (enmienda ① — el porqué): emitir la
--     clave precio_plan=NULL al bundle viejo NO le dice "sin plan":
--     D-375 es literal y le dice "plan sin descuento" ⇒ mostraría
--     precio×N. La guarda plan_no_ofrecido DETRÁS es lo que lo vuelve
--     honesto: ese bundle muestra el estimado viejo pero el contratar
--     REBOTA — nadie paga un número que el server no cobra. El bundle
--     nuevo lee precio_mensual_plan.
--   · unitario efectivo = mensual / N generadas — DERIVADO, solo para
--     el devengo variante (b), NO estable entre períodos (N varía con
--     el mes — declarado en letra, enmienda ② de mesa). N=0 guarded
--     (plan_sin_citas, ya existía en ambos caminos).
--   · El batch de renovación SALTEA la fila que rebota (mecanismo YA
--     medido: handler por fila — vence honesto + notificación; la
--     suscripción demo va a vencer así, correcto). La oferta sin
--     mensual declarado NO renueva: plan_no_ofrecido cae al handler.
--   · saltar_cita_plan NO se toca: ya solo mueve agenda (body medido).
--   · precio_paquete INTACTO (por-salida, Decisión T).
--
-- EL CORTE (acta): esta migración define el MODELO y arregla el
-- CONFIGURADOR. El cobro sigue SIMULADO; ciclo/prorrateo/reintentos/
-- pasarela son del ARCO DE PAGOS (disparo declarado en letra).
--
-- 76(g), DECLARADA: NO RIGE — DDL aditivo (columna nullable sin
-- default) + CREATE OR REPLACE (misma firma ×2) + DROP+CREATE de la
-- lectora (misma firma, RETURNS nuevo — L-119/L-140). Cero backfill,
-- cero anclas. Los 2 valores vivos de precio_plan NO se tocan.
-- REVERSA escrita ANTES de aplicar (bodies vivos embebidos — única
-- fuente): docs/relevamientos/2026-07-27-s79a-REVERSA-plan-mensual.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) la columna del modelo nuevo ───────────────────────────────────
ALTER TABLE public.prestador_servicios
  ADD COLUMN precio_mensual_plan numeric;

ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT chk_precio_mensual_plan_valido
  CHECK (precio_mensual_plan IS NULL OR precio_mensual_plan > 0);

COMMENT ON COLUMN public.prestador_servicios.precio_mensual_plan IS
  'S79: el precio del PERÍODO mensual del plan (suscripción). NULL = el prestador no ofrece plan (contratar rebota plan_no_ofrecido). Reemplaza a precio_plan (jubilada del cobro S79; per-salida muerto).';
COMMENT ON COLUMN public.prestador_servicios.precio_plan IS
  'JUBILADA S79 (reforma del plan mensual): el precio por-salida del plan murió. CERO lectores de motor (la lectora emite NULL por compat de bundle). Sus 2 valores vivos no se traducen. DROP futuro: al retirar el último bundle pre-reforma.';

-- ── 2) contratar_plan_paseo — el mes fijo, y la guarda ① ─────────────
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

  SELECT array_agg(DISTINCT d ORDER BY d) INTO v_dias
  FROM unnest(COALESCE(p_dias, ARRAY[]::smallint[])) AS d
  WHERE d BETWEEN 0 AND 6;
  IF v_dias IS NULL OR array_length(v_dias, 1) IS NULL THEN
    RAISE EXCEPTION 'dias_invalidos' USING ERRCODE = '22023';
  END IF;

  -- §6.1 v1.5 (founder S59, regla DURA): EL PLAN ES DE LUNES A VIERNES.
  IF EXISTS (SELECT 1 FROM unnest(v_dias) d WHERE d NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'plan_dia_no_laborable' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.precio_mensual_plan, ps.duracion_minutos
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

  -- REFORMA S79 (enmienda ① de mesa): sin precio mensual DECLARADO no
  -- hay plan que contratar — la ley del radio. Muere por omisión el
  -- COALESCE(precio_plan, precio): el per-cita jubilado no revive.
  IF v_servicio.precio_mensual_plan IS NULL THEN
    RAISE EXCEPTION 'plan_no_ofrecido' USING ERRCODE = '22023';
  END IF;

  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  IF NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM suscripciones_servicio s
    WHERE s.mascota_id = p_mascota_id AND s.prestador_id = p_prestador_id
      AND s.tipo_servicio = 'paseo_mensual' AND s.estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'plan_duplicado' USING ERRCODE = '22023';
  END IF;

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

  -- REFORMA S79: EL MES ES EL MES — total FIJO del período; el unitario
  -- es DERIVADO (mensual/N, base del devengo variante b) y NO estable
  -- entre períodos (N varía con el mes — declarado en letra).
  v_total    := round(v_servicio.precio_mensual_plan, 2);
  v_unitario := round(v_total / v_n, 2);

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

  v_generadas := _generar_citas_plan(v_susc_id, v_inicio, v_fin, v_pagado_en);
  IF v_generadas = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- REFORMA S79: si el filtro de pasado descartó fechas, el TOTAL NO
  -- CAMBIA (el mes es el mes) — solo el unitario derivado se recalcula
  -- sobre lo REAL generado, y las citas re-snapshotean.
  IF v_generadas <> v_n THEN
    v_unitario := round(v_total / v_generadas, 2);
    UPDATE suscripciones_servicio
    SET precio_unitario_efectivo = v_unitario
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

-- ── 3) cerrar_y_renovar_planes — el mes fijo también al renovar ──────
-- El batch YA saltea por fila (handler medido: vence honesto +
-- notificación). La oferta sin mensual declarado cae ahí:
-- plan_no_ofrecido → renovacion_fallida → el dueño se entera.
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
      -- (a) AVISO 72 h — el precio declarado es el MENSUAL de la oferta
      -- vigente (REFORMA S79: sin ×N; NULL ⇒ el aviso avisa que no va a
      -- poder renovarse — mejor enterarse 72 h antes que al vencer).
      v_aviso_key := 'aviso72h_' || v_susc.periodo_fin::text;
      IF v_susc.auto_renovar
         AND v_susc.periodo_fin - 3 <= v_hoy AND v_hoy < v_susc.periodo_fin
         AND NOT (v_susc.pago_metadata ? v_aviso_key) THEN
        SELECT ps.precio_mensual_plan INTO v_precio_prox
        FROM prestador_servicios ps
        WHERE ps.id = v_susc.prestador_servicio_id AND ps.activo;
        INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
        VALUES (
          v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
          'Tu plan de paseo se renueva pronto',
          CASE WHEN v_precio_prox IS NOT NULL
               THEN 'El ' || to_char(v_susc.periodo_fin, 'DD/MM') || ' se renueva tu plan por $' || round(v_precio_prox, 2)
                 || ' el mes. Si prefieres pausarlo, es un toque desde Mis paseos. (Pago simulado — fase de pruebas.)'
               ELSE 'Tu plan termina el ' || to_char(v_susc.periodo_fin, 'DD/MM')
                 || ' y el paseador ya no ofrece plan mensual, así que no va a renovarse. Puedes seguir con salidas sueltas o un paquete desde Mis paseos.'
          END,
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
          SELECT ps.id, ps.precio_mensual_plan, ps.duracion_minutos INTO v_oferta
          FROM prestador_servicios ps
          WHERE ps.id = v_susc.prestador_servicio_id AND ps.activo;

          IF v_oferta.id IS NULL THEN
            RAISE EXCEPTION 'servicio_no_disponible';
          END IF;
          -- REFORMA S79 (enmienda ①): sin mensual declarado NO se
          -- renueva — cae al handler por fila (vence honesto).
          IF v_oferta.precio_mensual_plan IS NULL THEN
            RAISE EXCEPTION 'plan_no_ofrecido';
          END IF;

          v_inicio := v_susc.periodo_fin;
          v_fin := (v_inicio + interval '1 month')::date;
          SELECT count(*) INTO v_n FROM _fechas_periodo_plan(v_inicio, v_susc.dias_semana, v_susc.frecuencia);
          IF v_n = 0 THEN
            RAISE EXCEPTION 'plan_sin_citas';
          END IF;
          -- EL MES ES EL MES: total fijo; unitario derivado (devengo).
          v_total    := round(v_oferta.precio_mensual_plan, 2);
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
          -- REFORMA S79: si el cron corrió tarde y se descartaron
          -- fechas, el TOTAL NO CAMBIA — solo el unitario derivado.
          SELECT count(*) INTO v_n FROM evento_cita_servicio
          WHERE suscripcion_servicio_id = v_susc.id AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
          IF v_n > 0 AND round(v_total / v_n, 2) <> v_unitario THEN
            v_unitario := round(v_total / v_n, 2);
            UPDATE suscripciones_servicio
            SET precio_unitario_efectivo = v_unitario
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
$function$;

-- ── 4) la lectora: RETURNS de TRANSICIÓN (única con precio_plan) ─────
-- precio_plan se EMITE NULL literal (compat: el bundle viejo lo lee
-- como "plan sin descuento" y estimaría precio×N — la guarda
-- plan_no_ofrecido de arriba es lo que vuelve honesta la transición:
-- ese contratar REBOTA). + precio_mensual_plan para el bundle nuevo.
DROP FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision);

CREATE FUNCTION public.obtener_paseadores_disponibles(
  p_fecha date, p_hora time without time zone, p_duracion_minutos integer,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, precio_mensual_plan numeric, duracion_minutos integer)
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
    NULL::numeric,             -- precio_plan JUBILADA (compat de clave; guarda plan_no_ofrecido detrás)
    ps.precio_mensual_plan,    -- REFORMA S79: el precio del PERÍODO
    ps.duracion_minutos
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable
  WHERE ps.activo
    AND ps.reservable
    AND ps.duracion_minutos = p_duracion_minutos
    AND NOT _prestador_bloqueado(pr.id, p_fecha)
    -- LETRA_PERFIL §2.2 (firma): SIN COALESCE. §2.3: transición.
    AND (
      p_lat IS NULL OR p_lon IS NULL
      OR (
        pr.lat IS NOT NULL
        AND pr.lon IS NOT NULL
        AND pr.radio_cobertura_km IS NOT NULL
        AND 2 * 6371 * asin(sqrt(
              power(sin(radians((pr.lat - p_lat) / 2)), 2)
              + cos(radians(p_lat)) * cos(radians(pr.lat))
                * power(sin(radians((pr.lon - p_lon) / 2)), 2)
            )) <= pr.radio_cobertura_km
      )
    )
    AND EXISTS (
      SELECT 1
      FROM prestador_horarios h
      JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
      WHERE h.prestador_id = pr.id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
        AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + p_duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
        AND (pe.rol = 'dueño' OR EXISTS (
              SELECT 1 FROM prestador_empleado_servicios pes
              WHERE pes.empleado_id = pe.id AND pes.servicio_id = ps.id))
        AND _agenda_ocupacion(pe.id, p_fecha, p_hora, p_duracion_minutos, NULL, ps.tipo_servicio)
            < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1))
    )
  ORDER BY 5, 3;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision) TO authenticated;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_n int; v_anon int; v_lectores int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='prestador_servicios' AND column_name='precio_mensual_plan') THEN
    RAISE EXCEPTION 'verificacion: precio_mensual_plan no existe';
  END IF;

  -- precio_plan JUBILADA del motor: cero funciones LEEN la columna
  -- (los matches restantes deben ser el literal NULL/el nombre en el
  -- RETURNS de la lectora y comentarios — se cuenta quién la lee de
  -- prestador_servicios: patrón 'ps.precio_plan' / 'precio_plan,').
  SELECT count(*) INTO v_lectores
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public' AND p.prosrc LIKE '%ps.precio_plan%';
  IF v_lectores > 0 THEN
    RAISE EXCEPTION 'verificacion: % funciones siguen leyendo ps.precio_plan', v_lectores;
  END IF;

  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public' AND p.proname='obtener_paseadores_disponibles';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'verificacion L-119: % sobrecargas de la lectora', v_n;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid=a.grantee
  WHERE ns.nspname='public' AND p.proname='obtener_paseadores_disponibles' AND r.rolname='anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion L-140: anon con % grants', v_anon;
  END IF;

  -- precio_paquete INTACTO (CHECK presente, semántica no tocada)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.prestador_servicios'::regclass AND conname='chk_precio_paquete_valido') THEN
    RAISE EXCEPTION 'verificacion: chk_precio_paquete_valido desaparecio';
  END IF;
END $$;

commit;
