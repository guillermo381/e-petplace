-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260826010000_s105a_d913_y_transicion_faltante.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: `verificar_compuertas_pre_cobro` vuelve a contar los intentos
-- vencidos, y se retira la transición `pago_capturado → cancelado_sistema`.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · **Vuelve a dejar compras IMPAGABLES PARA SIEMPRE** (`D-913`): un intento
--     que quedó `pendiente` y nunca se cerró bloquea su compra sin vencimiento.
--     Medido al aplicar: TRES intentos con 68, 115 y 116 horas bloqueando.
--   · Los pedidos que YA hayan pasado a `cancelado_sistema` por la transición
--     nueva **se quedan ahí** — y sin la fila del catálogo, volver a moverlos
--     desde ese estado puede quedar sin salida. *Retirar una transición no
--     devuelve a los que ya la cruzaron.*
--   · ⚠️ Retirarla obliga a que todo reverso futuro escriba `cancelado_cliente`
--     sobre algo que el cliente no canceló — el dato falso que esta migración
--     viene a hacer inexpresable.
-- ══════════════════════════════════════════════════════════════════════════

DELETE FROM public.cat_transiciones_pedido
 WHERE desde = 'pago_capturado' AND hasta = 'cancelado_sistema';

CREATE OR REPLACE FUNCTION public.verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text DEFAULT NULL::text, p_exige_token boolean DEFAULT true)
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

  /* ══ COMPUERTA 5 · El token viene y no está vacío ══
     🔴 SÓLO DONDE APLICA, Y SE DECIDE POR PARÁMETRO EXPLÍCITO — no por la forma
     del dato. `LETRA_DEUNA` §3.1 lo dice literal: **en DeUna la #5 NO APLICA**,
     porque no hay tarjeta que tokenizar. La puerta de ese riel llama con
     `p_exige_token => false`.

     ⛔ LA ALTERNATIVA BARATA ESTÁ DESCARTADA POR FIRMA, y su razón es la ley:
     *saltar la compuerta «cuando el token viene null» no distingue «este riel
     no tiene token» de «se olvidaron de mandarlo».* Los dos casos se ven
     idénticos desde adentro, y el segundo es un defecto real que `token_ausente`
     tiene que seguir cazando en el riel de tarjeta. **Un guard que se apaga solo
     cuando le falta el dato que vigila deja de ser un guard.**

     ⚠️ Y hay una razón más, medida acá: `p_token` **ya tenía `DEFAULT NULL`** —
     o sea que la firma vieja invitaba a llamarla sin token y morir. *El default
     que hacía cómoda la llamada era el mismo que la volvía imposible de pasar.* */
  IF p_exige_token THEN
    IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'compuerta', '5_token',
        'codigo', 'token_ausente',
        'no_evaluables', jsonb_build_array('cobertura'));
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'compra_id', p_compra_id,
    'pedidos', v_n_pedidos,
    'monto_verificado', v_c.total,
    /* 🔴 `evaluadas` DICE LO QUE DE VERDAD CORRIÓ. Dejar '5_token' fijo haría
       que un ok de DeUna afirmara haber verificado un token que nadie miró —
       y esa lista existe justamente para poder auditar qué se comprobó. */
    'evaluadas', CASE WHEN p_exige_token
      THEN jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor','5_token')
      ELSE jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor') END,
    /* 🔴 «NO APLICA» ES DISTINTO DE «NO EVALUABLE», y por eso van en campos
       distintos. `cobertura` no se pudo evaluar — es una deuda de medición.
       `5_token` en DeUna **no existe como pregunta**. *En la misma bolsa, una
       carencia y una decisión se leen igual.* */
    'no_aplican', CASE WHEN p_exige_token
      THEN '[]'::jsonb ELSE jsonb_build_array('5_token') END,
    -- 🔴 VIAJA SIEMPRE, incluso en el ok. Que nadie lea este true como
    --    «la cobertura está verificada»: no se verificó nada de cobertura.
    'no_evaluables', jsonb_build_array('cobertura'));
END $function$
;
