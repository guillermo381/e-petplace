-- ═══════════════════════════════════════════════════════════════════════════
-- S95-K · LA RESERVA VA ANTES DEL PAGO
--
-- ── 🔴 EL AGUJERO, MEDIDO ANTES DE ARREGLARLO ─────────────────────────────
-- La sonda `scripts/s95/medir-k2-k4.mjs` corrió contra el catálogo REAL, dentro
-- de una transacción revertida, con un SKU en cero:
--
--   stock_disponible ......... 0
--   la reserva ............... FALLÓ (vendedor_skus_stock_disponible_check)
--   reservas_vigentes ........ 0
--   pagos APROBADOS .......... 1        ← 🔴
--   estado final ............. liberado_preparacion
--
-- **Se cobró por algo que no se puede despachar**, y el pedido quedó listo para
-- preparar. Y hay algo peor que el cobro: el pedido pasó por el estado
-- `stock_reservado` **sin que existiera ninguna reserva** — *un estado que
-- miente es peor que un estado que falta, porque nadie lo va a ir a verificar.*
--
-- ── POR QUÉ LA CURA NO VA EN `crear_pedido_despensa` ──────────────────────
-- Validar stock al crear el pedido **no cierra el agujero y crea una carrera**:
-- entre el "hay stock" del carrito y el pago pueden pasar minutos, y en el
-- medio otra familia se lo lleva. Duplicar la fuente de verdad da una
-- validación que se siente segura y no lo es.
--
-- ── LA CURA: RESERVAR CUANDO SE PIDE PAGAR ────────────────────────────────
-- Nace `iniciar_pago_pedido()`: **reserva el stock Y mueve a `esperando_pago`
-- en el mismo acto.** Si no hay stock, **no se llega a la pasarela** — no hay
-- nada que reembolsar porque no se cobró.
--
-- **Es el patrón del hold de agenda que la casa ya tiene desde S54**: se
-- aparta lo que se está por comprar mientras la persona tipea la tarjeta, con
-- vigencia corta. La reserva ya nace con `expira_en` y ya hay un barredor
-- (`expirar_reservas_vencidas`), así que el que abandona el checkout devuelve
-- el stock solo.
--
-- Y `confirmar_pago_pedido` gana su cinturón: **si no hay reserva vigente, no
-- confirma**. No es redundancia — es la garantía de que el estado
-- `stock_reservado` diga la verdad aunque alguien llame al webhook por otro
-- camino.
--
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s95/2026-08-12-s95k-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón crea pedidos reales contra el catálogo vivo,
-- mueve stock y lo deshace por id, exigiendo que `pedidos`, las reservas y el
-- saldo del SKU vuelvan a su número inicial.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① INICIAR EL PAGO — reserva y mueve en un solo acto
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.iniciar_pago_pedido(
  p_pedido_id        uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped record; v_res jsonb; v_falta text;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN
    RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  -- 🔴 PRIMERO SE APARTA LA MERCADERÍA, DESPUÉS SE PIDE LA TARJETA.
  --    Si esto rebota, la persona ve «no nos queda» ANTES de pagar — que es
  --    una mala noticia, pero no es un cobro que hay que devolver.
  BEGIN
    v_res := reservar_stock_pedido(p_pedido_id, p_minutos_vigencia);
  EXCEPTION WHEN OTHERS THEN
    -- El CHECK de `vendedor_skus` es el que rebota la sobrerreserva. Se
    -- traduce a un código que quien llama pueda mostrar, en vez de dejar
    -- salir el nombre de un constraint.
    SELECT string_agg(DISTINCT pi.nombre_producto, ', ') INTO v_falta
    FROM pedido_items pi
    JOIN ofertas o ON o.id = pi.oferta_id
    JOIN vendedor_skus vs ON vs.id = o.sku_id
    WHERE pi.pedido_id = p_pedido_id AND vs.stock_disponible < pi.cantidad;
    RAISE EXCEPTION 'sin_stock: no queda suficiente de %', COALESCE(v_falta, 'algún producto del pedido')
      USING ERRCODE = '22023';
  END;

  PERFORM _mover_estado_pedido(p_pedido_id, 'esperando_pago', 'cliente');

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'narrativa', 'pagando',
                            'reserva', v_res,
                            'reserva_expira_en', v_res->>'expira_en');
END $$;

COMMENT ON FUNCTION public.iniciar_pago_pedido(uuid, integer) IS
  'S95-K · Reserva el stock Y mueve a `esperando_pago` EN EL MISMO ACTO. Patrón '
  'del hold de agenda (S54): se aparta lo que se está por comprar mientras la '
  'persona tipea la tarjeta. Si no hay stock, no se llega a la pasarela — no '
  'hay nada que reembolsar porque no se cobró.';

