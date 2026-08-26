-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260825230000_s105a_compuerta_token_por_riel.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve `verificar_compuertas_pre_cobro` a su definición previa
-- byte-idéntica — la de DOS argumentos, con la compuerta 5 corriendo siempre.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que hay que saber:
--   · **Vuelve a dejar el riel de DeUna IMPAGABLE.** La compuerta 5 exige un
--     token que en DeUna no existe (no hay tarjeta que tokenizar,
--     `LETRA_DEUNA` §3.1) ⇒ toda solicitud rebota `token_ausente`.
--   · Los pagos que hayan pasado por este camino **quedan como están**.
--   · ⚠️ La sobrecarga de TRES argumentos hay que dropearla explícitamente o
--     conviven dos firmas y PostgREST elige por forma del cuerpo — por eso el
--     DROP va abajo y no se omite.
--
-- ⛔ NO correr con la fila de DeUna encendida.
-- ══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.verificar_compuertas_pre_cobro(uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c            record;
  v_n_pedidos    int;
  v_en_vuelo     int;
  v_sin_reserva  int;
  v_suma_desglose numeric;
  v_n_desglose   int;
  v_inactivos    int;
BEGIN
  SELECT * INTO v_c FROM compras WHERE id = p_compra_id;
  IF v_c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', 'compra',
      'codigo', 'compra_no_existe',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  SELECT count(*) INTO v_n_pedidos FROM pedidos WHERE compra_id = p_compra_id;
  IF v_n_pedidos = 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', 'compra',
      'codigo', 'compra_sin_pedidos',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 0 · La compra no tiene ya un intento EN VUELO ══
  -- Se apoya en el candado `uq_pagos_intentos_tx_por_pedido` de la migración 2,
  -- pero NO lo reemplaza: el candado impide la fila duplicada, esta compuerta
  -- impide **el segundo débito**, que es lo caro. El candado protege la tabla;
  -- la compuerta protege la tarjeta del cliente.
  SELECT count(*) INTO v_en_vuelo
    FROM pagos_intentos
   WHERE compra_id = p_compra_id
     AND estado IN ('iniciado','pendiente');
  IF v_en_vuelo > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '0_intento_en_vuelo',
      'codigo', 'pago_en_proceso', 'detalle', jsonb_build_object('intentos', v_en_vuelo),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 1 · La reserva de stock sigue viva ══
  -- Un pedido SIN ítems no necesita reserva (no hay mercadería que apartar):
  -- exigírsela lo dejaría clavado para siempre.
  SELECT count(*) INTO v_sin_reserva
    FROM pedidos p
   WHERE p.compra_id = p_compra_id
     AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
     AND NOT EXISTS (
       SELECT 1 FROM inventario_reservas r
        WHERE r.pedido_id = p.id AND r.estado = 'vigente' AND r.expira_en > now());
  IF v_sin_reserva > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '1_reserva_vencida',
      'codigo', 'reserva_vencida', 'detalle', jsonb_build_object('pedidos_sin_reserva', v_sin_reserva),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 2 · El monto == el desglose congelado, CENTAVO A CENTAVO ══
  -- 🔴 La comparación es contra el DESGLOSE CONGELADO, jamás contra los totales
  --    vivos de `pedidos`: el desglose es lo que se le prometió al cliente al
  --    cobrar, y si los totales del pedido se movieron después, **el que tiene
  --    razón es el desglose**. Comparar contra lo vivo taparía justo el
  --    defecto que esta compuerta busca.
  SELECT count(*), COALESCE(sum(total),0) INTO v_n_desglose, v_suma_desglose
    FROM compra_desglose WHERE compra_id = p_compra_id;

  IF v_n_desglose <> v_n_pedidos THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'desglose_incompleto',
      'detalle', jsonb_build_object('pedidos', v_n_pedidos, 'lineas_desglose', v_n_desglose),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  IF round(v_suma_desglose, 2) <> round(v_c.total, 2) THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'monto_divergente',
      'detalle', jsonb_build_object('compra_total', v_c.total, 'suma_desglose', v_suma_desglose),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 3 · COBERTURA — NO EVALUABLE (ver cabecera) ══
  --    No se evalúa y no se finge. Viaja en `no_evaluables`.

  -- ══ COMPUERTA 4 · El vendedor sigue activo (regla 7.13) ══
  SELECT count(*) INTO v_inactivos
    FROM pedidos p
    JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.compra_id = p_compra_id
     AND cc.estado <> 'activa';
  IF v_inactivos > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '4_vendedor',
      'codigo', 'vendedor_no_activo', 'detalle', jsonb_build_object('pedidos_afectados', v_inactivos),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 5 · El token viene y no está vacío ══
  IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '5_token',
      'codigo', 'token_ausente',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'compra_id', p_compra_id,
    'pedidos', v_n_pedidos,
    'monto_verificado', v_c.total,
    'evaluadas', jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor','5_token'),
    -- 🔴 VIAJA SIEMPRE, incluso en el ok. Que nadie lea este true como
    --    «la cobertura está verificada»: no se verificó nada de cobertura.
    'no_evaluables', jsonb_build_array('cobertura'));
END $function$
;
