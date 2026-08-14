-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · SIEMBRA: UN PEDIDO VIVO PARA `duenotodo` (14-ago-2026)
--
-- POR QUÉ: `duenotodo` es la ÚNICA cuenta prestador+vendedor viva, y **sin un
-- pedido suyo la fila de despacho del HOY no la puede gatear nadie** — puerta
-- sin población, el modo de falla que S96 midió tres veces.
--
-- POR PUERTAS REALES, cero INSERT directo (mismo criterio que la siembra del
-- repartidor): si el camino del vendedor real se rompe, esto se rompe acá y
-- no en el gate del founder.
--
-- ABORTA en cada paso: un `RAISE` por cada precondición que no se cumpla.
-- Un seed que sigue con un paso fallado siembra un estado que el motor no
-- produce, y eso es peor que no sembrar.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc      uuid := '44efec32-16d0-4fb5-bd6d-2170ac92a97c';  -- duenotodo
  v_owner   uuid;
  v_admin   uuid;
  v_cliente uuid;
  v_mascota uuid;
  v_familia text;
  v_marca   text;
  v_nombre  text;
  v_varcod  text;
  v_sku     uuid;
  v_oferta  uuid;
  v_rep     uuid;
  v_ped     uuid;
  v_r       jsonb;
  v_estado  text;
  v_n       int;
