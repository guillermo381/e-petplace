-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL COMPROBANTE DEL PLAN DE PASEO — el sexto sujeto cierra entero
--
-- 76(g) VEDA: **NO RIGE.** Un reemplazo de función. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M33.sql`.
--
-- ═══ EL HUECO, medido por S109-B contra el objeto ══════════════════════════
-- El plan cobró de verdad (`DF-2108346`, $138, `acto2=true`) **y emitió CERO
-- comprobantes.** La rama `recurrente` de este actuador **no llamaba a
-- `registrar_intencion_notificacion`** — las otras tres sí.
-- *Un concepto sin emisor es la misma forma de motor sin puerta que esta sesión
-- pagó cuatro veces*, y `_concepto_de_pago` ya sabía decir «Plan mensual de
-- paseos» desde `20260907280000`.
--
-- 🔴 **SÓLO PARA `suscripcion_servicio`, y esa condición ES la decisión.** La
--    rama sirve TAMBIÉN a `recurrencia`. Emitir para las dos habría sido
--    exactamente el `ELSE` que capturó de más cuatro veces hoy — **acá se evita
--    antes en vez de curarse después.** El aviso es de S109-B, que pudo
--    escribirlo y frenó por esa razón.
--
-- 🔴 **LA DEDUP LLEVA EL PERÍODO.** Un mandato mensual tiene N cobros sobre el
--    MISMO id: sin él, el comprobante del segundo mes se deduplica contra el
--    del primero **y no sale nunca.**
--
-- ⚠️ **Y LO QUE NO SE INVENTA:** en el PRIMER cobro no hay `suscripcion_desglose`
--    —lo escribe el lazo de renovación— así que `subtotal` e `impuesto` viajan
--    **NULL, no en cero**. *Un cero fabricado en un comprobante es una
--    afirmación fiscal que nadie firmó.* Va a la misma cola que la pregunta del
--    paquete: **es criterio del contador, no nuestro.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e webhook_events; v_vivo boolean; v_ref uuid; v_monto numeric; v_estado text;
  v_tx text; v_auth text; v_res jsonb; v_user uuid; v_negocio text; v_moneda text;
  v_es_cita boolean; v_intento uuid; v_refcorta text; v_tocadas int; v_src jsonb; v_cuantos int; v_que_es text; v_acto jsonb; v_mov jsonb;
  v_sub numeric; v_imp numeric; v_periodo date;
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
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
        'motivo', 'referencia_ambigua', 'cuantos', v_cuantos);
    END IF;
    /* ✏️ LOS CUATRO SUJETOS QUE ESTA RAMA SABE RESOLVER. Eran dos; los otros
       caían en `sujeto_no_soportado` — correcto y sin mover nada. *En DeUna el
       sujeto NO viaja en el payload: se resuelve desde nuestro propio intento
       por la referencia corta, así que agregar un sujeto es agregarlo acá.* */
    SELECT i.id, COALESCE(i.compra_id, i.cita_id, i.bono_id, i.guarderia_suscripcion_id, i.programa_contratado_id)
      INTO v_intento, v_ref
      FROM pagos_intentos i WHERE i.referencia_corta = v_refcorta;
    IF v_ref IS NULL THEN
      /* ═══ UN SUJETO QUE NO SÉ MOVER SE NOMBRA Y SE MARCA ═══════════════════
         🔴 Firma del founder (31-ago): **un sujeto desconocido que devuelve
         éxito es un cobro que no ocurrió reportado como ocurrido, y es el peor
         defecto posible en el motor de pagos.**

         Esta rama devolvía `ok: true` **sin escribir nada en el evento**: el
         webhook lo logueaba y devolvía 200. *No hay columna que se pueda
         listar, contar ni alertar — sólo una línea de consola que nadie mira.*

         El XOR de `pagos_intentos` admite **cinco** sujetos y esta ruta resuelve
         **dos** (`compra_id`, `cita_id`). Los otros tres —y todo el que se
         agregue— caían acá en silencio. Ahora se distingue **«el intento no
         existe»** de **«existe y su sujeto no lo sé mover»**, que son dos cosas
         distintas y sólo la segunda es un problema nuestro. */
      IF v_intento IS NOT NULL THEN
        SELECT CASE
                 WHEN i.bono_id                IS NOT NULL THEN 'bono'
                 WHEN i.guarderia_suscripcion_id IS NOT NULL THEN 'mensualidad_guarderia'
                 WHEN i.recurrencia_id         IS NOT NULL THEN 'recurrencia'
                 WHEN i.suscripcion_servicio_id IS NOT NULL THEN 'suscripcion_servicio'
                 WHEN i.pedido_id              IS NOT NULL THEN 'pedido'
                 ELSE 'sin_sujeto' END
          INTO v_que_es FROM pagos_intentos i WHERE i.id = v_intento;
        UPDATE webhook_events SET resultado = 'desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es
                    || ' — esta puerta no lo sabe mover'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sujeto_no_soportado', 'sujeto', v_que_es,
          'intento_id', v_intento, 'referencia', v_refcorta);
      END IF;
      UPDATE webhook_events SET resultado = 'desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: no hay intento con esa referencia'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
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

  /* (3bis) 🔴 ¿ES UN REVERSO? — LA PREGUNTA QUE FALTABA, Y VA **ANTES** DEL
     CLASIFICADOR DE APROBACIÓN A PROPÓSITO.
     Un reverso de Nuvei llega con `status = 2`, **igual que un rechazo**: para
     `_pago_aprobado` los dos son "no confirma" y morían juntos en
     `desconocido`. *No fallaba — los CONFUNDÍA, y un evento que se confunde
     con otro no deja síntoma: deja un contador de rechazos que parece normal.*

     MEDIDO contra el evento REAL `DF-2102135` (25-ago-2026, sandbox, reverso
     ejercido por el founder desde el panel):
        status=2 · status_detail=7 · current_status=CANCELLED
        carrier_code=ReversedByMerchant · message="Reverse by mock"
     y **`transaction.id` NO CAMBIA** — Nuvei no emite un id de reverso propio
     (a diferencia de DeUna, que sí: ver `LETRA_DEUNA` §8). Por eso el intento
     se encuentra por su `proveedor_transaction_id` y no por una referencia
     nueva que en este riel no existe.

     🔴 DÓNDE VIVE CADA VOCABULARIO, y por qué son dos y no uno:
       · «¿esto ES un reverso?» → `_nuvei_status_detail_es_reverso` (acá abajo)
       · «¿qué CLASE de reverso es?» → `registrar_reverso_nuvei` (pista D)
     Son dos preguntas distintas con dueños distintos. Juntarlas en una lista
     sola obligaría a que el actuador supiera de reversos parciales, que es
     asunto de quien registra, no de quien reconoce. */
  IF v_e.proveedor <> 'deuna'
     AND _nuvei_status_detail_es_reverso(v_src->'transaction'->>'status_detail')
  THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE i.proveedor_transaction_id = v_tx AND i.proveedor = 'nuvei';

    IF v_intento IS NULL THEN
      /* *Un reverso sin intento no se ignora: se nombra.* Es plata que el
         proveedor dice haber devuelto sobre un cobro que nosotros no
         registramos — el caso más grave posible, y el único aviso que va a
         haber es esta línea. */
      UPDATE webhook_events SET resultado='desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: REVERSO SIN INTENTO (tx=' || COALESCE(v_tx,'?') || ')'
       WHERE id = p_evento_id;
      /* 🔴 `ok:false` — firma del founder (31-ago): **plata devuelta que no
         encontró su intento.** Un `ok` acá dice «resuelto» sobre dinero que
         quedó sin dueño. *Es un estado que exige intervención humana, y un ok
         lo hace invisible.* */
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
        'motivo', 'reverso_sin_intento', 'tx', v_tx);
    END IF;

    /* 🔴 `refund_amount` NO EXISTE en el payload del reverso — MEDIDO sobre
       `DF-2102135`. Lo único que viaja es `amount`, que es el monto de LA
       TRANSACCIÓN ORIGINAL. Se pasa como tal y se declara acá: quien lea
       `reverso.refund_amount` en el crudo está leyendo el monto del cobro, no
       un refund que el proveedor haya declarado aparte. *Un campo que se llama
       como otro miente sin equivocarse.* */
    v_acto := registrar_reverso_nuvei(
      v_intento,
      v_tx,
      v_src->'transaction'->>'status_detail',
      NULLIF(v_src->'transaction'->>'amount','')::numeric,
      v_src->'transaction'->>'authorization_code');

    UPDATE webhook_events
       SET resultado = CASE WHEN COALESCE((v_acto->>'ok')::boolean, false)
                            THEN 'aplicado' ELSE 'desconocido' END,
           detalle = COALESCE(detalle,'') || ' · actuador: reverso ' || COALESCE(v_acto->>'codigo','?')
     WHERE id = p_evento_id;

    /* 🔴 EL SUJETO NO SE MOVIÓ, y se dice DOS VECES a propósito.
       `registrar_reverso_nuvei` ya lo declara en su respuesta; el actuador lo
       repite en la suya porque **es su llamador el que queda a medias**, y
       nadie debería tener que abrir dos funciones para enterarse de que la
       compra sigue diciendo `pagada` sobre plata devuelta. `D-923`, dueño A. */
    /* 🔴 `D-923` CERRADA: el sujeto SE MUEVE, y recién ahora.
       Antes esta rama devolvía `sujeto_movido: false` con la deuda escrita —
       *la plata había vuelto y la compra seguía diciendo `pagada`.* La orden
       importa: **D registra el reverso primero** (idempotente, con su ventana)
       y sólo si eso salió bien se mueve el sujeto. Al revés cancelaríamos un
       pedido por un reverso que el proveedor todavía no confirmó. */
    /* 🔴 YA NO SE LLAMA A MANO. El sujeto lo mueve
       `trg_pagos_intentos_reverso_mueve_sujeto`, que dispara cuando el intento
       ENTRA en estado terminal — **sin importar qué riel lo reversó**.
       *Cablear la llamada por riel es cómo el segundo riel se olvida: DeUna
       tuvo su función de registro construida y su sujeto quedó sin mover.*
       Lo que se lee acá es el resultado, no la orden. */
    /* 🔴 ANTES ESTO AFIRMABA SOBRE OTRA COSA. Decía `sujeto_movido: true` con
       sólo mirar que el INTENTO estuviera reversado — que es lo que acababa de
       hacer el UPDATE de arriba, no lo que hizo el trigger. *Un campo que
       responde una pregunta distinta de la que su nombre hace miente sin
       equivocarse.* Ahora se lee la EVIDENCIA que el trigger deja cuando no
       pudo mover el sujeto. (Hallazgo cruzado de S108-B, verificado acá.) */
    SELECT jsonb_build_object(
             'ok', i.estado IN ('reversado','reverso_fallido')
                   AND NOT (COALESCE(i.payload_crudo,'{}'::jsonb) ? 'sujeto_no_movido'),
             'via', 'trigger', 'estado', i.estado,
             'fallo', COALESCE(i.payload_crudo,'{}'::jsonb)->'sujeto_no_movido')
      INTO v_mov FROM pagos_intentos i WHERE i.id = v_intento;

    RETURN jsonb_build_object('ok', true,
      'aplicado', COALESCE((v_acto->>'ok')::boolean, false),
      'motivo', 'reverso_nuvei', 'acto', v_acto,
      'sujeto_movido', COALESCE((v_mov->>'ok')::boolean, false),
      'movimiento', v_mov);
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
      /* 🔴 `ok:false` — firma del founder: **llegó plata por otro monto**, y es
       el caso donde más importa que alguien mire. */
    RETURN jsonb_build_object('ok', false, 'aplicado', false, 'motivo', 'monto_no_coincide');
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
     WHERE ((v_intento IS NOT NULL AND id = v_intento)
        OR (v_intento IS NULL AND cita_id = v_ref AND proveedor_transaction_id = v_tx))
       /* 🔴 D-916 · GUARD DE ESTADO TERMINAL. Sin esto, un evento de aprobacion
          posterior a un reverso devuelve el intento a 'aprobado' y la cita
          revive: plata devuelta que vuelve a contarse como cobrada. */
       AND estado NOT IN ('reversado','reverso_fallido');
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
        /* 🔴 EL IMPUESTO, DESGLOSADO — `L-318` en su forma más callada: el
           comprobante llevaba el total y **ningún campo de impuesto**. Medido
           antes de curar: **0 de 27 comprobantes emitidos lo llevaron**, y ni
           `aplicar_evento_de_pago` ni `confirmar_pago_compra` mencionaban la
           palabra. *No era que faltaba el dato: faltaba el campo* — así que
           levantar el guard del IVA no lo habría hecho aparecer.
           Sale del DESGLOSE CONGELADO, jamás recalculado: el comprobante tiene
           que decir lo que se cobró, no lo que hoy daría la cuenta. */
        'subtotal', (SELECT subtotal FROM cita_desglose WHERE cita_id = v_ref),
        'impuesto', (SELECT impuesto FROM cita_desglose WHERE cita_id = v_ref),
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
       AND i.estado IN ('iniciado','pendiente','aprobado','expirado')
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
     WHERE id = v_intento
       /* 🔴 D-916 · el mismo guard. Son DOS UPDATE y los dos lo necesitan:
          curar uno solo deja la puerta abierta por el otro sujeto. */
       AND estado NOT IN ('reversado','reverso_fallido');

    --  🔴 EL ACTO 2 SE ATRAPA A PROPOSITO: el cobro YA OCURRIO. Si renovar o
    --  crear el pedido falla, el intento tiene que quedar `aprobado` igual —
    --  dejar caer la excepcion revertiria la marca del pago y el proveedor
    --  reintentaria contra un cobro ya hecho. El fallo se escribe con su
    --  nombre para que una persona lo vea.
    BEGIN
      SELECT CASE
        WHEN i.suscripcion_servicio_id IS NOT NULL
          /* 🔴 EL PRIMER COBRO NO RENUEVA: CONFIRMA. Un plan que nace
             `pendiente` no tiene período previo que renovar — `renovar_plan_cobrado`
             es para el mes 2 en adelante. *Llamar a renovar sobre un plan sin
             estrenar movería un período que no existe.* Se distingue por el
             estado de pago, que es el hecho, no por el período. */
          THEN CASE WHEN EXISTS (SELECT 1 FROM suscripciones_servicio s
                                  WHERE s.id = i.suscripcion_servicio_id
                                    AND s.estado_pago = 'pendiente')
                    THEN confirmar_pago_plan_paseo(i.suscripcion_servicio_id)
                    ELSE renovar_plan_cobrado(i.suscripcion_servicio_id, i.suscripcion_periodo)
               END
        ELSE crear_pedido_de_recurrencia_cobrada(i.recurrencia_id, i.recurrencia_periodo)
      END INTO v_acto FROM pagos_intentos i WHERE i.id = v_intento;
    EXCEPTION WHEN OTHERS THEN
      v_acto := jsonb_build_object('ok', false, 'motivo', 'acto2_fallo', 'causa', SQLERRM);
    END;

    /* ═══ EL COMPROBANTE DEL PLAN DE PASEO — S109-A ══════════════════════
       🔴 El sexto sujeto cobraba de verdad y **no emitía comprobante**: esta
       rama no llamaba a `registrar_intencion_notificacion`. *Un concepto sin
       emisor es la misma forma de motor sin puerta que esta sesión pagó cuatro
       veces* — y `_concepto_de_pago` ya sabía decir «Plan mensual de paseos».

       🔴 **SÓLO PARA `suscripcion_servicio`, y el `IF` es la decisión.** Esta
       rama sirve TAMBIÉN a `recurrencia`, que es otro sujeto con otra
       semántica: darle comprobante de paso cambiaría su comportamiento sin que
       nadie lo haya pedido. *Aviso de S109-B, y es la misma clase de `ELSE` que
       capturó de más cuatro veces hoy — acá se evita antes, no se cura después.*

       🔴 **LA CLAVE DE DEDUP LLEVA EL PERÍODO.** Un mandato mensual tiene N
       cobros sobre el MISMO id: sin el período, el comprobante del segundo mes
       se deduplica contra el del primero **y no sale nunca**. Misma razón que
       la mensualidad de guardería.

       ⚠️ **EL DESGLOSE PUEDE NO EXISTIR, y no se inventa.** En el PRIMER cobro
       no hay `suscripcion_desglose` —lo escribe el lazo de renovación— así que
       `subtotal` e `impuesto` viajan **NULL y no en cero**. *Un cero fabricado
       en un comprobante es una afirmación fiscal que nadie firmó*, y el criterio
       tributario de estos cobros es justamente lo que espera al contador. */
    IF COALESCE((v_acto->>'ok')::boolean, false)
       AND EXISTS (SELECT 1 FROM pagos_intentos
                    WHERE id = v_intento AND suscripcion_servicio_id IS NOT NULL) THEN
      DECLARE v_per date; v_plan uuid;
      BEGIN
        SELECT i.suscripcion_servicio_id, i.suscripcion_periodo
          INTO v_plan, v_per FROM pagos_intentos i WHERE i.id = v_intento;

        SELECT s.user_id, cc.nombre_comercial
          INTO v_user, v_negocio
          FROM suscripciones_servicio s
          JOIN prestadores p ON p.id = s.prestador_id
          JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
         WHERE s.id = v_plan;

        PERFORM registrar_intencion_notificacion(
          p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
          p_mascota_id => NULL, p_evento_id => NULL,
          p_datos => jsonb_build_object(
            'titulo','Tu pago quedó confirmado',
            'mensaje','Guarda estos datos: son el respaldo de tu pago.',
            'negocio', v_negocio, 'concepto', _concepto_de_pago(v_plan),
            'transaction_id', v_tx, 'authorization_code', v_auth,
            'monto', v_monto, 'moneda', 'USD',
            'periodo', v_per,
            'subtotal', (SELECT d.subtotal FROM suscripcion_desglose d
                          WHERE d.suscripcion_servicio_id = v_plan AND d.periodo = v_per),
            'impuesto', (SELECT d.impuesto FROM suscripcion_desglose d
                          WHERE d.suscripcion_servicio_id = v_plan AND d.periodo = v_per),
            'sujeto_id', v_plan),
          p_clave_dedup => 'comprobante:' || v_plan::text || ':' || v_per::text);
      END;
    END IF;

    UPDATE webhook_events SET resultado='aplicado',
      /* ✏️ LA CAUSA SE PUBLICA. Se capturaba en `v_acto->>'causa'` y se
         DESCARTABA: en `webhook_events` quedaba `acto2=false` y nada más.
         *Un fallo que no dice por qué obliga a re-ejecutar el caso — y en pagos
         re-ejecutar es volver a mover plata.* (Hallazgo de S108-B, que tuvo que
         reproducir a mano un cobro real de $100 para saber la causa.) */
      detalle = COALESCE(detalle,'') || ' · actuador: recurrente · acto2=' || COALESCE(v_acto->>'ok','?')
                || COALESCE(' · ' || COALESCE('causa=' || (v_acto->>'causa'),
                                                 'codigo=' || (v_acto->>'codigo')), '')
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','recurrente',
                              'intento_id', v_intento, 'acto2', v_acto);
  END IF;

  -- ══ LOS DOS SUJETOS DE GUARDERÍA ═══════════════════════════════════════
  --  El paquete (`bono`) y la mensualidad. Mismo orden que el recurrente y por
  --  la misma razón: **se marca el intento PRIMERO y se dispara el acto
  --  DESPUÉS**, porque las dos puertas exigen un cobro ya aprobado.
  IF v_intento IS NULL THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE (i.bono_id = v_ref OR i.guarderia_suscripcion_id = v_ref
            OR i.programa_contratado_id = v_ref)
       AND i.estado IN ('iniciado','pendiente','aprobado','expirado')
     ORDER BY i.creado_en DESC LIMIT 1;
  END IF;

  IF v_intento IS NOT NULL
     AND EXISTS (SELECT 1 FROM pagos_intentos WHERE id = v_intento
                  AND (bono_id IS NOT NULL OR guarderia_suscripcion_id IS NOT NULL
                       OR programa_contratado_id IS NOT NULL)) THEN

    /* ═══ EL MONTO SE VERIFICA CONTRA LO CONGELADO — fail-CLOSED ═══════════
       🔴 El paquete se compara contra `bono_desglose`, que es el precio que se
       le prometió a la familia al comprar. **Si no hay desglose, NO se
       confirma.** Medido hoy: `bono_desglose` tiene 0 filas — nadie lo alimenta
       todavía (es de S108-B). *Escribir la comparación igual pero dejándola
       pasar cuando falta la fila sería un guard decorativo: con NULL, `<>` da
       NULL y todo pasa. Un cheque que no puede fallar no es un cheque.*
       ⇒ Esta rama queda BLOQUEADA a propósito hasta que el desglose exista, y
       lo dice con nombre propio en vez de aprobar a ciegas.

       La mensualidad no tiene tabla de desglose, pero **sí tiene techo**:
       `monto_esperado` es lo que la familia autorizó en el mandato. Cobrar por
       encima de eso es exceder la autorización, no un redondeo. */
    IF EXISTS (SELECT 1 FROM pagos_intentos WHERE id=v_intento AND bono_id IS NOT NULL) THEN
      IF NOT EXISTS (SELECT 1 FROM bono_desglose bd
                      JOIN pagos_intentos i ON i.bono_id = bd.bono_id
                     WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: bono sin desglose congelado'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sin_desglose_congelado', 'sujeto', 'bono', 'sujeto_id', v_ref);
      END IF;
      IF v_monto IS NOT NULL AND v_monto <> (
           SELECT bd.total FROM bono_desglose bd
            JOIN pagos_intentos i ON i.bono_id = bd.bono_id WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_no_coincide', 'sujeto', 'bono', 'sujeto_id', v_ref);
      END IF;
    ELSIF EXISTS (SELECT 1 FROM pagos_intentos WHERE id=v_intento AND programa_contratado_id IS NOT NULL) THEN
      /* Mismo fail-closed que el bono: sin desglose congelado NO se confirma. */
      IF NOT EXISTS (SELECT 1 FROM programa_desglose pd
                      JOIN pagos_intentos i ON i.programa_contratado_id = pd.programa_contratado_id
                     WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: programa sin desglose congelado'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sin_desglose_congelado', 'sujeto', 'programa', 'sujeto_id', v_ref);
      END IF;
      IF v_monto IS NOT NULL AND v_monto <> (
           SELECT pd.total FROM programa_desglose pd
            JOIN pagos_intentos i ON i.programa_contratado_id = pd.programa_contratado_id
           WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_no_coincide', 'sujeto', 'programa', 'sujeto_id', v_ref);
      END IF;
    ELSE
      IF v_monto IS NOT NULL AND v_monto > (
           SELECT g.monto_esperado FROM guarderia_suscripciones g
            JOIN pagos_intentos i ON i.guarderia_suscripcion_id = g.id WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_excede_mandato', 'sujeto', 'mensualidad_guarderia', 'sujeto_id', v_ref);
      END IF;
    END IF;

    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE id = v_intento
       /* 🔴 D-916 · el mismo guard que las otras dos ramas: nunca se re-aprueba
          un intento que ya volvió. Son TRES UPDATE ahora, y los tres lo llevan. */
       AND estado NOT IN ('reversado','reverso_fallido');

    /* El ACTO 2 se atrapa: **el cobro YA OCURRIÓ.** Si acreditar el paquete o
       generar el mes falla, el intento tiene que quedar `aprobado` igual —
       dejar caer la excepción revertiría la marca del pago y el proveedor
       reintentaría contra un cobro ya hecho. */
    BEGIN
      SELECT CASE
        WHEN i.bono_id IS NOT NULL
          THEN confirmar_pago_bono(i.bono_id)
        WHEN i.programa_contratado_id IS NOT NULL
          THEN confirmar_pago_programa(i.programa_contratado_id)
        /* El período ancla en el INTENTO, jamás en el reloj — *pagar es
           arrancar*, firma del founder del 31-ago. */
        ELSE cobrar_periodo_mensualidad_guarderia(i.guarderia_suscripcion_id, NULL, i.id)
      END INTO v_acto FROM pagos_intentos i WHERE i.id = v_intento;
    EXCEPTION WHEN OTHERS THEN
      v_acto := jsonb_build_object('ok', false, 'motivo', 'acto2_fallo', 'causa', SQLERRM);
    END;

    SELECT CASE WHEN i.bono_id IS NOT NULL THEN 'bono'
                WHEN i.programa_contratado_id IS NOT NULL THEN 'programa'
                ELSE 'mensualidad_guarderia' END
      INTO v_que_es FROM pagos_intentos i WHERE i.id = v_intento;

    UPDATE webhook_events
       SET resultado = CASE WHEN COALESCE((v_acto->>'ok')::boolean, false)
                            THEN 'aplicado' ELSE 'desconocido' END,
           detalle = COALESCE(detalle,'') || ' · actuador: ' || v_que_es
                     || ' · acto2=' || COALESCE(v_acto->>'ok','?')
                     || COALESCE(' (' || (v_acto->>'motivo') || ')','')
                     /* 🔴 LA MISMA LÍNEA, Y ACÁ ES PEOR: este defecto NO ES MÍO
                        DE ORIGEN — lo COPIÉ de la rama recurrente, que lo tiene
                        desde S103. *La segunda puerta al defecto era la puerta
                        de la que copié.* Cuando se cura una clase, se cura donde
                        está y donde nació. */
                     || COALESCE(' · ' || COALESCE('causa=' || (v_acto->>'causa'),
                                                      'codigo=' || (v_acto->>'codigo')), '')
     WHERE id = p_evento_id;

    /* ═══ EL ANCLA VUELVE AL INTENTO — hallazgo de S108-B, y es real ═══════
       Su edge escribe `guarderia_suscripcion_periodo` al CREAR el intento
       (mi CHECK lo exige junto con la suscripción), o sea **antes de que exista
       `cerrado_en`**: es un PRONÓSTICO. El ancla del plan sale del pago. Los dos
       coinciden casi siempre — y «casi siempre» no es siempre: con el cobro a
       las 23:50 y el webhook a las 00:05 la columna dice un mes y el plan otro.
       *Una columna que queda con la estimación es la que va a leer quien audite
       el cobro, y va a auditar contra un dato que nadie corrigió.* Se escribe
       el hecho encima. */
    IF v_que_es = 'mensualidad_guarderia'
       AND COALESCE((v_acto->>'ok')::boolean, false)
       AND (v_acto->>'periodo_desde') IS NOT NULL THEN
      UPDATE pagos_intentos
         SET guarderia_suscripcion_periodo = (v_acto->>'periodo_desde')::date
       WHERE id = v_intento;
    END IF;

    /* ═══ EL COMPROBANTE — bloque de S108-B, pegado literal ═════════════════
       🤝 Llegó como texto SQL completo y autocontenido (regla de la casa: un
       pedido entre pistas no viaja por referencia), y B lo ejerció antes de
       mandarlo, con prueba de cable incluida —borró el desglose y verificó que
       gritara—. **No se reinterpretó.**

       ✏️ LO ÚNICO QUE A LE AGREGÓ, y se declara: va envuelto en su propio
       BEGIN/EXCEPTION. *El cobro YA OCURRIÓ y el sujeto YA SE MOVIÓ; si armar
       el comprobante falla —un negocio sin cuenta comercial, un destinatario
       que no resuelve—, dejar caer la excepción revertiría la marca del pago y
       el proveedor reintentaría contra un cobro ya hecho.* Es el mismo criterio
       que ya protege al acto 2, aplicado al aviso.

       Las decisiones son de B y quedan escritas en su parte: sólo si el acto 2
       salió bien · el período sale de `periodo_desde` y no de la columna del
       intento · **la clave de dedup lleva el período**, porque un mandato tiene
       N cobros sobre el MISMO id y sin eso el comprobante del segundo mes se
       deduplica contra el del primero y no sale nunca · y el concepto queda
       neutro a propósito, con su tensión declarada contra §10.1 hasta que el
       contador conteste si un paquete de días tributa como un día. */
    BEGIN
      IF COALESCE((v_acto->>'ok')::boolean, false) THEN
        SELECT
          COALESCE(i.pagador_user_id,
            /* 🔴 SIN `ELSE`: un arma por sujeto. Con dos sujetos el `ELSE` era
               un XOR; con tres pasó a significar «todo lo que no sea un bono» y
               un programa se resolvía contra la guardería ⇒ NULL ⇒ el
               comprobante no salía (medido: `DF-2108273`). */
            CASE
              WHEN i.bono_id IS NOT NULL
                THEN (SELECT b.user_id FROM bonos b WHERE b.id = i.bono_id)
              WHEN i.guarderia_suscripcion_id IS NOT NULL
                THEN (SELECT g.autorizada_por FROM guarderia_suscripciones g
                       WHERE g.id = i.guarderia_suscripcion_id)
              WHEN i.programa_contratado_id IS NOT NULL
                THEN (SELECT pc.user_id FROM programas_contratados pc
                       WHERE pc.id = i.programa_contratado_id)
            END),
          cc.nombre_comercial,
          (SELECT g.periodo_desde FROM guarderia_suscripciones g
            WHERE g.id = i.guarderia_suscripcion_id)
        INTO v_user, v_negocio, v_periodo
        FROM pagos_intentos i
        JOIN prestadores pr ON pr.id = COALESCE(
               (SELECT b.prestador_id FROM bonos b WHERE b.id = i.bono_id),
               (SELECT g.prestador_id FROM guarderia_suscripciones g
                 WHERE g.id = i.guarderia_suscripcion_id),
               (SELECT pc.prestador_id FROM programas_contratados pc
                 WHERE pc.id = i.programa_contratado_id))
        JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
       WHERE i.id = v_intento;

        SELECT bd.subtotal, bd.impuesto, bd.moneda INTO v_sub, v_imp, v_moneda
          FROM pagos_intentos i JOIN bono_desglose bd ON bd.bono_id = i.bono_id
         WHERE i.id = v_intento;
        IF v_sub IS NULL THEN
          SELECT d.subtotal, d.impuesto, d.moneda INTO v_sub, v_imp, v_moneda
            FROM pagos_intentos i
            JOIN guarderia_suscripcion_desglose d
              ON d.guarderia_suscripcion_id = i.guarderia_suscripcion_id
             AND d.periodo = v_periodo
           WHERE i.id = v_intento;
        END IF;

        PERFORM registrar_intencion_notificacion(
          p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
          p_mascota_id => NULL, p_evento_id => NULL,
          p_datos => jsonb_build_object(
            'titulo','Tu pago quedó confirmado',
            'mensaje','Guarda estos datos: son el respaldo de tu pago.',
            'negocio', v_negocio,
            'concepto', _concepto_de_pago(v_ref),
            'transaction_id', v_tx, 'authorization_code', v_auth,
            'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
            'subtotal', v_sub, 'impuesto', v_imp,
            'sujeto_id', v_ref),
          p_clave_dedup => 'comprobante:' || v_ref::text
                           || COALESCE(':' || v_periodo::text, ''));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE webhook_events
         SET detalle = COALESCE(detalle,'') || ' · comprobante NO emitido: ' || SQLERRM
       WHERE id = p_evento_id;
    END;

    /* 🔴 `ok` SIGUE AL ACTO, no al cobro. Si la plata entró y el paquete no se
       acreditó, **eso exige una persona**: la familia pagó y no tiene sus días.
       Divergencia declarada contra la rama recurrente, que devuelve `ok:true`
       aunque su acto 2 falle — y se elige distinto por la firma del 31-ago
       (*un éxito sobre plata que no se aplicó es la mentira más cara que puede
       decir este motor*). Medido y ya escrito por el propio actuador: **ningún
       consumidor lee `ok`** — el webhook mira el error de Postgres y la consulta
       activa lee `aplicado` — así que esto NO dispara reintentos. */
    RETURN jsonb_build_object(
      'ok', COALESCE((v_acto->>'ok')::boolean, false),
      'aplicado', COALESCE((v_acto->>'ok')::boolean, false),
      'sujeto', v_que_es, 'sujeto_id', v_ref,
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
      /* ✏️ Los dos sujetos de guardería. Sin estas dos líneas un bono se
         nombraba `desconocido` — cierto, e inútil para el que lee. */
      WHEN EXISTS (SELECT 1 FROM bonos                  WHERE id = v_ref) THEN 'bono'
      WHEN EXISTS (SELECT 1 FROM guarderia_suscripciones WHERE id = v_ref) THEN 'mensualidad_guarderia'
      ELSE 'desconocido' END;
    UPDATE webhook_events SET resultado = 'desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es || ' — no aplicable por esta puerta'
     WHERE id = p_evento_id;
    /* 🔴 `ok:false`: NO SE APLICÓ. Medido antes de cambiarlo — **ningún
       consumidor lee `ok`**: `aplicar_consulta_activa_deuna` lee `aplicado` y
       el webhook mira el error de Postgres. *Un «ok» sobre plata que no se
       aplicó es la mentira más cara que puede decir este motor.* */
    RETURN jsonb_build_object('ok', false, 'aplicado', false,
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
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
        /* Mismo desglose congelado, del lado de la compra. `compra_desglose`
           tiene una línea POR PEDIDO ⇒ se SUMAN: un comprobante es de la
           compra entera, y mostrar la línea de un solo vendedor diría menos
           impuesto del que la familia pagó. */
        'subtotal', (SELECT sum(subtotal) FROM compra_desglose WHERE compra_id = v_ref),
        'impuesto', (SELECT sum(impuesto) FROM compra_desglose WHERE compra_id = v_ref),
        'envio',    (SELECT sum(envio)    FROM compra_desglose WHERE compra_id = v_ref),
        'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);
  END IF;

  UPDATE webhook_events SET resultado='aplicado',
    detalle = COALESCE(detalle,'') || ' · actuador: ' || COALESCE(v_res::text,'')
   WHERE id = p_evento_id;
  RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','compra',
                            'compra_id', v_ref, 'resultado', v_res);
END $function$;

REVOKE EXECUTE ON FUNCTION public.aplicar_evento_de_pago(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.aplicar_evento_de_pago(uuid) TO service_role;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cint$
DECLARE d text;
BEGIN
  SELECT regexp_replace(regexp_replace(pg_get_functiondef(p.oid),'/\*.*?\*/','','gs'),'--[^\n]*','','g')
    INTO d FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='aplicar_evento_de_pago';

  IF d !~ 'comprobante:.*suscripcion' AND d !~ 'v_plan::text \|\| '':''' THEN
    RAISE EXCEPTION 'CINTURON ①: la rama recurrente no emite comprobante del plan';
  END IF;
  RAISE NOTICE 'CINTURON ① OK - la rama recurrente emite';

  /* 🔴 EL DISCRIMINADOR, y sin el este verde no valdria: se exige que la
     emision este ATADA a suscripcion_servicio_id. Un emisor sin esa condicion
     le daria comprobante a `recurrencia` tambien — el ELSE que capturo de mas
     cuatro veces hoy. */
  IF d !~ 'suscripcion_servicio_id IS NOT NULL\) THEN' THEN
    RAISE EXCEPTION 'CINTURON ②: la emision no esta atada a suscripcion_servicio — le daria comprobante a recurrencia, que es otro sujeto';
  END IF;
  RAISE NOTICE 'CINTURON ② OK - atada al sujeto, recurrencia queda afuera';

  /* ③ La dedup lleva el periodo: sin el, el mes 2 no sale nunca. */
  IF d !~ '''comprobante:'' \|\| v_plan::text \|\| '':'' \|\| v_per::text' THEN
    RAISE EXCEPTION 'CINTURON ③: la clave de dedup no lleva el periodo — el comprobante del segundo mes se deduplica contra el del primero y no sale nunca';
  END IF;
  RAISE NOTICE 'CINTURON ③ OK - la dedup lleva el periodo';

  /* ④ Y las otras tres emisiones siguen ahi: agregar una no puede haberse
     llevado puesta otra. Eran 3 llamadas; ahora tienen que ser 4. */
  IF (length(d) - length(replace(d, 'registrar_intencion_notificacion', ''))) / length('registrar_intencion_notificacion') <> 4 THEN
    RAISE EXCEPTION 'CINTURON ④: no son cuatro emisiones — se perdio alguna de las tres que ya estaban';
  END IF;
  RAISE NOTICE 'CINTURON ④ OK - cuatro emisiones, las tres viejas intactas';

  RAISE NOTICE 'CINTURON VERDE - 4 brazos';
END $cint$;

COMMIT;
