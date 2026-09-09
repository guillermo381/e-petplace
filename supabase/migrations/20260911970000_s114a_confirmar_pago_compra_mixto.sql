-- S114-A · PAGO MIXTO ③ · confirmar_pago_compra ENTIENDE EL SALDO APLICADO.
--
-- FIRMAS DEL FOUNDER (confirmadas con condición):
--  ① La validación de monto de una compra mixta vive SÓLO acá, a nivel COMPRA,
--     contra (total - saldo_aplicado). confirmar_pago_pedido NO se toca (es la
--     función más caliente del motor y la usan los pagos sin saldo).
--  ② Que el chequeo per-pedido NO corra para una compra mixta es una DECISIÓN
--     EXPLÍCITA, no un camino que resulta que no pasa por ahí: el brazo mixto no
--     invoca confirmar_pago_pedido (cuya validación compararía pedido.total
--     contra el intento reducido por saldo y REBOTARÍA). Y falla RUIDOSAMENTE
--     si la premisa deja de valer — más de un intento para la misma compra.
--  ③ ROJO PROBADO: una compra mixta cuyo intento no coincide con
--     (total - saldo_aplicado) rebota. Si no rebota, el guard no está.
--
-- Por qué el brazo mixto es EXPLÍCITO y no reusa confirmar_pago_pedido: medido
-- contra el objeto — el flujo del webhook REUSA el único intento de la compra
-- (1 intento, monto=total, estado 'aprobado', clave 'cobro:<compra>:*',
-- proveedor_transaction_id estampado por esta función). Ese reuso valida
-- pedido.total == intento.monto. Con saldo, intento.monto = total - saldo, así
-- que ese chequeo per-pedido rebotaría sobre un mixto correcto. La validación
-- correcta es a nivel compra, y vive ACÁ.
--
-- El camino SIN saldo (saldo_aplicado = 0) queda IDÉNTICO: la validación pasa a
-- (total - COALESCE(saldo_aplicado,0)) que con 0 es total, y el loop de
-- confirmar_pago_pedido corre tal cual. Cero cambio de comportamiento no-mixto.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES en
-- docs/relevamientos/2026-09-08-s114a-REVERSA-20260911970000-confirmar_pago_compra_mixto.sql

CREATE OR REPLACE FUNCTION public.confirmar_pago_compra(
  p_compra_id            uuid,
  p_proveedor            text,
  p_referencia           text,
  p_clave_idempotencia   text,
  p_payload              jsonb   DEFAULT '{}'::jsonb,
  p_confirmado_por       text    DEFAULT 'webhook',
  p_transaction_id       text    DEFAULT NULL,
  p_monto                numeric DEFAULT NULL,
  p_authorization_code   text    DEFAULT NULL,
  p_marca                text    DEFAULT NULL,
  p_bin                  text    DEFAULT NULL,
  p_ultimos4             text    DEFAULT NULL
) RETURNS jsonb
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
END $function$;