BEGIN
  SET LOCAL ROLE postgres;

  SELECT owner_profile_id INTO v_owner FROM cuentas_comerciales WHERE id = v_cc AND estado='activa';
  IF v_owner IS NULL THEN RAISE EXCEPTION 'ABORTA: duenotodo no existe o no esta activa'; END IF;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'ABORTA: sin admin para publicar la oferta'; END IF;

  -- ── ① LA OFERTA (medido: duenotodo tenia CERO — sin oferta no hay pedido) ──
  SELECT o.id INTO v_oferta FROM ofertas o WHERE o.cuenta_comercial_id = v_cc AND o.estado='publicada' LIMIT 1;
  IF v_oferta IS NULL THEN
    -- 🔴 EL VENDEDOR MAPEA, NO ES AUTOR (M21/§4.2): el canónico se RESUELVE
    -- por familia+marca+nombre+código de variante. Si el producto no está en
    -- el catálogo de e-PetPlace, `proponer_sku_vendedor` rebota — y hace
    -- bien: sumar un vendedor es MAPEO, no autoría.
    SELECT pr.familia_codigo, pr.marca, pr.nombre, pv.codigo
      INTO v_familia, v_marca, v_nombre, v_varcod
      FROM producto_variantes pv JOIN productos pr ON pr.id=pv.producto_id
     WHERE pr.vendible AND pr.familia_codigo='alimento' AND pr.marca IS NOT NULL
     ORDER BY pr.nombre, pv.codigo LIMIT 1;
    IF v_varcod IS NULL THEN RAISE EXCEPTION 'ABORTA: no hay variante canonica de alimento con marca'; END IF;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);
    v_r := proponer_sku_vendedor(
      v_cc,
      jsonb_build_object('familia_codigo', v_familia, 'marca', v_marca, 'nombre', v_nombre),
      jsonb_build_object('codigo', v_varcod),
      jsonb_build_object('sku_vendedor', 'SKU-TODO-S97-1', 'stock_disponible', 25),
      'vendedor');
    v_sku := (v_r->>'sku_id')::uuid;
    IF v_sku IS NULL THEN RAISE EXCEPTION 'ABORTA: proponer_sku_vendedor no devolvio sku (%)', v_r; END IF;
    RAISE NOTICE '① sku propuesto: %', v_sku;

    -- e-PetPlace PUBLICA (§4.2): el acto es del admin, no del vendedor.
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
    v_r := publicar_oferta_sku(v_sku, 24.90, 'EC');
    v_oferta := (v_r->>'oferta_id')::uuid;
    IF v_oferta IS NULL THEN RAISE EXCEPTION 'ABORTA: publicar_oferta_sku no devolvio oferta (%)', v_r; END IF;
    RAISE NOTICE '① oferta publicada: % ($24.90)', v_oferta;
  ELSE
    RAISE NOTICE '① oferta ya existia: %', v_oferta;
  END IF;

  -- ── ② EL REPARTIDOR (despachar lo exige) ──────────────────────────────
  SELECT id INTO v_rep FROM repartidores WHERE cuenta_comercial_id = v_cc AND activo LIMIT 1;
  IF v_rep IS NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);
    v_r := registrar_repartidor(v_cc, 'Repartidor duenotodo S97', 'DEMO-REP-TODO-001', NULL, NULL);
    v_rep := (v_r->>'repartidor_id')::uuid;
    IF v_rep IS NULL THEN RAISE EXCEPTION 'ABORTA: registrar_repartidor fallo (%)', v_r; END IF;
    RAISE NOTICE '② repartidor: %', v_rep;
  ELSE
    RAISE NOTICE '② repartidor ya existia: %', v_rep;
  END IF;

  -- ── ③ EL CLIENTE que compra (una familia REAL con mascota) ────────────
  SELECT fm.user_id, m.id INTO v_cliente, v_mascota
    FROM familia_miembro fm
    JOIN mascotas m ON m.familia_id = fm.familia_id
    JOIN familia f ON f.id = fm.familia_id
   WHERE fm.hasta IS NULL AND f.tipo='estandar' AND fm.user_id IS NOT NULL
     AND m.estado_vida = 'activa'
   LIMIT 1;
  IF v_cliente IS NULL THEN RAISE EXCEPTION 'ABORTA: no hay familia real con mascota activa'; END IF;
  RAISE NOTICE '③ cliente: % · mascota: %', v_cliente, v_mascota;

  -- ── ④ EL PEDIDO, por el camino del cliente ────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cliente, 'role','authenticated')::text, true);
  v_r := crear_pedido_despensa(
    v_cc,
    jsonb_build_array(jsonb_build_object('oferta_id', v_oferta, 'cantidad', 2, 'mascota_id', v_mascota)),
    jsonb_build_object('nombre_receptor','Gate S97','telefono','0999999999',
                       'direccion','Av. Shyris N34-100','ciudad','Quito','sector','La Carolina',
                       'referencias','Edificio de vidrio','instrucciones','Timbre 4B'),
    'siembra-s97-duenotodo-1');
  v_ped := (v_r->>'pedido_id')::uuid;
  IF v_ped IS NULL THEN RAISE EXCEPTION 'ABORTA: crear_pedido_despensa fallo (%)', v_r; END IF;
  RAISE NOTICE '④ pedido: % (ya existia: %)', v_ped, COALESCE(v_r->>'ya_existia','false');

  -- ── ⑤ RESERVA → PAGO → EMPAQUE → FACTURA, todo por su puerta ──────────
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado NOT IN ('documentado','en_reparto','entregado') THEN
    PERFORM reservar_stock_pedido(v_ped, 30);
    PERFORM iniciar_pago_pedido(v_ped, 30);
    -- 🔴 EL PAGO NO LO CONFIRMA UNA PERSONA. `confirmar_pago_pedido` rebota
    -- `confirmacion_de_pago_no_es_del_cliente` a cualquier sesión con
    -- `auth.uid()` — es la cura de S95 (la puerta por la que se llevaban la
    -- mercadería). Se llama como lo llama la pasarela: SIN sesión. La siembra
    -- respeta el gate en vez de esquivarlo; si algún día ese rebote
    -- desaparece, esta línea deja de correr y lo vamos a saber acá.
    PERFORM set_config('request.jwt.claims', NULL, true);
    PERFORM confirmar_pago_pedido(v_ped, 'simulado', 'SIEMBRA-S97-TODO', 'idem-pago-s97-todo-1', '{}'::jsonb);
    RAISE NOTICE '⑤ pagado';

    -- El vendedor prepara. El lote va porque el empaque LO EXIGE (§8.6bis:
    -- el día que un fabricante retire un lote, esa columna es la diferencia).
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role','authenticated')::text, true);
    PERFORM mover_estado_pedido(v_ped, 'picking', 'vendedor', 'siembra S97');
    -- El lote va POR ÍTEM (`item_id`), no como lista suelta: `empacar_pedido`
    -- cuenta los ítems SIN lote y rebota `lote_requerido`. Su porqué está en
    -- el propio mensaje del motor — *sin lote no se puede responder un retiro
    -- de fabricante* — y es la razón por la que el empaque es un escalón
    -- propio (§8.6bis, la enmienda de los CUATRO escalones).
    PERFORM empacar_pedido(
      v_ped,
      (SELECT jsonb_agg(jsonb_build_object('item_id', pi.id, 'lote', 'L-S97-DEMO'))
         FROM pedido_items pi WHERE pi.pedido_id = v_ped),
      3.2);
    PERFORM registrar_factura_pedido(v_ped, '001-001-000000042', NULL, NULL, NULL, NULL);
    RAISE NOTICE '⑤ empacado y documentado';
  END IF;

  -- ── VERIFICACIÓN: queda EN LA FILA DE DESPACHO, no despachado ─────────
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'documentado' THEN
    RAISE EXCEPTION 'ABORTA: el pedido quedo en «%» y la fila de despacho del HOY espera «documentado»', v_estado;
  END IF;
  SELECT count(*) INTO v_n FROM pedidos WHERE cuenta_comercial_id = v_cc AND estado = 'documentado';

  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE '✅ SIEMBRA OK — pedido % en «documentado» (% en la fila) · repartidor % listo para el gate del despacho', v_ped, v_n, v_rep;
END $$;
