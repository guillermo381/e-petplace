-- FUNCTIONDEF pre-M10 (capturado del objeto vivo, 12-ago-2026)

CREATE OR REPLACE FUNCTION public.registrar_venta_mostrador(p_cuenta_comercial_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_venta uuid; v_it jsonb; v_sku record; v_codigo text;
  v_total numeric := 0; v_n int := 0;
  -- Sin 0/O/1/I/L: un código que se dicta por teléfono o se lee de una
  -- factura arrugada no puede depender de distinguir una O de un 0.
  v_abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'venta_sin_items' USING ERRCODE = '22023';
  END IF;

  -- El código: 8 del alfabeto, reintentando ante la colisión improbable.
  LOOP
    SELECT string_agg(substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1), '')
      INTO v_codigo FROM generate_series(1, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM ventas_mostrador WHERE codigo_reclamo = v_codigo);
  END LOOP;

  INSERT INTO ventas_mostrador (cuenta_comercial_id, codigo_reclamo, expira_en, registrada_por)
    VALUES (p_cuenta_comercial_id, v_codigo, now() + interval '90 days', auth.uid())
    RETURNING id INTO v_venta;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT vs.id, vs.cuenta_comercial_id, vs.stock_disponible, vs.variante_id,
           pv.producto_id, p.nombre, o.precio, o.moneda
      INTO v_sku
    FROM vendedor_skus vs
    JOIN producto_variantes pv ON pv.id = vs.variante_id
    JOIN productos p ON p.id = pv.producto_id
    LEFT JOIN ofertas o ON o.sku_id = vs.id AND o.estado = 'publicada'
    WHERE vs.id = (v_it->>'sku_id')::uuid;

    IF v_sku.id IS NULL OR v_sku.cuenta_comercial_id <> p_cuenta_comercial_id THEN
      RAISE EXCEPTION 'sku_invalido: % no es de esta casa', v_it->>'sku_id' USING ERRCODE = '22023';
    END IF;
    IF v_sku.stock_disponible < (v_it->>'cantidad')::int THEN
      -- La bolsa está EN EL MOSTRADOR — si el sistema dice que no hay, el
      -- inventario está mal, y eso se dice: el ajuste con motivo es el camino.
      RAISE EXCEPTION 'stock_insuficiente: el inventario dice % y la venta pide %',
        v_sku.stock_disponible, (v_it->>'cantidad')::int USING ERRCODE = '22023';
    END IF;

    INSERT INTO venta_mostrador_items (venta_id, sku_id, producto_id, variante_id,
                                       nombre_producto, cantidad, precio_unitario,
                                       moneda, lote, fecha_vencimiento)
      VALUES (v_venta, v_sku.id, v_sku.producto_id, v_sku.variante_id,
              v_sku.nombre, (v_it->>'cantidad')::int, v_sku.precio,
              COALESCE(v_sku.moneda, 'USD'), NULLIF(v_it->>'lote',''),
              NULLIF(v_it->>'fecha_vencimiento','')::date);

    -- El stock sale por el ledger, jamás pisando el saldo. `venta_directa`:
    -- del disponible, porque en el mostrador nunca hubo reserva.
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo,
                                        referencia_id, creado_por)
      VALUES (v_sku.id, 'venta_directa', (v_it->>'cantidad')::int, 'venta_mostrador',
              v_venta, auth.uid());

    v_total := v_total + COALESCE(v_sku.precio, 0) * (v_it->>'cantidad')::int;
    v_n := v_n + 1;
  END LOOP;

  UPDATE ventas_mostrador SET total = v_total WHERE id = v_venta;

  RETURN jsonb_build_object('ok', true, 'venta_id', v_venta,
                            'codigo_reclamo', v_codigo,
                            'items', v_n, 'total', v_total,
                            'expira_en', now() + interval '90 days');
END $function$
;
