-- =====================================================================
-- S56-A D-338 CORRECTIVA: suscripciones_servicio NO tiene updated_at
-- (tiene ultima_actividad_en) — la migracion 20260712130000 lo asumia
-- (L-084: la doc conceptual no es fuente de schema; el harness de
-- asserts lo atrapo en runtime, plpgsql no valida columnas al CREATE).
-- Se re-crean configurar_renovacion_plan y cerrar_y_renovar_planes SIN
-- ese campo; el updated_at de evento_cita_servicio (existe) se conserva.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.configurar_renovacion_plan(p_suscripcion_id uuid, p_auto_renovar boolean)
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
  SET auto_renovar = p_auto_renovar
  WHERE id = p_suscripcion_id;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', p_suscripcion_id, 'auto_renovar', p_auto_renovar);
END;
$function$
;

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
              )
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
                precio_unitario_efectivo = v_unitario
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
$function$
;
