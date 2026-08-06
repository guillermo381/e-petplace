-- S88-A · EL LOTE DE VOCES — seis firmadas, el memorial callado, y dos defectos
-- de motor que la escritura destapó.
--
-- 76(g) — VEDA: **NO RIGE.** Solo `CREATE OR REPLACE` de funciones. Cero datos.
--
-- LO QUE ENTRA, en un solo acto porque las voces se firman POR LOTE:
--   ① las SEIS voces aprobadas, en `_voz_notificacion` (que gana `p_extra`:
--      cada hecho pide los datos que tiene)
--   ② 🔴→✅ D-668 — `registro_completado_cliente` iba al destinatario
--      EQUIVOCADO (copy-paste). El dueño recibía dos avisos del mismo hecho y
--      quien hizo el alta, ninguno.
--   ③ ☠️ EL MEMORIAL CALLA también en `_trg_mascotas_memorial_planes`: la
--      liberación sigue ocurriendo, muere el AVISO.
--   ④ `procedimiento_agendado` recibe el NOMBRE DEL NEGOCIO **en origen** —
--      un aviso que no dice dónde obliga a abrir la app para saber lo básico.
--
-- ⚠️ NO ENTRA `plan_renovacion_fallida`, y la medición dice por qué:
--      EXCEPTION WHEN OTHERS THEN
--        UPDATE suscripciones_servicio SET estado = 'vencida'   ← al PRIMER fallo
--    **No hay período de gracia ni reintento.** La propuesta del founder
--    (gracia + citas respetadas) es CONSTRUCCIÓN, no voz — va a su ficha.
--    *Escribir «tu plan sigue vigente hasta X» sobre un motor que lo mata en
--    el acto sería una voz que miente con buena redacción.*

