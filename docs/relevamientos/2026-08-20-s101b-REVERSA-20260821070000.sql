-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ REVERSA de 20260821070000 — `sin_stock` deja de disfrazar               ║
-- ║ ESCRITA ANTES DE APLICAR (regla de la casa).                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: devuelve `iniciar_pago_pedido` a su forma con
--   `EXCEPTION WHEN OTHERS ... RAISE 'sin_stock'`.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que saberlo: revertir vuelve a poner el
--    disfraz. Cualquier fallo del reservador —incluido el `duplicate key` de
--    `D-851`— volverá a decirle a la familia «no queda suficiente» habiendo
--    stock. *No es una reversa neutra: reintroduce un defecto de voz medido.*

CREATE OR REPLACE FUNCTION public.iniciar_pago_pedido(
  p_pedido_id        uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped record; v_res jsonb; v_falta text;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN
    RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;
  BEGIN
    v_res := reservar_stock_pedido(p_pedido_id, p_minutos_vigencia);
  EXCEPTION WHEN OTHERS THEN
    SELECT string_agg(DISTINCT pi.nombre_producto, ', ') INTO v_falta
    FROM pedido_items pi
    JOIN ofertas o ON o.id = pi.oferta_id
    JOIN vendedor_skus vs ON vs.id = o.sku_id
    WHERE pi.pedido_id = p_pedido_id AND vs.stock_disponible < pi.cantidad;
    RAISE EXCEPTION 'sin_stock: no queda suficiente de %', COALESCE(v_falta, 'algún producto del pedido')
      USING ERRCODE = '22023';
  END;
  PERFORM _mover_estado_pedido(p_pedido_id, 'esperando_pago', 'cliente');
  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
    'narrativa', 'pagando', 'reserva', v_res,
    'reserva_expira_en', v_res->>'expira_en');
END $$;
