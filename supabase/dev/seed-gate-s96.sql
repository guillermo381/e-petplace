-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA DEL GATE S96 (12-ago-2026) — pedido del founder.
--
-- TODO por las puertas REALES (crear → reservar → iniciar → confirmar), con
-- los claims del comprador real; los pedidos quedan MARCADOS
-- `created_by_sistema` (la marca de M10 — jamás inflan un conteo). Deja:
--   · 1 repartidor de pruebas (activo, de la cuenta vendedora)
--   · P1: pedido DESPACHO con 1 ítem ATADO a una mascota real → liberado_preparacion
--   · P2: pedido DESPACHO con 2 ítems SIN destino (para probar «¿lo atás?») → liberado_preparacion
--   · P3: pedido RETIRO con 1 ítem → liberado_preparacion (entrega en mostrador con código)
--   · 1 venta de MOSTRADOR contra nadie, con su código de reclamo (se imprime)
-- El founder camina la escalera DESDE acá: picking → empacar → factura →
-- despachar (asigna el repartidor) → entregar con código.
-- Limpieza posterior: por id (se imprimen todos), jamás por barrido.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cuenta    uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_comprador uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_admin     uuid;
  v_mascota   uuid;
  v_of1 uuid := '591c4915-8edf-48ae-8411-515197474065'; -- Puppy Pollo y Arroz
  v_of2 uuid := 'a1eb80ad-9d4f-44cf-9226-a7f483249e96'; -- Adulto Cordero y Arroz
  v_of3 uuid := '504e3245-9d9b-4eff-a9f7-240e923592c8'; -- Adulto Pescado y Papa
  v_sku1 uuid;
  v_rep  jsonb;
  v_p1 uuid; v_p2 uuid; v_p3 uuid;
  v_r  jsonb;
  v_venta jsonb;
  v_entrega jsonb := jsonb_build_object(
    'nombre_receptor', 'Guillermo (gate S96)',
    'telefono', '+593999999999',
    'direccion', 'Av. de los Shyris N34-40',
    'ciudad', 'Quito',
    'referencias', 'Edificio de prueba, timbre 1',
    'instrucciones', 'Dejar en porteria si no hay nadie',
    'lat', -0.176281, 'lon', -78.480184);
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT m.id INTO v_mascota
    FROM familia_miembro f JOIN mascotas m ON m.familia_id = f.familia_id
   WHERE f.user_id = v_comprador AND _user_es_familia_de_mascota(m.id, v_comprador)
   LIMIT 1;
  SELECT vs.id INTO v_sku1 FROM vendedor_skus vs
   JOIN ofertas o ON o.sku_id = vs.id WHERE o.id = v_of1;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'sin mascota del comprador'; END IF;

  -- ── El repartidor (claims de admin) ──────────────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_rep := registrar_repartidor(v_cuenta, 'Repartidor de Pruebas', 'DEMO-REP-001', '+593988888888', NULL);
  RAISE NOTICE 'REPARTIDOR: %', v_rep;

  -- ── Los tres pedidos, como el comprador real ─────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_comprador, 'role', 'authenticated')::text, true);

  v_r := crear_pedido_despensa(v_cuenta,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of1, 'cantidad', 1, 'mascota_id', v_mascota)),
    v_entrega, 'gate-s96-p1', NULL, 'despacho', NULL, 'estandar');
  v_p1 := (v_r ->> 'pedido_id')::uuid;
  PERFORM reservar_stock_pedido(v_p1);
  PERFORM iniciar_pago_pedido(v_p1);

  v_r := crear_pedido_despensa(v_cuenta,
    jsonb_build_array(
      jsonb_build_object('oferta_id', v_of2, 'cantidad', 1),
      jsonb_build_object('oferta_id', v_of3, 'cantidad', 2)),
    v_entrega, 'gate-s96-p2', NULL, 'despacho', NULL, 'estandar');
  v_p2 := (v_r ->> 'pedido_id')::uuid;
  PERFORM reservar_stock_pedido(v_p2);
  PERFORM iniciar_pago_pedido(v_p2);

  v_r := crear_pedido_despensa(v_cuenta,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of2, 'cantidad', 1)),
    jsonb_build_object('nombre_receptor', 'Guillermo (gate S96)', 'telefono', '+593999999999',
                       'direccion', 'Retiro en tienda', 'ciudad', 'Quito'),
    'gate-s96-p3', NULL, 'retiro', NULL, 'estandar');
  v_p3 := (v_r ->> 'pedido_id')::uuid;
  PERFORM reservar_stock_pedido(v_p3);
  PERFORM iniciar_pago_pedido(v_p3);

  -- ── El pago, por el camino del webhook (motor por dentro) ────────────────
  PERFORM set_config('request.jwt.claims', NULL, true);
  PERFORM confirmar_pago_pedido(v_p1, 'seed_gate', 'gate-s96-pago-1', 'gate-s96-pago-1');
  PERFORM confirmar_pago_pedido(v_p2, 'seed_gate', 'gate-s96-pago-2', 'gate-s96-pago-2');
  PERFORM confirmar_pago_pedido(v_p3, 'seed_gate', 'gate-s96-pago-3', 'gate-s96-pago-3');

  -- ── La venta de mostrador, contra nadie (claims de admin) ────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_venta := registrar_venta_mostrador(v_cuenta,
    jsonb_build_array(jsonb_build_object('sku_id', v_sku1, 'cantidad', 1)));
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- ── La marca (M10): son de prueba y lo dicen ─────────────────────────────
  UPDATE pedidos SET created_by_sistema = true WHERE id IN (v_p1, v_p2, v_p3);

  RAISE NOTICE 'P1 despacho+mascota: % → %', v_p1, (SELECT estado FROM pedidos WHERE id = v_p1);
  RAISE NOTICE 'P2 despacho sin destino: % → %', v_p2, (SELECT estado FROM pedidos WHERE id = v_p2);
  RAISE NOTICE 'P3 retiro: % → %', v_p3, (SELECT estado FROM pedidos WHERE id = v_p3);
  RAISE NOTICE 'VENTA MOSTRADOR: %', v_venta;
END $$;