BEGIN;
-- ── EL HELPER, con `p_extra`: cada voz pide los datos que su hecho tiene ──
-- ⚠️ Se AMPLÍA la firma (4º parámetro con default) en vez de crear una gemela:
--    el llamador viejo sigue compilando y no hay dos verdades. DROP explícito
--    de la firma de 3 al final — L-119: `CREATE OR REPLACE` con parámetros
--    distintos NO reemplaza, crea sobrecarga y deja la vieja zombi.
CREATE OR REPLACE FUNCTION public._voz_notificacion(
  p_tipo       text,
  p_user_id    uuid,
  p_mascota_id uuid  DEFAULT NULL,
  p_extra      jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_idioma  text;
  v_m       text;   -- nombre de la mascota, o NULL
  v_de_m    text;   -- «de Thor» / «'s», o el genérico
  v_en_m    text;
BEGIN
  SELECT up.idioma INTO v_idioma FROM user_preferencias up WHERE up.user_id = p_user_id;
  IF v_idioma IS NULL OR v_idioma NOT IN ('es','en') THEN v_idioma := 'es'; END IF;

  IF p_mascota_id IS NOT NULL THEN
    SELECT m.nombre INTO v_m FROM mascotas m WHERE m.id = p_mascota_id;
  END IF;
  -- El sujeto, SIN INVENTAR: con nombre lo usa; sin nombre cae al genérico
  -- que el founder firmó («tu plan de paseos» / "your walk plan").
  v_de_m := coalesce('de ' || v_m, '');
  v_en_m := coalesce(v_m || '''s ', '');

  CASE p_tipo

    -- ✅ FIRMADA S88 (la primera, ya en producción)
    WHEN 'plan_renovado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your walk plan renewed',
        'mensaje','We renewed ' || coalesce(v_m || '''s walk plan','your walk plan') ||
                  ' for another month. It''s active now and we charged your usual ' ||
                  'payment method. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Tu plan de paseos se renovó',
        'mensaje','Renovamos ' || coalesce('el plan de paseos de ' || v_m,'tu plan de paseos') ||
                  ' por un mes más. Ya está activo y el cobro se hizo con tu método ' ||
                  'habitual. Podés ver el detalle en la app.') END;

    -- ✅ LOTE S88 · 1/6 — el aviso de 72 h.
    --    Lleva LA SALIDA a propósito: avisar sin dar salida sería avisar de
    --    adorno, y la letra de la categoría dice que un cobro sorpresa no se
    --    deshace (criterio firmado).
    WHEN 'plan_renovacion_proxima' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your walk plan renews in 3 days',
        'mensaje', v_en_m || 'walk plan renews' ||
                   coalesce(' on ' || (p_extra->>'fecha'), '') ||
                   ' and we''ll charge your usual payment method. If you''d rather ' ||
                   'stop it, you can pause it in the app before then.')
      ELSE jsonb_build_object(
        'titulo','Tu plan de paseos se renueva en 3 días',
        'mensaje','El plan de paseos ' || v_de_m || ' se renueva' ||
                  coalesce(' el ' || (p_extra->>'fecha'), '') ||
                  ' y se va a cobrar con tu método habitual. Si no querés que siga, ' ||
                  'podés pausarlo desde la app antes de esa fecha.') END;

    -- ✅ 2/6
    WHEN 'paquete_vence' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','You have ' || coalesce(p_extra->>'restantes','some') || ' walks left',
        'mensaje', v_en_m || 'walk package expires' ||
                   coalesce(' on ' || (p_extra->>'vence'),'') || ' and you still have ' ||
                   coalesce(p_extra->>'restantes','walks') || ' walks. You can book them in the app.')
      ELSE jsonb_build_object(
        'titulo','Te quedan ' || coalesce(p_extra->>'restantes','salidas') || ' salidas por usar',
        'mensaje','El paquete de paseos ' || v_de_m || ' vence' ||
                  coalesce(' el ' || (p_extra->>'vence'),'') || ' y todavía te quedan ' ||
                  coalesce(p_extra->>'restantes','salidas') || ' salidas. Podés reservarlas desde la app.') END;

    -- ✅ 3/6
    WHEN 'programa_vence' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s program','Your program') || ' still has sessions left',
        'mensaje', v_en_m || 'training program expires' ||
                   coalesce(' on ' || (p_extra->>'vence'),'') ||
                   '. You can schedule the remaining sessions in the app.')
      ELSE jsonb_build_object(
        'titulo','Al programa ' || coalesce(v_de_m,'') || ' le quedan sesiones',
        'mensaje','El programa de adiestramiento ' || v_de_m || ' vence' ||
                  coalesce(' el ' || (p_extra->>'vence'),'') ||
                  '. Coordiná las sesiones que faltan desde la app.') END;

    -- ✅ 4/6 — HAY PLATA: se nombra, no se esconde
    WHEN 'programa_vencido_reembolso' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We refunded ' || coalesce(p_extra->>'monto','your balance') ||
                 coalesce(' from ' || v_m || '''s program',''),
        'mensaje', v_en_m || 'training program expired with ' ||
                   coalesce(p_extra->>'sesiones','unused') || ' unused sessions. We refunded ' ||
                   coalesce(p_extra->>'monto','the balance') || ' to your payment method.')
      ELSE jsonb_build_object(
        'titulo','Te devolvimos ' || coalesce(p_extra->>'monto','tu saldo') ||
                 coalesce(' del programa de ' || v_m,''),
        'mensaje','El programa de adiestramiento ' || v_de_m || ' venció con ' ||
                  coalesce(p_extra->>'sesiones','sesiones') || ' sesiones sin usar. Te devolvimos ' ||
                  coalesce(p_extra->>'monto','el saldo') || ' a tu método de pago.') END;

    -- ✅ 5/6 — HAY PLATA
    WHEN 'plan_vencido_reembolso' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We refunded ' || coalesce(p_extra->>'monto','your balance') ||
                 coalesce(' from ' || v_m || '''s plan',''),
        'mensaje', v_en_m || 'walk plan ended with ' ||
                   coalesce(p_extra->>'citas','unused') || ' unused walks. We refunded ' ||
                   coalesce(p_extra->>'monto','the balance') || ' to your payment method.')
      ELSE jsonb_build_object(
        'titulo','Te devolvimos ' || coalesce(p_extra->>'monto','tu saldo') ||
                 coalesce(' del plan de ' || v_m,''),
        'mensaje','El plan de paseos ' || v_de_m || ' terminó con ' ||
                  coalesce(p_extra->>'citas','salidas') || ' salidas sin usar. Te devolvimos ' ||
                  coalesce(p_extra->>'monto','el saldo') || ' a tu método de pago.') END;

    -- ✅ 6/6 — el negocio lo pasa el productor (④): un aviso de un
    --    procedimiento que no dice DÓNDE obliga a abrir la app para saber lo básico.
    WHEN 'procedimiento_agendado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s procedure','Your procedure') || ' is scheduled',
        'mensaje', coalesce(p_extra->>'negocio','The clinic') || ' confirmed the date: ' ||
                   coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                   '. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Quedó agendado el procedimiento ' || v_de_m,
        'mensaje', coalesce(p_extra->>'negocio','La clínica') || ' confirmó la fecha: ' ||
                   coalesce(p_extra->>'fecha','') || coalesce(' a las ' || (p_extra->>'hora'),'') ||
                   '. Podés ver el detalle en la app.') END;

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
END;
$$;