REVOKE ALL ON FUNCTION public.iniciar_pago_pedido(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_pago_pedido(uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② CONFIRMAR EL PAGO — no confirma lo que no tiene reserva
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(
  p_pedido_id          uuid,
  p_proveedor          text,
  p_referencia         text,
  p_clave_idempotencia text,
  p_payload            jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
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
END $$;

REVOKE ALL ON FUNCTION public.confirmar_pago_pedido(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · el rojo reproducido y la cura probada, con contra-caso
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_user uuid; v_of uuid; v_sku uuid; v_ped uuid;
  v_ped_antes int; v_res_antes int; v_disp_antes int; v_n int;
  v_ok boolean; v_msg text; v_estado text;
BEGIN
  SELECT count(*) INTO v_ped_antes FROM pedidos;
  SELECT count(*) INTO v_res_antes FROM inventario_reservas;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_user
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id, o.sku_id INTO v_of, v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  IF v_cc IS NULL OR v_of IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin vendedor activo y oferta publicada el cinturón no prueba nada.';
  END IF;
  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);

  -- ── A · 🔴 EL ROJO REPRODUCIDO: sin stock, NO se llega a pagar ───────────
  IF v_disp_antes = 0 THEN
    SELECT (crear_pedido_despensa(v_cc,
              jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
              '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
              '__cint_s95k_a')->>'pedido_id')::uuid INTO v_ped;
    v_ok := true;
    BEGIN PERFORM iniciar_pago_pedido(v_ped, 5);
    EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
    IF v_ok THEN
      RAISE EXCEPTION 'ABORTA: se pudo iniciar el pago de un pedido SIN stock.';
    END IF;
    IF v_msg NOT LIKE 'sin_stock%' THEN
      RAISE EXCEPTION 'ABORTA: rebotó por otra razón (%), no por falta de stock.', v_msg;
    END IF;
    -- Y el pedido NO avanzó: sigue en `creado`, sin cobro.
    SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
    IF v_estado <> 'creado' THEN
      RAISE EXCEPTION 'ABORTA: el pedido avanzó a «%» pese a no tener stock.', v_estado;
    END IF;
    DELETE FROM pedido_estados WHERE pedido_id = v_ped;
    DELETE FROM pedido_items   WHERE pedido_id = v_ped;
    DELETE FROM pedidos        WHERE id = v_ped;
  END IF;

  -- ── B · CONTRA-CASO: CON stock, el camino feliz funciona ────────────────
  -- Sin esto, una cura que rompiera todo daría verde.
  PERFORM ajustar_stock_vendedor(v_sku, 3, '__cint_s95k carga temporal');
  SELECT (crear_pedido_despensa(v_cc,
            jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
            '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
            '__cint_s95k_b')->>'pedido_id')::uuid INTO v_ped;
  PERFORM iniciar_pago_pedido(v_ped, 5);
  SELECT count(*) INTO v_n FROM inventario_reservas
   WHERE pedido_id = v_ped AND estado='vigente';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ABORTA: iniciar el pago no dejó reserva vigente (%).', v_n;
  END IF;
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'esperando_pago' THEN
    RAISE EXCEPTION 'ABORTA: el pedido con stock quedó en «%».', v_estado;
  END IF;

  -- ── C · el backend confirma, y AHORA sí puede ───────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM confirmar_pago_pedido(v_ped, '__cint', 'ref', '__cint_s95k_pago', '{}'::jsonb);
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'liberado_preparacion' THEN
    RAISE EXCEPTION 'ABORTA: con reserva vigente el pago no avanzó (quedó en «%»).', v_estado;
  END IF;

  -- ── D · EL CINTURÓN DEL ESTADO QUE MIENTE: sin reserva, no confirma ─────
  UPDATE inventario_reservas SET estado='liberada', cerrada_en=now()
   WHERE pedido_id = v_ped AND estado='vigente';
  v_ok := true;
  BEGIN PERFORM confirmar_pago_pedido(v_ped, '__cint', 'ref2', '__cint_s95k_pago2', '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: se confirmó un pago sin reserva vigente.';
  END IF;
  IF v_msg NOT LIKE 'pago_sin_reserva%' THEN
    RAISE EXCEPTION 'ABORTA: rebotó por otra razón: %', v_msg;
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ───────────────────────────
  DELETE FROM pagos_eventos  WHERE clave_idempotencia LIKE '__cint_s95k%';
  DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '__cint_s95k%';
  DELETE FROM inventario_reservas WHERE pedido_id = v_ped;

  -- 🔴 EL STOCK SE DEVUELVE COMPENSANDO, NO BORRANDO — y el cinturón me lo
  --    enseñó abortando: cargué 3 de prueba, la reserva consumió 1, y borrar
  --    los movimientos dejaba el saldo materializado en 2. **Un ledger
  --    append-only no se corrige borrando filas**: el saldo lo mantiene un
  --    trigger AFTER INSERT que no se entera del DELETE. Se compensa por la
  --    misma puerta, y recién después se limpia el rastro del fixture.
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_user, 'role','authenticated')::text, true);
    PERFORM ajustar_stock_vendedor(v_sku, v_disp_antes - v_n, '__cint_s95k devolucion del fixture');
  END IF;
  DELETE FROM inventario_movimientos
   WHERE referencia_id = v_ped OR motivo LIKE '__cint_s95k%';
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedido_items   WHERE pedido_id = v_ped;
  DELETE FROM pedidos        WHERE clave_idempotencia LIKE '__cint_s95k%';

  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN RAISE EXCEPTION 'ABORTA 76(g): pedidos % vs %', v_n, v_ped_antes; END IF;
  SELECT count(*) INTO v_n FROM inventario_reservas;
  IF v_n <> v_res_antes THEN RAISE EXCEPTION 'ABORTA 76(g): reservas % vs %', v_n, v_res_antes; END IF;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): el stock del SKU quedó en % y arrancó en %.', v_n, v_disp_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S95-K: sin stock NO se llega a pagar, con stock el camino feliz corre, y un pago sin reserva REBOTA. Residuo 0.';
END $$;

COMMIT;
