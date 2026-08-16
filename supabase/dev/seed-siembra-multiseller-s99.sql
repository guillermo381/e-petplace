-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA MULTI-VENDEDOR — S99 (dictado del founder 18-ago ④)
-- «agregáselo a TODOS los sellers… para ver cómo se comportaría el sistema
--  con más sellers vendiendo los MISMOS productos, pero con STOCK DIFERENTE»
--
-- 🔴 FRENO DECLARADO Y NO SALTADO (freno ④ del LOOP — contradecir letra
-- firmada): `uq_oferta_publicada_por_variante` = UNIQUE(variante_id) WHERE
-- estado='publicada' ⇒ **DOS OFERTAS PUBLICADAS DE LA MISMA VARIANTE SON
-- INEXPRESABLES**. No es un descuido: implementa la FIRMA MADRE de S94
-- (`MODELO_DESPENSA` firmas ③: «UNA sola oferta visible por producto»).
-- El índice NO se toca sin firma. Ver el choque servido a la mesa en el
-- Loop de A (con la lectura fina: la firma habla de VISIBLE, el índice
-- cerró EXISTENTE — son dos rigores distintos y el de la base nadie lo
-- decidió).
--
-- LO QUE ESTA SIEMBRA SÍ HACE, y es lo más cerca del pedido sin romper la
-- firma — y encima deja el choque VISIBLE en vez de esconderlo:
--  ① MULTI-SELLER REAL EN LA VITRINA: las variantes aún libres se reparten
--     entre las OTRAS cuentas vendedoras y SE PUBLICAN — la vitrina pasa a
--     tener productos de varios vendedores (que es lo que nunca ejerció).
--  ② LOS MISMOS PRODUCTOS EN VARIOS VENDEDORES, con STOCK DISTINTO: cada
--     cuenta recibe SKUs sobre productos que otro ya tiene publicados —
--     `aceptado` CON precio y stock propios, sin oferta publicada (el
--     índice lo impide). **Eso hace visible la pregunta que el founder
--     tiene que contestar: «tengo el producto, tengo stock, y no está en
--     la vitrina porque otro lo publicó primero».**
--  ③ STOCK DISTINTO A PROPÓSITO por vendedor (5/9/14/23 + variación),
--     ENTRANDO POR EL LEDGER (`ajustar_stock_vendedor`, motivo obligatorio)
--     — jamás UPDATE directo a la columna materializada.
--
-- D-838 SE EXTIENDE a esta siembra: misma marca contable (`SIEMBRA-S99-%`),
-- mismo cierre por conteo-cero, misma condición de muerte.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_admin   text := '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}';
  c         record;
  f         record;
  v_r       jsonb;
  v_sku     uuid;
  v_precio  numeric;
  v_stock   int;
  n_pub     int := 0;
  n_esp     int := 0;
  n_err     int := 0;
  v_i       int;
