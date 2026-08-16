-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA DE INVENTARIO Y DE COMPETENCIA — S99 (firma del founder, 16-ago)
--
-- VERBATIM: «hoy tenemos productos sin stock y la idea era ponerle stock para
-- poder simular cómo se vería si estuviéramos full de productos, para hacer el
-- diseño, los filtros y revisar. También quiero probar qué pasa si tengo dos
-- proveedores, qué pasa si estoy consumiendo el stock, si consumo los veinte
-- pedidos.»
--
-- 🔴 EL REPARTO ES EL PUNTO, no el volumen: si TODO queda con stock, el filtro
-- tampoco se puede probar. Tres baldes, asignados por HASH del id (determinista
-- y reproducible — nada de `random()`, que haría irrepetible la siembra):
--   · ~70 %  HOLGADO (20–60)  → la vitrina llena, para juzgar diseño y filtros
--   · ~15 %  ESCASO  (2–3)    → para CONSUMIRLO y ver el agotamiento en vivo
--   · ~15 %  CERO             → para que el filtro tenga contra qué discriminar
--
-- 🔴 Y LA COMPETENCIA, QUE HOY NO EXISTE EN NINGUNA VARIANTE (medido: cero
-- variantes con 2+ vendedores). El índice de S99 la habilitó y nadie la
-- ejerce ⇒ la cadena de selección firmada **no se puede ver funcionando**.
-- Esta siembra le da un segundo vendedor a 24 variantes, con TRES formas:
--   · 18 los dos con stock y PRECIO DISTINTO → se ve elegir
--   ·  3 el segundo con stock y el primero en CERO → se ve el relevo
--   ·  3 el segundo en CERO y el primero con stock → el espejo
--
-- TODO ENTRA POR EL LEDGER CON MOTIVO, jamás por UPDATE, y por las PUERTAS
-- REALES (`ajustar_stock_vendedor` · `proponer_sku_vendedor` ·
-- `publicar_oferta_sku`). D-838 SE EXTIENDE: misma marca contable
-- `SIEMBRA-S99`, mismo cierre por conteo-cero, misma muerte antes del primer
-- vendedor real.
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ ACTO 2 DE 2 — corre DESPUÉS de `...-a-inventario.sql`: el CLI manda el
-- archivo como UNA transacción, así que si B aborta se lleva a A puesta (pasó,
-- y por eso son dos actos).

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE B · LA COMPETENCIA — un segundo vendedor sobre 24 variantes
--
-- El catálogo es de e-PetPlace y sumar un vendedor es MAPEO, no autoría (M21):
-- `proponer_sku_vendedor` rebota si el producto o la variante no son canónicos,
-- así que esta siembra NO puede inventar catálogo aunque quisiera.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta_a uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';  -- el que ya vende
  v_cta_b uuid := '61a28501-9d09-4bef-b23c-7c102e0fb3e7';  -- Tienda Pura (borrable)
  v_uid_b uuid := 'eaad8d8d-18dc-4295-a65a-323e467b8f84';
  v_admin text := '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}';
  v_vend  text;
  v_lista jsonb; v_f record; v_r jsonb; v_sku_b uuid; v_i int := 0;
  v_stock_b int; v_precio_b numeric;
  v_con_stock int; v_solo_b int; v_solo_a int;
