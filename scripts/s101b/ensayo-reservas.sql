-- ═══ ENSAYO DE LA CURA DE RESERVAS (D-851) — TODO EN TRANSACCIÓN, ROLLBACK ═══
-- Se corre SIN aplicar la migración: la aplica adentro, mide, y deshace.
-- El discriminador: ANTES el rearme rebota; DESPUÉS pasa Y el stock vuelve.
BEGIN;

\set ON_ERROR_STOP on

-- ── ROJO PRODUCIDO: el estado de HOY ────────────────────────────────────────
DO $$
DECLARE v_ped uuid; v_sku uuid; v_err text;
BEGIN
  SELECT r.pedido_id, r.sku_id INTO v_ped, v_sku
    FROM inventario_reservas r
   WHERE r.estado='vigente' AND r.expira_en <= now() LIMIT 1;
  IF v_ped IS NULL THEN RAISE EXCEPTION 'ENSAYO: no hay caso vencido para medir'; END IF;

  BEGIN
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_sku, v_ped, 1, now() + interval '30 minutes');
    RAISE EXCEPTION 'ENSAYO ROJO NO SE PRODUJO: el rearme pasó con el UNIQUE viejo';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '① ROJO REPRODUCIDO · el rearme rebota con el UNIQUE ciego al estado';
  END;
END $$;

-- ── SE APLICA LA CURA (solo el DDL y la función; el cron NO en el ensayo) ───
ALTER TABLE public.inventario_reservas
  DROP CONSTRAINT IF EXISTS inventario_reservas_pedido_id_sku_id_key;
CREATE UNIQUE INDEX uq_reserva_vigente_por_pedido_sku
  ON public.inventario_reservas (pedido_id, sku_id) WHERE estado = 'vigente';

\i supabase/migrations/_ensayo_solo_funcion.sql

-- ── VERDE: los tres casos que importan ─────────────────────────────────────
DO $$
DECLARE
  v_ped uuid; v_sku uuid; v_cant int;
  v_disp_antes int; v_disp_despues int; v_res jsonb; v_vigentes int;
BEGIN
  SELECT r.pedido_id, r.sku_id, r.cantidad INTO v_ped, v_sku, v_cant
    FROM inventario_reservas r
   WHERE r.estado='vigente' AND r.expira_en <= now() LIMIT 1;

  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;

  -- ② LA FAMILIA QUE VUELVE A LOS 31 MINUTOS **PUEDE COMPRAR**
  v_res := reservar_stock_pedido(v_ped, 30);
  IF (v_res->>'rearmadas')::int < 1 THEN
    RAISE EXCEPTION 'ENSAYO: no rearmó (%)', v_res;
  END IF;
  RAISE NOTICE '② VERDE · la familia que vuelve puede comprar · %', v_res;

  -- ③ EL STOCK NO SE DESCUENTA DOS VECES
  SELECT stock_disponible INTO v_disp_despues FROM vendedor_skus WHERE id = v_sku;
  IF v_disp_despues <> v_disp_antes THEN
    RAISE EXCEPTION 'ENSAYO: el stock se movió % → % (debía quedar igual: se libera y se vuelve a apartar la misma cantidad)',
      v_disp_antes, v_disp_despues;
  END IF;
  RAISE NOTICE '③ VERDE · stock intacto (% → %) — la liberación compensa la nueva reserva',
    v_disp_antes, v_disp_despues;

  -- ④ NO QUEDAN DOS VIGENTES DEL MISMO PAR
  SELECT count(*) INTO v_vigentes FROM inventario_reservas
   WHERE pedido_id=v_ped AND sku_id=v_sku AND estado='vigente';
  IF v_vigentes <> 1 THEN RAISE EXCEPTION 'ENSAYO: quedaron % vigentes', v_vigentes; END IF;
  RAISE NOTICE '④ VERDE · exactamente 1 vigente por (pedido, sku)';

  -- ⑤ 🔴 LA RESERVA VIVA SIGUE BLOQUEANDO LO SUYO (orden de mesa)
  --    Volver a llamar NO debe duplicar: debe respetar la vigente.
  v_res := reservar_stock_pedido(v_ped, 30);
  IF (v_res->>'ya_reservado')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ENSAYO: la vigente no fue respetada · %', v_res;
  END IF;
  SELECT count(*) INTO v_vigentes FROM inventario_reservas
   WHERE pedido_id=v_ped AND sku_id=v_sku AND estado='vigente';
  IF v_vigentes <> 1 THEN RAISE EXCEPTION 'ENSAYO: se duplicó la vigente'; END IF;
  SELECT stock_disponible INTO v_disp_despues FROM vendedor_skus WHERE id = v_sku;
  IF v_disp_despues <> v_disp_antes THEN
    RAISE EXCEPTION 'ENSAYO: la segunda llamada movió stock';
  END IF;
  RAISE NOTICE '⑤ VERDE · la reserva viva sigue bloqueando lo suyo · sin duplicar, sin mover stock';
END $$;

ROLLBACK;
