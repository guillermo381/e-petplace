-- REVERSA de 20260806230000_s89a_gracia_firmada.sql (escrita ANTES).
-- Solo cambia un comentario del body; restaurar re-pone el «PROPUESTO A MESA»
-- que la firma del founder ya superó — no revertir salvo error de sesión.

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
  -- D-669 (S89) · la ventana de gracia
  v_gracia     jsonb;
  v_gracia_vencida boolean;
  v_gracia_dias int := 7;   -- ⚠️ PROPUESTO A MESA (S89): no hay letra que fije el número
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
            'subtipo', 'plan_renovacion_72h', 'suscripcion_servicio_id', v_susc.id)
            || public._voz_notificacion('plan_renovacion_proxima', v_susc.user_id, v_susc.mascota_id, jsonb_build_object('fecha', to_char(v_susc.periodo_fin,'DD/MM'))),
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

        -- ══ D-669 · LA VENTANA DE GRACIA (S89) ═══════════════════════════
        -- Letra del founder: «una tarjeta vencida no es la decisión de un
        -- cliente de dejar de cuidar a su mascota». El fallo de cobro abre
        -- gracia (handler de abajo); acá solo se decide si la ventana venció.
        -- EL CRÉDITO NO SE SUMA DESDE METADATA — y es a propósito: la
        -- subtransacción por fila DESHACE el cierre cuando la renovación
        -- falla, así que los sobrantes siguen confirmados hasta la pasada
        -- que SÍ resuelve (renueva o vence) y ESA los computa frescos.
        -- Sumarlos desde gracia los contaría DOS veces (el par lo cazó:
        -- reembolso 12 donde correspondía 6).
        v_gracia := v_susc.pago_metadata->'gracia';
        v_gracia_vencida := v_gracia IS NOT NULL
                            AND (v_gracia->>'hasta')::date < v_hoy;

        IF v_susc.auto_renovar AND v_mascota_activa AND NOT v_gracia_vencida THEN
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
            'subtipo', 'plan_renovado', 'suscripcion_servicio_id', v_susc.id)
            /* ⭐ S88/D-667 — REPUESTA: esta voz se perdió al reescribir la
               función sobre un snapshot tomado ANTES de que existiera. El PAR
               la cazó (asunto NULL en la sombra). Es la razón por la que un
               `CREATE OR REPLACE` se arma leyendo el objeto VIVO, jamás una
               copia guardada minutos antes. */
            || public._voz_notificacion('plan_renovado', v_susc.user_id, v_susc.mascota_id),
          p_clave_dedup          => 'plan_renovado:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
        );
          -- D-669: el cobro sanó dentro de la ventana — la gracia se limpia
          UPDATE suscripciones_servicio
          SET pago_metadata = pago_metadata - 'gracia'
          WHERE id = v_susc.id AND pago_metadata ? 'gracia';
          v_renovados := v_renovados + 1;
        ELSE
          UPDATE suscripciones_servicio
          SET estado = 'vencida',
              estado_pago = CASE WHEN v_credito > 0 THEN 'reembolsado' ELSE estado_pago END,
              pago_metadata = pago_metadata || CASE WHEN v_credito > 0 THEN jsonb_build_object(
                'reembolsos', COALESCE(pago_metadata->'reembolsos', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                  'monto', v_credito, 'citas', v_sobrantes,
                  'motivo', CASE WHEN v_gracia_vencida
                             THEN 'd669_gracia_agotada_cobro_fallido'
                             WHEN NOT v_mascota_activa
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
            'subtipo', 'plan_vencido_reembolso', 'suscripcion_servicio_id', v_susc.id)
            || public._voz_notificacion('plan_vencido_reembolso', v_susc.user_id, v_susc.mascota_id, jsonb_build_object('monto', to_char(v_credito,'FM999990.00'), 'citas', v_sobrantes::text)),
          p_clave_dedup          => 'plan_vencido_reembolso:' || v_susc.id || ':' || coalesce(v_aviso_key, v_susc.periodo_fin::text)
        );
          END IF;
          v_vencidos := v_vencidos + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ══ D-669 (S89): EL PRIMER FALLO NO MATA — ABRE LA VENTANA DE GRACIA ══
      -- El plan queda ACTIVO, el cron reintenta en cada corrida, el crédito
      -- de los sobrantes se RETIENE (antes se evaporaba: vencida sin
      -- reembolso), y la muerte honesta —con su reembolso— llega SOLO si la
      -- ventana se agota (v_gracia_vencida ⇒ rama vencida de arriba).
      v_errores := v_errores + 1;
      IF v_susc.periodo_fin <= v_hoy THEN
        UPDATE suscripciones_servicio
        SET pago_metadata = pago_metadata || jsonb_build_object(
              'renovacion_fallida', jsonb_build_object('error', SQLERRM, 'en', now()),
              'gracia', jsonb_build_object(
                'desde',            COALESCE(pago_metadata->'gracia'->>'desde', v_hoy::text),
                'hasta',            COALESCE(pago_metadata->'gracia'->>'hasta', (v_hoy + v_gracia_dias)::text),
                'credito_en_juego', v_credito,   -- INFORMATIVO: la cuenta la hace la pasada que resuelve
                'reintentos',       COALESCE((pago_metadata->'gracia'->>'reintentos')::int, 0) + 1,
                'ultimo_error',     SQLERRM,
                'ultimo_reintento_en', now()
              )
            )
        WHERE id = v_susc.id AND estado = 'activa';
        PERFORM registrar_intencion_notificacion(
          p_tipo                 => 'plan_renovacion_fallida',
          p_destinatario_user_id => v_susc.user_id,
          p_mascota_id           => v_susc.mascota_id,
          p_datos                => jsonb_build_object(
            'subtipo', 'plan_renovacion_fallida', 'suscripcion_servicio_id', v_susc.id,
            'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_susc.mascota_id))
            || public._voz_notificacion('plan_renovacion_fallida', v_susc.user_id, v_susc.mascota_id,
                 jsonb_build_object('hasta', to_char(
                   COALESCE((v_susc.pago_metadata->'gracia'->>'hasta')::date, v_hoy + v_gracia_dias), 'DD/MM'))),
          p_clave_dedup          => 'plan_renovacion_fallida:' || v_susc.id || ':' || v_susc.periodo_fin
        );
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'renovados', v_renovados,
    'vencidos', v_vencidos, 'errores', v_errores, 'corrida_en', now()
  );
END;
$function$
;