BEGIN
  -- 🔴 LOS CANDIDATOS SE JUNTAN ANTES DE CAMBIAR DE SESIÓN, y no es un rodeo:
  -- la RLS de `vendedor_skus` es `es_vendedor_de OR is_admin`, así que el dueño
  -- de Tienda Pura NO PUEDE VER los SKU del otro vendedor — y está bien, el
  -- inventario es del negocio. El primer intento de esta siembra recorrió CERO
  -- filas por eso: **el gate hizo su trabajo y la siembra se adaptó a él.**
  SELECT jsonb_agg(f ORDER BY f ->> 'variante_id') INTO v_lista FROM (
    SELECT jsonb_build_object(
             'variante_id', pv.id, 'var_codigo', pv.codigo, 'nombre', p.nombre,
             'familia_codigo', p.familia_codigo, 'marca', p.marca, 'precio', o.precio,
             'stock_a', vs.stock_disponible) AS f
    FROM vendedor_skus vs
    JOIN ofertas o ON o.sku_id = vs.id AND o.estado = 'publicada'
    JOIN producto_variantes pv ON pv.id = vs.variante_id
    JOIN productos p ON p.id = pv.producto_id
    WHERE vs.cuenta_comercial_id = v_cta_a
      AND vs.stock_disponible > 5
      AND NOT EXISTS (SELECT 1 FROM vendedor_skus x
                       WHERE x.cuenta_comercial_id = v_cta_b AND x.variante_id = pv.id)
    ORDER BY pv.id LIMIT 24) z;

  v_vend := format('{"sub":"%s","role":"authenticated"}', v_uid_b);
  PERFORM set_config('request.jwt.claims', v_vend, true);
  SET LOCAL ROLE authenticated;

  FOR v_f IN SELECT
        (e ->> 'variante_id')::uuid AS variante_id,
        e ->> 'var_codigo'          AS var_codigo,
        e ->> 'nombre'              AS nombre,
        e ->> 'familia_codigo'      AS familia_codigo,
        e ->> 'marca'               AS marca,
        (e ->> 'precio')::numeric   AS precio,
        (e ->> 'stock_a')::int      AS stock_disponible
      FROM jsonb_array_elements(COALESCE(v_lista, '[]'::jsonb)) e
  LOOP
    v_i := v_i + 1;
    -- LAS TRES FORMAS, repartidas a propósito.
    IF v_i <= 18 THEN
      v_stock_b := 15;                       -- los dos con stock, precio distinto
      v_precio_b := round(v_f.precio * CASE WHEN v_i % 2 = 0 THEN 0.92 ELSE 1.07 END, 2);
    ELSIF v_i <= 21 THEN
      v_stock_b := 12;                       -- el segundo tiene, el primero se agota
      v_precio_b := round(v_f.precio * 1.03, 2);
    ELSE
      v_stock_b := 0;                        -- el segundo en CERO, el primero tiene
      v_precio_b := round(v_f.precio * 0.95, 2);
    END IF;

    v_r := public.proponer_sku_vendedor(
      v_cta_b,
      -- La llave del MAPEO es familia+MARCA+nombre (leída del cuerpo tras el
      -- rebote `producto_no_canonico`: la firma no la decía — regla 40 otra vez).
      jsonb_build_object('familia_codigo', v_f.familia_codigo, 'marca', v_f.marca,
                         'nombre', v_f.nombre),
      jsonb_build_object('codigo', v_f.var_codigo),
      jsonb_build_object('sku_vendedor', 'SIEMBRA-S99-COMP-' || lpad(v_i::text, 3, '0'),
                         'stock_disponible', v_stock_b,
                         'precio_propuesto', v_precio_b),
      'epetplace');
    IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'SIEMBRA B: la propuesta % rebotó — %', v_i, v_r;
    END IF;
    v_sku_b := (v_r ->> 'sku_id')::uuid;

    -- 🔴 EL VENDEDOR PROPONE, e-PetPlace PUBLICA (firma S95): la puerta rebotó
    -- `no_sos_admin` y la siembra se adapta — publica con la identidad de
    -- e-PetPlace, jamás con la del vendedor. **Tercera vez en esta sesión que
    -- un gate corrige a una siembra, y las tres veces el gate tenía razón.**
    PERFORM set_config('request.jwt.claims', v_admin, true);
    v_r := public.publicar_oferta_sku(v_sku_b, v_precio_b, 'EC');
    PERFORM set_config('request.jwt.claims', v_vend, true);
    IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'SIEMBRA B: la publicación % rebotó — %', v_i, v_r;
    END IF;

    -- Las tres del último tramo: el PRIMER vendedor se agota, para ver el relevo.
    IF v_i > 18 AND v_i <= 21 THEN
      PERFORM set_config('request.jwt.claims',
        '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
      PERFORM public.ajustar_stock_vendedor(
        (SELECT vs.id FROM vendedor_skus vs
          WHERE vs.cuenta_comercial_id = v_cta_a AND vs.variante_id = v_f.variante_id),
        -v_f.stock_disponible,
        'SIEMBRA-S99: se agota A PROPÓSITO para ver el relevo de la cadena de selección (D-838).');
      PERFORM set_config('request.jwt.claims', v_vend, true);
    END IF;
  END LOOP;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  IF v_i < 24 THEN
    RAISE EXCEPTION 'SIEMBRA B: solo se pudieron sembrar % variantes de 24', v_i;
  END IF;

  -- VERIFICACIÓN POR EL CAMINO QUE LA VITRINA LEE: las tres formas existen.
  SELECT
    count(*) FILTER (WHERE a.hay_stock AND b.hay_stock),
    count(*) FILTER (WHERE NOT a.hay_stock AND b.hay_stock),
    count(*) FILTER (WHERE a.hay_stock AND NOT b.hay_stock)
  INTO v_con_stock, v_solo_b, v_solo_a
  FROM ofertas a JOIN ofertas b ON b.variante_id = a.variante_id
  WHERE a.cuenta_comercial_id = v_cta_a AND b.cuenta_comercial_id = v_cta_b
    AND a.estado='publicada' AND b.estado='publicada';

  IF v_con_stock = 0 OR v_solo_b = 0 OR v_solo_a = 0 THEN
    RAISE EXCEPTION 'SIEMBRA B: falta alguna de las tres formas (ambos=% soloB=% soloA=%)',
      v_con_stock, v_solo_b, v_solo_a;
  END IF;
  RAISE NOTICE 'SIEMBRA B: % variantes con dos vendedores — ambos con stock=% · relevo=% · espejo=%',
    v_i, v_con_stock, v_solo_b, v_solo_a;
END $$;
