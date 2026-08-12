-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago) — 🔴 EL CATÁLOGO CANÓNICO SE SEPARA DE LA
-- OFERTA DEL VENDEDOR, Y SE SEPARA ANTES DE LA CARGA.
--
-- «El catálogo es de e-PetPlace; del vendedor se prende disponibilidad.
--  Sumar un vendedor pasa a ser MAPEO, no autoría.» (elevación de
-- 2026-08-12-s96-a-elevacion-catalogo-canonico.md, Opción A, aprobada con
-- el voto de la pista A.)
--
-- Lo que esta migración mata, medido en la elevación:
--  ① cualquier cuenta con rol vendedor podía REESCRIBIR el producto canónico
--    (composición y alérgenos incluidos) proponiendo (familia, marca, nombre)
--    coincidentes — con el segundo vendedor, uno le editaba la ficha clínica
--    de la vitrina al otro.
--  ② D-780: el upsert pisaba `stock_disponible` SIN pasar por el ledger —
--    re-correr el cargador sobre catálogo con ventas reseteaba el saldo al
--    valor de la planilla. **D-780 MUERE ACÁ**: el stock inicial entra por
--    `inventario_movimientos` (tipo `ingreso`, referencia `carga_inicial`) y
--    el trigger materializa; el re-propose NO toca stock (la diferencia va
--    por `ajustar_stock_vendedor`, por la puerta y con motivo).
--
-- Forma: nace `proponer_producto_canonico` (SOLO e-PetPlace) con el cuerpo
-- ①+② de la puerta vieja; `proponer_sku_vendedor` se ANGOSTA a MAPEO —
-- misma firma (cero cambio para el cargador, ÚNICO caller vivo medido),
-- pero resuelve el canónico por coincidencia y REBOTA si no existe
-- (`producto_no_canonico`), jamás lo escribe.
--
-- 76(g): NO RIGE — funciones; cero datos tocados (el catálogo vivo ya es
-- autoría epetplace, sin backfill). Reversa: scripts/s96/2026-08-12-s96-
-- m21-REVERSA.sql (ANTES; cuerpo viejo en functiondef-pre-m21.sql).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① LA PUERTA DEL CANÓNICO — solo e-PetPlace cura el catálogo ────────────
CREATE FUNCTION public.proponer_producto_canonico(
  p_producto jsonb,
  p_variante jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_familia      text := nullif(trim(coalesce(p_producto ->> 'familia_codigo', '')), '');
  v_nombre       text := nullif(trim(coalesce(p_producto ->> 'nombre', '')), '');
  v_marca        text := nullif(trim(coalesce(p_producto ->> 'marca', '')), '');
  v_var_codigo   text := nullif(trim(coalesce(p_variante ->> 'codigo', '')), '');
  v_presentacion text := nullif(trim(coalesce(p_variante ->> 'presentacion', '')), '');
  v_impuesto     text := nullif(trim(coalesce(p_variante ->> 'impuesto_codigo', '')), '');
  v_producto_id  uuid;
  v_variante_id  uuid;
  v_prod_nuevo   boolean;
  v_var_nuevo    boolean;
BEGIN
  -- La curaduría es de e-PetPlace, de nadie más. Sin sesión = el motor por
  -- dentro (el cargador corre con claims de admin igual).
  IF v_uid IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_cura_el_catalogo: el canónico es de e-PetPlace — el vendedor mapea su SKU, no escribe la ficha'
      USING ERRCODE = '42501';
  END IF;

  IF v_familia      IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.familia_codigo' USING ERRCODE = '22023'; END IF;
  IF v_nombre       IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.nombre'         USING ERRCODE = '22023'; END IF;
  IF v_var_codigo   IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.codigo'         USING ERRCODE = '22023'; END IF;
  IF v_presentacion IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.presentacion'   USING ERRCODE = '22023'; END IF;
  IF v_impuesto IS NULL THEN
    RAISE EXCEPTION 'impuesto_codigo_requerido: la variante % no declara código de tasa', v_var_codigo USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_tasas_impuesto t WHERE t.codigo = v_impuesto AND t.activo) THEN
    RAISE EXCEPTION 'impuesto_codigo_desconocido: "%" no existe o no está activo en cat_tasas_impuesto', v_impuesto USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_familias_producto f WHERE f.codigo = v_familia AND f.activo AND NOT f.deprecado) THEN
    RAISE EXCEPTION 'familia_desconocida: "%" no existe, está inactiva o está deprecada', v_familia USING ERRCODE = '22023';
  END IF;

  INSERT INTO productos (
    nombre, marca, descripcion, familia_codigo,
    especies_aplicables, tallas_aplicables, momentos_aplicables,
    ingredientes_activos, alergenos, es_dieta_prescripcion,
    origen_carga, creado_por, estado
  ) VALUES (
    v_nombre, v_marca, nullif(trim(coalesce(p_producto ->> 'descripcion', '')), ''), v_familia,
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'especies_aplicables',  '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'tallas_aplicables',    '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'momentos_aplicables',  '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'ingredientes_activos', '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'alergenos',            '[]'::jsonb)) x), '{}'),
    coalesce((p_producto ->> 'es_dieta_prescripcion')::boolean, false),
    'epetplace', v_uid, 'activo'
  )
  ON CONFLICT (familia_codigo, lower(coalesce(marca, '')), lower(nombre)) DO UPDATE
    SET descripcion           = coalesce(EXCLUDED.descripcion, productos.descripcion),
        especies_aplicables   = CASE WHEN EXCLUDED.especies_aplicables   = '{}' THEN productos.especies_aplicables   ELSE EXCLUDED.especies_aplicables   END,
        tallas_aplicables     = CASE WHEN EXCLUDED.tallas_aplicables     = '{}' THEN productos.tallas_aplicables     ELSE EXCLUDED.tallas_aplicables     END,
        momentos_aplicables   = CASE WHEN EXCLUDED.momentos_aplicables   = '{}' THEN productos.momentos_aplicables   ELSE EXCLUDED.momentos_aplicables   END,
        ingredientes_activos  = CASE WHEN EXCLUDED.ingredientes_activos  = '{}' THEN productos.ingredientes_activos  ELSE EXCLUDED.ingredientes_activos  END,
        alergenos             = EXCLUDED.alergenos,   -- el alérgeno SÍ se pisa: quitar uno es corrección clínica — y ahora solo e-PetPlace llega acá
        es_dieta_prescripcion = EXCLUDED.es_dieta_prescripcion,
        updated_at            = now()
  RETURNING id, (xmax = 0) INTO v_producto_id, v_prod_nuevo;

  INSERT INTO producto_variantes (
    producto_id, codigo, presentacion, contenido_valor, contenido_unidad,
    peso_kg, gtin, impuesto_codigo, largo_cm, ancho_cm, alto_cm, activo
  ) VALUES (
    v_producto_id, v_var_codigo, v_presentacion,
    (p_variante ->> 'contenido_valor')::numeric,
    nullif(trim(coalesce(p_variante ->> 'contenido_unidad', '')), ''),
    (p_variante ->> 'peso_kg')::numeric,
    nullif(trim(coalesce(p_variante ->> 'gtin', '')), ''),
    v_impuesto,
    (p_variante ->> 'largo_cm')::numeric,
    (p_variante ->> 'ancho_cm')::numeric,
    (p_variante ->> 'alto_cm')::numeric,
    true
  )
  ON CONFLICT (producto_id, codigo) DO UPDATE
    SET presentacion     = EXCLUDED.presentacion,
        contenido_valor  = coalesce(EXCLUDED.contenido_valor,  producto_variantes.contenido_valor),
        contenido_unidad = coalesce(EXCLUDED.contenido_unidad, producto_variantes.contenido_unidad),
        peso_kg          = coalesce(EXCLUDED.peso_kg,          producto_variantes.peso_kg),
        gtin             = coalesce(EXCLUDED.gtin,             producto_variantes.gtin),
        impuesto_codigo  = EXCLUDED.impuesto_codigo,
        largo_cm         = coalesce(EXCLUDED.largo_cm,         producto_variantes.largo_cm),
        ancho_cm         = coalesce(EXCLUDED.ancho_cm,         producto_variantes.ancho_cm),
        alto_cm          = coalesce(EXCLUDED.alto_cm,          producto_variantes.alto_cm),
        updated_at       = now()
  RETURNING id, (xmax = 0) INTO v_variante_id, v_var_nuevo;

  RETURN jsonb_build_object(
    'ok', true,
    'producto_id', v_producto_id,
    'variante_id', v_variante_id,
    'creado', jsonb_build_object('producto', v_prod_nuevo, 'variante', v_var_nuevo));
