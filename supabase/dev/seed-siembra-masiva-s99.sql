-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA MASIVA DE LA VITRINA — S99 (orden del founder 18-ago)
-- Deuda escrita ANTES de sembrar: D-838 (DEUDAS_CANONICAS) — cuenta
-- borrable eec12ef3 · marca 'SIEMBRA-S99-' en el dato · stock 0 (L-231) ·
-- cero fotos inventadas · muere antes del primer vendedor real.
--
-- M21 INTACTA: cero productos creados. Se proponen SKUs sobre el canónico
-- por la MISMA puerta del vendedor (proponer_sku_vendedor, como el owner
-- da83d6d8) y se publica como e-PetPlace (publicar_oferta_sku, admin
-- 75d0798a — el founder: «el vendedor propone, e-PetPlace publica» es
-- literalmente lo que este script hace).
--
-- DISTRIBUCIÓN (por rn % 20, determinista — cero random, reproducible):
--   0        → SIN PRECIO (propuesto, precio null — hueco del vendedor)
--   1        → RECHAZADO con motivo 'SIEMBRA: …' (veredicto e-PetPlace)
--   2        → PROPUESTO con precio, sin publicar (en revisión)
--   3..19    → PUBLICADO con precio variado (la vitrina que se ve)
-- Precio determinista: peso_kg*4.20 + (rn%7)*1.35 + 2.50 → el $/kg varía
-- entre presentaciones del mismo producto, que es su trabajo.
--
-- Pensado para UNA corrida; re-correrlo es idempotente por el upsert del
-- motor (ON CONFLICT cuenta+variante) — no duplica, re-propone.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig  text := current_user;
  v_cta      uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_owner    text := '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}';
  v_admin    text := '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}';
  f          record;
  v_r        jsonb;
  v_precio   numeric;
  n_prop     int := 0;
  n_pub      int := 0;
  n_rech     int := 0;
  n_sinp     int := 0;
  n_err      int := 0;
BEGIN
  IF NOT public._cuenta_es_vendedora(v_cta) THEN
    RAISE EXCEPTION 'SIEMBRA abortada: la cuenta % no es vendedora', v_cta;
  END IF;

  CREATE TEMP TABLE _siembra_plan ON COMMIT DROP AS
  SELECT pv.id AS variante_id, pv.codigo, pv.peso_kg,
         p.familia_codigo, p.nombre, p.marca,
         row_number() OVER (ORDER BY pv.codigo) AS rn
  FROM public.producto_variantes pv
  JOIN public.productos p ON p.id = pv.producto_id
  WHERE p.estado = 'activo' AND pv.activo
    AND NOT EXISTS (SELECT 1 FROM public.ofertas o
                    WHERE o.variante_id = pv.id AND o.estado = 'publicada');

  CREATE TEMP TABLE _siembra_skus (sku_id uuid, rn int, precio numeric) ON COMMIT DROP;

  -- PASE 1 — EL VENDEDOR PROPONE (owner de la cuenta borrable).
  FOR f IN SELECT * FROM _siembra_plan ORDER BY rn LOOP
    v_precio := round(COALESCE(f.peso_kg, 1) * 4.20 + (f.rn % 7) * 1.35 + 2.50, 2);
    BEGIN
      PERFORM set_config('request.jwt.claims', v_owner, true);
      SET LOCAL ROLE authenticated;
      v_r := public.proponer_sku_vendedor(
        v_cta,
        jsonb_build_object('familia_codigo', f.familia_codigo, 'nombre', f.nombre, 'marca', f.marca),
        jsonb_build_object('codigo', f.codigo),
        jsonb_build_object(
          'sku_vendedor', 'SIEMBRA-S99-' || f.codigo,
          'precio_propuesto', CASE WHEN f.rn % 20 = 0 THEN NULL ELSE v_precio END,
          'stock_disponible', 0
        ),
        'vendedor'
      );
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      INSERT INTO _siembra_skus VALUES ((v_r ->> 'sku_id')::uuid, f.rn, v_precio);
      n_prop := n_prop + 1;
    EXCEPTION WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      n_err := n_err + 1;  -- fila que no entró: se cuenta, no se esconde
    END;
  END LOOP;

  -- PASE 2 — e-PetPlace PUBLICA (admin) el 85 % (rn % 20 IN 3..19).
  FOR f IN SELECT s.sku_id, s.rn, s.precio FROM _siembra_skus s WHERE s.rn % 20 >= 3 LOOP
    BEGIN
      PERFORM set_config('request.jwt.claims', v_admin, true);
      SET LOCAL ROLE authenticated;
      v_r := public.publicar_oferta_sku(f.sku_id, f.precio, 'EC');
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      n_pub := n_pub + 1;
    EXCEPTION WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      n_err := n_err + 1;
    END;
  END LOOP;

  -- PASE 3 — el veredicto RECHAZADO (acto de e-PetPlace; seed directo con
  -- motivo marcado — el CHECK exige motivo, y el prefijo lo hace limpiable).
  UPDATE public.vendedor_skus vs
     SET estado = 'rechazado',
         motivo_rechazo = 'SIEMBRA: ficha de composición incompleta — re-proponé con la ficha del país'
   WHERE vs.id IN (SELECT s.sku_id FROM _siembra_skus s WHERE s.rn % 20 = 1);
  GET DIAGNOSTICS n_rech = ROW_COUNT;

  SELECT count(*) INTO n_sinp FROM _siembra_skus s WHERE s.rn % 20 = 0;

  RAISE NOTICE 'SIEMBRA S99: % propuestos (% publicados · % rechazados · % sin precio · resto en revisión) · % errores por fila',
    n_prop, n_pub, n_rech, n_sinp, n_err;
  RAISE NOTICE 'Marca contable: SELECT count(*) FROM vendedor_skus WHERE sku_vendedor LIKE ''SIEMBRA-S99-%%''';
END $$;
