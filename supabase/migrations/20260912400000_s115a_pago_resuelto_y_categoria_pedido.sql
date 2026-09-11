-- S115-A · ②a bis + ④ — EL PAGO SE RESUELVE SOLO, Y LA CATEGORÍA SE MANDA EN TODOS
-- Reversa: cubierta por la de 20260912390000 (la columna se va y con ella el relleno).
-- VEDA 76(g): NO RIGE.

BEGIN;
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
  v_fee_config_id          uuid;   -- S57: la rama sin cuenta dejaba v_fee_resuelto sin asignar y el INSERT moría
  v_monto_plataforma       numeric(14,2) := 0;
  v_monto_payout           numeric(14,2);
  v_comision_detalle       jsonb := NULL;   -- S115: dice cual mando, si el pct o el minimo
  v_comision_bruta         numeric(14,2);   -- S115: la comision ANTES de descontarle el riel
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
    
    v_fee_config_id := v_fee_resuelto.fee_config_id;

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
        /* 🔴 S115 · MODELO_ECONOMICO D-A: la comision efectiva es MAX(base x pct, minimo).
           El porcentaje NUNCA cubre la parte fija de un ticket chico (3DS, mensajes,
           factura electronica): un paseo de $6 al 18 % deja $1,08 y el riel solo ya
           cuesta mas. El minimo vive en `fee_configs.minimo_por_transaccion`, jamas
           en codigo (D-759). */
        v_comision_detalle := public.comision_efectiva(
          v_base_calculo,
          (v_fee_resuelto.parametros->>'pct')::numeric,
          COALESCE(v_fee_resuelto.minimo_por_transaccion, 0));
        v_monto_plataforma := (v_comision_detalle->>'comision')::numeric;
      
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
    
    /* 🔴 S115 · MODELO_ECONOMICO D-C — EL RIEL DEJA DE DESCONTARSE AL PRESTADOR.
       Antes: `payout = bruto - kushki_fee - plataforma` (el prestador cargaba con
       la pasarela). Ahora **el prestador recibe base menos comision, punto**: bajo
       reventa el riel es costo de Satori, y a la familia no se le puede recargar
       por pagar con tarjeta (LODC art. 9 y 19).

       La identidad `GMV = pasarela + plataforma + payout` SE MANTIENE, y se
       despeja sola: si `payout = bruto - comision`, entonces
       `plataforma = comision - pasarela`. Eso es, literalmente, «la pasarela es
       costo de e-PetPlace DENTRO de su margen».

       ⚠️ `monto_plataforma` PUEDE QUEDAR NEGATIVO —una comision chica con un riel
       caro— y **no se acota a cero**: un margen negativo es informacion real de esa
       transaccion. *Pisarlo a cero borraria exactamente el numero que el modelo
       economico existe para vigilar.* */
    v_comision_bruta   := v_monto_plataforma;
    v_monto_payout     := p_monto_bruto - v_comision_bruta;
    v_monto_plataforma := v_comision_bruta - p_monto_kushki_fee;
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
      /* S115: sin esto, una comision de 1,50 sobre una base de 8 se lee como
         «18 % mal calculado» en vez de «el minimo aplico». Un numero sin su razon
         obliga a reconstruirla, y se reconstruye mal. */
      'comision_bruta', v_comision_bruta,
      'comision_detalle', v_comision_detalle,
      'pasarela_absorbida', p_monto_kushki_fee,
      'regla_payout', 'base_menos_comision_s115',
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
    monto_bruto, monto_kushki_fee, monto_plataforma, monto_payout, pago_intento_id,
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
    /* S115 ②a: se RESUELVE, no se pide. Ningun caller tiene que acordarse de
       pasarlo — un dato que depende de que alguien se acuerde es un dato que se
       pierde en la puerta que nadie miro. */
    public.resolver_pago_del_origen(p_origen_tipo, p_origen_id),
    v_fee_config_id, v_fee_calculo_detalle,
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

CREATE OR REPLACE FUNCTION public._devengar_pedido(p_pedido_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_p record; v_cuenta record; v_ev uuid;
BEGIN
  SELECT id, total, moneda, country_code, cuenta_comercial_id, estado
    INTO v_p FROM pedidos WHERE id = p_pedido_id;
  IF NOT FOUND OR v_p.estado <> 'entregado' THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='pedido' AND ee.origen_id=p_pedido_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;
  IF v_p.total IS NULL OR v_p.total <= 0 THEN RETURN NULL; END IF;
  IF v_p.cuenta_comercial_id IS NULL THEN
    RAISE EXCEPTION 'pedido_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;
  SELECT moneda INTO v_cuenta FROM cuentas_comerciales WHERE id = v_p.cuenta_comercial_id;

  v_ev := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_p.cuenta_comercial_id,
    p_country_code        => v_p.country_code,
    p_moneda              => COALESCE(v_cuenta.moneda, v_p.moneda),
    p_monto_bruto         => v_p.total,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'pedido',
    /* 🔴 S115 ④ — LA CATEGORIA SE MANDA EN TODOS LOS CALLERS O EN NINGUNO.
       Sin esta linea el minimo de $2,00 de alimento era inalcanzable: la fila
       existia y nadie podia llegar a ella (motor sin puerta).
       ⚠️ EL CARRITO MIXTO LO DECIDO YO PORQUE LA LETRA NO LO DICE, y se declara:
       manda la categoria con MAYOR BASE del pedido. Medido: de 105 pedidos con
       items, 94 son solo alimento, 10 solo resto y **1 es MIXTO** — existe, no es
       teorico. *Aplicar el minimo alto por tener UNA bolsa de alimento castigaria
       un accesorio de $3; aplicar el bajo regalaria el piso en un pedido que es
       casi todo alimento. El dominante es el unico criterio derivable del dato.* */
    p_categoria_origen    => (
      SELECT CASE WHEN pi.impuesto_codigo = 'EC_IVA_0' THEN 'alimento' ELSE 'resto' END
        FROM pedido_items pi WHERE pi.pedido_id = p_pedido_id
       GROUP BY CASE WHEN pi.impuesto_codigo = 'EC_IVA_0' THEN 'alimento' ELSE 'resto' END
       ORDER BY sum(pi.subtotal) DESC LIMIT 1),
    p_origen_id           => p_pedido_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => NULL,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'despensa_entregado'));
  RETURN v_ev;
END $function$
;
REVOKE EXECUTE ON FUNCTION public._devengar_pedido(uuid) FROM PUBLIC, anon;
COMMIT;
