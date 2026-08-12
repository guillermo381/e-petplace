-- FUNCTIONDEF pre-M2 (capturado del objeto vivo, 12-ago-2026)
-- Para la reversa de la M2: restaurar estas versiones y re-otorgar grants.

CREATE OR REPLACE FUNCTION public.crear_pedido_despensa(p_cuenta_comercial_id uuid, p_items jsonb, p_entrega jsonb, p_clave_idempotencia text, p_bodega_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid      uuid := auth.uid();
  v_existente uuid;
  v_ped      uuid;
  v_it       jsonb;
  v_of       record;
  v_tasa     numeric;
  v_sub      numeric := 0;
  v_imp      numeric := 0;
  v_pf       numeric := 0;
  v_pv       numeric := 0;
  v_cot      jsonb;
  v_prom     jsonb;
  v_envio    numeric := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF p_clave_idempotencia IS NULL OR length(trim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENCIA: la misma clave devuelve el mismo pedido, no crea otro.
  SELECT id INTO v_existente FROM pedidos WHERE clave_idempotencia = p_clave_idempotencia;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'pedido_id', v_existente, 'ya_existia', true);
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'pedido_sin_items' USING ERRCODE = '22023';
  END IF;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, entrega_nombre_receptor, entrega_telefono,
                       entrega_direccion, entrega_ciudad, entrega_sector,
                       entrega_referencias)
  VALUES (v_uid, p_cuenta_comercial_id, 0, 0, 0, 0, 0, p_clave_idempotencia,
          'P-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
          p_entrega->>'nombre_receptor', p_entrega->>'telefono',
          p_entrega->>'direccion', p_entrega->>'ciudad',
          p_entrega->>'sector', p_entrega->>'referencias')
  RETURNING id INTO v_ped;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT o.*, v.impuesto_codigo, v.peso_kg, v.largo_cm, v.ancho_cm, v.alto_cm,
           v.producto_id, p.nombre AS nombre_producto, s.id AS sku
      INTO v_of
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    JOIN productos p ON p.id = v.producto_id
    JOIN vendedor_skus s ON s.id = o.sku_id
    WHERE o.id = (v_it->>'oferta_id')::uuid AND o.estado = 'publicada';

    IF v_of.id IS NULL THEN
      RAISE EXCEPTION 'oferta_no_publicada: %', v_it->>'oferta_id' USING ERRCODE = '22023';
    END IF;

    SELECT pct INTO v_tasa FROM cat_tasas_impuesto WHERE codigo = v_of.impuesto_codigo;

    -- 🔴 SE CONGELAN precio, código de tasa Y porcentaje. Guardar solo el
    --    código no alcanza: el código apunta a una fila que puede cambiar.
    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                              cuenta_comercial_id, nombre_producto, precio_unitario,
                              cantidad, subtotal, impuesto_codigo, impuesto_pct,
                              impuesto_monto)
    VALUES (v_ped, v_of.producto_id, v_of.variante_id, v_of.id,
            p_cuenta_comercial_id, v_of.nombre_producto, v_of.precio,
            (v_it->>'cantidad')::int,
            round(v_of.precio * (v_it->>'cantidad')::int, 2),
            v_of.impuesto_codigo, v_tasa,
            round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2));

    v_sub := v_sub + round(v_of.precio * (v_it->>'cantidad')::int, 2);
    v_imp := v_imp + round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2);
    v_pf  := v_pf  + COALESCE(v_of.peso_kg,0) * (v_it->>'cantidad')::int;
    v_pv  := v_pv  + COALESCE(v_of.largo_cm * v_of.ancho_cm * v_of.alto_cm / 6000.0, 0)
                     * (v_it->>'cantidad')::int;
  END LOOP;

  v_cot := cotizar_envio_despensa(p_cuenta_comercial_id, v_sub, v_pf, v_pv);
  IF (v_cot->>'ok')::boolean THEN
    v_envio := (v_cot->>'costo')::numeric;
  END IF;

  IF p_bodega_id IS NOT NULL THEN
    v_prom := calcular_promesa_entrega(p_bodega_id);
  END IF;

  UPDATE pedidos SET
    subtotal = v_sub, impuesto_total = v_imp, costo_envio = v_envio,
    total = v_sub + v_imp + v_envio,
    envio_regla_id = NULLIF(v_cot->>'regla_id','')::uuid,
    envio_tipo_regla = v_cot->>'tipo_regla',
    envio_peso_fisico_kg = v_pf,
    envio_peso_volumetrico_kg = v_pv,
    envio_peso_facturable_kg = GREATEST(v_pf, v_pv),
    envio_cotizacion = v_cot || COALESCE(jsonb_build_object('promesa', v_prom), '{}'::jsonb),
    promesa_entrega_desde = NULLIF(v_prom->>'desde','')::timestamptz,
    promesa_entrega_hasta = NULLIF(v_prom->>'hasta','')::timestamptz,
    updated_at = now()
  WHERE id = v_ped;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_uid, 'cliente');

  RETURN jsonb_build_object('ok', true, 'pedido_id', v_ped, 'subtotal', v_sub,
                            'impuesto', v_imp, 'envio', v_envio,
                            'total', v_sub + v_imp + v_envio,
                            'cotizacion_envio', v_cot);
