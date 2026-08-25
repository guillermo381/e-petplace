-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260826000000_s105a_cura_ambiente_y_intento_id.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve las DOS funciones a su forma previa byte-idéntica.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · `aplicar_consulta_activa_deuna` vuelve a REVENTAR con
--     `record "v_i" has no field "ambiente"` — la tabla `pagos_intentos` no
--     tiene esa columna y nunca la tuvo. **Es un error de ejecución, no un
--     rebote tipado: el pago se queda sin aplicar.**
--   · El lector deja de devolver `intento_id` y el barrido tiene que volver a
--     buscarlo por su cuenta — con el riesgo de elegir un intento distinto del
--     que el lector eligió.
--   · Los pagos ya aplicados quedan aplicados.
--
-- ⚠️ Los DROP van PRIMERO: las dos cambian de firma o de forma de salida.
-- ══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.aplicar_consulta_activa_deuna(uuid, jsonb, text, text);
DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer, text);

CREATE OR REPLACE FUNCTION public.aplicar_consulta_activa_deuna(p_intento_id uuid, p_crudo jsonb, p_origen text DEFAULT 'barrido'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i        pagos_intentos;
  v_sujeto   text;
  v_sujeto_id uuid;
  v_esperado numeric;
  v_recibido numeric;
  v_ev       uuid;
  v_res      jsonb;
  v_ahora    timestamptz := now();
BEGIN
  /* ① EL GATE — patrón exacto de `resolver_consulta_activa`: esto lo llama el
     barrido con `service_role`, jamás una persona logueada. */
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE = '42501';
  END IF;

  IF p_origen NOT IN ('barrido','consulta_activa') THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'origen_invalido', 'origen', p_origen);
  END IF;

  -- ② EL INTENTO
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'intento_no_existe');
  END IF;
  IF v_i.proveedor <> 'deuna' THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'proveedor_no_es_deuna',
                              'proveedor', v_i.proveedor);
  END IF;

  /* 🔴 GUARD DE ESTADO TERMINAL — `D-916`, el mismo que el actuador.
     Un barrido que corre después de un reverso no puede resucitar el cobro. */
  IF v_i.estado IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'intento_terminal',
                              'estado', v_i.estado);
  END IF;

  /* ③ ¿FANTASMA? — LAS TRES MARCAS JUNTAS, jamás una sola.
     Medido (S103-D §2quater): `payment/info` sobre algo inexistente devuelve
     **HTTP 200 · PENDING · amount 0 · date ""**, nunca `NOT_FOUND`.
     *Con sólo `PENDING` estaríamos llamando fantasma al caso más frecuente del
     sistema: el cliente que todavía no pagó.*
     ⚠️ SUPUESTO DECLARADO Y NO MEDIDO: que una transacción REAL recién creada
     devuelva su `amount`. Si resultara falsa, esta regla cambia y pasa a
     reconocerse por tiempo. Se implementa así **sabiendo que está condicionada**. */
  IF upper(coalesce(p_crudo->>'status','')) = 'PENDING'
     AND coalesce((p_crudo->>'amount')::numeric, 0) = 0
     AND coalesce(p_crudo->>'date','') = ''
  THEN
    UPDATE pagos_intentos
       SET hallazgo = 'huerfano_deuna_vencido', hallazgo_en = v_ahora,
           actualizado_en = v_ahora
     WHERE id = p_intento_id;
    /* **No toca el sujeto. No emite comprobante.** */
    RETURN jsonb_build_object('ok', true, 'resolucion', 'fantasma',
                              'sujeto_movido', false);
  END IF;

  -- ④ ¿APROBADO? — la rama DeUna de `_pago_aprobado` ya exige APPROVED y amount>0
  IF NOT _pago_aprobado(p_crudo) THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'no_aprobado',
                              'status', p_crudo->>'status', 'sujeto_movido', false);
  END IF;

  /* ⑤ QUÉ SUJETO ES — del intento, jamás adivinando.
     🔴 SIN `else` QUE ASUMA: el CHECK admite CUATRO sujetos. Con dos era una
     dicotomía correcta; con cuatro es una adivinanza que compila — y adivinar
     mal acá no es un error de lógica, es aplicar plata sobre el objeto
     equivocado. Los otros dos rebotan CON NOMBRE. */
  IF v_i.compra_id IS NOT NULL AND v_i.cita_id IS NULL THEN
    v_sujeto := 'compra'; v_sujeto_id := v_i.compra_id;
  ELSIF v_i.cita_id IS NOT NULL AND v_i.compra_id IS NULL THEN
    v_sujeto := 'cita';   v_sujeto_id := v_i.cita_id;
  ELSIF v_i.recurrencia_id IS NOT NULL OR v_i.suscripcion_servicio_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sujeto_no_cubierto',
      'sujeto', CASE WHEN v_i.recurrencia_id IS NOT NULL
                     THEN 'recurrencia' ELSE 'suscripcion_servicio' END,
      'nota', 'este camino cubre compra y cita — el recurrente entra por su propio cobro');
  ELSE
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sujeto_indeterminado');
  END IF;

  -- ⑥ IDEMPOTENCIA: ¿el sujeto ya está pagado?
  IF (v_sujeto = 'compra'
      AND EXISTS (SELECT 1 FROM compras WHERE id = v_sujeto_id AND estado = 'pagada'))
     OR (v_sujeto = 'cita'
      AND EXISTS (SELECT 1 FROM evento_cita_servicio
                   WHERE id = v_sujeto_id AND estado_reserva = 'pagada'))
  THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada',
      'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id, 'sujeto_movido', false);
  END IF;

  /* ⑦ 🔴 EL MONTO CONTRA EL DESGLOSE CONGELADO — **no es opcional y es la razón
     de ser de todo esto.** *Confirmar sin comparar sería creerle al proveedor un
     número que nosotros nunca prometimos* — y acá **no hay webhook que ya lo
     haya validado**: por eso el barrido existe. */
  v_recibido := NULLIF(p_crudo->>'amount','')::numeric;
  v_esperado := CASE v_sujeto
    WHEN 'cita'   THEN (SELECT total FROM cita_desglose WHERE cita_id = v_sujeto_id)
    ELSE               (SELECT total FROM compras       WHERE id      = v_sujeto_id) END;

  IF v_esperado IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sin_desglose',
      'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id);
  END IF;

  IF v_recibido IS DISTINCT FROM v_esperado THEN
    UPDATE pagos_intentos
       SET hallazgo = 'monto_no_coincide', hallazgo_en = v_ahora,
           actualizado_en = v_ahora
     WHERE id = p_intento_id;
    RETURN jsonb_build_object('ok', false, 'resolucion', 'monto_no_coincide',
      'esperado', v_esperado, 'recibido', v_recibido, 'sujeto_movido', false);
  END IF;

  /* ⑧ ALIMENTA AL ACTUADOR — la fila con la respuesta VERIFICADA.
     🔴 `payload.info` y no el crudo pelado: el actuador lee `payload->'info'`
     para DeUna porque §7 dice que **sólo la respuesta verificada alimenta**.
     Darle otra forma sería hacerle creer que hubo un webhook. */
  INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                              resultado, origen, verificado, stoken_valido, detalle)
  VALUES ('deuna',
          coalesce(v_i.ambiente, 'sandbox'),
          coalesce(p_crudo->>'internalTransactionReference', v_i.referencia_corta),
          jsonb_build_object('info', p_crudo),
          'recibido', p_origen, true,
          /* ⛔ NULL A PROPÓSITO — no hubo header que validar. Ver ①. */
          NULL,
          'origen=' || p_origen || ' · consulta verificada contra payment/info')
  RETURNING id INTO v_ev;

  v_res := aplicar_evento_de_pago(v_ev);

  /* ⑨ EL SELLO DEL CAMINO — el actuador estampó `confirmado_por='webhook'`
     porque es lo único que conoce. **Acá se corrige**, y no es cosmética: ese
     campo existe para poder auditar por dónde entró un cobro, y este cobro NO
     entró por un webhook — entró porque fuimos a preguntar. */
  UPDATE pagos_intentos
     SET confirmado_por = 'consulta_activa',
         hallazgo = 'confirmado_tardio', hallazgo_en = v_ahora,
         actualizado_en = v_ahora
   WHERE id = p_intento_id
     AND estado = 'aprobado';

  RETURN jsonb_build_object(
    'ok', coalesce((v_res->>'aplicado')::boolean, false),
    'resolucion', CASE WHEN coalesce((v_res->>'aplicado')::boolean, false)
                       THEN 'confirmado_tardio' ELSE coalesce(v_res->>'motivo','?') END,
    'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id,
    'evento_id', v_ev, 'actuador', v_res);
