-- ═══ ARNÉS · LAS TRES RESOLUCIONES DE LA CONSULTA ACTIVA ════════════════════
-- In-txn con ROLLBACK. Autosuficiente: crea la pieza adentro — *la migración
-- sigue SIN APLICAR y probarla no puede ser una vía lateral para instalarla.*
BEGIN;
CREATE TEMP TABLE _r(caso text, esperado text, obtenido text, veredicto text);

CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(
  p_minutos_de_gracia integer DEFAULT 10
) RETURNS TABLE (compra_id uuid, transaction_id text, monto numeric, creado_en timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  -- Compras que intentaron pagar y no llegaron a `pagada`, con un intento que
  -- YA tiene id de transacción del proveedor: sin ese id no hay a quién
  -- preguntarle, y un intento recién nacido todavía puede estar en vuelo —
  -- de ahí los minutos de gracia.
  SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.proveedor_transaction_id IS NOT NULL
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
   ORDER BY i.creado_en;
$$;

-- ── ② EL RESOLVEDOR ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_consulta_activa(
  p_compra_id uuid,
  p_crudo     jsonb,
  p_origen    text DEFAULT 'barrido'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_estado  text;
  v_tx      text;
  v_auth    text;
  v_monto   numeric;
  v_compra  record;
  v_res     jsonb;
  v_user    uuid;
  v_resol   text;
BEGIN
  -- Puerta de servidor: este camino confirma pagos.
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'consulta_activa_no_es_del_cliente' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_compra.id IS NULL THEN
    RAISE EXCEPTION 'compra_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Idempotencia: si ya está pagada, esto no hace nada. El barrido puede correr
  -- dos veces sin consecuencias.
  IF v_compra.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada');
  END IF;

  v_estado := p_crudo->'transaction'->>'status';
  v_tx     := p_crudo->'transaction'->>'id';
  v_auth   := p_crudo->'transaction'->>'authorization_code';
  v_monto  := NULLIF(p_crudo->'transaction'->>'amount','')::numeric;

  IF v_estado = '1' THEN
    -- ══ CONFIRMADO TARDÍO ══════════════════════════════════════════════════
    -- El proveedor dice que sí y nosotros no lo sabíamos. `confirmado_por` lo
    -- deja escrito: sin ese dato no se puede auditar cuál de los cuatro casos
    -- ocurrió (letra §4).
    v_res := confirmar_pago_compra(
      p_compra_id          => p_compra_id,
      p_proveedor          => 'nuvei',
      p_referencia         => v_tx,
      p_clave_idempotencia => 'ca:' || COALESCE(v_tx, p_compra_id::text),
      p_payload            => p_crudo,
      p_confirmado_por     => 'consulta_activa',
      p_transaction_id     => v_tx,
      p_monto              => v_monto,
      p_authorization_code => v_auth,
      p_marca              => p_crudo->'card'->>'type',
      p_bin                => p_crudo->'card'->>'bin',
      p_ultimos4           => p_crudo->'card'->>'number');
    v_resol := 'confirmado_tardio';

    -- El comprobante también nace acá: **la familia no tiene por qué saber si
    -- su pago se confirmó por webhook o porque fuimos a preguntar.** Mismo
    -- `clave_dedup` que el actuador ⇒ si los dos caminos corren, va UN correo.
    IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
      SELECT user_id INTO v_user FROM compras WHERE id = p_compra_id;
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => jsonb_build_object('transaction_id', v_tx,
                     'authorization_code', v_auth, 'monto', v_monto,
                     'moneda', v_compra.moneda, 'compra_id', p_compra_id),
        p_clave_dedup => 'comprobante:' || p_compra_id::text);
    END IF;
  ELSE
    -- ══ 🔴 TODO LO DEMÁS: SE ESCALA, NO SE DECIDE ══════════════════════════
    -- `huerfano_escalado` cubre el no-encontrado, el estado que no conocemos y
    -- el rechazo aparente. **No se marca la compra de ninguna forma**: sigue
    -- esperando, y una persona mira el crudo.
    -- *La diferencia entre «el banco dijo que no» y «no pudimos averiguarlo» no
    -- la puede resolver un barrido, y fingir que sí es lo que hace que alguien
    -- pague dos veces algo que ya pagó.*
    v_resol := 'huerfano_escalado';
  END IF;

  -- La traza va SIEMPRE, resuelva o escale: es la única prueba de qué dijo el
  -- proveedor y cuándo se lo preguntamos.
  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
  SELECT i.id, 'nuvei', 'consulta_activa',
         jsonb_build_object('crudo', p_crudo, 'resolucion', v_resol, 'origen', p_origen),
         'ca:' || COALESCE(v_tx, p_compra_id::text) || ':' || i.id::text, now()
    FROM pagos_intentos i WHERE i.compra_id = p_compra_id
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'resolucion', v_resol,
                            'compra_id', p_compra_id, 'transaction_id', v_tx);
END $$;

