-- ═══════════════════════════════════════════════════════════════════════════
-- S109-B · EL BARRIDO DEJA DE ENCONTRAR LO QUE NO PUEDE APLICAR
--
-- 🔴 EL HUECO, y por qué importa hoy y no mañana: **cita cobra desde S101;
--    bono y mensualidad desde S108.** Los tres —y ahora `programa`— pueden
--    quedar con un cobro hecho del lado del proveedor y **ningún rescate si el
--    webhook se interrumpe**. Queda una fila pagada que nada mueve, y del otro
--    lado *una familia que pagó y no recibió*.
--    S108-B2 curó el LECTOR (ve los siete por catálogo). **Los APLICADORES
--    seguían en dos.**
--
-- 🔴 LO QUE NO SE HACE, Y ES LO QUE MANTIENE UNA SOLA VERDAD: **no se
--    reimplementa cómo se mueve cada sujeto.** `aplicar_consulta_activa_deuna`
--    ya tenía la forma correcta —inserta un `webhook_events` VERIFICADO y llama
--    a `aplicar_evento_de_pago`, que conoce los siete— y `_evento_autenticado`
--    ya contempla ese camino (`origen IN ('barrido','consulta_activa') ⇒
--    verificado`). *Duplicar los movimientos acá sería una segunda verdad sobre
--    qué significa que algo se pagó.*
--    ⇒ Lo único que se ensancha es **a qué sujetos se les permite pasar**.
--
-- 🔴 Y EL MONTO SE VERIFICA PARA LOS SIETE, contra su desglose CONGELADO.
--    Medido: los siete tienen tabla de desglose. *Confirmar sin comparar sería
--    creerle al proveedor un número que nosotros nunca prometimos — y acá no
--    hay webhook que ya lo haya validado: por eso el barrido existe.*
--
-- 🔴 VEDA 76(g): NO RIGE. Dos funciones nuevas + `CREATE OR REPLACE` de una.
--    Cero DDL de tablas, cero backfill.
--
-- REVERSA: docs/relevamientos/2026-09-05-s109b-REVERSA-M1.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL TOTAL CONGELADO, PARA CUALQUIER SUJETO ────────────────────────────
CREATE OR REPLACE FUNCTION public._total_congelado_del_intento(p_intento uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  /* 🔴 UN `CASE` EXPLÍCITO Y NO SQL DINÁMICO SOBRE EL CATÁLOGO — decisión, no
     comodidad: esto decide si se confirma un cobro, y **en código de plata gana
     lo que se puede leer de un vistazo**. El olvido lo cubre el guard de ②, que
     revienta al aplicar; la elegancia no valía el riesgo de revisión.
     🔴 NULL significa «no sé», y quien llama DEBE tratarlo como negativa. */
  SELECT CASE
    WHEN i.pedido_id IS NOT NULL THEN
      /* La compra tiene una línea POR PEDIDO ⇒ se SUMAN: el cobro es de la
         compra entera, no de un pedido. Y se lee por `compra_id`, que es la
         clave del desglose, no por el sujeto del XOR. */
      (SELECT sum(d.total) FROM compra_desglose d WHERE d.compra_id = i.compra_id)
    WHEN i.cita_id IS NOT NULL THEN
      (SELECT d.total FROM cita_desglose d WHERE d.cita_id = i.cita_id)
    WHEN i.bono_id IS NOT NULL THEN
      (SELECT d.total FROM bono_desglose d WHERE d.bono_id = i.bono_id)
    WHEN i.guarderia_suscripcion_id IS NOT NULL THEN
      (SELECT d.total FROM guarderia_suscripcion_desglose d
        WHERE d.guarderia_suscripcion_id = i.guarderia_suscripcion_id
          AND d.periodo = i.guarderia_suscripcion_periodo)
    WHEN i.recurrencia_id IS NOT NULL THEN
      (SELECT d.total FROM recurrencia_desglose d
        WHERE d.recurrencia_id = i.recurrencia_id AND d.periodo = i.recurrencia_periodo)
    WHEN i.suscripcion_servicio_id IS NOT NULL THEN
      (SELECT d.total FROM suscripcion_desglose d
        WHERE d.suscripcion_servicio_id = i.suscripcion_servicio_id
          AND d.periodo = i.suscripcion_periodo)
    WHEN i.programa_contratado_id IS NOT NULL THEN
      (SELECT d.total FROM programa_desglose d
        WHERE d.programa_contratado_id = i.programa_contratado_id)
    ELSE NULL
  END
  FROM pagos_intentos i WHERE i.id = p_intento;
$fn$;

-- ── ② EL GUARD: NINGÚN SUJETO SIN SU FUENTE CONGELADA ──────────────────────
CREATE OR REPLACE FUNCTION public.verificar_cobertura_desgloses()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_def text; v_faltan text[] := '{}'; v_c record;
BEGIN
  v_def := pg_get_functiondef('public._total_congelado_del_intento(uuid)'::regprocedure);
  FOR v_c IN SELECT codigo, columna_intento FROM cat_sujetos_de_pago LOOP
    /* Se pregunta por la COLUMNA del XOR, que es la llave con la que el `CASE`
       discrimina. Si el sujeto nuevo no aparece, su rama no existe. */
    IF position('i.' || v_c.columna_intento IN v_def) = 0 THEN
      v_faltan := v_faltan || v_c.codigo;
    END IF;
  END LOOP;

  IF array_length(v_faltan,1) IS NOT NULL THEN
    RAISE EXCEPTION 'cobertura_desgloses: % no tiene rama en '
      '_total_congelado_del_intento — el barrido no podría verificar su monto y '
      'lo rebotaría como «sin desglose» sin que nadie sepa por qué', v_faltan
      USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true,
    'sujetos', (SELECT count(*) FROM cat_sujetos_de_pago));
