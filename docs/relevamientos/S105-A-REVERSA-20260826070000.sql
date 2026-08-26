-- REVERSA de 20260826070000_s105a_el_sistema_puede_cancelar.sql
-- Escrita ANTES de aplicar.
-- QUÉ DESHACE: `cancelar_pedido_despensa` vuelve a aceptar sólo
-- cliente/vendedor/admin.
-- 🔴 QUÉ NO DESHACE: los pedidos ya cancelados por el sistema quedan así, y
-- sus reservas liberadas NO se vuelven a apartar — la mercadería ya volvió al
-- stock y re-apartarla para un pedido muerto sería peor.
-- CONSECUENCIA: el reverso vuelve a NO poder cancelar pedidos (auth_requerido)
-- y la mercadería queda apartada para pedidos que nadie va a despachar.
CREATE OR REPLACE FUNCTION public.cancelar_pedido_despensa(p_pedido_id uuid, p_actor text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_hasta text;
BEGIN
  -- 🔴 EL `ELSE` ERA LA PUERTA. La versión de S95-D hacía
  --    `CASE p_actor WHEN 'cliente' … WHEN 'vendedor' … ELSE 'cancelado_sistema'`,
  --    así que **cualquier palabra que no fuera esas dos** caía en el camino
  --    del sistema y cancelaba el pedido de otro. Un `ELSE` que elige el
  --    camino más poderoso es un `ELSE` mal puesto.
  IF p_actor NOT IN ('cliente','vendedor','admin') THEN
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  v_hasta := CASE p_actor WHEN 'cliente' THEN 'cancelado_cliente'
                          WHEN 'vendedor' THEN 'cancelado_vendedor'
                          ELSE 'cancelado_sistema' END;
  -- Por la puerta INTERNA, pero con el actor declarado: los gates de
  -- cliente/vendedor/admin del anillo interno hacen la verificación.
  PERFORM _mover_estado_pedido(p_pedido_id, v_hasta, p_actor, p_motivo);

  FOR v_r IN SELECT * FROM inventario_reservas
              WHERE pedido_id = p_pedido_id AND estado='vigente' FOR UPDATE LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              COALESCE(p_motivo,'pedido cancelado'), 'pedido', p_pedido_id);
    UPDATE inventario_reservas SET estado='liberada', cerrada_en=now() WHERE id = v_r.id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'estado', v_hasta);
END $function$
;
