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

  -- S96: el retiro nace con su código de mostrador. Sin repartidor, sin
  -- ventana — el mismo mecanismo del código de la puerta, en el local.
  IF v_ped.metodo_entrega = 'retiro'
     AND NOT EXISTS (SELECT 1 FROM envios WHERE pedido_id = p_pedido_id) THEN
    INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                        metodo, estado, codigo_verificacion, destino_direccion,
                        intentos_entrega, costo_envio, moneda, pagado_por)
      VALUES (p_pedido_id, v_ped.cuenta_comercial_id, COALESCE(v_ped.country_code,'EC'),
              'propio', 'retiro', 'pendiente',
              lpad(floor(random() * 10000)::int::text, 4, '0'),
              'Retiro en tienda', 0, 0, COALESCE(v_ped.moneda,'USD'), 'cliente');
  END IF;

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $function$