END $fn$;

COMMENT ON FUNCTION public.verificar_cobertura_desgloses() IS
  'S109-B · exige que TODO sujeto catalogado tenga su rama en '
  '_total_congelado_del_intento. Se corre en toda migración que agregue un '
  'sujeto — hermana de verificar_cobertura_sujetos_de_pago().';

REVOKE ALL ON FUNCTION public._total_congelado_del_intento(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_cobertura_desgloses() FROM anon, authenticated, PUBLIC;

-- ── ③ EL APLICADOR DE DEUNA — de dos sujetos a los siete ───────────────────
CREATE OR REPLACE FUNCTION public.aplicar_consulta_activa_deuna(p_intento_id uuid, p_crudo jsonb, p_origen text DEFAULT 'barrido'::text, p_ambiente text DEFAULT 'sandbox'::text)
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

  /* ⑤ QUÉ SUJETO ES — POR CATÁLOGO, jamás por una cadena de `IF`.
     🔴 La versión anterior enumeraba a mano y decía, con razón, que un `else`
     con cuatro sujetos «es una adivinanza que compila». **Hoy son SIETE**, y
     una cadena de siete tiene el mismo problema con más ramas: cada sujeto
     nuevo obliga a que alguien se acuerde de este archivo, y *el olvido no da
     síntoma — da un `sujeto_indeterminado` que se lee como «raro» y no como
     «me falta una rama»*.
     ⇒ Se resuelve con `cat_sujetos_de_pago`, el mismo catálogo que el lector
     del barrido y que `verificar_cobertura_sujetos_de_pago()` obliga a
     mantener a la par del XOR. **Agregar un sujeto es agregar una fila.** */
  SELECT c.codigo, (to_jsonb(v_i) ->> c.columna_intento)::uuid
    INTO v_sujeto, v_sujeto_id
    FROM cat_sujetos_de_pago c
   WHERE to_jsonb(v_i) ->> c.columna_intento IS NOT NULL
   LIMIT 1;

  IF v_sujeto IS NULL THEN
    /* Fail-closed y RUIDOSO: si el catálogo no lo nombra, no se aplica nada.
       Es el mismo `sin_resolver` del lector, del lado del aplicador. */
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sujeto_indeterminado',
      'nota', 'ningún sujeto del catálogo coincide con este intento');
  END IF;

  /* ⑥ IDEMPOTENCIA — UNIFORME, por el INTENTO y no por cada sujeto.
     🔴 La versión anterior preguntaba «¿la compra está pagada?» / «¿la cita
     está pagada?»: una condición POR SUJETO, o sea otra lista que crece con
     cada uno. Se pregunta por lo único común: **si este intento ya se aprobó,
     ya se aplicó.** Y el actuador conserva sus chequeos por sujeto como
     respaldo — *dos redes, no dos verdades: ésta evita el viaje, la de él
     evita el doble movimiento.* */
  IF v_i.estado = 'aprobado' THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada',
      'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id, 'sujeto_movido', false);
  END IF;

  /* ⑦ 🔴 EL MONTO CONTRA EL DESGLOSE CONGELADO — **no es opcional y es la
     razón de ser de todo esto.** *Confirmar sin comparar sería creerle al
     proveedor un número que nosotros nunca prometimos* — y acá **no hay webhook
     que ya lo haya validado**: por eso el barrido existe.
     🔴 Y ahora vale para los SIETE: `_total_congelado_del_intento` sabe de qué
     tabla sale el número de cada uno, y `verificar_cobertura_desgloses()`
     revienta al aplicar si alguno se queda sin rama. */
  v_recibido := NULLIF(p_crudo->>'amount','')::numeric;
  v_esperado := public._total_congelado_del_intento(p_intento_id);

  IF v_esperado IS NULL THEN
    /* NULL es «no sé», y «no sé» NO confirma. */
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
          /* 🔴 EL BUG QUE MATÓ EL PASO 5, y su cura no es poner una constante.
             `pagos_intentos` **no tiene columna `ambiente`** —medido: no la
             tiene y nunca la tuvo— así que `v_i.ambiente` reventaba en
             ejecución con `record "v_i" has no field "ambiente"`. *No era un
             rebote tipado: era el pago quedándose sin aplicar.*

             Y hardcodear `'sandbox'` habría funcionado hoy y **mentido el día
             de producción**. Medido: **nadie más en SQL decide el ambiente** —
             lo sabe la EDGE, que es la única que conoce contra qué host habló.
             Por eso es PARÁMETRO. El default existe para no romper al llamador
             de hoy, no porque el motor sepa la respuesta. */
          p_ambiente,
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
END $function$;

