-- S88-A · D-667 — LA VOZ DE PRODUCTO, EN UN SOLO LUGAR
--
-- 76(g) — VEDA: **NO RIGE.** Una función nueva + un `CREATE OR REPLACE` del
--   productor. Cero datos tocados.
--
-- ⚠️ POR QUÉ UN HELPER Y NO STRINGS INLINE EN CADA PRODUCTOR:
--   son 37 tipos. Inlinear la voz en cada uno la disemina por nueve funciones
--   y garantiza que se firmen «de a una en pánico». Acá vive UNA tabla de
--   casos: firmar un lote de voces es editar UN cuerpo, y **el día que las
--   plantillas pasen a ser TABLA (la opción 2 de D-667), se cambia esta
--   función y nada más.**
--
-- ⚠️ Y LO QUE **NO** HACE, que es la mitad honesta: un tipo sin voz firmada
--   devuelve `'{}'::jsonb`. **No inventa.** La Edge Function seguirá cayendo a
--   su genérico para ese tipo — pero ahora el censo dice exactamente cuáles, y
--   ninguno está fuera de sombra sin que la mesa lo sepa.

CREATE OR REPLACE FUNCTION public._voz_notificacion(
  p_tipo       text,
  p_user_id    uuid,
  p_mascota_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_idioma  text;
  v_mascota text;
BEGIN
  -- El idioma de la PERSONA, con el default de la casa. `user_preferencias`
  -- es la verdad multi-dispositivo (D-316); sin fila, español.
  SELECT up.idioma INTO v_idioma FROM user_preferencias up WHERE up.user_id = p_user_id;
  IF v_idioma IS NULL OR v_idioma NOT IN ('es','en') THEN v_idioma := 'es'; END IF;

  -- El nombre, si existe. **Sin inventar**: la firma dice que cae a genérico.
  IF p_mascota_id IS NOT NULL THEN
    SELECT m.nombre INTO v_mascota FROM mascotas m WHERE m.id = p_mascota_id;
  END IF;

  CASE p_tipo

    -- ✅ FIRMADO POR EL FOUNDER (5-ago-2026)
    --   · el asunto DICE QUÉ PASÓ (jamás «novedad»)
    --   · el cuerpo NOMBRA EL COBRO sin esconderlo — es constancia: la
    --     categoría existe para que la plata no sea sorpresa
    --   · nombra a la mascota, que es lo que lo hace del dueño y no del sistema
    WHEN 'plan_renovado' THEN
      RETURN CASE WHEN v_idioma = 'en' THEN
        jsonb_build_object(
          'titulo',  'Your walk plan renewed',
          'mensaje', 'We renewed ' ||
                     coalesce(v_mascota || '''s walk plan', 'your walk plan') ||
                     ' for another month. It''s active now and we charged your ' ||
                     'usual payment method. You can see the details in the app.')
      ELSE
        jsonb_build_object(
          'titulo',  'Tu plan de paseos se renovó',
          'mensaje', 'Renovamos ' ||
                     coalesce('el plan de paseos de ' || v_mascota, 'tu plan de paseos') ||
                     ' por un mes más. Ya está activo y el cobro se hizo con tu ' ||
                     'método habitual. Podés ver el detalle en la app.')
      END;

    ELSE
      -- ⚠️ SIN VOZ FIRMADA. Se devuelve VACÍO a propósito: inventar un texto
      --    para un tipo que la mesa no firmó sería exactamente el defecto que
      --    D-667 existe para matar, con mejor redacción.
      RETURN '{}'::jsonb;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public._voz_notificacion(text, uuid, uuid) IS
  'S88/D-667: la voz de producto de un aviso, por tipo e idioma. UN solo lugar '
  'para 37 tipos — el día que las plantillas sean TABLA, cambia esta función y '
  'nada más. Un tipo sin voz firmada devuelve {} : no inventa.';

REVOKE EXECUTE ON FUNCTION public._voz_notificacion(text, uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._voz_notificacion(text, uuid, uuid) TO authenticated;

-- ── EL PRODUCTOR, con la voz enchufada ───────────────────────────────────
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
            'subtipo', 'plan_renovado', 'suscripcion_servicio_id', v_susc.id)
            -- ⭐ S88/D-667: LA VOZ VIAJA CON EL DATO. Sin esto, la Edge
            --    Function caía a «Tienes una novedad en e-PetPlace / Abre la
            --    app para verla» sobre un plan YA COBRADO.
            || public._voz_notificacion('plan_renovado', v_susc.user_id, v_susc.mascota_id),
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
$function$;

-- ── CINTURÓN: mide el OBJETO ──────────────────────────────────────────────
DO $belt$
BEGIN
  IF to_regprocedure('public._voz_notificacion(text, uuid, uuid)') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta el helper de voz';
  END IF;
  IF pg_get_functiondef('public.cerrar_y_renovar_planes()'::regprocedure)
     NOT LIKE '%_voz_notificacion%' THEN
    RAISE EXCEPTION 'CINTURON: el productor NO quedó con la voz enchufada';
  END IF;
  -- La voz no puede quedar vacía para el tipo que sale el 13.
  IF public._voz_notificacion('plan_renovado',
       (SELECT user_id FROM suscripciones_servicio LIMIT 1), NULL) = '{}'::jsonb THEN
    RAISE EXCEPTION 'CINTURON: plan_renovado devolvió voz VACIA';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: helper creado · productor enchufado · plan_renovado con voz.';
END
$belt$;
