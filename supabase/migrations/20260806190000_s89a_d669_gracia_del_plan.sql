-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · D-669 — LA GRACIA DEL PLAN: el primer fallo de cobro NO mata
--
-- LA MUERTE, reproducida contra el objeto ANTES de esta migración (fixture
-- in-txn, ROLLBACK): un fallo de renovación (plan_no_ofrecido como proxy del
-- cobro fallido real) dejaba en UNA corrida: estado='vencida' + el crédito de
-- los sobrantes EVAPORADO (cero reembolsos) + el aviso sin voz (titulo NULL).
--
-- LA CURA (letra del founder: «una tarjeta vencida no es la decisión de un
-- cliente de dejar de cuidar a su mascota»):
--   · el fallo abre GRACIA en pago_metadata (desde/hasta/credito_en_juego/
--     reintentos/ultimo_error) y el plan QUEDA ACTIVO — el cron diario ES el
--     reintento;
--   · el crédito de los sobrantes NO se evapora ni se retiene a mano: la
--     subtransacción por fila deshace el cierre fallido, los sobrantes
--     siguen confirmados, y la pasada que resuelve los computa frescos —
--     al cobro si sana (se descuenta), o al reembolso si la ventana se
--     agota (motivo d669_gracia_agotada_cobro_fallido — antes se evaporaba);
--   · la muerte honesta (vencida + reembolso + aviso) llega SOLO al agotarse
--     la ventana;
--   · la voz `plan_renovacion_fallida` NACE con la cura (en sombra, tuteo,
--     al lote de firma de D) — el aviso dejó de salir mudo.
--
-- ⚠️ EL NÚMERO A MESA: v_gracia_dias := 7 — NO HAY LETRA QUE LO FIJE
-- (medido: POLITICAS/PASEO/FINANCIERO sin ventana de gracia; MODELO_PASEO
-- §"reintentos" lo difería al arco de pagos). PROPUESTO, no firmado.
--
-- Sin estado nuevo A PROPÓSITO: 'en_gracia' habría exigido barrer todos los
-- lectores de estado='activa' (el cron incluido); la gracia vive en
-- pago_metadata y el plan SIGUE activo, que es la verdad del producto.
--
-- 76(g): NO RIGE — dos CREATE OR REPLACE, cero backfill.
-- D-662: cero cambio de contrato; bundles intactos.
-- L-140: no nace función; proacl intactos.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-d669-gracia.sql
--   (escrita ANTES; revertir REABRE la muerte al primer fallo).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._voz_notificacion(p_tipo text, p_user_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_extra jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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


    -- ✅ LOTE S88 · las dos del alta asistida. El hecho es UNO —el cliente
    --    completó su registro— y las audiencias son DOS, las dos del NEGOCIO.
    --    Se nombra al CLIENTE porque es el sujeto; no hay plata en juego.
    WHEN 'registro_completado_prestador' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','Your client') || ' completed their registration',
        'mensaje', coalesce(p_extra->>'cliente','Your client') ||
                   ' now has an e-PetPlace account and their pets are under their name. ' ||
                   'They can see the records and book from now on.')
      ELSE jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','Tu cliente') || ' completó su registro',
        'mensaje', coalesce(p_extra->>'cliente','Tu cliente') ||
                   ' ya tiene su cuenta en e-PetPlace y sus mascotas quedaron a su nombre. ' ||
                   'Desde ahora ve su expediente y puede reservar.') END;

    -- ⚠️ `_operador`, no `_cliente`: RENOMBRADO S88 porque el nombre mentía —
    --    se llamaba por el SUJETO del hecho y se leía como el DESTINATARIO.
    --    Va a QUIEN HIZO EL ALTA, y por eso su voz habla de SU trabajo.
    WHEN 'registro_completado_operador' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','The client') || ' completed the registration you started',
        'mensaje','The pets you added are now in their account. The handoff is done.')
      ELSE jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','El cliente') || ' completó el registro que iniciaste',
        'mensaje','Las mascotas que cargaste ya están en su cuenta. El alta quedó cerrada.') END;


    -- 🕯️ S89 · D-673 — LAS TRES DE CITA: EN SOMBRA, VOZ SIN FIRMA (el lote
    --    para la pasada de firma quedó depositado a D). Tuteo neutro por firma
    --    founder 6-ago-2026; la divergencia con el acento del lote S88 es
    --    territorio D-539 y se arbitra en esa pasada.
    WHEN 'cita_confirmada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s appointment','Your appointment') || ' is confirmed',
        'mensaje','The appointment ' || coalesce('for ' || v_m || ' ','') || 'with ' ||
                  coalesce(p_extra->>'negocio','the provider') || ' is confirmed for ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                  '. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Tu cita quedó confirmada',
        'mensaje','La cita ' || v_de_m || ' con ' || coalesce(p_extra->>'negocio','el prestador') ||
                  ' quedó confirmada para el ' || coalesce(p_extra->>'fecha','') ||
                  coalesce(' a las ' || (p_extra->>'hora'),'') ||
                  '. Puedes ver el detalle en la app.') END;

    -- audiencia PRESTADOR: la reserva que le cae al negocio.
    WHEN 'cita_solicitada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','You have a new booking',
        'mensaje','A booking came in' || coalesce(' for ' || v_m,'') || ': ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                  '. It''s already on your schedule as a firm appointment.')
      ELSE jsonb_build_object(
        'titulo','Te llegó una nueva reserva',
        'mensaje','Reservaron' || coalesce(' para ' || v_m,'') || ': ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' a las ' || (p_extra->>'hora'),'') ||
                  '. Ya está en tu agenda como cita firme.') END;

    -- los DOS toques del recordatorio comparten tipo; `toque` decide la voz.
    WHEN 'cita_recordatorio' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s appointment','Your appointment') || ' is ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'tomorrow' ELSE 'today' END,
        'mensaje','A reminder: the appointment' || coalesce(' for ' || v_m,'') ||
                  coalesce(' with ' || (p_extra->>'negocio'),'') || ' is ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'tomorrow' ELSE 'today' END ||
                  coalesce(' at ' || (p_extra->>'hora'),'') || '.')
      ELSE jsonb_build_object(
        'titulo','La cita ' || v_de_m || ' es ' ||
                 CASE WHEN p_extra->>'toque'='previo' THEN 'mañana' ELSE 'hoy' END,
        'mensaje','Te recordamos la cita' || coalesce(' de ' || v_m,'') ||
                  coalesce(' con ' || (p_extra->>'negocio'),'') || ': es ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'mañana' ELSE 'hoy' END ||
                  coalesce(' a las ' || (p_extra->>'hora'),'') || '.') END;


    -- 🕯️ S89 · D-669 — nace CON la cura de la gracia. EN SOMBRA, sin firma
    --    (va al lote de D). Tuteo neutro.
    WHEN 'plan_renovacion_fallida' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We couldn''t renew your walk plan',
        'mensaje', v_en_m || 'walk plan renewal payment didn''t go through. ' ||
                   'We''ll keep retrying' || coalesce(' until ' || (p_extra->>'hasta'),'') ||
                   '. Please check your payment method so the schedule isn''t lost.')
      ELSE jsonb_build_object(
        'titulo','No pudimos renovar tu plan de paseos',
        'mensaje','El cobro de la renovación del plan ' || v_de_m || ' no pasó. ' ||
                  'Vamos a seguir reintentando' || coalesce(' hasta el ' || (p_extra->>'hasta'),'') ||
                  '. Revisa tu método de pago para que la agenda no se pierda.') END;

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
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

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_src text; v_voz jsonb;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='cerrar_y_renovar_planes';
  IF v_src NOT LIKE '%v_gracia_vencida%' OR v_src NOT LIKE '%credito_en_juego%' THEN
    RAISE EXCEPTION 'cinturon_d669: la gracia no quedó en el motor';
  END IF;
  IF v_src NOT LIKE '%d669_gracia_agotada_cobro_fallido%' THEN
    RAISE EXCEPTION 'cinturon_d669: la muerte honesta no declara su motivo';
  END IF;
  v_voz := public._voz_notificacion('plan_renovacion_fallida', gen_random_uuid(), NULL, '{}'::jsonb);
  IF v_voz = '{}'::jsonb THEN
    RAISE EXCEPTION 'cinturon_d669: plan_renovacion_fallida sigue sin voz';
  END IF;
END $cint$;