DROP FUNCTION IF EXISTS public._voz_notificacion(text, uuid, uuid);
REVOKE EXECUTE ON FUNCTION public._voz_notificacion(text, uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._voz_notificacion(text, uuid, uuid, jsonb) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────
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
            'subtipo', 'plan_vencido_reembolso', 'suscripcion_servicio_id', v_susc.id)
            || public._voz_notificacion('plan_vencido_reembolso', v_susc.user_id, v_susc.mascota_id, jsonb_build_object('monto', to_char(v_credito,'FM999990.00'), 'citas', v_sobrantes::text)),
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

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vencer_paquetes_salidas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_bono      record;
  v_restantes int;
  v_moneda    text;
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_breakage  numeric(14,2) := 0;
  v_monto     numeric(14,2);
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (P16e).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo' AND estado_pago = 'pagado'
      AND unidades_usadas < unidades_total
      AND fecha_vencimiento >= v_hoy AND fecha_vencimiento <= v_hoy + 3
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vencimiento_' || v_bono.fecha_vencimiento::text;
    IF NOT (v_bono.pago_metadata ? v_aviso_key) THEN
      -- S87 · LOTE 1: pasa por LA PUERTA. Cambios que esto trae, declarados:
      --  · el tipo deja de ser 'sistema' (que mapeaba a seguridad_cuenta y por
      --    lo tanto SOBREVIVÍA AL MEMORIAL) y pasa a `paquete_vence` →
      --    `saldo_pagado`. Es el aviso literal de P16(e).
      --  · viaja `mascota_id` para que el gate 1 pueda evaluarlo. Si el bono no
      --    la tiene, va NULL y el gate NO aplica — y el lector lo dice; no se
      --    finge que evaluó.
      --  · la clave de dedup reusa la MISMA llave que ya gobernaba el aviso
      --    (`aviso_vencimiento_<fecha>`), así el candado de idempotencia del
      --    motor y el de esta función dicen lo mismo en vez de competir.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'paquete_vence',
        p_destinatario_user_id => v_bono.user_id,
        p_mascota_id           => v_bono.mascota_id,
        p_evento_id            => NULL,
        p_datos                => jsonb_build_object(
          'subtipo', 'paquete_vencimiento',
          'bono_id', v_bono.id,
          'salidas_restantes', v_bono.unidades_total - v_bono.unidades_usadas,
          'vence_el', v_bono.fecha_vencimiento
        )
            || public._voz_notificacion('paquete_vence', v_bono.user_id, v_bono.mascota_id, jsonb_build_object('restantes', (v_bono.unidades_total - v_bono.unidades_usadas)::text, 'vence', to_char(v_bono.vigencia_hasta,'DD/MM'))),
        p_clave_dedup          => 'bono:' || v_bono.id || ':' || v_aviso_key
      );
      UPDATE bonos SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_bono.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: breakage DECLARADO (Decisión T).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo'
      AND fecha_vencimiento < v_hoy
    FOR UPDATE
  LOOP
    v_restantes := v_bono.unidades_total - v_bono.unidades_usadas;

    UPDATE bonos SET estado = 'vencido' WHERE id = v_bono.id;
    v_vencidos := v_vencidos + 1;

    IF v_restantes > 0 AND v_bono.estado_pago = 'pagado'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono.id
           AND ee.tipo_evento = 'bono_breakage'
       )
    THEN
      v_monto := round(v_restantes * COALESCE(v_bono.precio_por_unidad, 0), 2);
      SELECT cc.moneda INTO v_moneda
      FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_bono.prestador_id;

      PERFORM crear_evento_economico(
        p_tipo_evento         => 'bono_breakage'::tipo_evento_economico_enum,
        p_revenue_stream      => 'eventual'::revenue_stream_enum,
        p_cuenta_comercial_id => NULL,   -- revenue puro plataforma: sin payout
        p_country_code        => v_bono.country_code,
        p_moneda              => COALESCE(v_moneda, 'USD'),
        p_monto_bruto         => v_monto,
        p_monto_kushki_fee    => 0,      -- simulación honesta
        p_origen_tipo         => 'bono',
        p_origen_id           => v_bono.id,
        p_fecha_devengo       => now(),
        p_fecha_cobro_kushki  => (v_bono.pago_metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object(
          'pago_simulado', true, 'via', 'vencer_paquetes_salidas',
          'salidas_vencidas', v_restantes,
          'precio_por_unidad', v_bono.precio_por_unidad
        )
      );
      v_breakage := v_breakage + v_monto;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'breakage_total', v_breakage, 'corrida_en', now()
  );
