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

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE A · EL INVENTARIO CON SUS TRES BALDES
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta  uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';  -- Despensa de Pruebas (borrable)
  v_uid  uuid := 'da83d6d8-f090-414c-98e0-7fae644f52df';
  v_sku  record;
  v_b    int;
  v_cant int;
  v_h int := 0; v_e int := 0; v_z int := 0;
BEGIN
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', v_uid), true);
  SET LOCAL ROLE authenticated;

  FOR v_sku IN
    SELECT vs.id, ('x' || substr(md5(vs.id::text), 1, 4))::bit(16)::int % 100 AS balde
    FROM vendedor_skus vs
    WHERE vs.cuenta_comercial_id = v_cta AND vs.stock_disponible = 0
    ORDER BY vs.id
  LOOP
    v_b := v_sku.balde;
    IF v_b < 70 THEN
      v_cant := 20 + (v_b % 41);          -- 20..60
      v_h := v_h + 1;
    ELSIF v_b < 85 THEN
      v_cant := 2 + (v_b % 2);            -- 2..3
      v_e := v_e + 1;
    ELSE
      v_cant := 0;                        -- se queda en cero A PROPÓSITO
      v_z := v_z + 1;
    END IF;

    IF v_cant > 0 THEN
      PERFORM public.ajustar_stock_vendedor(
        v_sku.id, v_cant,
        'SIEMBRA-S99: inventario de prueba para juzgar vitrina, filtros y agotamiento. '
        || 'NO ES INVENTARIO REAL DE UN VENDEDOR (D-838).');
    END IF;
  END LOOP;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  RAISE NOTICE 'SIEMBRA A: holgado=% · escaso=% · cero=%', v_h, v_e, v_z;

  -- El reparto tiene que existir DE VERDAD, no de intención.
  IF v_h = 0 OR v_e = 0 OR v_z = 0 THEN
    RAISE EXCEPTION 'SIEMBRA A: un balde quedó vacío (h=% e=% z=%) — sin reparto no se puede probar el filtro', v_h, v_e, v_z;
  END IF;
END $$;

