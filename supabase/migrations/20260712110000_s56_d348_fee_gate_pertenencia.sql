-- =====================================================================
-- S56-A D-348 (addendum arquitecto): resolver_fee_aplicable exponia los
-- fees NEGOCIADOS de terceros a cualquier authenticated con el uuid de
-- la cuenta (DEFINER + EXECUTE authenticated; la RLS actor_read_own_fees
-- de fee_configs protege la tabla pero el resolver la bypassea por
-- diseno — necesita las filas default, invisibles por RLS).
--
-- Cura (split, patron S54 "funciones core sin EXECUTE directo"):
--   1. _resolver_fee_aplicable — la logica REAL (body identico), interna:
--      sin EXECUTE de authenticated/anon; el motor la llama como owner.
--   2. resolver_fee_aplicable — conserva NOMBRE y FIRMA (fees.ts de la B
--      intacto): gate de pertenencia para claims 'authenticated'
--      (is_admin() o cuenta propia; si no, error tipado 'cuenta_ajena')
--      y delega en la interna. service_role/operacion sin claims: pasan.
--   3. crear_evento_economico y confirmar_cita_pagada re-apuntados a la
--      interna (callers relevados por prosrc: son exactamente esos dos).
-- Bodies reproducidos del pg_get_functiondef REAL (cero transcripcion).
-- =====================================================================