REVOKE ALL ON FUNCTION public.pagos_pendientes_de_conciliar(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pagos_pendientes_de_conciliar(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) TO service_role;



DO $$
DECLARE
  v_compra uuid; v_res jsonb; v_estado text; v_n int; v_correos int;
  v_crudo_ok jsonb; v_crudo_mal jsonb; v_tx text;
BEGIN
  SELECT c.id INTO v_compra FROM compras c
   WHERE c.estado='esperando_pago'
     AND EXISTS (SELECT 1 FROM pedidos p WHERE p.compra_id=c.id)
     AND EXISTS (SELECT 1 FROM compra_desglose d WHERE d.compra_id=c.id)
   ORDER BY c.created_at DESC LIMIT 1;
  IF v_compra IS NULL THEN RAISE EXCEPTION 'ARNÉS: no hay compra cobrable'; END IF;

  -- 🔴 Se aparta la mercadería adentro del arnés. **No es decoración del
  --    fixture**: el motor se niega a confirmar un pago sin stock reservado
  --    (`pago_sin_reserva`, guard de S95-K) — *confirmarlo dejaría el pedido
  --    listo para preparar sin mercadería apartada*. El arnés chocó contra ese
  --    guard, que es exactamente lo que un guard tiene que hacer.
  --    Y se usa `reservar_stock_pedido` y no `crear_intento_pago` porque esa
  --    puerta exige sesión de persona y este arnés corre sin ninguna.
  PERFORM reservar_stock_pedido(p.id, 30) FROM pedidos p WHERE p.compra_id = v_compra;

  v_tx := 'DF-CA-'||substr(gen_random_uuid()::text,1,8);

  -- El crudo con forma de respuesta REAL del proveedor.
  v_crudo_ok := jsonb_build_object(
    'transaction', jsonb_build_object('id',v_tx,'status','1',
      'amount',(SELECT total FROM compras WHERE id=v_compra),
      'authorization_code','RqRvA2','current_status','APPROVED'),
    'card', jsonb_build_object('bin','411111','type','vi','number','1111'));
  v_crudo_mal := jsonb_build_object(
    'transaction', jsonb_build_object('id',v_tx,'status','2',
      'current_status','CANCELLED','message','Reverse by mock'));

  -- ══ ④ HUÉRFANO: el proveedor no dice que sí ⇒ ESCALA, NO RECHAZA ═════════
  v_res := resolver_consulta_activa(v_compra, v_crudo_mal, 'arnes');
  SELECT estado INTO v_estado FROM compras WHERE id=v_compra;
  INSERT INTO _r VALUES ('④ huérfano · el barrido NO decide',
    'resolucion=huerfano_escalado · la compra NO se mueve',
    'resolucion='||(v_res->>'resolucion')||' · compra '||v_estado,
    CASE WHEN v_res->>'resolucion'='huerfano_escalado' AND v_estado='esperando_pago'
         THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ ② CONFIRMADO TARDÍO: el webhook nunca llegó, la consulta lo resuelve ══
  v_res := resolver_consulta_activa(v_compra, v_crudo_ok, 'arnes');
  SELECT estado INTO v_estado FROM compras WHERE id=v_compra;
  SELECT count(*) INTO v_correos FROM notificacion_intencion
   WHERE clave_dedup='comprobante:'||v_compra::text;
  INSERT INTO _r VALUES ('② confirmado tardío',
    'resolucion=confirmado_tardio · compra pagada · 1 comprobante',
    'resolucion='||(v_res->>'resolucion')||' · compra '||v_estado||' · correos='||v_correos,
    CASE WHEN v_res->>'resolucion'='confirmado_tardio' AND v_estado='pagada' AND v_correos=1
         THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ IDEMPOTENCIA: correr el barrido dos veces no hace nada ═══════════════
  v_res := resolver_consulta_activa(v_compra, v_crudo_ok, 'arnes');
  SELECT count(*) INTO v_correos FROM notificacion_intencion
   WHERE clave_dedup='comprobante:'||v_compra::text;
  INSERT INTO _r VALUES ('   ↳ el barrido corre dos veces',
    'ya_estaba_pagada · sigue 1 comprobante',
    (v_res->>'resolucion')||' · correos='||v_correos,
    CASE WHEN v_res->>'resolucion'='ya_estaba_pagada' AND v_correos=1 THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ LA TRAZA VA SIEMPRE, resuelva o escale ═══════════════════════════════
  SELECT count(*) INTO v_n FROM pagos_eventos e
    JOIN pagos_intentos i ON i.id=e.intento_id
   WHERE i.compra_id=v_compra AND e.tipo='consulta_activa';
  INSERT INTO _r VALUES ('   ↳ traza de lo que dijo el proveedor', '>=1', v_n::text,
    CASE WHEN v_n>=1 THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ EL LECTOR DE CANDIDATOS ══════════════════════════════════════════════
  SELECT count(*) INTO v_n FROM pagos_pendientes_de_conciliar(0);
  INSERT INTO _r VALUES ('   ↳ lector de candidatos', 'la pagada ya NO figura',
    (SELECT count(*)::text FROM pagos_pendientes_de_conciliar(0) WHERE compra_id=v_compra),
    CASE WHEN NOT EXISTS (SELECT 1 FROM pagos_pendientes_de_conciliar(0) WHERE compra_id=v_compra)
         THEN 'VERDE' ELSE '🔴 ROJO' END);
END $$;

SELECT caso, esperado, obtenido, veredicto FROM _r;
ROLLBACK;
