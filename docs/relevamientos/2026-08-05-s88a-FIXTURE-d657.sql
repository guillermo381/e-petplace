-- ============================================================================
-- S88-A · LOTE 2 — D-657: EL PLAN DEJA DE COBRARSE DESPUÉS DEL MEMORIAL
--
-- Dirección (c) FIRMADA por el founder (5-ago-2026): las DOS mitades.
--   (a) EL ACTO DEL PRODUCTO — la transición a memorial pausa/cancela las
--       suscripciones de esa mascota, LIBERANDO lo no consumido (P14).
--   (b) EL FUSIBLE DEL MOTOR — la renovación consulta estado_vida y no
--       renueva un plan de mascota no activa.
--   (b-bis, extensión declarada) — contratar_plan_paseo tampoco acepta una
--       mascota no activa: el mismo cobro con otra puerta.
--
-- EL ANTES, MEDIDO Y CONDENATORIO (fixture con oferta renovable fabricada):
--   renovados=1 · período nuevo hasta el 5-sep · 29 CITAS FIRMES NUEVAS
--   agendadas para una mascota FALLECIDA. Peor que la ficha: no solo cobra —
--   llena la agenda del paseador con paseos que no van a ocurrir.
--
-- LA LEY QUE EJECUTA: la cláusula de S80 NO RIGE en memorial (enmienda firmada
-- en POLITICAS P16 y MODELO_FINANCIERO §2 — sus dos casas): "la regla fue
-- escrita para quien ELIGIÓ no usar; una familia en duelo no eligió nada."
--
-- EL AVISO DE LA LIBERACIÓN, declarado: se registra por la puerta y NACE
-- descartado por el gate 1 (la mascota ya está en memorial). Es a propósito:
-- la liberación OCURRE; su aviso calla con el mismo respeto que todo lo demás
-- (§5.1), y el rastro queda en la sombra como descartada_memorial. Si el
-- founder quisiera que el aviso de plata sobreviva al memorial, es enmienda
-- de letra, no de este trigger.
--
-- VEDA 76(g): NO RIGE — REPLACE de funciones + un trigger; cero datos tocados.
-- REVERSA escrita ANTES: docs/relevamientos/2026-08-05-s88a-REVERSA-d657.sql
--   (y declara que revertir REINSTALA el cobro silencioso).
-- ============================================================================

BEGIN;

-- ── (a) EL ACTO DEL PRODUCTO ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_mascotas_memorial_planes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_s        record;
  v_sobrantes integer;
  v_credito   numeric(14,2);
BEGIN
  IF NEW.estado_vida IS DISTINCT FROM 'activa'
     AND OLD.estado_vida IS NOT DISTINCT FROM 'activa' THEN

    FOR v_s IN
      SELECT * FROM public.suscripciones_servicio
       WHERE mascota_id = NEW.id AND estado IN ('pendiente','activa','pausada')
       FOR UPDATE
    LOOP
      -- Lo no consumido del período vigente — el MISMO conteo que la rama
      -- vencida de cerrar_y_renovar_planes (espejo, no invento).
      SELECT count(*) INTO v_sobrantes
        FROM public.evento_cita_servicio c
       WHERE c.suscripcion_servicio_id = v_s.id
         AND c.estado = 'confirmada'
         AND c.fecha >= v_s.periodo_inicio AND c.fecha < v_s.periodo_fin;
      v_credito := round(COALESCE(v_s.precio_unitario_efectivo, 0) * v_sobrantes, 2);

      UPDATE public.evento_cita_servicio
         SET estado = 'cancelada'
       WHERE suscripcion_servicio_id = v_s.id
         AND estado = 'confirmada'
         AND fecha >= v_s.periodo_inicio AND fecha < v_s.periodo_fin;

      UPDATE public.suscripciones_servicio
         SET estado = 'cancelada',
             cancelado_en = now(),
             motivo_cancelacion = 'memorial',
             auto_renovar = false,
             ultima_actividad_en = now(),
             estado_pago = CASE WHEN v_credito > 0 THEN 'reembolsado' ELSE estado_pago END,
             pago_metadata = pago_metadata || CASE WHEN v_credito > 0 THEN jsonb_build_object(
               'reembolsos', COALESCE(pago_metadata->'reembolsos','[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                 'monto', v_credito, 'citas', v_sobrantes,
                 'motivo', 'liberacion_memorial_clausula_s80_no_rige',
                 'simulado', true, 'aplicado_en', now()
               ))
             ) ELSE '{}'::jsonb END
       WHERE id = v_s.id;

      -- El aviso: nace descartado por gate 1 (ver cabecera). El rastro ES el punto.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'plan_vencido_reembolso',
        p_destinatario_user_id => v_s.user_id,
        p_mascota_id           => NEW.id,
        p_datos                => jsonb_build_object(
          'subtipo', 'liberacion_memorial', 'suscripcion_servicio_id', v_s.id,
          'monto', v_credito, 'citas', v_sobrantes),
        p_clave_dedup          => 'liberacion-memorial:' || v_s.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_mascotas_memorial_planes
  AFTER UPDATE OF estado_vida ON public.mascotas
  FOR EACH ROW EXECUTE FUNCTION public._trg_mascotas_memorial_planes();