BEGIN
  -- ① y ② por cuenta vendedora (excluida la Despensa, que ya está sembrada)
  FOR c IN
    SELECT cc.id, cc.nombre_comercial, u.id AS owner_uid,
           row_number() OVER (ORDER BY cc.nombre_comercial) AS n
    FROM public.cuentas_comerciales cc
    JOIN public.cuenta_roles r ON r.cuenta_comercial_id = cc.id
      AND r.tipo_actor::text = 'seller_productos' AND r.estado::text = 'activo'
    JOIN auth.users u ON u.id = cc.owner_profile_id
    WHERE cc.id <> 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8'
  LOOP
    v_stock := 5 + c.n * 6;   -- 11 · 17 · 23 · 29 — stock DISTINTO por vendedor

    -- ① Su franja de variantes LIBRES → propone y se publica (multi-seller
    --    real en la vitrina; el reparto es determinista por hash del id).
    v_i := 0;
    FOR f IN
      SELECT pv.id AS variante_id, pv.codigo, pv.peso_kg,
             p.familia_codigo, p.nombre, p.marca
      FROM public.producto_variantes pv
      JOIN public.productos p ON p.id = pv.producto_id
      WHERE p.estado = 'activo' AND pv.activo
        AND NOT EXISTS (SELECT 1 FROM public.ofertas o
                        WHERE o.variante_id = pv.id AND o.estado = 'publicada')
        AND (abs(hashtext(pv.id::text)) % 4) = (c.n % 4)
      LIMIT 25
    LOOP
      v_precio := round(COALESCE(f.peso_kg, 1) * 4.60 + (c.n * 1.75) + 3.10, 2);
      BEGIN
        PERFORM set_config('request.jwt.claims',
          format('{"sub":"%s","role":"authenticated"}', c.owner_uid), true);
        SET LOCAL ROLE authenticated;
        v_r := public.proponer_sku_vendedor(
          c.id,
          jsonb_build_object('familia_codigo', f.familia_codigo, 'nombre', f.nombre, 'marca', f.marca),
          jsonb_build_object('codigo', f.codigo),
          jsonb_build_object('sku_vendedor', 'SIEMBRA-S99-' || left(c.nombre_comercial, 4) || '-' || f.codigo,
                             'precio_propuesto', v_precio, 'stock_disponible', 0),
          'vendedor');
        v_sku := (v_r ->> 'sku_id')::uuid;
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

        PERFORM set_config('request.jwt.claims', v_admin, true);
        SET LOCAL ROLE authenticated;
        PERFORM public.publicar_oferta_sku(v_sku, v_precio, 'EC');
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

        -- STOCK POR EL LEDGER (jamás UPDATE a la materializada):
        PERFORM set_config('request.jwt.claims',
          format('{"sub":"%s","role":"authenticated"}', c.owner_uid), true);
        SET LOCAL ROLE authenticated;
        PERFORM public.ajustar_stock_vendedor(v_sku, v_stock + (v_i % 5),
          'SIEMBRA S99: stock ficticio para probar la vitrina (D-838)');
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
        n_pub := n_pub + 1;
      EXCEPTION WHEN OTHERS THEN
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
        n_err := n_err + 1;
      END;
      v_i := v_i + 1;
    END LOOP;

    -- ② EL ESPEJO DEL CHOQUE: los MISMOS productos que otro ya publicó —
    --    SKU propio con precio y stock, SIN oferta (el índice lo impide).
    --    Es el caso que el founder tiene que ver para decidir.
    v_i := 0;
    FOR f IN
      SELECT pv.id AS variante_id, pv.codigo, pv.peso_kg,
             p.familia_codigo, p.nombre, p.marca
      FROM public.producto_variantes pv
      JOIN public.productos p ON p.id = pv.producto_id
      JOIN public.ofertas o ON o.variante_id = pv.id AND o.estado = 'publicada'
      WHERE o.cuenta_comercial_id <> c.id
        AND NOT EXISTS (SELECT 1 FROM public.vendedor_skus vs
                        WHERE vs.cuenta_comercial_id = c.id AND vs.variante_id = pv.id)
      ORDER BY pv.codigo
      LIMIT 20
    LOOP
      v_precio := round(COALESCE(f.peso_kg, 1) * 4.10 + (c.n * 2.25) + 2.80, 2);
      BEGIN
        PERFORM set_config('request.jwt.claims',
          format('{"sub":"%s","role":"authenticated"}', c.owner_uid), true);
        SET LOCAL ROLE authenticated;
        v_r := public.proponer_sku_vendedor(
          c.id,
          jsonb_build_object('familia_codigo', f.familia_codigo, 'nombre', f.nombre, 'marca', f.marca),
          jsonb_build_object('codigo', f.codigo),
          jsonb_build_object('sku_vendedor', 'SIEMBRA-S99-' || left(c.nombre_comercial, 4) || '-ESP-' || f.codigo,
                             'precio_propuesto', v_precio, 'stock_disponible', 0),
          'vendedor');
        v_sku := (v_r ->> 'sku_id')::uuid;
        PERFORM public.ajustar_stock_vendedor(v_sku, v_stock + 3 + (v_i % 7),
          'SIEMBRA S99: stock del vendedor cuyo producto NO está en vitrina (otro lo publicó) — D-838');
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
        n_esp := n_esp + 1;
      EXCEPTION WHEN OTHERS THEN
        EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
        n_err := n_err + 1;
      END;
      v_i := v_i + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'SIEMBRA MULTI-SELLER: % publicadas por otros vendedores · % SKUs del choque (mismo producto, sin vitrina) · % errores',
    n_pub, n_esp, n_err;
END $$;