REVOKE ALL ON FUNCTION public.confirmar_pago_compra(
  uuid, text, text, text, jsonb, text, text, numeric, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- ── CINTURÓN · LOS DOS ROJOS (firma ③ y premisa ②), antes que el verde ───────
-- Corre como el webhook (auth.uid() NULL ⇒ pasa el gate de sesión). Cada rojo
-- crea su fixture, provoca el RAISE (que revierte sus propias escrituras) y
-- limpia el fixture. El verde E2E con familia real + consumo se mide en vivo
-- tras aplicar (necesita saldo acreditado y pedido reservable).
DO $cinturon$
DECLARE
  v_user uuid; v_compra uuid; v_ped uuid; v_ok boolean; v_cta uuid;
BEGIN
  SELECT c.user_id INTO v_user FROM compras c
   WHERE _familia_del_user(c.user_id) IS NOT NULL LIMIT 1;
  IF v_user IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no hay usuario con familia'; END IF;

  -- ③ ROJO · compra mixta cuyo intento no coincide con (total - saldo) rebota.
  --    total=20, saldo_aplicado=13 ⇒ el riel debía cobrar 7; se confirma con 99.
  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, moneda,
                       estado, clave_idempotencia, saldo_aplicado)
  VALUES (v_user, 20,0,0,20,'USD','esperando_pago','SONDA-CPC-'||gen_random_uuid()::text, 13)
  RETURNING id INTO v_compra;

  v_ok := false;
  BEGIN
    PERFORM confirmar_pago_compra(v_compra, 'nuvei', v_compra::text,
      'SONDA-CPC-ev-'||v_compra::text, '{}'::jsonb, 'webhook', 'TX-X', 99.00);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%monto_no_coincide%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'CINTURÓN ③: un mixto con monto que no coincide NO rebotó — el guard no está'; END IF;

  -- verde chico del monto: con p_monto = 7 (=20-13) NO rebota por monto (rebotará
  -- después por falta de pedidos/intento, que es otra cosa — probamos que el
  -- guard de monto deja pasar el valor correcto).
  v_ok := false;
  BEGIN
    PERFORM confirmar_pago_compra(v_compra, 'nuvei', v_compra::text,
      'SONDA-CPC-ev2-'||v_compra::text, '{}'::jsonb, 'webhook', 'TX-Y', 7.00);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%monto_no_coincide%' THEN
      RAISE EXCEPTION 'CINTURÓN: el monto correcto (7) rebotó como monto_no_coincide';
    END IF;
    v_ok := true;  -- rebotó por otra razón (sin_pedidos/intento) — el monto pasó
  END;
  IF NOT v_ok THEN
    -- no rebotó: raro (no hay pedidos), pero el monto correcto pasó igual
    NULL;
  END IF;
  DELETE FROM compras WHERE id = v_compra;

  -- ② PREMISA · más de un intento vivo en una compra mixta rebota RUIDOSO.
  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, moneda,
                       estado, clave_idempotencia, saldo_aplicado)
  VALUES (v_user, 20,0,0,20,'USD','esperando_pago','SONDA-CPC2-'||gen_random_uuid()::text, 13)
  RETURNING id INTO v_compra;
  SELECT cuenta_comercial_id INTO v_cta FROM pedidos WHERE cuenta_comercial_id IS NOT NULL LIMIT 1;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'CINTURÓN ②: no hay cuenta_comercial para el fixture'; END IF;
  INSERT INTO pedidos (compra_id, user_id, cuenta_comercial_id, estado, subtotal, impuesto_total, costo_envio, total, moneda, country_code)
  VALUES (v_compra, v_user, v_cta, 'creado', 20, 0, 0, 20, 'USD', 'EC') RETURNING id INTO v_ped;
  -- dos intentos vivos para la misma compra
  INSERT INTO pagos_intentos (pedido_id, compra_id, proveedor, proveedor_referencia, monto,
                              moneda, forma, estado, clave_idempotencia)
  VALUES (v_ped, v_compra, 'nuvei', v_compra::text, 7, 'USD','tokenizacion','iniciado','SONDA-CPC2-i1-'||v_compra::text),
         (v_ped, v_compra, 'nuvei', v_compra::text, 7, 'USD','tokenizacion','iniciado','SONDA-CPC2-i2-'||v_compra::text);

  v_ok := false;
  BEGIN
    PERFORM confirmar_pago_compra(v_compra, 'nuvei', v_compra::text,
      'SONDA-CPC2-ev-'||v_compra::text, '{}'::jsonb, 'webhook', 'TX-Z', 7.00);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%intento_no_unico_en_compra_mixta%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'CINTURÓN ②: rebotó por otra cosa: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'CINTURÓN ②: dos intentos en una compra mixta NO rebotaron — la premisa no se vigila'; END IF;

  DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE 'SONDA-CPC2-i%';
  DELETE FROM pedidos WHERE id = v_ped;
  DELETE FROM compras WHERE id = v_compra;

  -- residuo 0
  IF EXISTS (SELECT 1 FROM compras WHERE clave_idempotencia LIKE 'SONDA-CPC%') THEN
    RAISE EXCEPTION 'CINTURÓN: quedó residuo de compras SONDA-CPC';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · ③ monto≠resto rebota · monto correcto pasa · ② >1 intento rebota · residuo 0';
END $cinturon$;