CREATE OR REPLACE FUNCTION public._resolver_fee_aplicable(p_cuenta_comercial_id uuid, p_tipo_actor tipo_actor_enum, p_country_code text, p_revenue_stream revenue_stream_enum, p_tipo_origen text, p_categoria_origen text DEFAULT NULL::text, p_fecha_referencia timestamp with time zone DEFAULT now())
 RETURNS TABLE(fee_config_id uuid, tipo_calculo tipo_calculo_fee_enum, parametros jsonb, absorbe_descuento_default quien_absorbe_descuento_enum, es_default boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.tipo_calculo,
    fc.parametros,
    fc.absorbe_descuento_default,
    (fc.cuenta_comercial_id IS NULL) AS es_default
  FROM fee_configs fc
  WHERE fc.activo = true
    AND fc.country_code = p_country_code
    AND fc.revenue_stream = p_revenue_stream
    AND p_fecha_referencia >= fc.vigencia_desde
    AND (fc.vigencia_hasta IS NULL OR p_fecha_referencia < fc.vigencia_hasta)
    AND (
      -- Match por cuenta específica
      fc.cuenta_comercial_id = p_cuenta_comercial_id
      OR
      -- O match por default (cuenta NULL + tipo_actor matchea)
      (fc.cuenta_comercial_id IS NULL AND fc.tipo_actor = p_tipo_actor)
    )
    AND (fc.tipo_origen IS NULL OR fc.tipo_origen = p_tipo_origen)
    AND (fc.categoria_origen IS NULL OR fc.categoria_origen = p_categoria_origen)
  ORDER BY 
    -- Especificidad: cuenta específica > default
    (fc.cuenta_comercial_id IS NOT NULL) DESC,
    -- Especificidad: tipo_origen específico > NULL
    (fc.tipo_origen IS NOT NULL) DESC,
    -- Especificidad: categoria_origen específica > NULL
    (fc.categoria_origen IS NOT NULL) DESC,
    -- Prioridad explícita
    fc.prioridad DESC,
    -- Más reciente gana en empates
    fc.vigencia_desde DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolver_fee_aplicable(p_cuenta_comercial_id uuid, p_tipo_actor tipo_actor_enum, p_country_code text, p_revenue_stream revenue_stream_enum, p_tipo_origen text, p_categoria_origen text DEFAULT NULL::text, p_fecha_referencia timestamp with time zone DEFAULT now())
 RETURNS TABLE(fee_config_id uuid, tipo_calculo tipo_calculo_fee_enum, parametros jsonb, absorbe_descuento_default quien_absorbe_descuento_enum, es_default boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rol text := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
BEGIN
  -- D-348: gate de pertenencia en la puerta PUBLICA. El fee negociado de
  -- un tercero no es dato publico: un caller authenticated solo resuelve
  -- fees de SU cuenta (owner_profile_id = auth.uid()) o es admin. El
  -- motor (crear_evento_economico / confirmar_cita_pagada) usa la
  -- interna _resolver_fee_aplicable y no pasa por aca; service_role y
  -- sesiones sin claims (operacion) tampoco se gatean.
  IF v_rol = 'authenticated' THEN
    IF NOT is_admin() AND NOT EXISTS (
      SELECT 1 FROM cuentas_comerciales cc
      WHERE cc.id = p_cuenta_comercial_id AND cc.owner_profile_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'cuenta_ajena' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
  SELECT * FROM _resolver_fee_aplicable(
    p_cuenta_comercial_id, p_tipo_actor, p_country_code, p_revenue_stream,
    p_tipo_origen, p_categoria_origen, p_fecha_referencia);
END;
$function$;

CREATE OR REPLACE FUNCTION public.crear_evento_economico(p_tipo_evento tipo_evento_economico_enum, p_revenue_stream revenue_stream_enum, p_cuenta_comercial_id uuid, p_country_code text, p_moneda text, p_monto_bruto numeric, p_monto_kushki_fee numeric, p_origen_tipo text, p_origen_id uuid, p_kushki_charge_id text DEFAULT NULL::text, p_fecha_devengo timestamp with time zone DEFAULT now(), p_fecha_cobro_kushki timestamp with time zone DEFAULT NULL::timestamp with time zone, p_categoria_origen text DEFAULT NULL::text, p_descuento_aplicado numeric DEFAULT 0, p_quien_absorbe_descuento quien_absorbe_descuento_enum DEFAULT NULL::quien_absorbe_descuento_enum, p_metadata jsonb DEFAULT '{}'::jsonb, p_parent_evento_id uuid DEFAULT NULL::uuid, p_cohorte_periodo text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_evento_id              uuid;
  v_tipo_actor_requerido   tipo_actor_enum;
  v_tipo_actor_validado    tipo_actor_enum;
  v_rol_activo             boolean;
  v_fee_resuelto           record;
  v_monto_plataforma       numeric(14,2) := 0;
  v_monto_payout           numeric(14,2);
  v_estado                 estado_evento_economico_enum;
  v_fee_calculo_detalle    jsonb;
  v_quien_absorbe          quien_absorbe_descuento_enum;
  v_base_calculo           numeric(14,2);
  v_kushki_pct             numeric;
  v_kushki_fijo            numeric;
  v_metadata_final         jsonb;
BEGIN
  -- ---------- Validaciones de entrada ----------
  IF p_monto_bruto < 0 THEN
    RAISE EXCEPTION 'monto_bruto no puede ser negativo: %', p_monto_bruto;
  END IF;
  
  IF p_monto_kushki_fee < 0 THEN
    RAISE EXCEPTION 'monto_kushki_fee no puede ser negativo: %', p_monto_kushki_fee;
  END IF;
  
  -- ---------- Derivar tipo_actor_requerido del origen del evento ----------
  -- Mapping origen_tipo → tipo_actor que la cuenta DEBE tener activo
  v_tipo_actor_requerido := CASE p_origen_tipo
    WHEN 'pedido'             THEN 'seller_productos'::tipo_actor_enum
    WHEN 'cita'               THEN 'prestador_servicios'::tipo_actor_enum
    WHEN 'donacion'           THEN 'refugio'::tipo_actor_enum
    WHEN 'bono'               THEN 'prestador_servicios'::tipo_actor_enum
    WHEN 'estadia'            THEN 'prestador_servicios'::tipo_actor_enum
    -- Tipos sin validación de rol (revenue puro plataforma o casos especiales)
    WHEN 'suscripcion'        THEN NULL
    WHEN 'producto_comercial' THEN NULL
    WHEN 'ajuste_manual'      THEN NULL
    WHEN 'evento_diferido'    THEN NULL  -- hereda contexto del parent
    ELSE NULL
  END;
  
  -- ---------- Si hay cuenta_comercial Y hay rol requerido: validar ----------
  IF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_requerido IS NOT NULL THEN
    -- Validar que la cuenta existe
    IF NOT EXISTS (
      SELECT 1 FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id
    ) THEN
      RAISE EXCEPTION 'cuenta_comercial_id % no existe', p_cuenta_comercial_id;
    END IF;
    
    -- Validar rol activo en cuenta_roles
    SELECT EXISTS (
      SELECT 1 FROM cuenta_roles cr
      WHERE cr.cuenta_comercial_id = p_cuenta_comercial_id
        AND cr.tipo_actor = v_tipo_actor_requerido
        AND cr.estado = 'activo'
    ) INTO v_rol_activo;
    
    IF NOT v_rol_activo THEN
      RAISE EXCEPTION 'La cuenta_comercial % no tiene rol activo de %. Activar el rol en cuenta_roles antes de crear eventos de origen %.',
        p_cuenta_comercial_id, v_tipo_actor_requerido, p_origen_tipo;
    END IF;
    
    v_tipo_actor_validado := v_tipo_actor_requerido;
    
  ELSIF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_requerido IS NULL THEN
    -- Caso especial: hay cuenta pero el origen no requiere validación de rol
    -- (ej. ajuste_manual, evento_diferido). Pasamos NULL como tipo_actor a resolver_fee.
    v_tipo_actor_validado := NULL;
  END IF;
  
  -- ---------- Resolver fee aplicable ----------
  IF p_cuenta_comercial_id IS NOT NULL AND v_tipo_actor_validado IS NOT NULL THEN
    SELECT * INTO v_fee_resuelto
    FROM _resolver_fee_aplicable(
      p_cuenta_comercial_id => p_cuenta_comercial_id,
      p_tipo_actor          => v_tipo_actor_validado,
      p_country_code        => p_country_code,
      p_revenue_stream      => p_revenue_stream,
      p_tipo_origen         => p_origen_tipo,
      p_categoria_origen    => p_categoria_origen,
      p_fecha_referencia    => p_fecha_devengo
    );
    
    IF v_fee_resuelto.fee_config_id IS NULL THEN
      RAISE EXCEPTION 'No se encontró fee_config aplicable para cuenta=%, tipo_actor=%, country=%, stream=%, origen=%, categoria=%',
        p_cuenta_comercial_id, v_tipo_actor_validado, p_country_code, 
        p_revenue_stream, p_origen_tipo, p_categoria_origen;
    END IF;
    
    -- Determinar quién absorbe descuento
    v_quien_absorbe := COALESCE(p_quien_absorbe_descuento, v_fee_resuelto.absorbe_descuento_default);
    
    -- ---------- Calcular monto_plataforma según tipo_calculo ----------
    IF v_quien_absorbe = 'plataforma' AND p_descuento_aplicado > 0 THEN
      v_base_calculo := p_monto_bruto + p_descuento_aplicado;
    ELSE
      v_base_calculo := p_monto_bruto;
    END IF;
    
    CASE v_fee_resuelto.tipo_calculo
      
      WHEN 'porcentual' THEN
        v_monto_plataforma := ROUND(
          v_base_calculo * (v_fee_resuelto.parametros->>'pct')::numeric / 100, 
          2
        );
      
      WHEN 'fijo' THEN
        v_monto_plataforma := (v_fee_resuelto.parametros->>'monto')::numeric;
      
      WHEN 'escalonado' THEN
        v_monto_plataforma := ROUND(
          v_base_calculo * (
            SELECT (tramo->>'pct')::numeric
            FROM jsonb_array_elements(v_fee_resuelto.parametros->'tramos') AS tramo
            WHERE tramo->>'hasta' IS NULL 
               OR v_base_calculo <= (tramo->>'hasta')::numeric
            ORDER BY 
              CASE WHEN tramo->>'hasta' IS NULL 
                   THEN 999999999 
                   ELSE (tramo->>'hasta')::numeric 
              END ASC
            LIMIT 1
          ) / 100,
          2
        );
      
      WHEN 'passthrough_kushki' THEN
        v_kushki_pct := COALESCE((v_fee_resuelto.parametros->>'kushki_pct')::numeric, 0);
        v_kushki_fijo := COALESCE((v_fee_resuelto.parametros->>'kushki_fijo')::numeric, 0);
        v_monto_plataforma := 0;
      
      WHEN 'personalizado' THEN
        RAISE EXCEPTION 'tipo_calculo=personalizado requiere implementación específica';
      
      ELSE
        RAISE EXCEPTION 'tipo_calculo % no soportado', v_fee_resuelto.tipo_calculo;
    END CASE;
    
    -- Ajuste por descuento si plataforma absorbe
    IF v_quien_absorbe = 'plataforma' AND p_descuento_aplicado > 0 THEN
      v_monto_plataforma := v_monto_plataforma - p_descuento_aplicado;
    END IF;
    
    -- Calcular monto_payout
    v_monto_payout := p_monto_bruto - p_monto_kushki_fee - v_monto_plataforma;
    v_estado := 'pendiente_liquidar';
    
    -- Snapshot del cálculo (incluye tipo_actor_resuelto para desglose en liquidaciones)
    v_fee_calculo_detalle := jsonb_build_object(
      'fee_config_id', v_fee_resuelto.fee_config_id,
      'tipo_calculo', v_fee_resuelto.tipo_calculo,
      'parametros_aplicados', v_fee_resuelto.parametros,
      'absorbe_descuento', v_quien_absorbe,
      'descuento_aplicado', p_descuento_aplicado,
      'precio_lista_referencia', v_base_calculo,
      'es_default', v_fee_resuelto.es_default,
      'tipo_actor_resuelto', v_tipo_actor_validado::text,
      'calculado_en', now()
    );
    
  ELSE
    -- Sin cuenta_comercial: revenue puro plataforma
    -- (suscripciones Prime, productos comerciales, publicidad, etc.)
    v_monto_plataforma := p_monto_bruto - p_monto_kushki_fee;
    v_monto_payout := NULL;
    v_estado := 'no_aplica';
    v_fee_calculo_detalle := jsonb_build_object(
      'tipo', 'revenue_puro_plataforma',
      'sin_fee_config', true,
      'tipo_actor_resuelto', NULL,
      'calculado_en', now()
    );
  END IF;
  
  -- ---------- Construir metadata final ----------
  v_metadata_final := p_metadata 
    || jsonb_build_object('categoria_origen', p_categoria_origen);
  
  IF v_tipo_actor_validado IS NOT NULL THEN
    v_metadata_final := v_metadata_final 
      || jsonb_build_object('tipo_actor_resuelto', v_tipo_actor_validado::text);
  END IF;
  
  IF p_descuento_aplicado > 0 THEN
    v_metadata_final := v_metadata_final 
      || jsonb_build_object(
           'descuento_aplicado', p_descuento_aplicado,
           'quien_absorbe_descuento', v_quien_absorbe
         );
  END IF;
  
  -- ---------- INSERT ----------
  INSERT INTO eventos_economicos (
    tipo_evento, revenue_stream, cuenta_comercial_id,
    country_code, moneda,
    monto_bruto, monto_kushki_fee, monto_plataforma, monto_payout,
    fee_config_id, fee_calculo_detalle,
    origen_tipo, origen_id,
    kushki_charge_id,
    parent_evento_id, cohorte_periodo,
    fecha_devengo, fecha_cobro_kushki,
    estado, metadata
  ) VALUES (
    p_tipo_evento, p_revenue_stream, p_cuenta_comercial_id,
    p_country_code, p_moneda,
    p_monto_bruto, p_monto_kushki_fee, v_monto_plataforma, v_monto_payout,
    v_fee_resuelto.fee_config_id, v_fee_calculo_detalle,
    p_origen_tipo, p_origen_id,
    p_kushki_charge_id,
    p_parent_evento_id, p_cohorte_periodo,
    p_fecha_devengo, p_fecha_cobro_kushki,
    v_estado, v_metadata_final
  ) RETURNING id INTO v_evento_id;
  
  RETURN v_evento_id;
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

  -- D-339: hold de paseo que nació sin dirección + checkout que la
  -- capturó = el pago la congela. Un snapshot existente NO se pisa.
  IF v_cita.direccion_snapshot IS NULL AND EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'paseo'
  ) THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
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


-- L-140: ley en dos partes por funcion nueva/reemplazada.
REVOKE ALL ON FUNCTION public._resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamp with time zone) TO service_role;

REVOKE ALL ON FUNCTION public.resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamp with time zone) TO authenticated, service_role;
