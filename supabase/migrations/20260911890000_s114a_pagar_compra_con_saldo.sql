-- S114-A ① (v2) · PAGAR CON SALDO POR COMPRA, NO POR PEDIDO — todo o nada.
--
-- C midió el defecto que la v1 (pagar_pedido_con_saldo) escondía con N=1: el
-- carrito tiene N PEDIDOS (uno por cuenta comercial) agrupados en UNA COMPRA, y
-- el riel de tarjeta cobra la COMPRA (su id es el dev_reference). Cobrar por
-- pedido con dos tiendas es N llamadas sueltas: si la segunda rebota por saldo,
-- la primera YA se cobró — cobro parcial de PLATA, el caso que la familia cuenta.
--
-- FIRMA DEL FOUNDER: `pagar_compra_con_saldo(p_compra_id)`, simétrico con el riel
-- de tarjeta. Todo o nada. Reembolso, conciliación y postventa ya razonan sobre
-- la compra; dos rieles con granularidad distinta sobre la misma plata divergen
-- en el primer caso raro.
--
-- La v1 (pagar_pedido_con_saldo, 20260911880000) se aplicó hoy y tenía CERO
-- consumidores (C la frenó antes de montar) ⇒ se REEMPLAZA, no conviven dos
-- puertas sobre la misma plata (una cosa, una puerta).
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; sin backfill de negocio). Reversa ANTES.

DROP FUNCTION IF EXISTS public.pagar_pedido_con_saldo(uuid);

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

  -- Ya pagada: idempotente y hablado (doble toque no cobra dos veces).
  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok',true,'duplicado',true,'codigo','ya_pagada'); END IF;
  IF v_c.estado IN ('cancelada','fallida') THEN
    RETURN jsonb_build_object('ok',false,'codigo','compra_no_pagable'); END IF;

  -- 🔴 RESERVA DE **TODOS** LOS PEDIDOS ANTES DE TOCAR PLATA. Si alguno no tiene
  --    stock apartado, no se cobra NADA — el mismo guard del webhook, sobre la
  --    compra entera, para que el todo-o-nada empiece antes del consumo.
  SELECT count(*) INTO v_sin_reserva
    FROM pedidos p
   WHERE p.compra_id = p_compra_id
     AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM inventario_reservas ir
                      WHERE ir.pedido_id = p.id AND ir.estado = 'vigente');
  IF v_sin_reserva > 0 THEN
    RETURN jsonb_build_object('ok',false,'codigo','pago_sin_reserva'); END IF;

  v_fam := _familia_del_user(v_yo);
  IF v_fam IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_familia'); END IF;

  v_saldo := saldo_hogar_disponible(v_fam);
  IF v_saldo < v_c.total THEN
    RETURN jsonb_build_object('ok',false,'codigo','saldo_insuficiente',
      'saldo', v_saldo, 'total', v_c.total);
  END IF;

  -- Consumir UNA vez por la compra, idempotente por clave. `compras.total` es el
  -- monto autoritativo (las compuertas del riel de tarjeta ya lo verifican == la
  -- suma del desglose congelado).
  v_cons := consumir_saldo_hogar(v_fam, v_c.total, 'compra:' || p_compra_id::text, p_compra_id);
  IF (v_cons->>'ok')::boolean IS NOT TRUE THEN RETURN v_cons; END IF;

  -- Marca TODOS los pedidos + la compra. Todo pasa en ESTA transacción: si un
  -- _mover_estado_pedido lanza (transición inválida), la función aborta y el
  -- consumo se deshace con ella — cero cobro parcial.
  FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id LOOP
    PERFORM _mover_estado_pedido(v_ped.id, 'pago_capturado', 'sistema',
      'pago con saldo del hogar');
  END LOOP;
  UPDATE compras SET estado = 'pagada', updated_at = now() WHERE id = p_compra_id;

  RETURN jsonb_build_object('ok', true, 'pagado_con', 'saldo',
    'compra_id', p_compra_id, 'saldo_restante', saldo_hogar_disponible(v_fam));
END $fn$;

REVOKE ALL ON FUNCTION public.pagar_compra_con_saldo(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pagar_compra_con_saldo(uuid) TO authenticated;