END;
$function$
;

-- ──────────────────────────────────────────────────────────────────────
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
          'vence_el', v_prog.vigencia_hasta)
            || public._voz_notificacion('programa_vence', v_prog.user_id, v_prog.mascota_id, jsonb_build_object('vence', to_char(v_prog.vigencia_hasta,'DD/MM'))),
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
            'reembolso', v_reembolso)
            || public._voz_notificacion('programa_vencido_reembolso', v_prog.user_id, v_prog.mascota_id, jsonb_build_object('monto', to_char(v_reembolso,'FM999990.00'), 'sesiones', v_restantes::text)),
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

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fijar_fecha_procedimiento(p_cita uuid, p_fecha date, p_hora time without time zone, p_empleado uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_cita          record;
  v_pres          record;
  v_cuenta        uuid;
  v_emp_prestador uuid;
  v_capacidad     int;
  v_ocupados      int;
  v_ahora         timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_notif_user    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  -- cita + elegibilidad (fecha NULL + presupuesto aprobado)
  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.presupuesto_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_presupuesto' USING ERRCODE = '22023';
  END IF;
  IF v_cita.fecha IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_fijada' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_pres FROM presupuesto WHERE id = v_cita.presupuesto_id;
  IF v_pres.estado <> 'aprobado' THEN
    RAISE EXCEPTION 'presupuesto_no_aprobado: %', COALESCE(v_pres.estado, 'inexistente')
      USING ERRCODE = '22023';
  END IF;
  v_cuenta := v_pres.cuenta_comercial_id;

  -- persona que fija: habilitada de la cuenta
  IF NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- persona asignada (reasignación §2): activa y de la MISMA cuenta
  SELECT pe.prestador_id INTO v_emp_prestador
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  WHERE pe.id = p_empleado
    AND pe.activo = true
    AND pr.cuenta_comercial_id = v_cuenta;
  IF v_emp_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_es_de_cuenta' USING ERRCODE = '22023';
  END IF;

  -- higiene: la fecha coordinada no vive en el pasado (espejo reagendar_cita_suelta)
  IF (p_fecha + p_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- serializar por prestador+fecha (mismo patrón del motor de ventana)
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_emp_prestador::text || ':' || p_fecha::text, 0)
  );

  -- ocupación real del motor de ventana (regla de mezcla V0), duración
  -- SNAPSHOTEADA de la cita respetada; el procedimiento es exclusivo por
  -- default (cupo_techo NULL ⇒ capacidad 1). No se impone la grilla
  -- reservable (fuera_de_horario): la fecha del procedimiento se coordina,
  -- no se reserva contra el horario público.
  v_capacidad := COALESCE(
    (SELECT cupo_techo FROM tipos_servicio WHERE codigo = v_cita.tipo_servicio), 1);
  v_ocupados := public._agenda_ocupacion(
    p_empleado, p_fecha, p_hora, v_cita.duracion_minutos, p_cita, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- fijar fecha/hora/empleado + re-derivar prestador (asignación autoritativa).
  -- PRECIO CONGELADO INTACTO — no se toca `precio`.
  -- S72-A: la todo-libre gana un TIPO CONSUMIBLE al coordinar — sin él, la
  -- cita queda invisible a la agenda vet (los lectores discriminan por el
  -- embed tipos_servicio). COALESCE: jamás pisa un tipo que la cita ya tenga.
  UPDATE evento_cita_servicio
  SET fecha        = p_fecha,
      hora         = p_hora,
      empleado_id  = p_empleado,
      prestador_id = v_emp_prestador,
      tipo_servicio = COALESCE(tipo_servicio, 'procedimiento'),
      metadata     = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                       'fecha_fijada_en', now(),
                       'fijada_por',      v_uid
                     ),
      updated_at   = now()
  WHERE id = p_cita;

  -- si la cita tiene evento de timeline, mover su fecha (no-op si NULL)
  IF v_cita.evento_id IS NOT NULL THEN
    UPDATE eventos_mascota
    SET fecha_evento = (p_fecha + p_hora)
    WHERE id = v_cita.evento_id;
  END IF;

  -- notificación al dueño SIEMPRE (canal existente `notificaciones`). El
  -- caso fantasma sin user en app no tiene destino in-app (declarado): se
  -- notifica cuando hay dueño real.
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    -- S87 · LOTE 1 → LA PUERTA. El tipo DECIA 'cita_confirmada' bajo un titulo
    -- que decia 'Tu procedimiento quedo agendado': el vocabulario viejo no
    -- distinguia. Pasa a `procedimiento_agendado` (firmado S87).
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'procedimiento_agendado',
      p_destinatario_user_id => v_notif_user,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id,
                                                   'presupuesto_id', p_presupuesto_id)
            || public._voz_notificacion('procedimiento_agendado', v_notif_user, v_cita.mascota_id, jsonb_build_object('negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id), 'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))),
      p_clave_dedup          => 'proc-agendado:' || v_cita.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita,
    'fecha', p_fecha,
    'hora', p_hora,
    'empleado_id', p_empleado,
    'prestador_id', v_emp_prestador,
    'dueno_notificado', (v_notif_user IS NOT NULL)
  );
