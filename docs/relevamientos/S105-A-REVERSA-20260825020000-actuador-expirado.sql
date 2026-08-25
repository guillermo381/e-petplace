-- ===========================================================================
-- REVERSA de 20260825020000_s105a_actuador_acepta_expirado.sql
-- ===========================================================================
-- Escrita ANTES de aplicar, con la definicion VIVA volcada de pg_get_functiondef.
--
-- QUE DESHACE: devuelve `aplicar_evento_de_pago` a su forma previa, en la que su
--   rama de RECURRENCIA busca el intento con
--       i.estado IN ('iniciado','pendiente','aprobado')
--   y por lo tanto IGNORA un intento en 'expirado'.
--
-- QUE NO DESHACE, y hay que saberlo antes de correrla: si para entonces EXISTE
--   un productor de 'expirado' y alguna recurrencia quedo en ese estado, revertir
--   REABRE la clase D-912 por esa puerta: el actuador dejaria de encontrar esos
--   intentos y no haria nada, sin error y sin log.
--   Hoy es inofensiva porque 'expirado' tiene CERO productores y CERO filas.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e webhook_events; v_vivo boolean; v_ref uuid; v_monto numeric; v_estado text;
  v_tx text; v_auth text; v_res jsonb; v_user uuid; v_negocio text; v_moneda text;
  v_es_cita boolean; v_intento uuid; v_refcorta text; v_tocadas int; v_src jsonb; v_cuantos int; v_que_es text; v_acto jsonb;
