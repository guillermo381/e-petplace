-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · LAS DOS FIRMAS DEL FOUNDER SOBRE EL REPORTE DE LA FASE 1 (12-ago-2026)
--
-- ① LOS 2 PEDIDOS E2E DE S95-K SE MARCAN, NO SE BORRAN (precedente S92: las
--    64 sondas se marcaron; y L-231: un ledger append-only no se corrige
--    borrando filas — estos dos tienen historia de estados, pagos, factura y
--    movimientos de inventario colgando). Nace `pedidos.created_by_sistema`
--    (el nombre que la casa ya usa: `familia.created_by_sistema`, backfill
--    S17-C) y las DOS filas quedan marcadas POR ID, con guard que aborta si
--    el censo cambió.
--
-- ② LA EXPIRACIÓN DEL CÓDIGO DE MOSTRADOR: FIRMADA EN 90 DÍAS, PERO COMO
--    PARÁMETRO, no constante. Razón escrita del founder: **que una factura
--    tirada no pueda meter un evento falso en el expediente de un
--    desconocido** — si 90 días resulta largo, se acorta editando una fila,
--    sin migración. Vive en `app_config` (`mostrador_reclamo_dias`), la misma
--    casa del plazo de caducidad del acceso de prestador.
--
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s96/2026-08-12-s96-m10-REVERSA.sql
--   (+ functiondef-pre-m10.sql con el cuerpo del mostrador capturado)
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE en ①**: toca DOS filas vivas identificadas por id, con
-- guard de censo (si no son exactamente esas dos, ABORTA). El cinturón de ②
-- muta `app_config` dentro de la transacción y lo restaura, residuo 0.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LA MARCA — imposible de confundir, con el nombre que la casa ya usa
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pedidos
  ADD COLUMN created_by_sistema boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pedidos.created_by_sistema IS
  'S96 · true = dato de PRUEBA creado por el sistema (E2E, fixtures), jamás una '
  'compra real. Mismo nombre y semántica que familia.created_by_sistema (S92: '
  'las sondas se marcan, no se borran — el ledger append-only no se corrige '
  'borrando filas, L-231). Todo contador de negocio lo excluye.';

DO $$
DECLARE v_n int;
BEGIN
  -- El guard del censo: son EXACTAMENTE los dos E2E de S95-K, por id. Si al
  -- aplicar esto hay más, menos, u otros, el mundo cambió y esta migración
  -- no puede decidir sola — ABORTA y se re-mide.
  SELECT count(*) INTO v_n FROM pedidos
   WHERE clave_idempotencia LIKE '%\_\_e2e\_real\_g4%' ESCAPE '\';
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'ABORTA: el censo esperaba 2 pedidos E2E y hay % — re-medir antes de marcar.', v_n;
  END IF;

  UPDATE pedidos SET created_by_sistema = true
   WHERE id IN ('f69620bf-d628-4961-93ce-c40274f54561',
                '3cf70071-9a4e-4107-aab7-774ae85e8815');
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'ABORTA: la marca alcanzó % fila(s) y tenían que ser 2 exactas.', v_n;
  END IF;

  -- Y ninguna compra real quedó marcada por accidente.
  IF EXISTS (SELECT 1 FROM pedidos
             WHERE created_by_sistema
               AND clave_idempotencia NOT LIKE '%\_\_e2e\_real\_g4%' ESCAPE '\') THEN
    RAISE EXCEPTION 'ABORTA: hay una fila marcada que no es de las dos E2E.';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL PLAZO DEL RECLAMO — parámetro, jamás constante
-- ═══════════════════════════════════════════════════════════════════════════
-- `tipo` y `categoria` salen del CHECK vivo de la tabla, no de la memoria
-- (la primera corrida rebotó: no existe la categoría 'despensa' ni el tipo
-- 'integer' — el vocabulario real es numero/limites).
INSERT INTO app_config (clave, valor, tipo, descripcion, categoria)
VALUES ('mostrador_reclamo_dias', '90', 'numero',
        'S96 · Días de vigencia del código de reclamo de la venta de mostrador. '
        'Firmado en 90 por el founder, COMO PARÁMETRO: que una factura tirada no '
        'pueda meter un evento falso en el expediente de un desconocido — si 90 '
        'resulta largo, se edita esta fila y nada más.',
        'limites')
ON CONFLICT (clave) DO NOTHING;

-- La función del mostrador lee el parámetro (default defensivo 90 si la fila
-- faltara — el mismo patrón de `acceso_prestador_caducidad_meses`). Cambia
-- SOLO el origen del plazo; el resto del cuerpo es el de la M6, verbatim
-- (capturado pre-M10 para la reversa).
CREATE OR REPLACE FUNCTION public.registrar_venta_mostrador(
  p_cuenta_comercial_id uuid,
  p_items               jsonb   -- [{sku_id, cantidad, lote?, fecha_vencimiento?}]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_venta uuid; v_it jsonb; v_sku record; v_codigo text;
  v_total numeric := 0; v_n int := 0;
  v_dias int;
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

  -- 🔴 EL PLAZO ES PARÁMETRO (firma founder S96): app_config manda.
  SELECT COALESCE(
    (SELECT valor::integer FROM app_config WHERE clave = 'mostrador_reclamo_dias'),
    90) INTO v_dias;

  -- El código: 8 del alfabeto, reintentando ante la colisión improbable.
  LOOP
    SELECT string_agg(substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1), '')
      INTO v_codigo FROM generate_series(1, 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM ventas_mostrador WHERE codigo_reclamo = v_codigo);
  END LOOP;

  INSERT INTO ventas_mostrador (cuenta_comercial_id, codigo_reclamo, expira_en, registrada_por)
    VALUES (p_cuenta_comercial_id, v_codigo, now() + make_interval(days => v_dias), auth.uid())
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
                            'expira_en', now() + make_interval(days => v_dias));