END;
$function$
;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_completar_pendiente_registro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
  v_mascota_id uuid;
  v_evento_id uuid;
  v_prestador_dueno_user_id uuid;
BEGIN
  -- Match dual: por email O por teléfono normalizado (con el país del pendiente).
  SELECT * INTO v_pendiente
  FROM cliente_pendiente_registro cpr
  WHERE cpr.completado_en IS NULL
    AND cpr.soporte_resuelto_en IS NULL
    AND (
      (cpr.email IS NOT NULL AND NEW.email IS NOT NULL AND LOWER(cpr.email) = LOWER(NEW.email))
      OR (cpr.telefono_normalizado IS NOT NULL AND NEW.telefono IS NOT NULL
          AND cpr.telefono_normalizado = public.normalizar_telefono(NEW.telefono, cpr.country_code))
    )
  LIMIT 1;

  IF v_pendiente.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE cliente_pendiente_registro
  SET completado_en = now(), completado_por_user_id = NEW.id
  WHERE id = v_pendiente.id;

  UPDATE familia
  SET tipo = 'estandar', cuenta_comercial_id = NULL, updated_at = now()
  WHERE id = v_pendiente.familia_id_placeholder;

  INSERT INTO familia_miembro (familia_id, user_id, rol, desde)
  VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

  FOR v_mascota_id IN
    SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
  LOOP
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota_id, NEW.id, v_pendiente.familia_id_placeholder, now(), NEW.id);

    UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;

    v_evento_id := gen_random_uuid();
    INSERT INTO eventos_mascota (
      id, mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, datos, country_code
    ) VALUES (
      v_evento_id, v_mascota_id, 'alta_asistida_completada_por_cliente', 'administrativo', now(),
      NEW.id,
      jsonb_build_object('pendiente_id', v_pendiente.id, 'prestador_origen', v_pendiente.creado_por_prestador_id),
      v_pendiente.country_code
    );
  END LOOP;

  SELECT user_id INTO v_prestador_dueno_user_id
  FROM prestadores WHERE id = v_pendiente.creado_por_prestador_id;

  IF v_prestador_dueno_user_id IS NOT NULL THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_prestador`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_prestador',
        p_destinatario_user_id => v_prestador_dueno_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre),
        p_clave_dedup          => 'registro_completado_prestador:' || v_pendiente.id
      );
  END IF;

  IF v_pendiente.creado_por_user_id IS NOT NULL
     AND v_pendiente.creado_por_user_id <> v_prestador_dueno_user_id THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_cliente`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_cliente',
        /* 🔴→✅ S88/D-668: decía `v_prestador_dueno_user_id`, COPIADO del bloque de
           arriba. El GUARD sí se adaptó —pregunta por `creado_por_user_id` y exige
           que sea DISTINTO del dueño— y el destinatario no: el dueño recibía DOS
           avisos del mismo hecho y quien hizo el alta NINGUNO. */
        p_destinatario_user_id => v_pendiente.creado_por_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre),
        p_clave_dedup          => 'registro_completado_cliente:' || v_pendiente.id
      );
  END IF;

  RETURN NEW;
