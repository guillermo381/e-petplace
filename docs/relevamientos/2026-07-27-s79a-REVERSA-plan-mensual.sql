-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727230000_s79_plan_mensual.sql (escrita ANTES de
-- aplicar). Los bodies de abajo son los VIVOS pre-reforma, capturados
-- con pg_get_functiondef el 27-Jul (la única fuente: no viven en
-- ninguna migración individual — acumulan ediciones V0/S57/S59).
--
-- NOTA DE DATOS: DROPear precio_mensual_plan borra los precios
-- mensuales que los prestadores hayan declarado tras la reforma —
-- IRRECUPERABLES (voz del prestador). La suscripción viva y las citas
-- conservan sus snapshots (datos, no schema). La lectora vuelve a su
-- versión geo de 20260727210000 (RETURNS con precio_plan leyendo la
-- columna).
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) vuelve la lectora de 210000 (RETURNS original): re-correr la
--    sección "3) veterinaria"... NO: la de PASEO vive en
--    20260727200000 (el contrato, pieza 3). DROP de la nueva y
--    re-aplicar ese CREATE + su REVOKE/GRANT.
DROP FUNCTION IF EXISTS public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision);
-- (re-aplicar el CREATE de 20260727200000_s79_contrato_letra_perfil.sql)

-- 2) vuelven los bodies pre-reforma (verbatim, misma firma):
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
  v_precio_unidad numeric;   -- COALESCE(precio_plan, precio) — Decisión S
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

  -- días normalizados (sin duplicados, orden natural, convención regla 32)
  SELECT array_agg(DISTINCT d ORDER BY d) INTO v_dias
  FROM unnest(COALESCE(p_dias, ARRAY[]::smallint[])) AS d
  WHERE d BETWEEN 0 AND 6;
  IF v_dias IS NULL OR array_length(v_dias, 1) IS NULL THEN
    RAISE EXCEPTION 'dias_invalidos' USING ERRCODE = '22023';
  END IF;

  -- §6.1 v1.5 (founder S59, regla DURA): EL PLAN ES DE LUNES A VIERNES.
  -- Los fines de semana se pasean suelto o por paquete. PUNTO DE
  -- REVERSIÓN declarado: si el founder pasa a default-con-excepción,
  -- este guard se relaja a default (y chk_plan_dias_laborables cae).
  IF EXISTS (SELECT 1 FROM unnest(v_dias) d WHERE d NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'plan_dia_no_laborable' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.precio_plan, ps.duracion_minutos
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

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma — el NO registrado bloquea;
  -- NULL NO bloquea (la pregunta única vive en la UI).
  IF NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  -- un plan activo por mascota+prestador (el hub muestra UNO)
  IF EXISTS (
    SELECT 1 FROM suscripciones_servicio s
    WHERE s.mascota_id = p_mascota_id AND s.prestador_id = p_prestador_id
      AND s.tipo_servicio = 'paseo_mensual' AND s.estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'plan_duplicado' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  --    confirmar_cita_pagada): un cobro que el motor rechazará al
  --    cierre es un cobro que promete mentira.
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

  -- el período arranca en la primera fecha del plan (desde mañana)
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

  -- Decisión S: el descuento por volumen del prestador vive en
  -- prestador_servicios.precio_plan (precio POR SALIDA dentro del plan;
  -- NULL = sin descuento, rige el precio del bloque suelto).
  v_precio_unidad := COALESCE(v_servicio.precio_plan, v_servicio.precio);
  v_total    := round(v_precio_unidad * v_n, 2);
  v_unitario := round(v_total / v_n, 2);

  -- UN cobro simulado DECLARADO por el período (jamás toca el ledger).
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

  -- las citas del período, firmes, con el motor de ventana (atómico:
  -- si una fecha no cabe, TODO el plan rebota y el cobro no nace)
  v_generadas := _generar_citas_plan(v_susc_id, v_inicio, v_fin, v_pagado_en);
  IF v_generadas = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- si el filtro de pasado descartó fechas, el cobro se ajusta a lo REAL
  IF v_generadas <> v_n THEN
    v_total    := round(v_precio_unidad * v_generadas, 2);
    v_unitario := round(v_total / v_generadas, 2);
    UPDATE suscripciones_servicio
    SET precio_mensual = v_total, precio_pagado = v_total,
        precio_unitario_efectivo = v_unitario,
        pago_metadata = jsonb_build_object('cobros', jsonb_build_array(jsonb_build_object(
          'periodo_inicio', v_inicio, 'periodo_fin', v_fin,
          'total', v_total, 'credito_aplicado', 0, 'cobrado', v_total,
          'pagado_en', v_pagado_en, 'pago_simulado', true
        )))
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
$function$;

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
  v_n_prox     int;
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
        -- el aviso DECLARA el precio del período nuevo (contrato B/arquitecto
        -- S56): oferta vigente (precio_plan si existe) × salidas estimadas.
        SELECT COALESCE(ps.precio_plan, ps.precio) INTO v_precio_prox
        FROM prestador_servicios ps
        WHERE ps.id = v_susc.prestador_servicio_id AND ps.activo;
        SELECT count(*) INTO v_n_prox
        FROM _fechas_periodo_plan(v_susc.periodo_fin, v_susc.dias_semana, v_susc.frecuencia);
        INSERT INTO notificaciones (user_id, country_code, tipo, canal, titulo, mensaje, datos, rol_destino)
        VALUES (
          v_susc.user_id, v_susc.country_code, 'sistema', 'in_app',
          'Tu plan de paseo se renueva pronto',
          'El ' || to_char(v_susc.periodo_fin, 'DD/MM') || ' se renueva tu plan'
            || CASE WHEN v_precio_prox IS NOT NULL AND v_n_prox > 0
                    THEN ' por $' || round(v_precio_prox * v_n_prox, 2)
                    ELSE '' END
            || '. Si prefieres pausarlo, es un toque desde Mis paseos. (Pago simulado — fase de pruebas.)',
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
          SELECT ps.id, ps.precio, ps.precio_plan, ps.duracion_minutos INTO v_oferta
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
          v_total    := round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2);
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
          IF round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2) <> v_total THEN
            v_total    := round(COALESCE(v_oferta.precio_plan, v_oferta.precio) * v_n, 2);
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
$function$;


-- 3) cae la columna y su CHECK
ALTER TABLE public.prestador_servicios
  DROP CONSTRAINT IF EXISTS chk_precio_mensual_plan_valido;
ALTER TABLE public.prestador_servicios
  DROP COLUMN IF EXISTS precio_mensual_plan;

commit;
