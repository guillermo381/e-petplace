-- ============================================================================
-- S87-A · LOTE 1 — MIGRACIONES 2 y 3 DE 7 (avisos 2 a 7 de 11)
--   · vencer_programas_adiestramiento .... 2 avisos
--   · cerrar_y_renovar_planes ............ 4 avisos
--
-- Los seis pasan por la puerta con los cinco gates. Los cinco de plata dejan
-- de ser `sistema` — dejan de sobrevivir al memorial, que es lo que este arco
-- existe para arreglar.
--
-- Dedup: cada aviso reusa la llave que YA gobernaba su idempotencia
-- (`v_aviso_key` / el id de la entidad). Dos candados que no se hablan es un
-- duplicado esperando.
--
-- VEDA 76(g): NO RIGE — REPLACE de funciones, sin DDL de datos.
-- REVERSA: los cuerpos anteriores viven en el historial de migraciones.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vencer_programas_adiestramiento()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_prog      record;
  v_restantes int;
  v_reembolso numeric(14,2);
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_errores   int := 0;
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (patrón P16e).
  FOR v_prog IN
    SELECT pc.* FROM programas_contratados pc
    WHERE pc.estado = 'activo'
      AND pc.vigencia_hasta >= v_hoy AND pc.vigencia_hasta <= v_hoy + 3
      AND EXISTS (
        SELECT 1 FROM evento_cita_servicio c
        WHERE c.programa_contratado_id = pc.id AND c.estado = 'confirmada'
      )
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vigencia_' || v_prog.vigencia_hasta::text;
    IF NOT (v_prog.pago_metadata ? v_aviso_key) THEN
      -- S87 · LOTE 1 → LA PUERTA. tipo 'sistema' (que sobrevivía al memorial)
      -- pasa a `programa_vence` → saldo_pagado. Viaja mascota_id: el programa
      -- SÍ es de una mascota, así que el gate 1 puede evaluarlo de verdad.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'programa_vence',
        p_destinatario_user_id => v_prog.user_id,
        p_mascota_id           => v_prog.mascota_id,
        p_datos                => jsonb_build_object(
          'subtipo', 'programa_vigencia',
          'programa_contratado_id', v_prog.id,
          'vence_el', v_prog.vigencia_hasta),
        p_clave_dedup          => 'prog:' || v_prog.id || ':' || v_aviso_key
      );
      UPDATE programas_contratados
      SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_prog.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: sesiones restantes canceladas (la agenda se
  -- libera sola: _agenda_ocupacion no cuenta canceladas), reembolso
  -- proporcional declarado, motivo capturado.
  FOR v_prog IN
    SELECT pc.* FROM programas_contratados pc
    WHERE pc.estado = 'activo' AND pc.vigencia_hasta < v_hoy
    FOR UPDATE
  LOOP
    BEGIN
      -- el reembolso es la SUMA de los precios snapshoteados de las
      -- sesiones canceladas (exacto aunque la última porte el residuo).
      SELECT count(*), COALESCE(sum(c.precio), 0)
      INTO v_restantes, v_reembolso
      FROM evento_cita_servicio c
      WHERE c.programa_contratado_id = v_prog.id AND c.estado = 'confirmada';

      UPDATE evento_cita_servicio
      SET estado = 'cancelada',
          metadata = COALESCE(metadata, '{}'::jsonb)
                     || jsonb_build_object('motivo', 'vigencia_programa_vencida', 'cancelada_en', now()),
          updated_at = now()
      WHERE programa_contratado_id = v_prog.id AND estado = 'confirmada';

      UPDATE programas_contratados
      SET estado = 'vencido',
          motivo_vencimiento = 'sin_uso',   -- v1: registro sin triage (§9 diferido)
          estado_pago = CASE WHEN v_reembolso > 0 THEN 'reembolsado' ELSE estado_pago END,
          pago_metadata = pago_metadata || CASE WHEN v_reembolso > 0 THEN jsonb_build_object(
            'reembolsos', COALESCE(pago_metadata->'reembolsos', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'monto', v_reembolso, 'sesiones', v_restantes,
              'motivo', 'sin_uso',
              'via', 'vencer_programas_adiestramiento',
              'simulado', true, 'aplicado_en', now()
            ))
          ) ELSE '{}'::jsonb END,
          updated_at = now()
      WHERE id = v_prog.id;

      IF v_reembolso > 0 THEN
        -- S87 · LOTE 1 → LA PUERTA. Es OTRO hecho que el primero: plata que
        -- VUELVE. `programa_vencido_reembolso` → saldo_pagado. Dedup por
        -- programa: el reembolso de un programa se avisa UNA vez.
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'programa_vencido_reembolso',
          p_destinatario_user_id => v_prog.user_id,
          p_mascota_id           => v_prog.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'programa_vencido_reembolso',
            'programa_contratado_id', v_prog.id,
            'sesiones_sin_usar', v_restantes,
            'reembolso', v_reembolso),
          p_clave_dedup          => 'prog-reemb:' || v_prog.id
        );
      END IF;
      v_vencidos := v_vencidos + 1;
    EXCEPTION WHEN OTHERS THEN
      -- un programa imposible NO puede matar la corrida (patrón
      -- cerrar_y_renovar_planes).
      v_errores := v_errores + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'errores', v_errores, 'corrida_en', now()
  );
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
                  'motivo', 'p14_reembolso_proporcional_no_renovacion',
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

REVOKE EXECUTE ON FUNCTION public.vencer_programas_adiestramiento() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cerrar_y_renovar_planes() FROM PUBLIC, anon;
