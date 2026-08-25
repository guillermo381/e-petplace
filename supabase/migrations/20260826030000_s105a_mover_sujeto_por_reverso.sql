-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · ④ LOS CUATRO SUJETOS AL REVERSARSE — opción (c), firmada
--
-- LA REGLA QUE LOS ORDENA (founder, 25-ago-2026): *el reverso lo pide el
-- cliente o el banco, y **lo que la plataforma no puede hacer es sostener un
-- compromiso sobre plata que ya volvió**.*
--
--   · CITA → se cancela y **libera el horario**. El prestador recibe aviso: es
--     su agenda y su tiempo.
--   · COMPRA y PEDIDO → se cancelan. Si estaba en preparación, el vendedor se
--     entera.
--   · SUSCRIPCIÓN → se corta, no renueva.
--   · RECURRENCIA → se cancela.
--
-- 🔴 EL CENSO ANTES DE PRODUCIR, COMO SE ORDENÓ (`L-318`) — y cambió el diseño:
--   · `compras.estado`: `'cancelada'` está en el CHECK y **NADIE lo lee** —
--     cero funciones, cero vistas, cero policies. Se estrena acá.
--   · `pedidos`: **no se toca a mano.** Va por `cancelar_pedido_despensa(...,
--     'admin', motivo)`, que escribe `cancelado_sistema` **y libera la reserva
--     de inventario** — mercadería que hay que devolver al stock. *Escribir el
--     estado sin liberar la reserva dejaría producto apartado para un pedido
--     muerto.* Usa la transición que esta misma jornada tuvo que crear.
--   · `evento_cita_servicio`: `'cancelada'` **sí tiene lectores** (22 citas
--     vivas ya lo usan) ⇒ no se estrena nada.
--   · `suscripciones_servicio.estado`: **sin CHECK**, texto libre. Tiene
--     `cancelado_en` y `motivo_cancelacion` — se completan los tres.
--   · `pedidos_recurrencias`: CHECK con `'cancelada'` ✅.
--
-- 🔴 **NO REUSA `cancelar_cita_suelta`**, y la razón es de fondo: esa función
-- exige `auth.uid()` = dueño de la cita **y ventana de ≥24 h** (P18). *Un
-- reverso no lo pide el dueño ni respeta su ventana* — pasarlo por ahí sería
-- rebotar el 90 % de los casos o falsear el actor.
--
-- ⚠️ EL AVISO NACE **EN SOMBRA**, y es decisión declarada, no olvido: el canal
-- es el que ya existe (`registrar_intencion_notificacion`) y el tipo se agrega
-- al catálogo que ya lo valida — pero **el texto no lo revisó nadie**, y un
-- aviso que empieza a salir el día que se crea es cómo le llega un correo sin
-- revisar a un prestador real. Se enciende con:
--     UPDATE cat_notificacion_tipos SET en_sombra=false WHERE codigo='pago_reversado';
--
-- 76(g) — VEDA: **NO RIGE.** DDL + una fila de catálogo. Sin backfill: los
-- reversos anteriores **no se re-procesan** — hay exactamente uno y su sujeto
-- se decide a mano con la mesa.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826030000.sql`
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion, en_sombra, activo, audiencia, ignora_techo)
VALUES ('pago_reversado', 'operacion',
        'El proveedor devolvió el cobro: el compromiso se cancela y la contraparte se entera. Nace EN SOMBRA — su texto no fue revisado.',
        true, true, 'ambas', true)
ON CONFLICT (codigo) DO NOTHING;

CREATE OR REPLACE FUNCTION public.mover_sujeto_por_reverso(
  p_intento_id uuid,
  p_motivo text DEFAULT 'reverso del proveedor'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_id uuid; v_ahora timestamptz := now();
  v_ped record; v_dest uuid; v_negocio text; v_prest uuid; v_avisos int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','intento_no_existe'); END IF;

  /* 🔴 SÓLO SOBRE UN INTENTO YA REVERSADO. *Mover el sujeto de un intento vivo
     sería cancelar un pedido pagado por una llamada equivocada* — y esta
     función tiene poder para hacerlo. El estado terminal ES la autorización. */
  IF v_i.estado NOT IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'codigo','intento_no_reversado','estado', v_i.estado);
  END IF;

  -- ¿QUÉ SUJETO? — del intento, sin `else` que asuma (el CHECK admite cuatro)
  IF    v_i.cita_id IS NOT NULL THEN v_sujeto := 'cita';         v_id := v_i.cita_id;
  ELSIF v_i.compra_id IS NOT NULL THEN v_sujeto := 'compra';     v_id := v_i.compra_id;
  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN v_sujeto := 'suscripcion'; v_id := v_i.suscripcion_servicio_id;
  ELSIF v_i.recurrencia_id IS NOT NULL THEN v_sujeto := 'recurrencia'; v_id := v_i.recurrencia_id;
  ELSE RETURN jsonb_build_object('ok', false, 'codigo','sujeto_indeterminado'); END IF;

  -- ══ CITA ══ se cancela, libera el horario, y el PRESTADOR se entera
  IF v_sujeto = 'cita' THEN
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* El aviso va al PRESTADOR: *es su agenda y su tiempo.* Se resuelve el
       destinatario desde el prestador, no desde la cita, porque la cita no
       guarda a quién avisarle. */
    SELECT c.prestador_id INTO v_prest FROM evento_cita_servicio c WHERE c.id = v_id;
    SELECT p.user_id INTO v_dest FROM prestadores p WHERE p.id = v_prest;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => jsonb_build_object(
          'titulo','Una cita quedó cancelada',
          'mensaje','El pago fue devuelto por el banco, así que la cita se canceló y el horario quedó libre.',
          'sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:cita:' || v_id::text);
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ COMPRA + PEDIDOS ══ por la PUERTA, que además libera el inventario
  ELSIF v_sujeto = 'compra' THEN
    FOR v_ped IN SELECT p.* FROM pedidos p WHERE p.compra_id = v_id
                  AND p.estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
    LOOP
      /* 🔴 EL FALLO DE UN PEDIDO NO TUMBA LA CANCELACIÓN DE LOS OTROS ni la de
         la compra: *la plata ya volvió y el estado tiene que reflejarlo aunque
         una transición puntual rebote.* El motivo queda escrito igual. */
      BEGIN
        PERFORM cancelar_pedido_despensa(v_ped.id, 'admin', p_motivo);
      EXCEPTION WHEN OTHERS THEN
        UPDATE pedidos SET notas_admin = COALESCE(notas_admin,'') ||
               ' · reverso no pudo cancelar: ' || SQLERRM WHERE id = v_ped.id;
      END;

      -- si estaba en preparación o más allá, el VENDEDOR se entera
      IF v_ped.estado IN ('liberado_preparacion','documentado','en_reparto','hacia_destino') THEN
        SELECT cc.nombre_comercial INTO v_negocio FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        SELECT cc.owner_profile_id INTO v_dest FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        IF v_dest IS NOT NULL THEN
          PERFORM registrar_intencion_notificacion(
            p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
            p_mascota_id => NULL, p_evento_id => NULL,
            p_datos => jsonb_build_object(
              'titulo','Un pedido en preparación quedó cancelado',
              'mensaje','El pago fue devuelto por el banco. No lo despaches.',
              'sujeto','pedido','sujeto_id', v_ped.id,
              'negocio', v_negocio, 'motivo', p_motivo),
            p_clave_dedup => 'reverso:pedido:' || v_ped.id::text);
          v_avisos := v_avisos + 1;
        END IF;
      END IF;
    END LOOP;

    UPDATE compras SET estado = 'cancelada', updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ SUSCRIPCIÓN ══ se corta y NO renueva
  ELSIF v_sujeto = 'suscripcion' THEN
    UPDATE suscripciones_servicio
       SET estado = 'cancelada', auto_renovar = false,
           cancelado_en = v_ahora, motivo_cancelacion = p_motivo
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ RECURRENCIA ══
  ELSE
    UPDATE pedidos_recurrencias SET estado = 'cancelada' WHERE id = v_id AND estado <> 'cancelada';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujeto', v_sujeto, 'sujeto_id', v_id,
                            'avisos', v_avisos, 'motivo', p_motivo);
END $$;

REVOKE ALL ON FUNCTION public.mover_sujeto_por_reverso(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mover_sujeto_por_reverso(uuid, text) TO service_role;

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
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
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
    IF COALESCE((v_acto->>'ok')::boolean, false) THEN
      v_mov := mover_sujeto_por_reverso(v_intento, 'reverso Nuvei ' || COALESCE(v_tx,''));
    ELSE
      v_mov := jsonb_build_object('ok', false, 'motivo', 'no_se_registro_el_reverso');
    END IF;

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
;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — 🔴 EJERCE EL CAMINO DE VERDAD sobre los DOS sujetos que hay vivos,
-- en subtransacción que se deshace sola (`L-406`).
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_int uuid; v_compra uuid; v_est_i text; v_est_c text; v_est_p text; v_ped uuid;
  r_vivo jsonb; r_rev jsonb; v_reserva text; v_res_cerrada timestamptz; v_res_id uuid;
BEGIN
  -- ① EL ROJO: sobre un intento NO reversado tiene que negarse
  SELECT id INTO v_int FROM pagos_intentos WHERE estado='aprobado' AND compra_id IS NOT NULL LIMIT 1;
  IF v_int IS NULL THEN RAISE EXCEPTION 'CINTURÓN: sin intento aprobado con compra'; END IF;
  r_vivo := mover_sujeto_por_reverso(v_int, 'cinturon');
  IF (r_vivo->>'codigo') <> 'intento_no_reversado' THEN
    RAISE EXCEPTION 'CINTURÓN: movió el sujeto de un intento VIVO — %', r_vivo;
  END IF;

  -- ② EL CAMINO DE VERDAD: se lleva ese mismo intento a `reversado` y se ejerce
  SELECT compra_id INTO v_compra FROM pagos_intentos WHERE id = v_int;
  SELECT estado INTO v_est_i FROM pagos_intentos WHERE id = v_int;
  SELECT estado INTO v_est_c FROM compras        WHERE id = v_compra;
  SELECT id, estado INTO v_ped, v_est_p FROM pedidos WHERE compra_id = v_compra LIMIT 1;
  SELECT r.id, r.estado, r.cerrada_en INTO v_res_id, v_reserva, v_res_cerrada
    FROM inventario_reservas r WHERE r.pedido_id = v_ped LIMIT 1;

  UPDATE pagos_intentos SET estado='reversado' WHERE id = v_int;
  r_rev := mover_sujeto_por_reverso(v_int, 'cinturon');

  -- ③ SE DESHACE ANTES DE DECIDIR
  UPDATE pagos_intentos SET estado = v_est_i WHERE id = v_int;
  UPDATE compras SET estado = v_est_c WHERE id = v_compra;
  IF v_ped IS NOT NULL THEN UPDATE pedidos SET estado = v_est_p WHERE id = v_ped; END IF;
  IF v_res_id IS NOT NULL THEN
    /* 🔴 `cerrada_en` SE RESTAURA A SU VALOR, NO A NULL — lo pidió el primer
       intento, que abortó contra `CHECK (estado='vigente' OR cerrada_en IS NOT
       NULL)`. *Restaurar «a vacío» no es restaurar: es inventar un estado que
       la tabla declara imposible.* */
    UPDATE inventario_reservas SET estado = v_reserva, cerrada_en = v_res_cerrada
     WHERE id = v_res_id;
    DELETE FROM inventario_movimientos WHERE referencia_id = v_ped AND motivo = 'cinturon';
  END IF;
  DELETE FROM notificacion_intencion WHERE clave_dedup LIKE 'reverso:%'
     AND created_at > now() - interval '1 minute';

  IF NOT COALESCE((r_rev->>'ok')::boolean,false) THEN
    RAISE EXCEPTION 'CINTURÓN: el camino de verdad no movió el sujeto — %', r_rev;
  END IF;
  IF (r_rev->>'sujeto') <> 'compra' THEN
    RAISE EXCEPTION 'CINTURÓN: resolvió el sujeto equivocado — %', r_rev->>'sujeto';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · rojo=% · sujeto movido=% · avisos=% · estados restaurados (%/%/%)',
    r_vivo->>'codigo', r_rev->>'sujeto', r_rev->>'avisos', v_est_i, v_est_c, v_est_p;
END $cint$;
