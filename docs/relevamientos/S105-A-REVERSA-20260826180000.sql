-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260826180000_s105a_retomar_no_aparta.sql
-- Escrita ANTES de aplicar.
-- QUÉ DESHACE: `retomar_compra` vuelve a re-apartar stock por su cuenta.
-- 🔴 CONSECUENCIA: vuelve la DUPLICACIÓN — retomar aparta y el checkout aparta
-- otra vez segundos después. Y si la persona retoma y no llega al checkout,
-- **el stock queda bloqueado 180 minutos para alguien que sí podía comprar**,
-- por una acción que no puede terminar.
-- ⚠️ Las reservas ya tomadas por el camino viejo NO se liberan acá: vencen solas.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.retomar_compra(p_compra_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid      uuid := auth.uid();
  v_c        compras;
  v_it       record;
  v_ped      record;
  v_retirados jsonb := '[]'::jsonb;
  v_ajustes   jsonb := '[]'::jsonb;
  v_res      jsonb;
  v_ahora    timestamptz := now();
  v_nuevo_sub numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF NOT FOUND OR v_c.user_id <> v_uid THEN
    /* Mismo código para «no existe» y «es de otro»: la diferencia le
       confirmaría a un tercero que esa compra existe. */
    RETURN jsonb_build_object('ok', false, 'codigo', 'compra_no_existe');
  END IF;

  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_pagada', 'retomada', false);
  END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'compra_no_retomable',
                              'estado', v_c.estado);
  END IF;

  /* ══ ② ¿SIGUE EXISTIENDO TODO? — SE PREGUNTA ANTES DE TOCAR NADA ══
     🔴 El censo va COMPLETO antes de la primera escritura, a propósito: si se
     fuera item por item apartando y abortara en el tercero, quedarían dos
     reservas tomadas para una compra que no se va a completar. *Apartar stock
     para algo que ya sabemos que no puede terminar es peor que no apartarlo.* */
  FOR v_it IN
    SELECT pi.id, pi.nombre_producto, pi.cantidad, pi.precio_unitario,
           o.id AS oferta_id, o.precio AS precio_hoy, o.estado AS oferta_estado,
           o.retirado_en, o.hay_stock
      FROM pedido_items pi
      JOIN pedidos p ON p.id = pi.pedido_id
      LEFT JOIN ofertas o ON o.id = pi.oferta_id
     WHERE p.compra_id = p_compra_id
  LOOP
    IF v_it.oferta_id IS NULL
       OR v_it.retirado_en IS NOT NULL
       OR v_it.oferta_estado IS DISTINCT FROM 'publicada'
       OR v_it.hay_stock IS NOT TRUE
    THEN
      v_retirados := v_retirados || jsonb_build_object(
        'item', v_it.id, 'producto', v_it.nombre_producto,
        'razon', CASE
          WHEN v_it.oferta_id IS NULL          THEN 'sin_oferta'
          WHEN v_it.retirado_en IS NOT NULL    THEN 'retirado'
          WHEN v_it.hay_stock IS NOT TRUE      THEN 'sin_stock'
          ELSE 'no_publicada' END);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_retirados) > 0 THEN
    /* 🔴 NO SE RETOMA A MEDIAS — firma del founder. Y **se nombra qué falta**:
       *«no se puede completar» sin decir cuál producto obliga a la familia a
       adivinar, y a nosotros a no poder ayudarla.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'producto_no_disponible',
      'retomada', false, 'faltantes', v_retirados);
  END IF;

  /* ══ ③ EL PRECIO: EL MENOR DE LOS DOS ══ */
  FOR v_it IN
    SELECT pi.id, pi.pedido_id, pi.nombre_producto, pi.cantidad,
           pi.precio_unitario, pi.impuesto_pct, o.precio AS precio_hoy
      FROM pedido_items pi
      JOIN pedidos p ON p.id = pi.pedido_id
      JOIN ofertas o ON o.id = pi.oferta_id
     WHERE p.compra_id = p_compra_id
       AND o.precio < pi.precio_unitario          -- SÓLO a la baja
  LOOP
    v_nuevo_sub := round(v_it.precio_hoy * v_it.cantidad, 2);
    UPDATE pedido_items
       SET /* el registro de la promesa, sólo la PRIMERA vez: un segundo retome
              no debe pisar el precio original con el del primer ajuste. */
           precio_unitario_prometido = COALESCE(precio_unitario_prometido, precio_unitario),
           precio_unitario = v_it.precio_hoy,
           subtotal        = v_nuevo_sub,
           impuesto_monto  = round(v_nuevo_sub * COALESCE(v_it.impuesto_pct,0) / 100, 2),
           updated_at      = v_ahora
     WHERE id = v_it.id;

    v_ajustes := v_ajustes || jsonb_build_object(
      'producto', v_it.nombre_producto,
      'antes', v_it.precio_unitario, 'ahora', v_it.precio_hoy);
  END LOOP;

  /* ══ ④ RE-CONGELAR LOS TRES NIVELES, O LA COMPUERTA 2 REBOTA ══
     *Actualizar el ítem y no el desglose dejaría el cobro autorizado por un
     lado y rechazado por el otro.* */
  IF jsonb_array_length(v_ajustes) > 0 THEN
    UPDATE pedidos p SET
      subtotal       = s.sub,
      impuesto_total = s.imp,
      total          = s.sub + s.imp + COALESCE(p.costo_envio,0),
      updated_at     = v_ahora
    FROM (SELECT pi.pedido_id, sum(pi.subtotal) sub, sum(COALESCE(pi.impuesto_monto,0)) imp
            FROM pedido_items pi JOIN pedidos pp ON pp.id = pi.pedido_id
           WHERE pp.compra_id = p_compra_id GROUP BY pi.pedido_id) s
    WHERE p.id = s.pedido_id;

    UPDATE compra_desglose d SET
      subtotal = p.subtotal, impuesto = p.impuesto_total,
      total    = p.total,    congelado_en = v_ahora
    FROM pedidos p
    WHERE d.pedido_id = p.id AND d.compra_id = p_compra_id;

    UPDATE compras c SET
      subtotal = s.sub, impuesto_total = s.imp, envio_total = s.env,
      total = s.tot, updated_at = v_ahora
    FROM (SELECT sum(subtotal) sub, sum(impuesto) imp,
                 sum(COALESCE(envio,0)) env, sum(total) tot
            FROM compra_desglose WHERE compra_id = p_compra_id) s
    WHERE c.id = p_compra_id;
  END IF;

  /* ══ ⑤ RE-APARTAR EL STOCK — **ES PARTE DEL ACTO, NO UN PASO APARTE** ══
     Si falla, la excepción sube y **toda la función se deshace**: los precios
     ajustados se revierten con ella. *Una compra con el precio nuevo y sin
     stock apartado sería exactamente el botón que promete lo que no puede.* */
  FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id
                AND estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
  LOOP
    BEGIN
      PERFORM reservar_stock_pedido(v_ped.id, 180);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'stock_insuficiente',
        'retomada', false, 'pedido', v_ped.id, 'causa', SQLERRM);
    END;
  END LOOP;

  UPDATE compras SET estado = 'esperando_pago', updated_at = v_ahora
   WHERE id = p_compra_id AND estado = 'creada';

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'retomada', 'retomada', true,
    'compra_id', p_compra_id,
    'total', (SELECT total FROM compras WHERE id = p_compra_id),
    /* 🔴 LOS AJUSTES VIAJAN PARA QUE LA PANTALLA LOS DIGA — firma del founder:
       *el precio menor «se dice en pantalla»*. Si esto no viajara, la familia
       vería un total distinto del que dejó **sin explicación**, que se lee
       peor que el precio viejo. */
    'ajustes_de_precio', v_ajustes,
    'bajo_de_precio', (jsonb_array_length(v_ajustes) > 0));
END $function$
;