END $$;

REVOKE ALL ON FUNCTION public.registrar_venta_mostrador(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venta_mostrador(uuid, jsonb) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_vend uuid; v_sku uuid; v_res jsonb; v_venta uuid;
  v_disp_antes int; v_n int; v_exp timestamptz;
BEGIN
  -- ① las dos marcas quedaron, y SOLO esas dos.
  SELECT count(*) INTO v_n FROM pedidos WHERE created_by_sistema;
  IF v_n <> 2 THEN RAISE EXCEPTION 'ABORTA: % fila(s) marcadas, tenían que ser 2.', v_n; END IF;

  -- ② el parámetro manda: con 7 en la config, la venta expira en ~7 días.
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_vend
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.sku_id INTO v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;

  UPDATE app_config SET valor = '7' WHERE clave = 'mostrador_reclamo_dias';

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);
  PERFORM ajustar_stock_vendedor(v_sku, 1, '__cint_s96m10 carga temporal');
  v_res := registrar_venta_mostrador(v_cc,
    jsonb_build_array(jsonb_build_object('sku_id', v_sku, 'cantidad', 1)));
  v_venta := (v_res->>'venta_id')::uuid;
  v_exp := (v_res->>'expira_en')::timestamptz;
  IF v_exp > now() + interval '8 days' OR v_exp < now() + interval '6 days' THEN
    RAISE EXCEPTION 'ABORTA: el plazo no salió del parámetro (expira %).', v_exp;
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  UPDATE app_config SET valor = '90' WHERE clave = 'mostrador_reclamo_dias';
  DELETE FROM ventas_mostrador WHERE id = v_venta;   -- items caen por CASCADE
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_vend, 'role','authenticated')::text, true);
    PERFORM ajustar_stock_vendedor(v_sku, v_disp_antes - v_n, '__cint_s96m10 devolucion');
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;
  DELETE FROM inventario_movimientos
   WHERE referencia_id = v_venta OR motivo LIKE '__cint_s96m10%';

  IF (SELECT valor FROM app_config WHERE clave='mostrador_reclamo_dias') <> '90' THEN
    RAISE EXCEPTION 'ABORTA 76(g): el parámetro no volvió a 90.';
  END IF;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): el stock quedó en % y arrancó en %.', v_n, v_disp_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S96-M10: las 2 marcas exactas quedaron, el plazo del reclamo sale de app_config (7 → 90 restaurado). Residuo 0.';
END $$;

COMMIT;