BEGIN
  SELECT * INTO v_e FROM webhook_events WHERE id = p_evento_id FOR UPDATE;
  IF v_e.id IS NULL THEN RAISE EXCEPTION 'evento_no_existe' USING ERRCODE='22023'; END IF;

  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'pagos_actuador_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'actuador_apagado');
  END IF;

  /* (1) LA PUERTA — por PROVEEDOR y en un solo lugar. Mismo RETURN y mismo
     motivo que antes: si el motivo cambia, cambia lo que un tablero muestra. */
  IF NOT _evento_autenticado(v_e) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'evento_no_autenticado_o_no_server');
  END IF;

  /* (2) LA FUENTE DE VERDAD, POR PROVEEDOR — §7.
     DeUna: SÓLO `info`, la respuesta verificada. Sin ella no se confirma.
     Nuvei: su propio payload, sin tocar. */
  IF v_e.proveedor = 'deuna' THEN
    v_src := v_e.payload->'info';
    IF v_src IS NULL OR jsonb_typeof(v_src) <> 'object' THEN
      UPDATE webhook_events SET resultado='no_verificado',
        detalle = COALESCE(detalle,'') || ' · actuador: sin consulta verificada'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
        'motivo', 'sin_consulta_verificada');
    END IF;
  ELSE
    v_src := v_e.payload;
  END IF;

  /* (3) LAS CINCO EXTRACCIONES, POR VOCABULARIO. */
  IF v_e.proveedor = 'deuna' THEN
    v_refcorta := NULLIF(v_src->>'internalTransactionReference','');
    /* 🔴 LA AMBIGÜEDAD SE NOMBRA ACÁ, NO SE DELEGA AL ÍNDICE.
       Hoy `uq_pagos_intentos_referencia_corta` hace imposible el duplicado —
       pero un `SELECT … INTO` sin cota tomaría UNA FILA SIN AVISAR el día que
       ese índice se caiga o alguien lo afloje. *Una defensa que vive en otra
       pieza no es una defensa: es una coincidencia.* El motor se defiende solo
       y con nombre propio. */
    SELECT count(*) INTO v_cuantos FROM pagos_intentos WHERE referencia_corta = v_refcorta;
    IF v_cuantos > 1 THEN
      UPDATE webhook_events SET resultado='desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: referencia ambigua (' || v_cuantos || ')'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
        'motivo', 'referencia_ambigua', 'cuantos', v_cuantos);
    END IF;
    SELECT i.id, COALESCE(i.compra_id, i.cita_id) INTO v_intento, v_ref
      FROM pagos_intentos i WHERE i.referencia_corta = v_refcorta;
    IF v_ref IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
        'motivo', 'sin_referencia_corta', 'referencia', v_refcorta);
    END IF;
    v_estado := v_src->>'status';
    v_monto  := NULLIF(v_src->>'amount','')::numeric;
    v_tx     := v_src->>'transactionId';
    v_auth   := NULLIF(v_src->>'transferNumber','');   -- §3.6
  ELSE
    -- NUVEI: byte-idéntico a lo que había. No se mueve un signo.
    v_ref := NULLIF(v_src->'transaction'->>'dev_reference','')::uuid;
    IF v_ref IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'sin_dev_reference');
    END IF;
    v_estado := v_src->'transaction'->>'status';
    v_monto  := NULLIF(v_src->'transaction'->>'amount','')::numeric;
    v_tx     := v_src->'transaction'->>'id';
    v_auth   := v_src->'transaction'->>'authorization_code';
  END IF;

  IF NOT _pago_aprobado(v_src) THEN
    UPDATE webhook_events SET resultado='desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: status=' || COALESCE(v_estado,'0') || ' no confirma'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'status_no_aprobado', 'status', v_estado);
  END IF;

  /* 🔴 QUÉ SUJETO ES — se pregunta a los datos, no se supone por el formato. */
  SELECT EXISTS (SELECT 1 FROM evento_cita_servicio WHERE id = v_ref) INTO v_es_cita;

  IF v_es_cita THEN
    IF EXISTS (SELECT 1 FROM evento_cita_servicio
                WHERE id = v_ref AND estado_reserva = 'pagada') THEN
      UPDATE webhook_events SET resultado='duplicado' WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'cita_ya_pagada');
    END IF;

    IF v_monto IS NOT NULL AND v_monto <> (SELECT total FROM cita_desglose WHERE cita_id = v_ref) THEN
      UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'monto_no_coincide');
    END IF;

    UPDATE evento_cita_servicio
       SET estado = 'confirmada', estado_reserva = 'pagada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'pagado_en', now(), 'transaction_id', v_tx, 'authorization_code', v_auth),
           updated_at = now()
     WHERE id = v_ref;

    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE (v_intento IS NOT NULL AND id = v_intento)
        OR (v_intento IS NULL AND cita_id = v_ref AND proveedor_transaction_id = v_tx);
    GET DIAGNOSTICS v_tocadas = ROW_COUNT;

    SELECT m.user_id INTO v_user FROM evento_cita_servicio c
      JOIN mascotas m ON m.id = c.mascota_id WHERE c.id = v_ref;
    SELECT cc.nombre_comercial, d.moneda INTO v_negocio, v_moneda
      FROM evento_cita_servicio c
      JOIN prestadores p ON p.id = c.prestador_id
      JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
      LEFT JOIN cita_desglose d ON d.cita_id = c.id
     WHERE c.id = v_ref;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
      p_mascota_id => NULL, p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo','Tu pago quedó confirmado',
        'mensaje','Guarda estos datos: son el respaldo de tu pago.',
        'negocio', v_negocio, 'concepto', _concepto_de_pago(v_ref),
        'transaction_id', v_tx, 'authorization_code', v_auth,
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
        'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);

    UPDATE webhook_events SET resultado='aplicado',
      detalle = COALESCE(detalle,'') || ' · actuador: CITA confirmada · intentos=' || v_tocadas
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','cita',
                              'cita_id', v_ref, 'intentos_cerrados', v_tocadas);
  END IF;

  -- ══ LA COMPRA ══════════════════════════════════════════════════════════
  -- S103: LOS OTROS DOS SUJETOS — el cobro recurrente.
  --  🔴 EL ORDEN NO ES ESTILO: `renovar_plan_cobrado` y
  --  `crear_pedido_de_recurrencia_cobrada` EXIGEN un intento ya `aprobado`
  --  (la plata dispara el acto, jamas el reloj) => se marca PRIMERO y se
  --  dispara DESPUES. Al reves devolverian `sin_cobro_aprobado` sobre un cobro
  --  que si ocurrio.
  IF v_intento IS NULL THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE (i.recurrencia_id = v_ref OR i.suscripcion_servicio_id = v_ref)
       AND i.estado IN ('iniciado','pendiente','aprobado')
     ORDER BY i.creado_en DESC LIMIT 1;
  END IF;

  IF v_intento IS NOT NULL
     AND EXISTS (SELECT 1 FROM pagos_intentos WHERE id = v_intento
                  AND (recurrencia_id IS NOT NULL OR suscripcion_servicio_id IS NOT NULL)) THEN
    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE id = v_intento;

    --  🔴 EL ACTO 2 SE ATRAPA A PROPOSITO: el cobro YA OCURRIO. Si renovar o
    --  crear el pedido falla, el intento tiene que quedar `aprobado` igual —
    --  dejar caer la excepcion revertiria la marca del pago y el proveedor
    --  reintentaria contra un cobro ya hecho. El fallo se escribe con su
    --  nombre para que una persona lo vea.
    BEGIN
      SELECT CASE
        WHEN i.suscripcion_servicio_id IS NOT NULL
          THEN renovar_plan_cobrado(i.suscripcion_servicio_id, i.suscripcion_periodo)
        ELSE crear_pedido_de_recurrencia_cobrada(i.recurrencia_id, i.recurrencia_periodo)
      END INTO v_acto FROM pagos_intentos i WHERE i.id = v_intento;
    EXCEPTION WHEN OTHERS THEN
      v_acto := jsonb_build_object('ok', false, 'motivo', 'acto2_fallo', 'causa', SQLERRM);
    END;

    UPDATE webhook_events SET resultado='aplicado',
      detalle = COALESCE(detalle,'') || ' · actuador: recurrente · acto2=' || COALESCE(v_acto->>'ok','?')
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','recurrente',
                              'intento_id', v_intento, 'acto2', v_acto);
  END IF;

  -- S103: EL SUJETO SE VERIFICA, NO SE ASUME.
  --  Con dos sujetos «si no es cita, es compra» era una dicotomia. Con cuatro
  --  —el CHECK admite pedido, cita, recurrencia y suscripcion_servicio— es una
  --  adivinanza que compila. Y adivinar mal aca no es un error de logica: es
  --  aplicar plata sobre el objeto equivocado.
  --  El rebote NOMBRA lo que encontro: un `compra_no_existe` sobre una
  --  recurrencia manda al lector a buscar un pedido que jamas existio.
  IF NOT EXISTS (SELECT 1 FROM compras WHERE id = v_ref) THEN
    v_que_es := CASE
      WHEN EXISTS (SELECT 1 FROM pedidos_recurrencias   WHERE id = v_ref) THEN 'recurrencia'
      WHEN EXISTS (SELECT 1 FROM suscripciones_servicio WHERE id = v_ref) THEN 'suscripcion_servicio'
      WHEN EXISTS (SELECT 1 FROM pedidos               WHERE id = v_ref) THEN 'pedido'
      ELSE 'desconocido' END;
    UPDATE webhook_events SET resultado = 'desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es || ' — no aplicable por esta puerta'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'sujeto_no_aplicable', 'sujeto', v_que_es, 'sujeto_id', v_ref);
  END IF;

  v_res := confirmar_pago_compra(
    p_compra_id => v_ref, p_proveedor => v_e.proveedor, p_referencia => v_tx,
    p_clave_idempotencia => 'wh:' || p_evento_id::text, p_payload => v_e.payload,
    p_confirmado_por => 'webhook', p_transaction_id => v_tx, p_monto => v_monto,
    p_authorization_code => v_auth, p_marca => v_src->'card'->>'type',
    p_bin => v_src->'card'->>'bin', p_ultimos4 => v_src->'card'->>'number');

  IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
    SELECT c.user_id, c.moneda INTO v_user, v_moneda FROM compras c WHERE c.id = v_ref;
    SELECT cc.nombre_comercial INTO v_negocio
      FROM pedidos p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
     WHERE p.compra_id = v_ref LIMIT 1;
    PERFORM registrar_intencion_notificacion(
      p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
      p_mascota_id => NULL, p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo','Tu pago quedó confirmado',
        'mensaje','Guarda estos datos: son el respaldo de tu pago.',
        'negocio', v_negocio, 'concepto', _concepto_de_pago(v_ref),
        'transaction_id', v_tx, 'authorization_code', v_auth,
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'), 'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);
  END IF;

  UPDATE webhook_events SET resultado='aplicado',
    detalle = COALESCE(detalle,'') || ' · actuador: ' || COALESCE(v_res::text,'')
   WHERE id = p_evento_id;
  RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','compra',
                            'compra_id', v_ref, 'resultado', v_res);
END $function$