-- ── ④ EL APLICADOR DE NUVEI — el que no existía ────────────────────────────
/* 🔴 POR QUÉ NACE UNO NUEVO Y NO SE ENSANCHA `resolver_consulta_activa`:
   esa función está TECLEADA POR COMPRA (`p_compra_id`) y es **el único camino
   de Nuvei que hoy funciona y está ejercido**. Reescribirla para que reciba un
   intento sería tocar el riel vivo de compras para arreglar el de los otros
   seis. ⇒ El aplicador nuevo recibe el INTENTO —como el de DeUna— y **para la
   compra DELEGA en la vieja**: una sola entrada para el barrido, cero
   duplicación del camino probado.
   *Dos funciones que hacen lo mismo son dos verdades; una que llama a la otra
   es una sola con dos puertas.* */
CREATE OR REPLACE FUNCTION public.aplicar_consulta_activa_nuvei(
  p_intento_id uuid, p_crudo jsonb,
  p_origen text DEFAULT 'barrido', p_ambiente text DEFAULT 'sandbox'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_sujeto_id uuid;
  v_esperado numeric; v_recibido numeric; v_ev uuid; v_res jsonb;
  v_ahora timestamptz := now();
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  IF p_origen NOT IN ('barrido','consulta_activa') THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'origen_no_permitido');
  END IF;

  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'intento_no_existe');
  END IF;
  IF v_i.proveedor <> 'nuvei' THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'otro_proveedor',
                              'proveedor', v_i.proveedor);
  END IF;
  /* 🔴 Un intento reversado NO se re-confirma: la plata ya volvió. Mismo guard
     que `D-916` puso en las tres ramas del actuador. */
  IF v_i.estado IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'intento_terminal',
                              'estado', v_i.estado);
  END IF;

  -- El sujeto, POR CATÁLOGO.
  SELECT c.codigo, (to_jsonb(v_i) ->> c.columna_intento)::uuid
    INTO v_sujeto, v_sujeto_id
    FROM cat_sujetos_de_pago c
   WHERE to_jsonb(v_i) ->> c.columna_intento IS NOT NULL
   LIMIT 1;
  IF v_sujeto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sujeto_indeterminado');
  END IF;

  /* 🔴 LA COMPRA VA POR SU CAMINO DE SIEMPRE. `resolver_consulta_activa` hace
     más que mover el sujeto y está ejercida; no se la reemplaza por gusto de
     uniformidad. */
  IF v_sujeto = 'pedido' AND v_i.compra_id IS NOT NULL THEN
    RETURN resolver_consulta_activa(v_i.compra_id, p_crudo, p_origen)
           || jsonb_build_object('delegado_en', 'resolver_consulta_activa');
  END IF;

  IF NOT _pago_aprobado(p_crudo) THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'no_aprobado',
      'status', p_crudo->'transaction'->>'status', 'sujeto_movido', false);
  END IF;

  -- Idempotencia por el INTENTO, uniforme.
  IF v_i.estado = 'aprobado' THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada',
      'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id, 'sujeto_movido', false);
  END IF;

  -- El monto contra el desglose CONGELADO. NULL no confirma.
  v_recibido := NULLIF(p_crudo->'transaction'->>'amount','')::numeric;
  v_esperado := public._total_congelado_del_intento(p_intento_id);
  IF v_esperado IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'resolucion', 'sin_desglose',
      'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id);
  END IF;
  IF v_recibido IS DISTINCT FROM v_esperado THEN
    UPDATE pagos_intentos SET hallazgo = 'monto_no_coincide', hallazgo_en = v_ahora,
           actualizado_en = v_ahora WHERE id = p_intento_id;
    RETURN jsonb_build_object('ok', false, 'resolucion', 'monto_no_coincide',
      'esperado', v_esperado, 'recibido', v_recibido, 'sujeto_movido', false);
  END IF;

  /* Alimenta al actuador con la respuesta VERIFICADA. Para Nuvei el actuador
     lee `payload->'transaction'`, así que el crudo va tal cual — darle otra
     forma sería hacerle creer que hubo un webhook.
     `stoken_valido` NULL a propósito: no hubo header que validar. Lo que
     autentica es `origen='barrido' + verificado=true`, que es la regla que
     `_evento_autenticado` ya contempla para este camino. */
  INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                              resultado, origen, verificado, stoken_valido, detalle)
  VALUES ('nuvei', p_ambiente,
          coalesce(p_crudo->'transaction'->>'id', v_i.proveedor_transaction_id),
          p_crudo, 'recibido', p_origen, true, NULL,
          'origen=' || p_origen || ' · consulta verificada contra /v2/transaction')
  RETURNING id INTO v_ev;

  v_res := aplicar_evento_de_pago(v_ev);

  /* El sello del camino: este cobro NO entró por un webhook — entró porque
     fuimos a preguntar. El campo existe para poder auditarlo. */
  UPDATE pagos_intentos
     SET confirmado_por = 'consulta_activa', hallazgo = 'confirmado_tardio',
         hallazgo_en = v_ahora, actualizado_en = v_ahora
   WHERE id = p_intento_id AND estado = 'aprobado';

  RETURN jsonb_build_object(
    'ok', coalesce((v_res->>'aplicado')::boolean, false),
    'resolucion', CASE WHEN coalesce((v_res->>'aplicado')::boolean, false)
                       THEN 'confirmado_tardio' ELSE coalesce(v_res->>'motivo','?') END,
    'sujeto', v_sujeto, 'sujeto_id', v_sujeto_id,
    'evento_id', v_ev, 'actuador', v_res);
