-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · D-673 — LOS PRODUCTORES DE CITA, EN SOMBRA (orden ② de la mesa)
--
-- QUÉ: los dos tipos sin productor ganan el suyo, en los puntos de disparo
-- elegidos POR FORMA DE LLAMADA sobre el mapa del depósito
-- (2026-08-06-s89a-medicion-d673-productores-de-cita.md):
--   · `confirmar_cita_pagada` — la transición pendiente→confirmada del camino
--     principal. El pago ES la confirmación (firma founder): de la MISMA
--     transacción nacen DOS avisos — cita_confirmada al dueño y
--     cita_solicitada al negocio (titular = prestadores.user_id).
--   · `reservar_salida_paquete` — la salida de paquete nace firme y cubierta:
--     mismos dos avisos.
-- Y `_voz_notificacion` gana las TRES voces de cita (incluida la del
-- recordatorio, que consume la migración 20260806170000) — EN TUTEO NEUTRO
-- (firma founder 6-ago-2026), SIN FIRMA todavía: el lote para la pasada de
-- firma de D queda depositado en docs/relevamientos/.
--
-- LO EXCLUIDO A PROPÓSITO (decisión declarada, letra founder pendiente):
--   · `_generar_citas_plan` — N citas por período: avisar una a una es
--     cuestión de DOSIS, no de timbre; pide su propia letra.
--   · `registrar_atencion_mostrador` — el dueño está EN el mostrador (acto
--     presencial) o es fantasma sin destino.
--   · `crear_cita_negocio` / `tomar_cita` — las crea el negocio: el aviso al
--     dueño («te agendaron») es una SEMÁNTICA nueva, no cita_confirmada.
--
-- REQUISITO DE D (adenda 6-ago): toda intención nace portando su referente —
-- mascota_id SIEMPRE (sin él no hay destino) y mascota_nombre en datos.
--
-- VARA S89 INTACTA: los dos tipos siguen `en_sombra=true` en el catálogo —
-- las intenciones nacen y se leen EN LA SOMBRA; nada llega a campana ni
-- correo hasta la firma de la voz, y el primer envío real lleva su ojo.
--
-- 76(g): NO RIGE — tres CREATE OR REPLACE, cero backfill.
-- D-662: cero cambio de contrato (mismas firmas y RETURNS); bundles intactos.
-- L-140: no nace función; los proacl existentes se conservan.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-d673-productores.sql
--   (escrita ANTES, con los tres bodies vivos pre-migración embebidos).
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

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.confirmar_cita_pagada(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_cita      record;
  v_cuenta    record;
  v_fee       uuid;
  v_pagado_en timestamptz;
  v_direccion jsonb;   -- D-339
  v_titular   uuid;    -- S89 D-673: destinatario del negocio
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'no_es_tu_cita' USING ERRCODE = '42501';
  END IF;
  IF v_cita.estado = 'confirmada' AND v_cita.estado_reserva = 'pagada' THEN
    RAISE EXCEPTION 'cita_ya_confirmada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'pendiente' OR v_cita.estado_reserva <> 'pendiente_pago' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, v_cita.estado_reserva
      USING ERRCODE = '22023';
  END IF;

  -- Expiración perezosa: un hold vencido se trata como inexistente.
  IF v_cita.expira_en IS NOT NULL AND v_cita.expira_en <= now() THEN
    RAISE EXCEPTION 'hold_expirado' USING ERRCODE = '22023';
  END IF;

  IF v_cita.prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_prestador' USING ERRCODE = '22023';
  END IF;
  -- Snapshot de §5; cita_sin_precio queda para holds legacy malformados.
  IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
    RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero (SIN insertar) ─────────────
  SELECT cc.id, cc.moneda, cc.estado
  INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = v_cita.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;

  -- Tanda S54-B (a): la cuenta debe estar ACTIVA — pagar contra una
  -- cuenta pendiente/suspendida/cerrada promete una liquidación que
  -- generar_liquidacion rechaza (§7.11).
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios'
      AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;

  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    p_cuenta_comercial_id => v_cuenta.id,
    p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
    p_country_code        => v_cita.country_code,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_tipo_origen         => 'cita',
    p_categoria_origen    => NULL,
    p_fecha_referencia    => now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- D-339: hold que nació sin dirección + checkout que la capturó = el
  -- pago la congela. Un snapshot existente NO se pisa. S61 D-392: el
  -- grooming A DOMICILIO hereda el mecanismo VERBATIM.
  IF v_cita.direccion_snapshot IS NULL AND (
    EXISTS (
      SELECT 1 FROM tipos_servicio ts
      WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'paseo'
    )
    OR v_cita.modalidad = 'domicilio'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  -- S61 D-392, EL GUARD: la cita a DOMICILIO no se paga sin dirección —
  -- la promesa "el groomer sabe a dónde ir" es del MOTOR, no de la UI.
  IF v_cita.modalidad = 'domicilio'
     AND v_cita.direccion_snapshot IS NULL
     AND v_direccion IS NULL THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;

  -- ── Transición doble en el MISMO UPDATE: cita firme + pago simulado
  --    registrado. metadata.pagado_en será fecha_cobro_kushki en el cierre.
  v_pagado_en := now();
  UPDATE evento_cita_servicio
  SET estado         = 'confirmada',
      estado_reserva = 'pagada',
      direccion_snapshot = COALESCE(direccion_snapshot, v_direccion),   -- D-339
      metadata       = COALESCE(metadata, '{}'::jsonb)
                       || jsonb_build_object('pagado_en', v_pagado_en, 'pago_simulado', true),
      updated_at     = now()
  WHERE id = p_cita_id;


  -- ── S89 · D-673 (EN SOMBRA): el hecho «la cita quedó firme» toca el timbre.
  --    DOS audiencias del MISMO instante (firma founder 6-ago-2026): el aviso
  --    al dueño y el aviso al negocio nacen de esta transacción. Los dos tipos
  --    siguen en sombra: nada llega a campana ni correo hasta la firma de su
  --    voz (vara S89). Molde: procedimiento_agendado post-D-674. fecha/hora
  --    de v_cita son válidas acá: el UPDATE de arriba no las tocó.
  SELECT pr.user_id INTO v_titular FROM prestadores pr WHERE pr.id = v_cita.prestador_id;

  PERFORM registrar_intencion_notificacion(
    p_tipo                 => 'cita_confirmada',
    p_destinatario_user_id => v_cita.user_id,
    p_mascota_id           => v_cita.mascota_id,
    p_datos                => jsonb_build_object('cita_id', v_cita.id, 'origen', 'pago',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id))
          || public._voz_notificacion('cita_confirmada', v_cita.user_id, v_cita.mascota_id,
               jsonb_build_object(
                 'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                 'fecha',   to_char(v_cita.fecha,'DD/MM'),
                 'hora',    to_char(v_cita.hora,'HH24:MI'))),
    p_clave_dedup          => 'cita-confirmada:' || v_cita.id
  );

  IF v_titular IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_solicitada',
      p_destinatario_user_id => v_titular,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id, 'origen', 'pago',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id))
            || public._voz_notificacion('cita_solicitada', v_titular, v_cita.mascota_id,
                 jsonb_build_object('fecha', to_char(v_cita.fecha,'DD/MM'),
                                    'hora',  to_char(v_cita.hora,'HH24:MI'))),
      p_clave_dedup          => 'cita-solicitada:' || v_cita.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'confirmada',
    'estado_reserva', 'pagada',
    'pagado_en', v_pagado_en
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reservar_salida_paquete(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_familia     uuid;
  v_servicio    record;
  v_bono        record;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_direccion   jsonb;
  v_saldo       int;
  -- V0-actor
  v_empleado    uuid;
  v_cupo_techo  int;
  -- S68
  v_ts_reservable boolean;
  v_ts_solo_hoy   boolean;
  -- S89 D-673
  v_titular       uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;
  SELECT ps.id, ps.tipo_servicio, ps.reservable INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- S68: mismas puertas que el hold — reservable en dos niveles + solo_hoy.
  SELECT ts.reservable, ts.reserva_solo_hoy INTO v_ts_reservable, v_ts_solo_hoy
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;
  IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(v_ts_solo_hoy, false)
     AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN  -- D-320
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
  END IF;

  -- F3 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma.
  IF NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  -- FIFO DEL HOGAR (v1.4): el bono más viejo con saldo y vigencia.
  SELECT b.* INTO v_bono
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= p_fecha
  ORDER BY b.fecha_compra, b.created_at, b.id
  LIMIT 1
  FOR UPDATE;
  IF v_bono.id IS NULL THEN
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE = '22023';
  END IF;

  -- V0-actor: geometría (fuera_de_horario) → persona (slot_ocupado).
  IF NOT EXISTS (
    SELECT 1 FROM prestador_horarios h
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_bono.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  ) THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;

  SELECT pe.id INTO v_empleado
  FROM prestador_horarios h
  JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_bono.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
    AND _agenda_ocupacion(pe.id, p_fecha, p_hora, v_bono.duracion_minutos, NULL, v_servicio.tipo_servicio)
        < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
  ORDER BY (SELECT count(*) FROM evento_cita_servicio cc
            WHERE cc.empleado_id = pe.id AND cc.fecha = p_fecha
              AND (cc.estado IN ('confirmada', 'en_curso')
                   OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                       AND cc.expira_en > now()))),
           pe.created_at, pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  v_direccion := _direccion_hogar_snapshot(v_auth);   -- D-339

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'reservar_salida_paquete', 'bono_id', v_bono.id),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  -- Cita firme y CUBIERTA (tercer escritor del invariante, S57).
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, bono_id, direccion_snapshot, metadata
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_empleado, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_bono.precio_por_unidad, v_bono.duracion_minutos,
    'confirmada', 'pagada',
    NULL, COALESCE(v_country, 'EC'), v_bono.id, v_direccion,
    jsonb_build_object(
      'origen', 'paquete', 'pago_simulado', true,
      'pagado_en', v_bono.pago_metadata ->> 'pagado_en'
    )
  ) RETURNING id INTO v_cita_id;

  UPDATE bonos
  SET unidades_usadas = unidades_usadas + 1,
      estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
      agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
  WHERE id = v_bono.id;

  SELECT COALESCE(sum(b.unidades_total - b.unidades_usadas), 0)::int INTO v_saldo
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.fecha_vencimiento >= (now() AT TIME ZONE 'America/Guayaquil')::date;


  -- ── S89 · D-673 (EN SOMBRA): la salida de paquete nace FIRME — el mismo
  --    instante, dos audiencias (firma founder 6-ago-2026). En sombra hasta
  --    la firma de la voz. Molde: procedimiento_agendado post-D-674.
  SELECT pr.user_id INTO v_titular FROM prestadores pr WHERE pr.id = p_prestador_id;

  PERFORM registrar_intencion_notificacion(
    p_tipo                 => 'cita_confirmada',
    p_destinatario_user_id => v_auth,
    p_mascota_id           => p_mascota_id,
    p_datos                => jsonb_build_object('cita_id', v_cita_id, 'origen', 'paquete',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = p_mascota_id))
          || public._voz_notificacion('cita_confirmada', v_auth, p_mascota_id,
               jsonb_build_object(
                 'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = p_prestador_id),
                 'fecha',   to_char(p_fecha,'DD/MM'),
                 'hora',    to_char(p_hora,'HH24:MI'))),
    p_clave_dedup          => 'cita-confirmada:' || v_cita_id
  );

  IF v_titular IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_solicitada',
      p_destinatario_user_id => v_titular,
      p_mascota_id           => p_mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita_id, 'origen', 'paquete',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = p_mascota_id))
            || public._voz_notificacion('cita_solicitada', v_titular, p_mascota_id,
                 jsonb_build_object('fecha', to_char(p_fecha,'DD/MM'),
                                    'hora',  to_char(p_hora,'HH24:MI'))),
      p_clave_dedup          => 'cita-solicitada:' || v_cita_id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'bono_id', v_bono.id,
    'fecha', p_fecha,
    'hora', p_hora,
    'precio_origen', v_bono.precio_por_unidad,
    'saldo_restante', v_saldo
  );