END;
$$;

REVOKE ALL ON FUNCTION public.proponer_producto_canonico(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proponer_producto_canonico(jsonb, jsonb) TO authenticated;

-- ── ② LA PUERTA DEL VENDEDOR SE ANGOSTA A MAPEO — misma firma (L-119) ──────
DROP FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text);

CREATE FUNCTION public.proponer_sku_vendedor(
  p_cuenta_comercial_id uuid,
  p_producto     jsonb,
  p_variante     jsonb,
  p_sku          jsonb,
  p_origen_carga text DEFAULT 'epetplace'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_familia      text := nullif(trim(coalesce(p_producto ->> 'familia_codigo', '')), '');
  v_nombre       text := nullif(trim(coalesce(p_producto ->> 'nombre', '')), '');
  v_marca        text := nullif(trim(coalesce(p_producto ->> 'marca', '')), '');
  v_var_codigo   text := nullif(trim(coalesce(p_variante ->> 'codigo', '')), '');
  v_sku_vendedor text := nullif(trim(coalesce(p_sku ->> 'sku_vendedor', '')), '');
  v_stock        integer := coalesce((p_sku ->> 'stock_disponible')::integer, 0);
  v_producto_id  uuid;
  v_variante_id  uuid;
  v_sku_id       uuid;
  v_sku_nuevo    boolean;
  v_sku_estado   text;
BEGIN
  -- Quién llama: alguien de la cuenta (o admin) — igual que antes.
  IF v_uid IS NOT NULL AND NOT is_admin() AND NOT es_vendedor_de(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF NOT _cuenta_es_vendedora(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_vendedor: la cuenta % no tiene rol seller_productos activo', p_cuenta_comercial_id USING ERRCODE = '22023';
  END IF;
  IF v_familia    IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.familia_codigo' USING ERRCODE = '22023'; END IF;
  IF v_nombre     IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.nombre'         USING ERRCODE = '22023'; END IF;
  IF v_var_codigo IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.codigo'         USING ERRCODE = '22023'; END IF;
  IF v_sku_vendedor IS NULL THEN RAISE EXCEPTION 'campo_requerido: sku.sku_vendedor'      USING ERRCODE = '22023'; END IF;
  IF p_origen_carga NOT IN ('vendedor', 'epetplace', 'asistido_por_ia') THEN
    RAISE EXCEPTION 'origen_carga_invalido: "%"', p_origen_carga USING ERRCODE = '22023';
  END IF;

  -- 🔴 LA FIRMA: el canónico se RESUELVE, jamás se escribe desde acá.
  SELECT id INTO v_producto_id FROM productos
   WHERE familia_codigo = v_familia
     AND lower(coalesce(marca, '')) = lower(coalesce(v_marca, ''))
     AND lower(nombre) = lower(v_nombre);
  IF v_producto_id IS NULL THEN
    RAISE EXCEPTION 'producto_no_canonico: "%" no está en el catálogo de e-PetPlace — el catálogo es de e-PetPlace y sumar un vendedor es MAPEO, no autoría (proponer_producto_canonico lo crea el equipo)', v_nombre
      USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_variante_id FROM producto_variantes
   WHERE producto_id = v_producto_id AND codigo = v_var_codigo;
  IF v_variante_id IS NULL THEN
    RAISE EXCEPTION 'variante_no_canonica: la variante "%" de "%" no está en el catálogo — misma regla que el producto', v_var_codigo, v_nombre
      USING ERRCODE = '22023';
  END IF;

  -- ── EL SKU DEL VENDEDOR — lo único que ES suyo. El stock inicial entra
  --    POR EL LEDGER (D-780 muere acá); el re-propose JAMÁS toca stock:
  --    la diferencia va por ajustar_stock_vendedor, con motivo.
  BEGIN
    INSERT INTO vendedor_skus (
      cuenta_comercial_id, variante_id, sku_vendedor, precio_propuesto,
      country_code, estado, origen_carga, propuesto_por
    ) VALUES (
      p_cuenta_comercial_id, v_variante_id, v_sku_vendedor,
      (p_sku ->> 'precio_propuesto')::numeric,
      coalesce(nullif(trim(coalesce(p_sku ->> 'country_code', '')), ''), 'EC'),
      'propuesto', p_origen_carga, v_uid
    )
    ON CONFLICT (cuenta_comercial_id, variante_id) DO UPDATE
      SET sku_vendedor     = EXCLUDED.sku_vendedor,
          precio_propuesto = coalesce(EXCLUDED.precio_propuesto, vendedor_skus.precio_propuesto),
          origen_carga     = EXCLUDED.origen_carga,
          -- `estado` NO se toca (reproponer no despublica) y `stock` TAMPOCO.
          updated_at       = now()
    RETURNING id, (xmax = 0), estado INTO v_sku_id, v_sku_nuevo, v_sku_estado;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'sku_vendedor_duplicado: "%" ya está usado por otra variante de esta cuenta', v_sku_vendedor
      USING ERRCODE = '22023';
  END;

  IF v_sku_nuevo AND v_stock > 0 THEN
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
    VALUES (v_sku_id, 'ingreso', v_stock, 'carga inicial del vendedor (proponer_sku_vendedor)', 'carga_inicial', v_sku_id);
  END IF;

  RETURN jsonb_build_object(
    'ok',          true,
    'producto_id', v_producto_id,
    'variante_id', v_variante_id,
    'sku_id',      v_sku_id,
    'estado',      v_sku_estado,
    'creado',      jsonb_build_object('producto', false, 'variante', false, 'sku', v_sku_nuevo));
END;
$$;

REVOKE ALL ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) TO authenticated;

COMMENT ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) IS
  'S96 (firma founder 12-ago): MAPEO, no autoría — resuelve el canónico por '
  'coincidencia y rebota si no existe. El stock inicial entra por el ledger '
  '(D-780 muerta); el re-propose no toca stock ni el producto canónico.';

-- ── ③ EL CINTURÓN ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_familia   text;
  v_admin     uuid;
  v_vend      uuid;
  v_cuenta    uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_r         jsonb;
  v_prod      uuid;
  v_var       uuid;
  v_sku       uuid;
  v_al        text[];
  v_disp      int;
  v_ok        boolean;
  v_n         int;
  v_json_prod jsonb;
  v_json_var  jsonb;
BEGIN
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT owner_profile_id INTO v_vend FROM cuentas_comerciales WHERE id = v_cuenta;
  IF v_vend IS NULL THEN RAISE EXCEPTION 'cinturón sin vendedor: la cuenta % no tiene dueño', v_cuenta; END IF;

  v_json_prod := jsonb_build_object('familia_codigo', v_familia, 'nombre', '__cint_m21_prod',
    'marca', '__cint', 'ingredientes_activos', jsonb_build_array('pollo'),
    'alergenos', jsonb_build_array('pollo'));
  v_json_var := jsonb_build_object('codigo', 'CINT-M21-V1', 'presentacion', 'Bolsa 1kg',
    'impuesto_codigo', (SELECT codigo FROM cat_tasas_impuesto WHERE activo LIMIT 1));

  -- (a) un NO-admin no crea canónico — el rebote es la prueba.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role', 'authenticated')::text, true);
  v_ok := false;
  BEGIN
    PERFORM proponer_producto_canonico(v_json_prod, v_json_var);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'solo_epetplace_cura_el_catalogo%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (a): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (a): un vendedor CREÓ canónico'; END IF;

  -- (b) e-PetPlace lo crea.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_r := proponer_producto_canonico(v_json_prod, v_json_var);
  v_prod := (v_r ->> 'producto_id')::uuid;
  v_var  := (v_r ->> 'variante_id')::uuid;
  IF v_prod IS NULL OR v_var IS NULL THEN RAISE EXCEPTION 'cinturón (b): el canónico no nació'; END IF;

  -- (c) el vendedor MAPEA su sku con stock inicial 3 → entra POR EL LEDGER.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role', 'authenticated')::text, true);
  v_r := proponer_sku_vendedor(v_cuenta, v_json_prod, v_json_var,
    jsonb_build_object('sku_vendedor', 'CINT-M21-SKU', 'precio_propuesto', 9.99, 'stock_disponible', 3),
    'vendedor');
  v_sku := (v_r ->> 'sku_id')::uuid;
  SELECT stock_disponible INTO v_disp FROM vendedor_skus WHERE id = v_sku;
  IF v_disp <> 3 THEN RAISE EXCEPTION 'cinturón (c): saldo % (esperado 3 materializado por el trigger)', v_disp; END IF;
  SELECT count(*) INTO v_n FROM inventario_movimientos
   WHERE sku_id = v_sku AND tipo = 'ingreso' AND referencia_tipo = 'carga_inicial';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturón (c2): el stock no entró por el ledger (% movimientos)', v_n; END IF;

  -- (d) 🔴 EL TEST DE LA FIRMA: el vendedor re-propone con OTRA composición
  --     y OTRO stock → el canónico queda INTACTO y el saldo también (D-780).
  v_r := proponer_sku_vendedor(v_cuenta,
    jsonb_build_object('familia_codigo', v_familia, 'nombre', '__cint_m21_prod', 'marca', '__cint',
                       'alergenos', jsonb_build_array('res'), 'ingredientes_activos', jsonb_build_array('res')),
    v_json_var,
    jsonb_build_object('sku_vendedor', 'CINT-M21-SKU', 'precio_propuesto', 11.50, 'stock_disponible', 99),
    'vendedor');
  SELECT alergenos INTO v_al FROM productos WHERE id = v_prod;
  IF v_al <> ARRAY['pollo'] THEN
    RAISE EXCEPTION 'cinturón (d): el vendedor REESCRIBIÓ el canónico (%) — la firma no rige', v_al;
  END IF;
  SELECT stock_disponible INTO v_disp FROM vendedor_skus WHERE id = v_sku;
  IF v_disp <> 3 THEN
    RAISE EXCEPTION 'cinturón (d2): el re-propose pisó el saldo (% — D-780 sigue viva)', v_disp;
  END IF;

  -- (e) un producto que NO está en el catálogo rebota HABLANDO.
  v_ok := false;
  BEGIN
    PERFORM proponer_sku_vendedor(v_cuenta,
      jsonb_build_object('familia_codigo', v_familia, 'nombre', '__cint_m21_inexistente', 'marca', '__cint'),
      v_json_var,
      jsonb_build_object('sku_vendedor', 'CINT-M21-SKU2'), 'vendedor');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'producto_no_canonico%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (e): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (e): un producto inexistente entró por la puerta del vendedor'; END IF;

  -- (f) residuo 0 (par neto del ledger retirado con saldo verificado — es
  --     limpieza de fixture; el movimiento era del sku que muere acá).
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM inventario_movimientos WHERE sku_id = v_sku;
  DELETE FROM vendedor_skus WHERE id = v_sku;
  DELETE FROM producto_variantes WHERE id = v_var;
  DELETE FROM productos WHERE id = v_prod;
  SELECT count(*) INTO v_n FROM productos WHERE nombre = '__cint_m21_prod';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (f): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M21 VERDE: el canónico es de e-PetPlace, el vendedor mapea, el stock entra por el ledger, D-780 muerta';
END $$;

COMMIT;
