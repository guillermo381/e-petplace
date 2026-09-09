-- S114-A ① · EL ENCHUFE DEL SALDO — pagar un pedido con el saldo del hogar.
--
-- Medido: el motor del saldo está completo y correcto (acreditar/consumir/
-- disponible; un crédito real de 13.00 que el RPC suma bien). PERO A4 declaró
-- «enchufado a la puerta del checkout» y NO lo estaba: pagos-cobro no llama
-- consumir_saldo_hogar y ninguna pantalla lee obtenerMiSaldo. La plata entraba
-- y no se podía gastar. Esta es la puerta del motor (el wrapper y la superficie
-- del checkout las monta C).
--
-- Es acción INTERNA de la familia (no el webhook de la pasarela): a diferencia de
-- confirmar_pago_pedido, la llama el dueño. Reusa el motor existente
-- (consumir_saldo_hogar, _mover_estado_pedido) — una cosa, una puerta.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; sin backfill de negocio).
-- Reversa escrita ANTES.

CREATE OR REPLACE FUNCTION public.pagar_pedido_con_saldo(p_pedido_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_yo uuid := auth.uid();
  v_ped record; v_fam uuid; v_saldo numeric; v_reservas int; v_cons jsonb;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','pedido_no_existe'); END IF;
  IF v_ped.user_id <> v_yo THEN RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo'); END IF;

  -- Ya pagado: idempotente y hablado (doble toque no cobra dos veces).
  IF v_ped.estado = 'pago_capturado' THEN
    RETURN jsonb_build_object('ok',true,'duplicado',true,'codigo','ya_pagado');
  END IF;

  -- El mismo guard que el webhook: sin stock reservado, confirmar dejaría el
  -- pedido listo para preparar sin mercadería apartada.
  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id = p_pedido_id AND estado = 'vigente';
  IF v_reservas = 0 AND EXISTS (SELECT 1 FROM pedido_items WHERE pedido_id = p_pedido_id) THEN
    RETURN jsonb_build_object('ok',false,'codigo','pago_sin_reserva');
  END IF;

  v_fam := _familia_del_user(v_yo);
  IF v_fam IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_familia'); END IF;

  v_saldo := saldo_hogar_disponible(v_fam);
  IF v_saldo < v_ped.total THEN
    RETURN jsonb_build_object('ok',false,'codigo','saldo_insuficiente',
      'saldo', v_saldo, 'total', v_ped.total);
  END IF;

  -- Consumir es idempotente por la clave: un doble toque no descuenta dos veces.
  v_cons := consumir_saldo_hogar(v_fam, v_ped.total, 'pedido:' || p_pedido_id::text, p_pedido_id);
  IF (v_cons->>'ok')::boolean IS NOT TRUE THEN RETURN v_cons; END IF;

  -- Marca el pedido pagado por el MISMO camino que el webhook (pago_capturado).
  PERFORM _mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema',
    'pago con saldo del hogar');

  RETURN jsonb_build_object('ok', true, 'pagado_con', 'saldo',
    'saldo_restante', saldo_hogar_disponible(v_fam));
END $fn$;

-- Es acción de la familia en sesión: authenticated la ejecuta; anon jamás.
REVOKE ALL ON FUNCTION public.pagar_pedido_con_saldo(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pagar_pedido_con_saldo(uuid) TO authenticated;