END $function$
;

CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(p_minutos_de_gracia integer DEFAULT 10, p_proveedor text DEFAULT NULL::text)
 RETURNS TABLE(compra_id uuid, transaction_id text, monto numeric, creado_en timestamp with time zone, proveedor text, referencia_corta text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Compras que intentaron pagar y no llegaron a `pagada`, con un intento que
  -- YA tiene id de transacción del proveedor: sin ese id no hay a quién
  -- preguntarle, y un intento recién nacido todavía puede estar en vuelo —
  -- de ahí los minutos de gracia.
  SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en,
         i.proveedor, i.referencia_corta
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.proveedor_transaction_id IS NOT NULL
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
     /* 🔴 EL FILTRO POR RIEL — `NULL` significa TODOS, no «ninguno».
        Es lo que mantiene intacta a toda llamada previa: la de un argumento
        sigue devolviendo exactamente lo mismo que devolvía. */
     AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)
     /* 🔴 Y LOS TERMINALES AFUERA (`D-916`): un intento reversado no es un
        pago pendiente de conciliar — es un pago que ya volvió. Preguntarle al
        proveedor por él sólo puede terminar en confirmarlo de nuevo. */
     AND i.estado NOT IN ('reversado','reverso_fallido')
   ORDER BY i.creado_en;
$function$
;
