-- S115-A · TANDA 3 — LA INCOHERENCIA QUE YO MISMO CREE, CERRADA EN EL DIA
-- Reversa: re-crear confirmar_cita_pagada con p_categoria_origen => NULL (ver diff).
-- VEDA 76(g): NO RIGE.
--
-- 🔴 EL DEFECTO ERA MIO Y LO CAZO RELEER LO QUE HABIA ANOTADO COMO «ABIERTO».
--    En 20260912350000 hice que el congelador de citas mandara la categoria real.
--    confirmar_cita_pagada RE-RESUELVE el fee y seguia mandando NULL ⇒ para una
--    cita veterinaria el congelado resolvia el 12 % y la confirmacion el 18 %:
--    **dos fee_config_id para la misma cita.** No falla, no avisa — el ultimo que
--    escribe gana, y la comision queda mal por seis puntos sin sintoma.
--    *Lo habia escrito en el acta como «queda abierto». Medirlo costo un minuto;
--    dejarlo abierto habria costado la comision de cada clinica.*

BEGIN;
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
    /* 🔴 S115: ANTES iba NULL, y desde que el congelador manda la categoria real
       eso producia DOS fee_config_id distintos para la MISMA cita — el congelado
       decia 12 % (vet) y la confirmacion 18 % (default de cuidado). *Dos numeros
       para el mismo hecho no discuten: gana el ultimo que escribio.* Se lee del
       MISMO lugar que el congelador: el catalogo. */
    p_categoria_origen    => (SELECT ts.categoria FROM tipos_servicio ts
                              WHERE ts.codigo = v_cita.tipo_servicio),
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
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                                             'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))
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
      p_evento_id            => v_cita.evento_id,   -- adjudicación mesa S89: el referente del hecho (C: sin él, el destino cae al fallback de mascota)
      p_datos                => jsonb_build_object('cita_id', v_cita.id, 'origen', 'pago',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id),
                                             'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))
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
COMMIT;
