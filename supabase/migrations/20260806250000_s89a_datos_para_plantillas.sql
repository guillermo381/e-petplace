-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 8 ④ — LOS DATOS PARA LAS PLANTILLAS POR TIPO
--
-- Los productores de cita ya calculaban fecha/hora/negocio para la VOZ, pero
-- solo viajaban ADENTRO del texto. Pasan a viajar también como CLAVES de
-- `datos` (fecha DD/MM · hora HH24:MI · negocio · mascota_nombre) para que
-- la plantilla del correo pinte su bloque de detalle sin parsear prosa.
-- Cuatro productores, cero cambio de contrato ni de comportamiento.
--
-- 76(g) NO RIGE · D-662 cero contrato · L-140 proacl intactos.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-datos-plantillas.sql
-- ═══════════════════════════════════════════════════════════════════════════

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
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = p_mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = p_prestador_id),
                                             'fecha', to_char(p_fecha,'DD/MM'), 'hora', to_char(p_hora,'HH24:MI'))
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
      p_evento_id            => v_evento_id,        -- adjudicación mesa S89 (ídem confirmar_cita_pagada)
      p_datos                => jsonb_build_object('cita_id', v_cita_id, 'origen', 'paquete',
                                             'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = p_mascota_id),
                                             'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = p_prestador_id),
                                             'fecha', to_char(p_fecha,'DD/MM'), 'hora', to_char(p_hora,'HH24:MI'))
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


CREATE OR REPLACE FUNCTION public.notificar_recordatorios_cita()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora      timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_hoy        date := v_ahora::date;
  c            record;
  v_cita_ts    timestamp;
  v_due_dia    timestamp;
  v_due_previo timestamp;
  v_negocio    text;
  v_nombre     text;
  v_previo     int := 0;
  v_dia        int := 0;
BEGIN
  FOR c IN
    SELECT ec.id, ec.user_id, ec.mascota_id, ec.prestador_id,
           ec.fecha, ec.hora, ec.created_at
    FROM evento_cita_servicio ec
    WHERE ec.estado = 'confirmada'
      AND ec.user_id IS NOT NULL
      AND ec.fecha IS NOT NULL AND ec.hora IS NOT NULL
      AND ec.fecha BETWEEN v_hoy AND v_hoy + 1
  LOOP
    v_cita_ts    := c.fecha + c.hora;
    v_due_dia    := LEAST(c.fecha + time '08:00', v_cita_ts - interval '1 hour');
    v_due_previo := (c.fecha - 1) + time '08:00';
    SELECT p.nombre_comercial INTO v_negocio FROM prestadores p WHERE p.id = c.prestador_id;
    SELECT m.nombre INTO v_nombre FROM mascotas m WHERE m.id = c.mascota_id;

    -- TOQUE DEL DÍA (incluye el «aviso inmediato» de la cita de último momento)
    IF v_ahora >= v_due_dia AND v_ahora < v_cita_ts THEN
      IF registrar_intencion_notificacion(
           p_tipo                 => 'cita_recordatorio',
           p_destinatario_user_id => c.user_id,
           p_mascota_id           => c.mascota_id,
           p_datos                => jsonb_build_object(
                                       'cita_id', c.id, 'toque', 'dia',
                                       'mascota_nombre', v_nombre, 'negocio', v_negocio,
                                       'fecha', to_char(c.fecha,'DD/MM'), 'hora', to_char(c.hora,'HH24:MI'))
                 || public._voz_notificacion('cita_recordatorio', c.user_id, c.mascota_id,
                      jsonb_build_object('toque', 'dia', 'negocio', v_negocio,
                                         'hora', to_char(c.hora, 'HH24:MI'))),
           p_clave_dedup          => 'cita-recordatorio:dia:' || c.id || ':' || c.fecha
         ) IS NOT NULL THEN
        v_dia := v_dia + 1;
      END IF;
    END IF;

    -- TOQUE PREVIO (solo si la cita ya existía la mañana del día anterior)
    IF v_ahora >= v_due_previo AND v_ahora < v_due_dia
       AND (c.created_at AT TIME ZONE 'America/Guayaquil') <= v_due_previo THEN
      IF registrar_intencion_notificacion(
           p_tipo                 => 'cita_recordatorio',
           p_destinatario_user_id => c.user_id,
           p_mascota_id           => c.mascota_id,
           p_datos                => jsonb_build_object(
                                       'cita_id', c.id, 'toque', 'previo',
                                       'mascota_nombre', v_nombre, 'negocio', v_negocio,
                                       'fecha', to_char(c.fecha,'DD/MM'), 'hora', to_char(c.hora,'HH24:MI'))
                 || public._voz_notificacion('cita_recordatorio', c.user_id, c.mascota_id,
                      jsonb_build_object('toque', 'previo', 'negocio', v_negocio,
                                         'hora', to_char(c.hora, 'HH24:MI'))),
           p_clave_dedup          => 'cita-recordatorio:previo:' || c.id || ':' || c.fecha
         ) IS NOT NULL THEN
        v_previo := v_previo + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'previo', v_previo, 'dia', v_dia,
                            'corrido_en', v_ahora);
END;
$function$
;


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

  -- Notificación al dueño SIEMPRE. El caso fantasma sin user en app no tiene
  -- destino in-app (declarado): se notifica cuando hay dueño real.
  -- S89 · D-674: la voz lee los valores POST-update — p_fecha/p_hora (los que
  -- esta llamada acaba de fijar; v_cita.* traía los NULL del snapshot) y
  -- v_emp_prestador (la asignación autoritativa re-derivada). Y el dato del
  -- presupuesto sale de la CITA (v_cita.presupuesto_id): la referencia S87 a
  -- un parámetro que esta firma no tiene daba 42703 en la rama real.
  -- (El nombre del token muerto no se escribe acá A PROPÓSITO: el cinturón lo
  -- busca en prosrc, y prosrc lee los comentarios como código — L-170.)
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'procedimiento_agendado',
      p_destinatario_user_id => v_notif_user,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id,
                                                   'presupuesto_id', v_cita.presupuesto_id,
                                                   'mascota_nombre', (SELECT m.nombre FROM mascotas m WHERE m.id = v_cita.mascota_id),
                                                   'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_emp_prestador),
                                                   'fecha', to_char(p_fecha,'DD/MM'), 'hora', to_char(p_hora,'HH24:MI'))
            || public._voz_notificacion('procedimiento_agendado', v_notif_user, v_cita.mascota_id,
                 jsonb_build_object(
                   'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_emp_prestador),
                   'fecha',   to_char(p_fecha,'DD/MM'),
                   'hora',    to_char(p_hora,'HH24:MI'))),
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

DO $cint$
DECLARE v_fn text; v_src text;
BEGIN
  FOREACH v_fn IN ARRAY ARRAY['confirmar_cita_pagada','reservar_salida_paquete',
                              'notificar_recordatorios_cita','fijar_fecha_procedimiento'] LOOP
    SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_fn;
    IF v_src NOT LIKE '%''negocio''%' OR v_src NOT LIKE '%''hora''%' THEN
      RAISE EXCEPTION 'cinturon_datos_plantillas: % no porta los datos', v_fn;
    END IF;
  END LOOP;
END $cint$;