END;
$function$
;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_mascotas_memorial_planes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

      /* ☠️ S88 — EL MEMORIAL CALLA, TAMBIÉN ACÁ (firma del founder).
         Acá vivía un aviso `plan_vencido_reembolso` con subtipo
         `liberacion_memorial`. **NO SALE**, y es la MISMA decisión que el
         founder firmó hoy para su hermana exacta — no una nueva: la
         liberación por memorial calla, y la familia ve el crédito cuando
         vuelve. *Un aviso de plata en duelo es la app hablando justo cuando
         prometió callar.*
         ⚠️ LA LIBERACIÓN SIGUE OCURRIENDO. Lo que muere es el AVISO. */
    END LOOP;
  END IF;
  RETURN NEW;
END $function$
;

-- ── CINTURÓN: mide el OBJETO, tipo por tipo ───────────────────────────────
DO $belt$
DECLARE v_t text; v_faltan text := '';
BEGIN
  FOREACH v_t IN ARRAY ARRAY['plan_renovado','plan_renovacion_proxima','paquete_vence',
                             'programa_vence','programa_vencido_reembolso',
                             'plan_vencido_reembolso','procedimiento_agendado'] LOOP
    IF public._voz_notificacion(v_t, NULL, NULL, '{}'::jsonb) = '{}'::jsonb THEN
      v_faltan := v_faltan || v_t || ' ';
    END IF;
  END LOOP;
  IF v_faltan <> '' THEN RAISE EXCEPTION 'CINTURON: sin voz → %', v_faltan; END IF;

  -- La que NO debe tener voz todavía (su motor no tiene gracia).
  IF public._voz_notificacion('plan_renovacion_fallida', NULL, NULL, '{}'::jsonb) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'CINTURON: plan_renovacion_fallida tiene voz y su motor no tiene gracia';
  END IF;

  -- D-668: el receptor curado.
  IF pg_get_functiondef('public._trg_completar_pendiente_registro()'::regprocedure)
     NOT LIKE '%v_pendiente.creado_por_user_id%' THEN
    RAISE EXCEPTION 'CINTURON: el receptor de registro_completado_cliente sigue mal';
  END IF;

  -- El memorial CALLA.
  IF pg_get_functiondef('public._trg_mascotas_memorial_planes()'::regprocedure)
     LIKE '%registrar_intencion_notificacion%' THEN
    RAISE EXCEPTION 'CINTURON: el memorial sigue avisando';
  END IF;

  -- La firma vieja de 3 parámetros no puede sobrevivir (L-119: sobrecarga zombi).
  IF to_regprocedure('public._voz_notificacion(text, uuid, uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON: quedó viva la firma de 3 parámetros';
  END IF;

  RAISE NOTICE 'CINTURON VERDE: 7 voces · fallida SIN voz · receptor curado · memorial callado · sin zombi.';
END
$belt$;

COMMIT;
