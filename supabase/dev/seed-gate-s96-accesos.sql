-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA DE ACCESOS DEL GATE S96 (12-ago, 2ª tanda — pedido del founder)
--  ① clave CONOCIDA para la cuenta de pruebas del vendedor (es «borrable»,
--    nació para esto — jamás se hace sobre una cuenta real)
--  ② el repartidor de pruebas queda atado al MISMO usuario vendedor (v1: la
--    pantalla del repartidor vive dentro de Negocios; en producción sería
--    cuenta propia — declarado)
--  ③ la alergia de Thor a POLLO, por la forma real del evento (procedencia
--    declarado_por_familia, autor = el titular real; el trigger propaga al
--    perfil vigente)
--  ④ un producto que dispara la advertencia IMPRECISA (ave_no_especificada)
--    — entra POR LAS DOS PUERTAS NUEVAS de M21 (estrena la separación)
--  ⑤ dos pedidos de REPUESTO para la pasada de Karina (la escalera se gasta)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cuenta    uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_vend_uid  uuid := 'da83d6d8-f090-414c-98e0-7fae644f52df';
  v_comprador uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_admin     uuid;
  v_thor      uuid;
  v_rep_id    uuid;
  v_ev        uuid;
  v_r         jsonb;
  v_prod      uuid;
  v_var       uuid;
  v_sku       uuid;
  v_of1 uuid := '591c4915-8edf-48ae-8411-515197474065';
  v_p uuid;
  v_familia text;
  v_tasa    text;
  v_entrega jsonb := jsonb_build_object(
    'nombre_receptor', 'Karina (gate S96)', 'telefono', '+593999999999',
    'direccion', 'Av. de los Shyris N34-40', 'ciudad', 'Quito',
    'lat', -0.176281, 'lon', -78.480184);
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT m.id INTO v_thor FROM mascotas m
   WHERE m.nombre = 'Thor' AND m.familia_id IN
     (SELECT familia_id FROM familia_miembro WHERE user_id = v_comprador) LIMIT 1;
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT codigo INTO v_tasa FROM cat_tasas_impuesto WHERE activo LIMIT 1;

  -- ① la clave de la cuenta de PRUEBAS (borrable) — conocida para el gate.
  UPDATE auth.users
     SET encrypted_password = extensions.crypt('GateS96.negocios', extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now())
   WHERE id = v_vend_uid AND email = 'nuevo_test2@e-petplace.com';
  IF NOT FOUND THEN RAISE EXCEPTION 'la cuenta vendedora no es la esperada — NO se tocó ninguna clave'; END IF;

  -- ② el repartidor, atado al usuario vendedor (v1 declarado).
  SELECT id INTO v_rep_id FROM repartidores WHERE documento = 'DEMO-REP-001';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM actualizar_repartidor(v_rep_id, NULL, NULL, NULL, v_vend_uid);

  -- ③ la alergia de Thor a POLLO (forma real; el trigger propaga al perfil).
  IF NOT EXISTS (SELECT 1 FROM evento_alergia_diagnosticada WHERE mascota_id = v_thor AND alergeno = 'pollo') THEN
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, country_code, procedencia, creado_por_user_id)
    VALUES (v_thor, 'alergia_diagnosticada', 'salud', now(), 'EC', 'declarado_por_familia', v_comprador)
    RETURNING id INTO v_ev;
    INSERT INTO evento_alergia_diagnosticada (evento_id, mascota_id, alergeno, categoria_alergeno, severidad, estado, fecha_diagnostico, country_code)
    VALUES (v_ev, v_thor, 'pollo', 'alimentaria', 'moderada', 'confirmada', current_date, 'EC');
  END IF;

  -- ④ el producto de la advertencia IMPRECISA — por las DOS puertas de M21.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_r := proponer_producto_canonico(
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Snack de Ave (prueba del gate)',
      'marca', 'DEMO', 'especies_aplicables', jsonb_build_array('perro'),
      'ingredientes_activos', jsonb_build_array('ave_no_especificada','arroz'),
      'alergenos', jsonb_build_array('ave_no_especificada')),
    jsonb_build_object('codigo', 'GATE-AVE-1', 'presentacion', 'Bolsa 500g', 'impuesto_codigo', v_tasa));
  v_prod := (v_r ->> 'producto_id')::uuid;
  v_r := proponer_sku_vendedor(v_cuenta,
    jsonb_build_object('familia_codigo', v_familia, 'nombre', 'Snack de Ave (prueba del gate)', 'marca', 'DEMO'),
    jsonb_build_object('codigo', 'GATE-AVE-1'),
    jsonb_build_object('sku_vendedor', 'GATE-AVE-SKU', 'precio_propuesto', 5.00, 'stock_disponible', 5),
    'epetplace');
  v_sku := (v_r ->> 'sku_id')::uuid;
  PERFORM publicar_oferta_sku(v_sku, 5.00, 'EC');
  RAISE NOTICE 'PRODUCTO IMPRECISA: % (Snack de Ave, ave_no_especificada, \$5)', v_prod;

  -- ⑤ dos pedidos de repuesto (Karina) — camino real, marcados.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_comprador, 'role', 'authenticated')::text, true);
  FOR v_p IN
    SELECT (crear_pedido_despensa(v_cuenta,
      jsonb_build_array(jsonb_build_object('oferta_id', v_of1, 'cantidad', 1)),
      v_entrega, k.clave, NULL, 'despacho', NULL, 'estandar') ->> 'pedido_id')::uuid
    FROM (VALUES ('gate-s96-k1'), ('gate-s96-k2')) k(clave)
  LOOP
    PERFORM reservar_stock_pedido(v_p);
    PERFORM iniciar_pago_pedido(v_p);
    PERFORM set_config('request.jwt.claims', NULL, true);
    PERFORM confirmar_pago_pedido(v_p, 'seed_gate', 'pago-' || v_p, 'pago-' || v_p);
    UPDATE pedidos SET created_by_sistema = true WHERE id = v_p;
    RAISE NOTICE 'PEDIDO KARINA: % → %', (SELECT numero_orden FROM pedidos WHERE id = v_p), (SELECT estado FROM pedidos WHERE id = v_p);
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_comprador, 'role', 'authenticated')::text, true);
  END LOOP;
  PERFORM set_config('request.jwt.claims', NULL, true);

  RAISE NOTICE 'ALERGIA THOR: %', (SELECT alergias FROM mascota_perfil_vigente WHERE mascota_id = v_thor);
END $$;