REVOKE EXECUTE ON FUNCTION public._trg_mascotas_memorial_planes() FROM PUBLIC, anon, authenticated;

-- ── (b) EL FUSIBLE + (b-bis) LA OTRA BOCA ──────────────────────────────────
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
  v_mascota_activa boolean;  -- D-657 (b): el fusible del motor
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
        -- S87 · LOTE 1 → LA PUERTA (aviso `plan_renovacion_72h`).
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'plan_renovacion_proxima',
          p_destinatario_user_id => v_susc.user_id,
          p_mascota_id           => v_susc.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'plan_renovacion_72h', 'suscripcion_servicio_id', v_susc.id),
          p_clave_dedup          => 'plan_renovacion_72h:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
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

        -- ══ D-657 (b) · EL FUSIBLE DEL MOTOR (firma founder, dirección (c)) ══
        -- La renovación consulta estado_vida: un plan de mascota no activa NO
        -- se renueva — cae a la rama vencida, que ya libera lo no consumido
        -- (P14). Mascota NULL o borrada: no hay base para frenar, renueva
        -- (declarado). La cláusula de S80 no rige en memorial: la regla fue
        -- escrita para quien ELIGIÓ no usar — una familia en duelo no eligió
        -- nada (enmienda firmada 5-ago en POLITICAS P16 y FINANCIERO §2).
        SELECT (m.estado_vida IS NOT DISTINCT FROM 'activa') INTO v_mascota_activa
        FROM mascotas m WHERE m.id = v_susc.mascota_id;
        v_mascota_activa := COALESCE(v_mascota_activa, true);

        IF v_susc.auto_renovar AND v_mascota_activa THEN
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

          -- S87 · LOTE 1 → LA PUERTA (aviso `plan_renovado`).
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'plan_renovado',
          p_destinatario_user_id => v_susc.user_id,
          p_mascota_id           => v_susc.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'plan_renovado', 'suscripcion_servicio_id', v_susc.id),
          p_clave_dedup          => 'plan_renovado:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
        );
          v_renovados := v_renovados + 1;
        ELSE
          UPDATE suscripciones_servicio
          SET estado = 'vencida',
              estado_pago = CASE WHEN v_credito > 0 THEN 'reembolsado' ELSE estado_pago END,
              pago_metadata = pago_metadata || CASE WHEN v_credito > 0 THEN jsonb_build_object(
                'reembolsos', COALESCE(pago_metadata->'reembolsos', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                  'monto', v_credito, 'citas', v_sobrantes,
                  'motivo', CASE WHEN NOT v_mascota_activa
                             THEN 'liberacion_memorial_clausula_s80_no_rige'
                             ELSE 'p14_reembolso_proporcional_no_renovacion' END,
                  'simulado', true, 'aplicado_en', now()
                ))
              ) ELSE '{}'::jsonb END
          WHERE id = v_susc.id;

          IF v_credito > 0 THEN
            -- S87 · LOTE 1 → LA PUERTA (aviso `plan_vencido_reembolso`).
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'plan_vencido_reembolso',
          p_destinatario_user_id => v_susc.user_id,
          p_mascota_id           => v_susc.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'plan_vencido_reembolso', 'suscripcion_servicio_id', v_susc.id),
          p_clave_dedup          => 'plan_vencido_reembolso:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
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
      -- S87 · LOTE 1 → LA PUERTA (aviso `plan_renovacion_fallida`).
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'plan_renovacion_fallida',
          p_destinatario_user_id => v_susc.user_id,
          p_mascota_id           => v_susc.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'plan_renovacion_fallida', 'suscripcion_servicio_id', v_susc.id),
          p_clave_dedup          => 'plan_renovacion_fallida:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
        );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'renovados', v_renovados,
    'vencidos', v_vencidos, 'errores', v_errores, 'corrida_en', now()
  );
END;
$function$

