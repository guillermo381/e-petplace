-- REVERSA de 20260904160000_s108a_paquete_paseo_nace_pendiente.sql — ANTES.
-- ⚠️ Revertir sin revertir tambien 20260904100000 deja al paseo SIN ROLLOVER en
--    ningun lado: aca vuelve a comprar-y-extender, pero `confirmar_pago_bono`
--    seguiria extendiendo tambien ⇒ DOBLE extension. Se revierten JUNTAS.
BEGIN;
CREATE OR REPLACE FUNCTION public.comprar_paquete_salidas(p_prestador_id uuid, p_servicio_id uuid, p_unidades integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_familia     uuid;
  v_country     text;
  v_servicio    record;
  v_cuenta      record;
  v_fee         uuid;
  v_hoy_local   date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_vence       date;
  v_pagado_en   timestamptz := now();
  v_total       numeric(14,2);
  v_bono_id     uuid;
  v_rollover    record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- El paquete es DEL HOGAR (v1.4): la familia vigente del comprador.
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
  END IF;
  -- Presets EN LETRA (§6bis.1): 5 · 10 · 15.
  IF p_unidades IS NULL OR p_unidades NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'preset_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio_paquete, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL OR v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.precio_paquete IS NULL OR v_servicio.precio_paquete <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón S54).
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
  -- el país del cobro: el del hogar (fallback prestador — jamás inventado)
  SELECT COALESCE(f.country_code, pr.country_code, 'EC') INTO v_country
  FROM familia f, prestadores pr
  WHERE f.id = v_familia AND pr.id = p_prestador_id;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    v_country, 'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  v_vence := (v_hoy_local + interval '1 month')::date;
  v_total := round(v_servicio.precio_paquete * p_unidades, 2);

  -- ROLLOVER (P16e) — ahora POR HOGAR: lock primero (FOR UPDATE no
  -- convive con agregados), conteo después.
  PERFORM 1
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local
  FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total - unidades_usadas), 0)::int AS salidas
  INTO v_rollover
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local;

  -- UN pago simulado DECLARADO (jamás toca el ledger). COMPRAR NO ES
  -- RESERVAR: este INSERT a bonos es la ÚNICA escritura — cero citas.
  INSERT INTO bonos (
    prestador_id, user_id, familia_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago,
    country_code, prestador_servicio_id, pago_metadata
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'paseo',
    'Paquete de ' || p_unidades || ' salidas de ' || v_servicio.duracion_minutos || ''' (vigencia mensual, del hogar)',
    p_unidades, 0, v_servicio.duracion_minutos,
    v_total, v_servicio.precio_paquete,
    v_hoy_local, v_vence, 'activo', 'pagado',
    v_country, p_servicio_id,
    jsonb_build_object(
      'pagado_en', v_pagado_en, 'pago_simulado', true,
      'salidas_rollover', v_rollover.salidas
    )
  ) RETURNING id INTO v_bono_id;

  IF v_rollover.bonos > 0 THEN
    UPDATE bonos b
    SET fecha_vencimiento = v_vence,
        pago_metadata = b.pago_metadata || jsonb_build_object(
          'rollover_extendido_por', v_bono_id, 'rollover_en', now()
        )
    WHERE b.familia_id = v_familia
      AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
      AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
      AND b.unidades_usadas < b.unidades_total
      AND b.id <> v_bono_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'bono_id', v_bono_id,
    'unidades', p_unidades,
    'precio_por_unidad', v_servicio.precio_paquete,
    'total', v_total,
    'vence_el', v_vence,
    'salidas_rollover', v_rollover.salidas,
    'saldo_total', p_unidades + v_rollover.salidas,
    'pagado_en', v_pagado_en
  );
END;
$function$

;
COMMIT;
