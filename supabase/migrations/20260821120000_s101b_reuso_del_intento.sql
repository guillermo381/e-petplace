-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · EL WEBHOOK CONFIRMA EL INTENTO QUE YA EXISTE                   ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821120000.sql ║
-- ║ (escrita ANTES; declara que revertir APAGA el cobro)                    ║
-- ║ Regla 76(g): NO RIGE — cuerpo de función, sin backfill.                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 EL DEFECTO, MEDIDO CONTRA EL EVENTO REAL `DF-2098177` ═══════════════
--
--   ACTUADOR ROJO :: duplicate key value violates unique constraint
--                    "uq_pagos_intentos_tx_por_pedido"
--
-- `pagos-cobro` **registra el intento ANTES de disparar** —por diseño, es la
-- letra: *nunca se cobra sin haber dejado escrito que se iba a cobrar*— y ahí
-- queda el `proveedor_transaction_id`. Después el webhook llega y esta función
-- **creaba un intento NUEVO** con el MISMO id. El UNIQUE lo rebota.
--
-- ⇒ **Ningún pago real se podía confirmar.** Los dos caminos eran correctos por
--   separado; juntos no funcionaban.
--
-- 🔴 **Y por qué no se afloja el UNIQUE** (la otra cura posible, descartada con
--    su razón): es la defensa que impide reaplicar una transacción del proveedor
--    sobre otro pedido, y **hoy es lo único que lo impide**. *No se debilita una
--    defensa para acomodar un flujo: se acomoda el flujo.*
--
-- ⇒ **LA CURA: el webhook CONFIRMA el intento que ya existe.** Es lo que la
--   realidad describe — *hay un intento, y el webhook lo confirma; jamás hay dos
--   intentos para un mismo cobro.*

CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(
  p_pedido_id uuid, p_proveedor text, p_referencia text,
  p_clave_idempotencia text, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_int uuid; v_ped record; v_reservas int; v_prev record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM pagos_eventos WHERE clave_idempotencia = p_clave_idempotencia) THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true);
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id = p_pedido_id AND estado = 'vigente';
  IF v_reservas = 0 AND EXISTS (SELECT 1 FROM pedido_items WHERE pedido_id = p_pedido_id) THEN
    RAISE EXCEPTION 'pago_sin_reserva: el pedido % no tiene stock reservado; confirmarlo lo dejaría listo para preparar sin mercadería apartada', p_pedido_id
      USING ERRCODE = '22023';
  END IF;

  -- ══ 🔴 ① ¿YA HAY UN INTENTO PARA ESTA TRANSACCIÓN? ═══════════════════════
  SELECT * INTO v_prev FROM pagos_intentos
   WHERE pedido_id = p_pedido_id
     AND proveedor = p_proveedor
     AND proveedor_transaction_id IS NOT DISTINCT FROM p_referencia
     AND p_referencia IS NOT NULL
   FOR UPDATE;

  IF v_prev.id IS NOT NULL THEN
    -- 🔴 LA VALIDACIÓN DE MONTO RIGE TAMBIÉN ACÁ (firma de mesa). El monto que
    --    el proveedor confirma tiene que ser el que dejamos escrito al intentar.
    --    *Si divergen, algo pasó entre el intento y la confirmación, y eso no lo
    --    resuelve un UPDATE: lo mira una persona.* Se registra y NO se mueve.
    IF v_ped.total IS DISTINCT FROM v_prev.monto THEN
      RAISE EXCEPTION
        'monto_del_intento_no_coincide: el intento dice % y el pedido vale %',
        v_prev.monto, v_ped.total USING ERRCODE = '22023';
    END IF;

    -- Se TRANSICIONA, no se crea un segundo.
    UPDATE pagos_intentos
       SET estado = 'aprobado', payload_crudo = p_payload,
           cerrado_en = COALESCE(cerrado_en, now()), actualizado_en = now()
     WHERE id = v_prev.id;
    v_int := v_prev.id;
  ELSE
    -- ══ ② SIN INTENTO NUESTRO ════════════════════════════════════════════════
    -- 🔴 Este camino existe **solo** para un evento del proveedor que no tenga
    --    intento previo. Con el flujo de S101-B **eso no debería pasar nunca**
    --    (`pagos-cobro` registra antes de disparar), así que **se DICE en vez de
    --    crear en silencio**: un intento fabricado por la confirmación es un
    --    cobro del que no tenemos registro de haber iniciado.
    --    *Se conserva el INSERT porque el caso legítimo existe —una transacción
    --    iniciada fuera de nuestro flujo— pero queda marcado para que se vea.*
    INSERT INTO pagos_intentos (pedido_id, proveedor, proveedor_referencia, monto,
                                moneda, forma, estado, payload_crudo,
                                clave_idempotencia, cerrado_en, motivo_rechazo)
      VALUES (p_pedido_id, p_proveedor, p_referencia, v_ped.total, v_ped.moneda,
              'tokenizacion', 'aprobado', p_payload,
              p_clave_idempotencia || ':intento', now(),
              'intento_creado_por_la_confirmacion: no habia intento previo')
      RETURNING id INTO v_int;
  END IF;

  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
    VALUES (v_int, p_proveedor, 'pago_aprobado', p_payload, p_clave_idempotencia, now());

  PERFORM _mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema');

  RETURN jsonb_build_object('ok', true, 'duplicado', false,
                            'intento_id', v_int, 'pedido_id', p_pedido_id,
                            'reuso', (v_prev.id IS NOT NULL));
END $fn$;

DO $$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='confirmar_pago_pedido';
  IF v_def NOT ILIKE '%monto_del_intento_no_coincide%' THEN
    RAISE EXCEPTION 'CINTURON: falta la validacion de monto en el reuso';
  END IF;
  IF v_def NOT ILIKE '%intento_creado_por_la_confirmacion%' THEN
    RAISE EXCEPTION 'CINTURON: el caso sin intento previo crea en silencio';
  END IF;
  RAISE NOTICE 'cinturon verde: reusa, valida monto en el reuso, y dice cuando crea';
END $$;