;

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
  -- D-657 (b-bis): el motor consulta estado_vida en las DOS bocas del plan
  -- (renovar Y contratar). Un plan nuevo para una mascota no activa es el
  -- mismo cobro con otra puerta. Mismo código de rebote: el wrapper ya lo mapea.
  IF EXISTS (SELECT 1 FROM mascotas m
              WHERE m.id = p_mascota_id AND m.estado_vida IS DISTINCT FROM 'activa') THEN
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
$function$

;

-- fixture
-- ════════════════════════════════════════════════════════════════════════════
-- FIXTURE D-657 — pares y rojos, in-txn ROLLBACK (L-199).
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_su record; v_r jsonb; v_out text := ''; v_m text; v_n int; v_ct int;
BEGIN
  SELECT s.*, m.familia_id INTO v_su
    FROM suscripciones_servicio s JOIN mascotas m ON m.id=s.mascota_id
   WHERE s.estado='activa' LIMIT 1;
  -- oferta renovable fabricada (sin ella la rama cae a "vence honesto" y nada discrimina)
  UPDATE prestador_servicios SET precio_mensual_plan=138 WHERE id=v_su.prestador_servicio_id;

  -- ── PAR (a) · EL ACTO: la transición cancela, libera y deja rastro ────────
  UPDATE mascotas SET estado_vida='fallecida' WHERE id=v_su.mascota_id;
  SELECT count(*) INTO v_ct FROM evento_cita_servicio
   WHERE suscripcion_servicio_id=v_su.id AND estado='confirmada';
  v_out := v_out || format('A: susc=%s · citas_confirmadas_que_quedan=%s · credito=%s · aviso=%s | ',
    (SELECT estado FROM suscripciones_servicio WHERE id=v_su.id),
    v_ct,
    (SELECT pago_metadata #>> '{reembolsos,-1,monto}' FROM suscripciones_servicio WHERE id=v_su.id),
    (SELECT estado||'/'||motivo FROM notificacion_intencion WHERE clave_dedup='liberacion-memorial:'||v_su.id));

  -- ── PAR (b) · EL FUSIBLE: fabrico el estado que el acto no alcanzó ───────
  -- (una suscripción activa de mascota YA no-activa — el fusible existe para
  --  lo que llegue por caminos que el trigger no vio)
  UPDATE suscripciones_servicio SET estado='activa',
         periodo_fin=(now() AT TIME ZONE 'America/Guayaquil')::date
   WHERE id=v_su.id;
  v_r := cerrar_y_renovar_planes();
  v_out := v_out || format('B(fusible): renovados=%s vencidos=%s · estado=%s · motivo_liberacion=%s | ',
    v_r->>'renovados', v_r->>'vencidos',
    (SELECT estado FROM suscripciones_servicio WHERE id=v_su.id),
    (SELECT pago_metadata #>> '{reembolsos,-1,motivo}' FROM suscripciones_servicio WHERE id=v_su.id));

  -- ── VERDE · DISCRIMINADOR: mascota ACTIVA → el motor SÍ renueva ──────────
  UPDATE mascotas SET estado_vida='activa' WHERE id=v_su.mascota_id;
  -- ⚠️ CAZADO POR EL PROPIO FIXTURE: el trigger de (a) puso auto_renovar=false
  -- en el paso A, y la primera versión de este paso no lo restauraba — el
  -- motor tomaba vencida LEGÍTIMAMENTE y el verde parecía fallo del fusible.
  -- Un discriminador que no restaura TODO el estado no discrimina.
  UPDATE suscripciones_servicio SET estado='activa', auto_renovar=true,
         periodo_fin=(now() AT TIME ZONE 'America/Guayaquil')::date,
         pago_metadata = pago_metadata - 'reembolsos'
   WHERE id=v_su.id;
  v_r := cerrar_y_renovar_planes();
  v_out := v_out || format('V(activa renueva): FULL=%s · nuevo_fin=%s | ',
    v_r::text, (SELECT periodo_fin FROM suscripciones_servicio WHERE id=v_su.id));

  -- ── ROJO · LA OTRA BOCA: contratar con mascota fallecida rebota ──────────
  UPDATE mascotas SET estado_vida='fallecida' WHERE id=v_su.mascota_id;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_su.user_id, 'role','authenticated')::text, true);
  BEGIN
    PERFORM contratar_plan_paseo(v_su.prestador_id, v_su.prestador_servicio_id,
      v_su.mascota_id, ARRAY[1,3]::smallint[], '09:00'::time, 'semanal');
    v_out := v_out || 'R(contratar)=NO REBOTO (MAL)';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_m = MESSAGE_TEXT;
    v_out := v_out || 'R(contratar)=' || v_m;
  END;
  PERFORM set_config('epp.d657', v_out, true);
END $$;
SELECT current_setting('epp.d657', true) AS fixture_d657;
ROLLBACK;
