-- REVERSA de 20260911960000 (saldo_hogar_disponible con reserva + aplicar_saldo_a_compra).
-- ⚠️ Restaura saldo_hogar_disponible a la SUMA SIMPLE (sin restar reservas) y
--    elimina la puerta del pago mixto. Revertir DEJA de reservar el saldo de
--    compras esperando_pago: si hay compras mixtas en vuelo, su saldo vuelve a
--    figurar disponible y puede gastarse dos veces. Medir antes.

CREATE OR REPLACE FUNCTION public.saldo_hogar_disponible(p_familia uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(sum(monto), 0)::numeric(12,2)
    FROM saldo_hogar_movimientos WHERE familia_id = p_familia;
$fn$;
REVOKE ALL ON FUNCTION public.saldo_hogar_disponible(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.saldo_hogar_disponible(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.aplicar_saldo_a_compra(uuid, numeric);

-- vuelve a nacer la puerta v2 (full-saldo, todo o nada) tal como estaba:
CREATE OR REPLACE FUNCTION public.pagar_compra_con_saldo(p_compra_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_yo uuid := auth.uid();
  v_c record; v_fam uuid; v_saldo numeric; v_sin_reserva int; v_cons jsonb; v_ped record;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','compra_no_existe'); END IF;
  IF v_c.user_id <> v_yo THEN RETURN jsonb_build_object('ok',false,'codigo','no_es_tuya'); END IF;
  IF v_c.estado = 'pagada' THEN RETURN jsonb_build_object('ok',true,'duplicado',true,'codigo','ya_pagada'); END IF;
  IF v_c.estado IN ('cancelada','fallida') THEN RETURN jsonb_build_object('ok',false,'codigo','compra_no_pagable'); END IF;
  SELECT count(*) INTO v_sin_reserva FROM pedidos p WHERE p.compra_id = p_compra_id
     AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM inventario_reservas ir WHERE ir.pedido_id = p.id AND ir.estado = 'vigente');
  IF v_sin_reserva > 0 THEN RETURN jsonb_build_object('ok',false,'codigo','pago_sin_reserva'); END IF;
  v_fam := _familia_del_user(v_yo);
  IF v_fam IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_familia'); END IF;
  v_saldo := saldo_hogar_disponible(v_fam);
  IF v_saldo < v_c.total THEN RETURN jsonb_build_object('ok',false,'codigo','saldo_insuficiente','saldo',v_saldo,'total',v_c.total); END IF;
  v_cons := consumir_saldo_hogar(v_fam, v_c.total, 'compra:' || p_compra_id::text, p_compra_id);
  IF (v_cons->>'ok')::boolean IS NOT TRUE THEN RETURN v_cons; END IF;
  FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id LOOP
    PERFORM _mover_estado_pedido(v_ped.id, 'pago_capturado', 'sistema', 'pago con saldo del hogar');
  END LOOP;
  UPDATE compras SET estado = 'pagada', updated_at = now() WHERE id = p_compra_id;
  RETURN jsonb_build_object('ok',true,'pagado_con','saldo','compra_id',p_compra_id,'saldo_restante',saldo_hogar_disponible(v_fam));
END $fn$;
REVOKE ALL ON FUNCTION public.pagar_compra_con_saldo(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pagar_compra_con_saldo(uuid) TO authenticated;
