-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA DE LA CUENTA VENDEDORA PURA (S96, orden founder) — espejo de la del
-- legado, TODO por las puertas reales, pedidos marcados. Deja en la cuenta
-- `61a28501` (Tienda Pura, owner vendedor.puro@e-petplace.com):
--   regla de envío (flota propia, $0, Quito y valles) · recurso + 2 turnos ·
--   repartidor propio · 3 productos canónicos DEMO nuevos (¡variantes propias:
--   §4.1 prohíbe segunda oferta sobre las del legado!) con skus del puro por
--   MAPEO (M21) y ofertas publicadas · 3 pedidos en liberado_preparacion ·
--   1 venta de mostrador con código. La arena entra con estado NO_APLICA —
--   el cuarto estado, caminable en el gate.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cuenta    uuid := '61a28501-9d09-4bef-b23c-7c102e0fb3e7';
  v_puro      uuid := 'eaad8d8d-18dc-4295-a65a-323e467b8f84';
  v_comprador uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_admin     uuid;
  v_mascota   uuid;
  v_familia   text;
  v_tasa      text;
  v_r         jsonb;
  v_prod_arena uuid;
  v_sku1 uuid; v_sku2 uuid; v_sku3 uuid;
  v_of1 uuid; v_of2 uuid; v_of3 uuid;
  v_p1 uuid; v_p2 uuid; v_p3 uuid;
  v_venta jsonb;
  v_entrega jsonb := jsonb_build_object(
    'nombre_receptor', 'Guillermo (gate pura)', 'telefono', '+593999999999',
    'direccion', 'Av. de los Shyris N34-40', 'ciudad', 'Quito',
    'referencias', 'Edificio de prueba', 'instrucciones', 'Dejar en porteria',
    'lat', -0.176281, 'lon', -78.480184);
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT codigo INTO v_tasa FROM cat_tasas_impuesto WHERE activo LIMIT 1;
  SELECT m.id INTO v_mascota FROM familia_miembro f
    JOIN mascotas m ON m.familia_id = f.familia_id
   WHERE f.user_id = v_comprador AND m.nombre = 'Zeus'
     AND _user_es_familia_de_mascota(m.id, v_comprador) LIMIT 1;

  -- ── La operación del puro, con SUS claims (él se configura solo — §2.1) ──
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_puro, 'role', 'authenticated')::text, true);
  PERFORM definir_regla_envio_vendedor(v_cuenta, 'flota_propia',
    jsonb_build_object('monto', 0, 'pagado_por', 'vendedor'), 'vendedor',
    ARRAY['Quito','Cumbayá','Tumbaco','Conocoto','Sangolquí','San Rafael']);
  PERFORM definir_recurso_reparto(v_cuenta, 'Moto de la Tienda Pura', 15, ARRAY[1,2,3,4,5,6]);
  PERFORM definir_turno_entrega(v_cuenta, 'manana', '12:00', '14:00', '18:00', 0, 1);
  PERFORM definir_turno_entrega(v_cuenta, 'tarde', '23:59', '09:00', '13:00', 1, 2);
  PERFORM registrar_repartidor(v_cuenta, 'Repartidor Puro de Pruebas', 'DEMO-REP-PURO-001', '+593977777777', v_puro);

  -- ── El catálogo: canónicos DEMO nuevos (admin) + mapeo del puro (M21) ────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM proponer_producto_canonico(
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Croquetas Demo Adulto Res', 'marca', 'DEMO',
      'especies_aplicables', jsonb_build_array('perro'),
      'ingredientes_activos', jsonb_build_array('res','arroz'), 'alergenos', jsonb_build_array('res','arroz')),
    jsonb_build_object('codigo', 'DEMO-RES-1', 'presentacion', 'Bolsa 2kg', 'impuesto_codigo', v_tasa));
  PERFORM proponer_producto_canonico(
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Croquetas Demo Cachorro Pollo', 'marca', 'DEMO',
      'especies_aplicables', jsonb_build_array('perro'),
      'ingredientes_activos', jsonb_build_array('pollo','arroz'), 'alergenos', jsonb_build_array('pollo','arroz')),
    jsonb_build_object('codigo', 'DEMO-POLLO-1', 'presentacion', 'Bolsa 2kg', 'impuesto_codigo', v_tasa));
  v_r := proponer_producto_canonico(
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Arena Sanitaria Demo', 'marca', 'DEMO',
      'especies_aplicables', jsonb_build_array('gato')),
    jsonb_build_object('codigo', 'DEMO-ARENA-1', 'presentacion', 'Bolsa 5kg', 'impuesto_codigo', v_tasa));
  v_prod_arena := (v_r ->> 'producto_id')::uuid;
  -- El cuarto estado, en su caso real: a una arena no se le piden ingredientes.
  PERFORM declarar_composicion_estado(v_prod_arena, 'no_aplica');

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_puro, 'role', 'authenticated')::text, true);
  v_sku1 := (proponer_sku_vendedor(v_cuenta,
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Croquetas Demo Adulto Res', 'marca', 'DEMO'),
    jsonb_build_object('codigo', 'DEMO-RES-1'),
    jsonb_build_object('sku_vendedor', 'PURO-RES-1', 'precio_propuesto', 18.00, 'stock_disponible', 10), 'vendedor') ->> 'sku_id')::uuid;
  v_sku2 := (proponer_sku_vendedor(v_cuenta,
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Croquetas Demo Cachorro Pollo', 'marca', 'DEMO'),
    jsonb_build_object('codigo', 'DEMO-POLLO-1'),
    jsonb_build_object('sku_vendedor', 'PURO-POLLO-1', 'precio_propuesto', 16.00, 'stock_disponible', 10), 'vendedor') ->> 'sku_id')::uuid;
  v_sku3 := (proponer_sku_vendedor(v_cuenta,
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Arena Sanitaria Demo', 'marca', 'DEMO'),
    jsonb_build_object('codigo', 'DEMO-ARENA-1'),
    jsonb_build_object('sku_vendedor', 'PURO-ARENA-1', 'precio_propuesto', 9.00, 'stock_disponible', 10), 'vendedor') ->> 'sku_id')::uuid;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_of1 := ((publicar_oferta_sku(v_sku1, 18.00, 'EC')) ->> 'oferta_id')::uuid;
  v_of2 := ((publicar_oferta_sku(v_sku2, 16.00, 'EC')) ->> 'oferta_id')::uuid;
  v_of3 := ((publicar_oferta_sku(v_sku3, 9.00, 'EC')) ->> 'oferta_id')::uuid;

  -- ── Los tres pedidos del comprador real ──────────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_comprador, 'role', 'authenticated')::text, true);
  v_p1 := (crear_pedido_despensa(v_cuenta,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of1, 'cantidad', 1, 'mascota_id', v_mascota)),
    v_entrega, 'gate-pura-p1', NULL, 'despacho', NULL, 'estandar') ->> 'pedido_id')::uuid;
  v_p2 := (crear_pedido_despensa(v_cuenta,
    jsonb_build_array(
      jsonb_build_object('oferta_id', v_of2, 'cantidad', 1),
      jsonb_build_object('oferta_id', v_of3, 'cantidad', 2)),
    v_entrega, 'gate-pura-p2', NULL, 'despacho', NULL, 'estandar') ->> 'pedido_id')::uuid;
  v_p3 := (crear_pedido_despensa(v_cuenta,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of1, 'cantidad', 1)),
    jsonb_build_object('nombre_receptor', 'Guillermo (gate pura)', 'telefono', '+593999999999',
                       'direccion', 'Retiro en tienda', 'ciudad', 'Quito'),
    'gate-pura-p3', NULL, 'retiro', NULL, 'estandar') ->> 'pedido_id')::uuid;
  PERFORM reservar_stock_pedido(v_p1); PERFORM iniciar_pago_pedido(v_p1);
  PERFORM reservar_stock_pedido(v_p2); PERFORM iniciar_pago_pedido(v_p2);
  PERFORM reservar_stock_pedido(v_p3); PERFORM iniciar_pago_pedido(v_p3);

  PERFORM set_config('request.jwt.claims', NULL, true);
  PERFORM confirmar_pago_pedido(v_p1, 'seed_gate', 'gate-pura-pago-1', 'gate-pura-pago-1');
  PERFORM confirmar_pago_pedido(v_p2, 'seed_gate', 'gate-pura-pago-2', 'gate-pura-pago-2');
  PERFORM confirmar_pago_pedido(v_p3, 'seed_gate', 'gate-pura-pago-3', 'gate-pura-pago-3');
  UPDATE pedidos SET created_by_sistema = true WHERE id IN (v_p1, v_p2, v_p3);

  -- ── La venta de mostrador del puro ───────────────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_puro, 'role', 'authenticated')::text, true);
  v_venta := registrar_venta_mostrador(v_cuenta,
    jsonb_build_array(jsonb_build_object('sku_id', v_sku1, 'cantidad', 1)));
  PERFORM set_config('request.jwt.claims', NULL, true);

  RAISE NOTICE 'P1 %: %', (SELECT numero_orden FROM pedidos WHERE id=v_p1), (SELECT estado FROM pedidos WHERE id=v_p1);
  RAISE NOTICE 'P2 %: %', (SELECT numero_orden FROM pedidos WHERE id=v_p2), (SELECT estado FROM pedidos WHERE id=v_p2);
  RAISE NOTICE 'P3 (retiro) %: %', (SELECT numero_orden FROM pedidos WHERE id=v_p3), (SELECT estado FROM pedidos WHERE id=v_p3);
  RAISE NOTICE 'MOSTRADOR: %', v_venta;
END $$;