END;
$function$
;

-- ── CINTURÓN (los marcadores se buscan en el CÓDIGO; los comentarios de esta
--    migración no los nombran — L-170) ──────────────────────────────────────
DO $cint$
DECLARE
  v_src text;
  v_voz jsonb;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='confirmar_cita_pagada';
  IF v_src NOT LIKE '%cita-confirmada:%' OR v_src NOT LIKE '%cita-solicitada:%' THEN
    RAISE EXCEPTION 'cinturon_d673: confirmar_cita_pagada no toca el timbre';
  END IF;
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='reservar_salida_paquete';
  IF v_src NOT LIKE '%cita-confirmada:%' OR v_src NOT LIKE '%cita-solicitada:%' THEN
    RAISE EXCEPTION 'cinturon_d673: reservar_salida_paquete no toca el timbre';
  END IF;
  FOREACH v_src IN ARRAY ARRAY['cita_confirmada','cita_solicitada','cita_recordatorio'] LOOP
    v_voz := public._voz_notificacion(v_src, gen_random_uuid(), NULL, '{}'::jsonb);
    IF v_voz = '{}'::jsonb THEN
      RAISE EXCEPTION 'cinturon_d673: _voz_notificacion sin voz para %', v_src;
    END IF;
  END LOOP;
END $cint$;