END $function$
;

CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(p_pedido_id uuid, p_proveedor text, p_referencia text, p_clave_idempotencia text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_int uuid; v_ped record; v_reservas int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM pagos_eventos WHERE clave_idempotencia = p_clave_idempotencia) THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true);
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  -- 🔴 EL CINTURÓN DEL ESTADO QUE MIENTE. Este camino mueve el pedido a
  --    `stock_reservado`; si no hay reserva, ese estado sería falso y el
  --    pedido seguiría a preparación sin mercadería apartada. Con
  --    `iniciar_pago_pedido` esto no debería pasar nunca — **y justamente por
  --    eso se verifica**: lo que no puede pasar es lo que nadie va a revisar.
  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id = p_pedido_id AND estado = 'vigente';
  IF v_reservas = 0 AND EXISTS (SELECT 1 FROM pedido_items WHERE pedido_id = p_pedido_id) THEN
    RAISE EXCEPTION 'pago_sin_reserva: el pedido % no tiene stock reservado; confirmarlo lo dejaría listo para preparar sin mercadería apartada', p_pedido_id
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO pagos_intentos (pedido_id, proveedor, proveedor_referencia, monto,
                              moneda, forma, estado, payload_crudo, clave_idempotencia,
                              cerrado_en)
    VALUES (p_pedido_id, p_proveedor, p_referencia, v_ped.total, v_ped.moneda,
            'tokenizacion', 'aprobado', p_payload,
            p_clave_idempotencia || ':intento', now())
    RETURNING id INTO v_int;

  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
    VALUES (v_int, p_proveedor, 'pago_aprobado', p_payload, p_clave_idempotencia, now());

  PERFORM _mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'stock_reservado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'vendedor_notificado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'liberado_preparacion', 'sistema');

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $function$
;

CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(p_pedido_id uuid, p_minutos_vigencia integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_it record; v_sku uuid; v_n int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM inventario_reservas WHERE pedido_id = p_pedido_id AND estado='vigente') THEN
    RETURN jsonb_build_object('ok', true, 'ya_reservado', true);
  END IF;

  FOR v_it IN SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id LOOP
    SELECT sku_id INTO v_sku FROM ofertas WHERE id = v_it.oferta_id;
    IF v_sku IS NULL THEN
      RAISE EXCEPTION 'item_sin_sku: %', v_it.id USING ERRCODE = '22023';
    END IF;
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
      VALUES (v_sku, 'reserva', v_it.cantidad, 'pedido', p_pedido_id);
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_sku, p_pedido_id, v_it.cantidad,
              now() + (p_minutos_vigencia || ' minutes')::interval);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'reservas', v_n, 'expira_en',
                            now() + (p_minutos_vigencia || ' minutes')::interval);
END $function$
;

