-- Cuerpo VIVO de proponer_sku_vendedor capturado ANTES de la M21 (12-ago-2026), para su reversa.

CREATE OR REPLACE FUNCTION public.proponer_sku_vendedor(p_cuenta_comercial_id uuid, p_producto jsonb, p_variante jsonb, p_sku jsonb, p_origen_carga text DEFAULT 'epetplace'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid          uuid := auth.uid();
  v_familia      text := nullif(trim(p_producto ->> 'familia_codigo'), '');
  v_nombre       text := nullif(trim(p_producto ->> 'nombre'), '');
  v_marca        text := nullif(trim(p_producto ->> 'marca'), '');
  v_var_codigo   text := nullif(trim(p_variante ->> 'codigo'), '');
  v_presentacion text := nullif(trim(p_variante ->> 'presentacion'), '');
  v_impuesto     text := nullif(trim(p_variante ->> 'impuesto_codigo'), '');
  v_sku_vendedor text := nullif(trim(p_sku ->> 'sku_vendedor'), '');
  v_producto_id  uuid;
  v_variante_id  uuid;
  v_sku_id       uuid;
  v_prod_nuevo   boolean;
  v_var_nuevo    boolean;
  v_sku_nuevo    boolean;
  v_sku_estado   text;
BEGIN
  -- ── Gate de sesión ──────────────────────────────────────────────────────
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  -- ── Gate de autorización: quién llama ───────────────────────────────────
  IF NOT (es_vendedor_de(p_cuenta_comercial_id) OR is_admin()) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  -- ── Gate de la CUENTA: tiene que ser vendedora, la llame quien la llame ──
  IF NOT _cuenta_es_vendedora(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION
      'cuenta_sin_rol_vendedor: la cuenta % no tiene rol seller_productos activo',
      p_cuenta_comercial_id USING ERRCODE = '22023';
  END IF;

  -- ── Campos que no se inventan ───────────────────────────────────────────
  IF v_familia      IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.familia_codigo'  USING ERRCODE = '22023'; END IF;
  IF v_nombre       IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.nombre'          USING ERRCODE = '22023'; END IF;
  IF v_var_codigo   IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.codigo'          USING ERRCODE = '22023'; END IF;
  IF v_presentacion IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.presentacion'    USING ERRCODE = '22023'; END IF;
  IF v_sku_vendedor IS NULL THEN RAISE EXCEPTION 'campo_requerido: sku.sku_vendedor'         USING ERRCODE = '22023'; END IF;

  -- ── El código de tasa es OBLIGATORIO (§4.4-③, firmado) ──────────────────
  --    La FK ya lo haría imposible; acá se rechaza HABLANDO, porque un
  --    "violates foreign key constraint" no le dice nada a quien carga.
  IF v_impuesto IS NULL THEN
    RAISE EXCEPTION 'impuesto_codigo_requerido: la variante % no declara código de tasa', v_var_codigo
      USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_tasas_impuesto t WHERE t.codigo = v_impuesto AND t.activo) THEN
    RAISE EXCEPTION 'impuesto_codigo_desconocido: "%" no existe o no está activo en cat_tasas_impuesto', v_impuesto
      USING ERRCODE = '22023';
  END IF;

  -- ── La familia sale del catálogo, no de la imaginación ──────────────────
  IF NOT EXISTS (SELECT 1 FROM cat_familias_producto f
                  WHERE f.codigo = v_familia AND f.activo AND NOT f.deprecado) THEN
    RAISE EXCEPTION 'familia_desconocida: "%" no existe, está inactiva o está deprecada', v_familia
      USING ERRCODE = '22023';
  END IF;

  IF p_origen_carga NOT IN ('vendedor', 'epetplace', 'asistido_por_ia') THEN
    RAISE EXCEPTION 'origen_carga_invalido: "%"', p_origen_carga USING ERRCODE = '22023';
  END IF;

  -- ── ① EL PRODUCTO CANÓNICO ──────────────────────────────────────────────
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
    p_origen_carga, v_uid, 'activo'
  )
  ON CONFLICT (familia_codigo, lower(coalesce(marca, '')), lower(nombre)) DO UPDATE
    SET descripcion           = coalesce(EXCLUDED.descripcion, productos.descripcion),
        especies_aplicables   = CASE WHEN EXCLUDED.especies_aplicables   = '{}' THEN productos.especies_aplicables   ELSE EXCLUDED.especies_aplicables   END,
        tallas_aplicables     = CASE WHEN EXCLUDED.tallas_aplicables     = '{}' THEN productos.tallas_aplicables     ELSE EXCLUDED.tallas_aplicables     END,
        momentos_aplicables   = CASE WHEN EXCLUDED.momentos_aplicables   = '{}' THEN productos.momentos_aplicables   ELSE EXCLUDED.momentos_aplicables   END,
        ingredientes_activos  = CASE WHEN EXCLUDED.ingredientes_activos  = '{}' THEN productos.ingredientes_activos  ELSE EXCLUDED.ingredientes_activos  END,
        alergenos             = EXCLUDED.alergenos,   -- 🔴 el alérgeno SÍ se pisa: quitar uno es una corrección clínica
        es_dieta_prescripcion = EXCLUDED.es_dieta_prescripcion,
        updated_at            = now()
  RETURNING id, (xmax = 0) INTO v_producto_id, v_prod_nuevo;

  -- ── ② LA VARIANTE ───────────────────────────────────────────────────────
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

  -- ── ③ EL SKU DEL VENDEDOR ───────────────────────────────────────────────
  BEGIN
    INSERT INTO vendedor_skus (
      cuenta_comercial_id, variante_id, sku_vendedor, precio_propuesto,
      country_code, estado, origen_carga, propuesto_por, stock_disponible
    ) VALUES (
      p_cuenta_comercial_id, v_variante_id, v_sku_vendedor,
      (p_sku ->> 'precio_propuesto')::numeric,
      coalesce(nullif(trim(coalesce(p_sku ->> 'country_code', '')), ''), 'EC'),
      'propuesto', p_origen_carga, v_uid,
      coalesce((p_sku ->> 'stock_disponible')::integer, 0)
    )
    ON CONFLICT (cuenta_comercial_id, variante_id) DO UPDATE
      SET sku_vendedor     = EXCLUDED.sku_vendedor,
          precio_propuesto = coalesce(EXCLUDED.precio_propuesto, vendedor_skus.precio_propuesto),
          stock_disponible = EXCLUDED.stock_disponible,
          origen_carga     = EXCLUDED.origen_carga,
          -- 🔴 `estado` NO se toca: reproponer no despublica.
          updated_at       = now()
    RETURNING id, (xmax = 0), estado INTO v_sku_id, v_sku_nuevo, v_sku_estado;
  EXCEPTION WHEN unique_violation THEN
    -- La otra unicidad de la tabla: (cuenta, sku_vendedor). Si el mismo
    -- código de vendedor ya está en OTRA variante, el dato de entrada está
    -- mal y hay que decirlo con nombre, no con un error de Postgres.
    RAISE EXCEPTION
      'sku_vendedor_duplicado: "%" ya está usado por otra variante de esta cuenta', v_sku_vendedor
      USING ERRCODE = '22023';
  END;

  RETURN jsonb_build_object(
    'ok',           true,
    'producto_id',  v_producto_id,
    'variante_id',  v_variante_id,
    'sku_id',       v_sku_id,
    'estado',       v_sku_estado,
    'creado',       jsonb_build_object('producto', v_prod_nuevo,
                                       'variante', v_var_nuevo,
                                       'sku',      v_sku_nuevo)
  );
END $function$
;
