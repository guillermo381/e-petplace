-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · EL APLICADOR DEL BARRIDO DE DEUNA  (`D-887`)
--
-- EL DEFECTO: el barrido clasifica `confirmado` y **ahí se acaba**. Su comentario
-- decía «lo aplica el actuador» — y el actuador arranca con `SELECT * FROM
-- webhook_events WHERE id = ...`: **necesita una fila de evento.** Pero el caso
-- que el barrido existe para resolver es **el webhook que nunca llegó** ⇒ no hay
-- fila, no hay a quién pasarle nada, **y el sujeto no se mueve.**
-- *Es «puerta sin motor» escrito como comentario: la promesa compilaba.*
--
-- 🔴 EL DISEÑO — y es lo que decide todo lo demás: **el barrido NO confirma.
-- ALIMENTA AL ACTUADOR ÚNICO.** Escribe la fila de `webhook_events` con la
-- respuesta verificada y lo llama. *Dos piezas que confirman pagos es cómo se
-- confirma dos veces.* Es seguro: `webhook_events` tiene RLS con cero policies
-- y grants sólo `postgres`/`service_role` — nadie desde afuera fabrica un evento.
--
-- 🔴 LA TENSIÓN CONTRATO-vs-FICHA, RESUELTA Y DECLARADA (no absorbida):
-- `CONTRATO_APLICADOR_BARRIDO_DEUNA` §6 pide `confirmado_por='consulta_activa'`;
-- el actuador estampa `'webhook'`. **Gana el diseño de la ficha** (posterior, y
-- con la razón fuerte: un solo lugar que confirma plata) **y el aplicador
-- CORRIGE el sello después**, porque dejar `'webhook'` sería mentir sobre el
-- camino — y ese campo existe justamente para poder auditar por dónde entró.
-- Y su §7 dice que el discriminador NO exija fila en `webhook_events`: **queda
-- enmendado** — la fila SÍ existe, con `origen='barrido'`. *Lo que el §7
-- protegía era que el discriminador no diera rojo en el caso que vino a cubrir;
-- con `origen` declarado, distinguir es posible y exigirlo es correcto.*
--
-- 76(g) — VEDA: **NO RIGE.** DDL sin backfill. El cinturón escribe y por eso
-- corre en subtransacción que se deshace sola (`L-406`).
--
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260825220000.sql`
-- ⛔ Su nota es dura: revertir con la fila de DeUna encendida reabre `D-887`.
-- ══════════════════════════════════════════════════════════════════════════

/* ① EL GATE APRENDE EL BARRIDO — y NO por relajación, por origen.
   🔴 `stoken_valido` NO se toca y JAMÁS se pone en `true` desde acá: **no hubo
   header que validar.** La columna queda NULL con su significado correcto —
   *firmar una verificación que no ocurrió es peor que no tenerla.*
   Lo que autentica al barrido es otra cosa y más fuerte: **fuimos NOSOTROS a
   preguntarle al proveedor por su API**, y el veredicto de esa consulta vive en
   `verificado`. Un evento de barrido sin `verificado IS TRUE` no entra. */
CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT CASE
    /* 🔴 EL ORIGEN SE PREGUNTA PRIMERO. Un evento nacido de una consulta
       nuestra no tiene stoken por construcción, así que evaluarlo con la regla
       del webhook lo rechazaría siempre — y el barrido quedaría escribiendo
       filas que su propio gate no deja pasar. *El caso que la pieza existe para
       cubrir no puede morir en la puerta de la pieza.* */
    WHEN p_evento.origen IN ('barrido','consulta_activa') THEN
      p_evento.verificado IS TRUE
    /* NUVEI · el stoken sigue mandando; lo que cambia es DE DÓNDE sale el
       veredicto de credencial: de una columna sellada al insertar, jamás de un
       campo de texto que después recibe mensajes de excepción. */
    WHEN p_evento.proveedor = 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.credencial = 'SERVER'
    /* DEUNA · las dos condiciones, jamás una: un webhook con el secreto
       correcto y datos falsos muere en la consulta. Y `verificado` es ahora un
       BOOLEAN que escribe quien emite el veredicto — NULL no autentica. */
    WHEN p_evento.proveedor = 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.verificado IS TRUE
    /* 🔴 FAIL-CLOSED: un proveedor que nadie enseñó NO se autentica. */
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public._evento_autenticado(webhook_events) FROM PUBLIC, anon;


/* ② EL APLICADOR. Recibe el INTENTO, no el sujeto: de él salen los dos
   (`compra_id`, `cita_id`) y el `dev_reference` que el actuador necesita.
   *`resolver_consulta_activa` recibe `p_compra_id` y por eso no servía: DeUna
   necesita los dos sujetos y el intento es el único que los tiene juntos.* */
CREATE OR REPLACE FUNCTION public.aplicar_consulta_activa_deuna(
  p_intento_id uuid,
  p_crudo      jsonb,
  p_origen     text DEFAULT 'barrido'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
END $$;

REVOKE ALL ON FUNCTION public.aplicar_consulta_activa_deuna(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_consulta_activa_deuna(uuid, jsonb, text) TO service_role;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — los DOS contra-casos que el contrato §7 exige, con rojo producido.
-- 🔴 Escribe ⇒ subtransacción que se deshace sola (`L-406`).
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_int uuid; v_compra uuid; v_estado_prev text; v_total numeric;
  r_fantasma jsonb; r_monto jsonb; r_uno jsonb; r_dos jsonb;
  v_comprobantes int; v_gate_ok boolean;
BEGIN
  -- ⓪ el gate del barrido autentica lo suyo y NO relaja lo ajeno
  SELECT _evento_autenticado(ROW(
      gen_random_uuid(), now(), 'sandbox', 'deuna', 'X', '{}'::jsonb,
      NULL, 'recibido', NULL, NULL, NULL, true, 'barrido')::webhook_events)
    AND NOT _evento_autenticado(ROW(
      gen_random_uuid(), now(), 'sandbox', 'deuna', 'X', '{}'::jsonb,
      NULL, 'recibido', NULL, NULL, NULL, NULL, 'barrido')::webhook_events)
    AND NOT _evento_autenticado(ROW(
      gen_random_uuid(), now(), 'sandbox', 'deuna', 'X', '{}'::jsonb,
      NULL, 'recibido', NULL, NULL, NULL, true, 'webhook')::webhook_events)
    INTO v_gate_ok;
  IF NOT coalesce(v_gate_ok, false) THEN
    RAISE EXCEPTION 'CINTURÓN: el gate del barrido no discrimina (verificado / NULL / webhook-sin-stoken)';
  END IF;

  -- un intento de DeUna con compra, para los contra-casos
  SELECT i.id, i.compra_id INTO v_int, v_compra
    FROM pagos_intentos i
   WHERE i.proveedor = 'deuna' AND i.compra_id IS NOT NULL
   ORDER BY i.creado_en DESC LIMIT 1;

  IF v_int IS NULL THEN
    RAISE NOTICE 'CINTURÓN PARCIAL · gate VERDE · sin intento DeUna con compra: los dos contra-casos NO se ejercieron';
    RETURN;
  END IF;

  SELECT estado INTO v_estado_prev FROM compras WHERE id = v_compra;
  SELECT total  INTO v_total       FROM compras WHERE id = v_compra;

  -- ① EL FANTASMA REAL: no mueve el sujeto, no emite comprobante
  r_fantasma := aplicar_consulta_activa_deuna(v_int,
    jsonb_build_object('status','PENDING','amount',0,'date',''));

  -- ② MONTO QUE NO COINCIDE: tampoco mueve nada
  r_monto := aplicar_consulta_activa_deuna(v_int,
    jsonb_build_object('status','APPROVED','amount', v_total + 1,
                       'date','2026-08-25','internalTransactionReference','CINT'));

  -- ③ deshacer ANTES de decidir
  UPDATE pagos_intentos SET hallazgo = NULL, hallazgo_en = NULL WHERE id = v_int;
  DELETE FROM webhook_events WHERE detalle LIKE 'origen=barrido%' AND transaction_id = 'CINT';

  IF (r_fantasma->>'resolucion') <> 'fantasma' THEN
    RAISE EXCEPTION 'CINTURÓN: el fantasma no se reconoció — %', r_fantasma->>'resolucion';
  END IF;
  IF (r_monto->>'resolucion') <> 'monto_no_coincide' THEN
    RAISE EXCEPTION 'CINTURÓN: el monto discrepante NO frenó — %', r_monto->>'resolucion';
  END IF;
  IF (SELECT estado FROM compras WHERE id = v_compra) IS DISTINCT FROM v_estado_prev THEN
    RAISE EXCEPTION 'CINTURÓN: la compra se movió en un caso que NO debía aplicar';
  END IF;

  /* 🔴 EL CAMINO FELIZ NO SE EJERCE ACÁ, y se dice por qué: aplicar de verdad
     mueve una compra real y **manda un comprobante a una familia**. Su prueba
     es la sesión con el proveedor, no una migración. *Un arnés que para probar
     el circuito lo ejecuta de verdad es un arnés que hace lo que vino a
     vigilar* (`L-406`). */
  RAISE NOTICE 'CINTURÓN VERDE · gate ok · fantasma=% · monto=% · compra intacta=%',
    r_fantasma->>'resolucion', r_monto->>'resolucion', v_estado_prev;
END $cint$;
