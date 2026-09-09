-- S114-A · 🩹 SHIM TEMPORAL · pagar_compra_con_saldo (puente para el bundle 6354fbfe).
--
-- El pago mixto (20260911960000) DROPEÓ pagar_compra_con_saldo y la reemplazó por
-- aplicar_saldo_a_compra. Pero el OTA 6354fbfe que el founder tiene en el teléfono
-- lleva el bundle viejo, cuyo checkout llama a pagar_compra_con_saldo — sin este
-- shim, el tramo del saldo queda MUERTO en ese bundle durante el recorrido.
--
-- 🔴 ESTE SHIM ES TEMPORAL Y TIENE FECHA DE MUERTE ESCRITA: muere cuando C
--    reconecte checkout.tsx a aplicarSaldoACompra y entre el próximo candidato.
--    Reversa: docs/relevamientos/2026-09-08-s114a-REVERSA-20260911990000-shim-*.sql
--    NO es una segunda puerta permanente sobre la misma plata: es full-saldo
--    todo-o-nada (el comportamiento EXACTO del viejo), y NO reserva ni deja la
--    compra a medias — marca pagada en el acto, como esperaba el bundle viejo.
--    El pago PARCIAL sólo existe por aplicar_saldo_a_compra; el shim rebota
--    saldo_insuficiente si el saldo no cubre el total, igual que el original.
--
-- Deja saldo_aplicado = total (una compra pagada 100% con saldo lo dice), para
-- que el dato quede consistente con la columna nueva.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES.

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

  -- FULL-SALDO TODO-O-NADA: si no cubre el total, rebota (el mixto vive aparte).
  v_saldo := saldo_hogar_disponible(v_fam);
  IF v_saldo < v_c.total THEN
    RETURN jsonb_build_object('ok',false,'codigo','saldo_insuficiente','saldo',v_saldo,'total',v_c.total);
  END IF;

  -- marca pagada + saldo_aplicado=total ANTES de consumir (libera cualquier
  -- resta de reserva; acá no hay reserva previa porque este camino no reserva).
  UPDATE compras SET saldo_aplicado = v_c.total, estado = 'pagada', updated_at = now()
   WHERE id = p_compra_id;

  v_cons := consumir_saldo_hogar(v_fam, v_c.total, 'compra:' || p_compra_id::text, p_compra_id);
  IF (v_cons->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'shim_consumo_fallo: %', v_cons USING ERRCODE='22023'; END IF;

  FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id LOOP
    PERFORM _mover_estado_pedido(v_ped.id, 'pago_capturado', 'sistema', 'pago con saldo del hogar (shim)');
  END LOOP;

  RETURN jsonb_build_object('ok',true,'pagado_con','saldo','compra_id',p_compra_id,
                            'saldo_restante',saldo_hogar_disponible(v_fam));
END $fn$;

REVOKE ALL ON FUNCTION public.pagar_compra_con_saldo(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pagar_compra_con_saldo(uuid) TO authenticated;

COMMENT ON FUNCTION public.pagar_compra_con_saldo(uuid) IS
  '🩹 SHIM TEMPORAL S114-A · puente para el bundle 6354fbfe (checkout viejo). '
  'Full-saldo todo-o-nada. MUERE cuando C reconecte a aplicarSaldoACompra y entre '
  'el próximo candidato. El pago mixto/parcial vive en aplicar_saldo_a_compra.';