END $fn$;

REVOKE ALL ON FUNCTION public.aplicar_consulta_activa_nuvei(uuid, jsonb, text, text)
  FROM anon, authenticated, PUBLIC;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_r jsonb; v_grito text; v_bono uuid; v_i uuid; v_user uuid; v_total numeric;
  v_pres uuid; v_fam uuid; v_ps uuid; v_n int;
BEGIN
  -- ── (a) CONTROL POSITIVO: el guard aprueba los siete de hoy ──────────────
  v_r := verificar_cobertura_desgloses();
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: el guard no aprueba el estado vigente · %', v_r;
  END IF;
  IF (v_r->>'sujetos')::int <> (SELECT count(*) FROM cat_sujetos_de_pago) THEN
    RAISE EXCEPTION 'CINTURON: el guard cuenta distinto que el catálogo';
  END IF;

  -- ── (b) ROJO: un sujeto catalogado SIN rama ─────────────────────────────
  /* Se simula al revés —se agrega un sujeto que el `CASE` no puede conocer—
     porque es la dirección real del olvido: primero nace la columna, después
     alguien se acuerda del resto. */
  BEGIN
    INSERT INTO cat_sujetos_de_pago (codigo, columna_intento, descripcion)
    VALUES ('sujeto_de_prueba','columna_que_no_existe_id','CINTURON');
    PERFORM verificar_cobertura_desgloses();
    RAISE EXCEPTION 'CINTURON: el guard APROBÓ con un sujeto sin rama';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    GET STACKED DIAGNOSTICS v_grito = MESSAGE_TEXT;
    IF v_grito NOT LIKE '%sujeto_de_prueba%' THEN
      RAISE EXCEPTION 'CINTURON: gritó por otra cosa · %', v_grito;
    END IF;
  END;
  IF EXISTS (SELECT 1 FROM cat_sujetos_de_pago WHERE codigo='sujeto_de_prueba') THEN
    RAISE EXCEPTION 'CINTURON: la fila de prueba quedó en el catálogo';
  END IF;

  -- ── (c) EL DISCRIMINADOR: un BONO llega hasta el monto ───────────────────
  /* 🔴 Antes de esta migración un bono devolvía `sujeto_indeterminado` y no
     pasaba de ahí. Se FABRICA el caso —bono `pendiente`, cuyo trigger congela
     su desglose— y se exige que el aplicador llegue a comparar el monto.
     *Que no diga `sujeto_indeterminado` es lo único que prueba que el sujeto
     entró; un `ok:false` cualquiera no distingue una cosa de la otra.* */
  SELECT b.prestador_id, b.familia_id, b.user_id, b.prestador_servicio_id
    INTO v_pres, v_fam, v_user, v_ps
    FROM bonos b WHERE b.tipo_servicio='guarderia_dia' LIMIT 1;
  IF v_pres IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin bono con que DISCRIMINAR';
  END IF;

  INSERT INTO bonos (prestador_id, user_id, familia_id, tipo_servicio, descripcion,
                     unidades_total, unidades_usadas, precio_total, precio_por_unidad,
                     fecha_compra, fecha_vencimiento, estado, estado_pago,
                     country_code, prestador_servicio_id)
  VALUES (v_pres, v_user, v_fam, 'guarderia_dia', 'CINTURON s109b', 5, 0, 40, 8,
          current_date, current_date + 30, 'activo', 'pendiente', 'EC', v_ps)
  RETURNING id INTO v_bono;

  v_total := (SELECT total FROM bono_desglose WHERE bono_id = v_bono);
  IF v_total IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el trigger no congeló el desglose del bono de prueba';
  END IF;

  INSERT INTO pagos_intentos (proveedor, monto, forma, clave_idempotencia, bono_id,
                              estado, referencia_corta, pagador_user_id, pagador_origen)
  VALUES ('deuna', v_total, 'codigo_push', 'cint:s109b:'||gen_random_uuid(), v_bono,
          'pendiente', 'cint-'||substr(gen_random_uuid()::text,1,8), v_user, 'sesion')
  RETURNING id INTO v_i;

  -- el total congelado se resuelve para un sujeto que ANTES no tenía camino
  IF public._total_congelado_del_intento(v_i) IS DISTINCT FROM v_total THEN
    RAISE EXCEPTION 'CINTURON: el total congelado del BONO no se resolvió (esperaba %)', v_total;
  END IF;

  -- y el aplicador llega al monto en vez de rebotar por sujeto
  v_r := aplicar_consulta_activa_deuna(v_i, jsonb_build_object('status','APPROVED','amount', v_total + 1), 'barrido');
  IF v_r->>'resolucion' = 'sujeto_indeterminado' THEN
    RAISE EXCEPTION 'CINTURON: el BONO sigue sin camino en el aplicador de DeUna';
  END IF;
  IF v_r->>'resolucion' <> 'monto_no_coincide' THEN
    RAISE EXCEPTION 'CINTURON: esperaba monto_no_coincide, dio % · %', v_r->>'resolucion', v_r;
  END IF;

  -- ── (d) FAIL-CLOSED: sin desglose, NO se confirma ────────────────────────
  DELETE FROM bono_desglose WHERE bono_id = v_bono;
  UPDATE pagos_intentos SET hallazgo=NULL, hallazgo_en=NULL WHERE id=v_i;
  v_r := aplicar_consulta_activa_deuna(v_i, jsonb_build_object('status','APPROVED','amount', v_total), 'barrido');
  IF v_r->>'resolucion' <> 'sin_desglose' THEN
    RAISE EXCEPTION 'CINTURON: sin desglose congelado NO rebotó — dio %', v_r->>'resolucion';
  END IF;

  -- ── (e) permisos ────────────────────────────────────────────────────────
  IF has_function_privilege('authenticated','public.aplicar_consulta_activa_nuvei(uuid,jsonb,text,text)','EXECUTE')
     OR has_function_privilege('authenticated','public._total_congelado_del_intento(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: piezas del barrido ejecutables desde el bundle';
  END IF;

  -- ── (f) residuo ─────────────────────────────────────────────────────────
  DELETE FROM pagos_intentos WHERE id = v_i;
  DELETE FROM bonos WHERE id = v_bono;
  SELECT count(*) INTO v_n FROM bonos WHERE descripcion='CINTURON s109b';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: quedó residuo (% bonos)', v_n; END IF;

  RAISE NOTICE 'CINTURON S109B OK · guard positivo · rojo del sujeto sin rama · el BONO llega al monto · fail-closed sin desglose · permisos · residuo 0';
END $cinturon$;
