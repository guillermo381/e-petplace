-- REVERSA de 20260912100000_s114a_confirmar_pago_compra_estado_intento.sql
-- Restaura confirmar_pago_compra con el filtro viejo ('iniciado','aprobado').
-- NOTA: revertir NO deshace datos — sólo la definición de la función.

CREATE OR REPLACE FUNCTION public.confirmar_pago_compra(p_compra_id uuid, p_proveedor text, p_referencia text, p_clave_idempotencia text, p_payload jsonb DEFAULT '{}'::jsonb, p_confirmado_por text DEFAULT 'webhook'::text, p_transaction_id text DEFAULT NULL::text, p_monto numeric DEFAULT NULL::numeric, p_authorization_code text DEFAULT NULL::text, p_marca text DEFAULT NULL::text, p_bin text DEFAULT NULL::text, p_ultimos4 text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c        record;
  v_p        record;
  v_res      jsonb;
  v_intento  uuid;
  v_n        int := 0;
  v_intentos uuid[] := '{}';
  v_esperado numeric;            -- lo que el riel debía cobrar: total - saldo_aplicado
  v_saldo    numeric;            -- saldo aplicado a esta compra
  v_int_ct   int;               -- cuántos intentos tiene la compra (premisa ②)
  v_int_monto numeric;          -- monto del único intento (consistencia ③)
  v_fam      uuid;
  v_cons     jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

  IF p_confirmado_por NOT IN ('webhook','consulta_activa') THEN
    RAISE EXCEPTION 'confirmado_por_invalido: % — debe ser webhook o consulta_activa', p_confirmado_por
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN
    RAISE EXCEPTION 'compra_no_existe' USING ERRCODE = '22023';
  END IF;

  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
                              'compra_id', p_compra_id, 'motivo', 'compra_ya_pagada');
  END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RAISE EXCEPTION 'compra_no_confirmable: está en %', v_c.estado USING ERRCODE = '22023';
  END IF;

  v_saldo    := COALESCE(v_c.saldo_aplicado, 0);
  v_esperado := ROUND(v_c.total - v_saldo, 2);

  -- ⚠️ VALIDACIÓN DE MONTO A NIVEL COMPRA — lo que el riel debía cobrar es
  --    (total - saldo_aplicado). Con saldo 0 es el total, idéntico a antes.
  --    OPCIONAL por construcción: con p_monto => NULL no valida (idéntico a no
  --    tenerla). Es el ROJO ③ del pago mixto: un intento que no coincide rebota.
  IF p_monto IS NOT NULL AND p_monto <> v_esperado THEN
    RAISE EXCEPTION 'monto_no_coincide: la pasarela dice % y el riel debía cobrar % (total % - saldo %)',
      p_monto, v_esperado, v_c.total, v_saldo USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pedidos WHERE compra_id = p_compra_id) THEN
    RAISE EXCEPTION 'compra_sin_pedidos: % no tiene pedidos que confirmar', p_compra_id
      USING ERRCODE = '22023';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- 🔴 BRAZO MIXTO (saldo_aplicado > 0) — DECISIÓN EXPLÍCITA (firma ②).
  --    NO se invoca confirmar_pago_pedido: su validación per-pedido compara
  --    pedido.total contra el intento reducido por saldo y rebotaría sobre un
  --    mixto correcto. La validación de monto ya corrió ARRIBA, a nivel compra,
  --    contra (total - saldo_aplicado). Acá se transiciona el ÚNICO intento y se
  --    confirman los pedidos inline, sin re-validar monto.
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_saldo > 0 THEN
    -- PREMISA ②, RUIDOSA: el intento es único y a nivel compra. Si aparece más
    -- de uno, la premisa que autoriza a saltear el chequeo per-pedido dejó de
    -- valer y NO se confirma en silencio.
    SELECT count(*), max(monto) INTO v_int_ct, v_int_monto
      FROM pagos_intentos
     WHERE compra_id = p_compra_id AND estado IN ('iniciado','aprobado');
    IF v_int_ct <> 1 THEN
      RAISE EXCEPTION 'intento_no_unico_en_compra_mixta: la compra % tiene % intentos vivos; el brazo mixto exige exactamente 1',
        p_compra_id, v_int_ct USING ERRCODE = '22023';
    END IF;
    -- Consistencia: lo que dejamos escrito al intentar tiene que ser el resto.
    IF v_int_monto IS DISTINCT FROM v_esperado THEN
      RAISE EXCEPTION 'intento_mixto_monto_inconsistente: el intento dice % y el resto a cobrar era %',
        v_int_monto, v_esperado USING ERRCODE = '22023';
    END IF;

    -- Transiciona el único intento a aprobado y estampa los datos de la pasarela.
    UPDATE pagos_intentos
       SET estado                   = 'aprobado',
           payload_crudo            = p_payload,
           cerrado_en               = COALESCE(cerrado_en, now()),
           confirmado_por           = p_confirmado_por,
           proveedor_transaction_id = p_transaction_id,
           authorization_code       = p_authorization_code,
           marca                    = p_marca,
           bin                      = p_bin,
           ultimos4                 = p_ultimos4,
           actualizado_en           = now()
     WHERE compra_id = p_compra_id AND estado IN ('iniciado','aprobado')
     RETURNING id INTO v_intento;
    v_intentos := v_intentos || v_intento;

    -- Confirma cada pedido INLINE: reserva + evento (idempotente) + transición.
    -- Mismos pasos que confirmar_pago_pedido MENOS la validación de monto
    -- per-pedido (que acá no aplica: el monto se validó a nivel compra).
    FOR v_p IN SELECT id FROM pedidos WHERE compra_id = p_compra_id ORDER BY created_at, id
    LOOP
      IF EXISTS (SELECT 1 FROM inventario_reservas ir
                  WHERE ir.pedido_id = v_p.id AND ir.estado = 'vigente')
         OR NOT EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = v_p.id)
      THEN
        NULL;  -- reserva ok (o pedido sin ítems) — sigue
      ELSE
        RAISE EXCEPTION 'pago_sin_reserva: el pedido % no tiene stock reservado', v_p.id
          USING ERRCODE = '22023';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pagos_eventos
                      WHERE clave_idempotencia = p_clave_idempotencia || ':' || v_p.id::text) THEN
        INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
        VALUES (v_intento, p_proveedor, 'pago_aprobado', p_payload,
                p_clave_idempotencia || ':' || v_p.id::text, now());
        PERFORM _mover_estado_pedido(v_p.id, 'pago_capturado', 'sistema', 'pago mixto (saldo + riel)');
      END IF;
      v_n := v_n + 1;
    END LOOP;

    UPDATE compras SET estado = 'pagada', updated_at = now() WHERE id = p_compra_id;

    -- CONSUMO DEL SALDO — DESPUÉS de que el riel confirmó (firma del founder).
    -- La compra ya está 'pagada' ⇒ su reserva no se resta más en disponible, así
    -- que el consumo baja el saldo del sum sin doble conteo.
    v_fam := _familia_del_user(v_c.user_id);
    IF v_fam IS NULL THEN
      RAISE EXCEPTION 'compra_mixta_sin_familia: no se pudo resolver la familia de % para consumir el saldo', v_c.user_id
        USING ERRCODE = '22023';
    END IF;
    v_cons := consumir_saldo_hogar(v_fam, v_saldo, 'compra:' || p_compra_id::text, p_compra_id);
    IF (v_cons->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'consumo_de_saldo_fallo_en_mixto: %', v_cons USING ERRCODE = '22023';
    END IF;

    RETURN jsonb_build_object('ok', true, 'compra_id', p_compra_id,
                              'mixto', true, 'saldo_aplicado', v_saldo,
                              'cobrado_por_riel', v_esperado,
                              'pedidos_confirmados', v_n, 'intentos', to_jsonb(v_intentos));
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- CAMINO SIN SALDO — idéntico al de S101 (loop → confirmar_pago_pedido).
  -- ══════════════════════════════════════════════════════════════════════════
  FOR v_p IN SELECT id FROM pedidos WHERE compra_id = p_compra_id ORDER BY created_at, id
  LOOP
    v_res := confirmar_pago_pedido(
               v_p.id, p_proveedor, p_referencia,
               p_clave_idempotencia || ':' || v_p.id::text,
               p_payload);

    IF COALESCE((v_res->>'duplicado')::boolean, false) THEN
      RAISE EXCEPTION 'pedido_ya_confirmado_con_esta_clave: % — la compra no se confirma a medias', v_p.id
        USING ERRCODE = '22023';
    END IF;

    v_intento := (v_res->>'intento_id')::uuid;

    UPDATE pagos_intentos
       SET compra_id                = p_compra_id,
           confirmado_por           = p_confirmado_por,
           proveedor_transaction_id = p_transaction_id,
           authorization_code       = p_authorization_code,
           marca                    = p_marca,
           bin                      = p_bin,
           ultimos4                 = p_ultimos4,
           actualizado_en           = now()
     WHERE id = v_intento;

    v_n := v_n + 1;
    v_intentos := v_intentos || v_intento;
  END LOOP;

  UPDATE compras SET estado = 'pagada', updated_at = now() WHERE id = p_compra_id;

  RETURN jsonb_build_object('ok', true, 'compra_id', p_compra_id,
                            'pedidos_confirmados', v_n, 'intentos', to_jsonb(v_intentos));
END $function$
;
