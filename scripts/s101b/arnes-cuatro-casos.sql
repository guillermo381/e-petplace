-- ═══ ARNÉS · LOS CUATRO CASOS DE LA LETRA §6 ════════════════════════════════
-- Todo in-txn con ROLLBACK. El fixture NO es inventado: es el **body real** del
-- callback del débito `DF-2098177`, el que el proveedor nos mandó y validó.
BEGIN;
CREATE TEMP TABLE _r(caso text, esperado text, obtenido text, veredicto text);

-- 🔴 EL ARNÉS ES AUTOSUFICIENTE: crea la pieza DENTRO de su propia transacción.
--    *La migración sigue SIN APLICAR y esperando firma — probar algo no puede
--     ser una vía lateral para instalarlo.*
INSERT INTO app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('pagos_actuador_vivo', 'false', 'booleano',
        'S101-B: si el actuador puede mover estados. APAGADO hasta arbitraje de mesa. '
        'Encenderlo confirma compras de verdad y dispara correos a familias reales.',
        -- 🔴 `integraciones` y no `pagos`: el CHECK de `categoria` tiene
        -- vocabulario CERRADO y `pagos` no está adentro. **Es la tercera vez en
        -- la jornada que invento un valor contra un CHECK** (el `resultado` del
        -- buzón y el estado del reservador fueron las otras dos).
        -- *Un vocabulario cerrado no se amplía de paso mientras construís otra
        -- cosa: se mide primero, y si de verdad falta un valor, eso es una
        -- decisión de letra con su propia firma.*
        'integraciones', false)
ON CONFLICT (clave) DO NOTHING;

-- ── ② EL ACTUADOR ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_e        record;
  v_vivo     boolean;
  v_compra   uuid;
  v_monto    numeric;
  v_estado   text;
  v_tx       text;
  v_auth     text;
  v_res      jsonb;
  v_user     uuid;
BEGIN
  SELECT * INTO v_e FROM webhook_events WHERE id = p_evento_id FOR UPDATE;
  IF v_e.id IS NULL THEN
    RAISE EXCEPTION 'evento_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 ① ¿ESTÁ ENCENDIDO? Se pregunta PRIMERO y se responde hablado: un
  --    actuador apagado que falla en silencio no se distingue de uno roto.
  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'pagos_actuador_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'actuador_apagado');
  END IF;

  -- 🔴 ② LA LEY: solo eventos autenticados con credencial SERVER.
  IF COALESCE(v_e.stoken_valido, false) IS NOT TRUE
     OR v_e.detalle NOT ILIKE '%credencial=SERVER%' THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'evento_no_autenticado_o_no_server');
  END IF;

  -- ③ El vínculo con nuestra compra es el `dev_reference`, que **nosotros**
  --    pusimos al crear el intento: es el id de LA COMPRA, jamás el de un pedido.
  v_compra := NULLIF(v_e.payload->'transaction'->>'dev_reference','')::uuid;
  IF v_compra IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'sin_dev_reference');
  END IF;

  v_estado := v_e.payload->'transaction'->>'status';
  v_monto  := NULLIF(v_e.payload->'transaction'->>'amount','')::numeric;
  v_tx     := v_e.payload->'transaction'->>'id';
  v_auth   := v_e.payload->'transaction'->>'authorization_code';

  -- ④ Solo el aprobado confirma. Todo lo demás **se registra y no mueve nada**:
  --    *un actuador que interpreta estados que no conoce es un actuador que
  --    inventa.* Lo desconocido queda visible, no absorbido.
  IF v_estado IS DISTINCT FROM '1' THEN
    UPDATE webhook_events
       SET resultado = 'desconocido',
           detalle = COALESCE(detalle,'') || ' · actuador: status=' || COALESCE(v_estado,'∅') || ' no confirma'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'status_no_aprobado', 'status', v_estado);
  END IF;

  -- ⑤ LA TRANSICIÓN. `confirmar_pago_compra` ya trae la idempotencia al grano
  --    de la compra (el caso ③ y el webhook tardío mueren ahí), la validación
  --    de monto, y el estampado de los datos de la pasarela.
  v_res := confirmar_pago_compra(
    p_compra_id           => v_compra,
    p_proveedor           => 'nuvei',
    p_referencia          => v_tx,
    p_clave_idempotencia  => 'wh:' || p_evento_id::text,
    p_payload             => v_e.payload,
    p_confirmado_por      => 'webhook',
    p_transaction_id      => v_tx,
    p_monto               => v_monto,
    p_authorization_code  => v_auth,
    p_marca               => v_e.payload->'card'->>'type',
    p_bin                 => v_e.payload->'card'->>'bin',
    p_ultimos4            => v_e.payload->'card'->>'number');

  -- ⑥ 🔴 EL COMPROBANTE — REQUISITO DE CERTIFICACIÓN DE NUVEI (Erick, 20-ago):
  --    *«necesitamos que ese correo adjunte esos 2 códigos»* — el id de
  --    transacción y el código de autorización.
  --
  --    **Lo dispara ACÁ, en la transición a confirmado — JAMÁS la señal
  --    optimista.** *Un correo sobre un pago que todavía no está confirmado
  --    sería exactamente la mentira que toda la letra prohíbe.*
  --
  --    Idempotente por `p_clave_dedup` anclada al EVENTO: un webhook duplicado
  --    no manda dos correos. Y el tipo `pago_confirmado` está **en sombra** en
  --    el catálogo, así que hoy se registra la intención y no sale nada —
  --    *el correo nace apagado por el mecanismo de la casa, no por uno mío.*
  IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
    SELECT user_id INTO v_user FROM compras WHERE id = v_compra;
    PERFORM registrar_intencion_notificacion(
      p_tipo               => 'pago_confirmado',
      p_destinatario_user_id => v_user,
      p_mascota_id         => NULL,
      p_evento_id          => NULL,
      p_datos              => jsonb_build_object(
                                'transaction_id',     v_tx,
                                'authorization_code', v_auth,
                                'monto',              v_monto,
                                'moneda',             (SELECT moneda FROM compras WHERE id = v_compra),
                                'compra_id',          v_compra),
      p_clave_dedup        => 'comprobante:' || v_compra::text);
  END IF;

  UPDATE webhook_events
     SET resultado = 'aplicado',
         detalle = COALESCE(detalle,'') || ' · actuador: ' || COALESCE(v_res::text,'')
   WHERE id = p_evento_id;

  RETURN jsonb_build_object('ok', true, 'aplicado', true, 'compra_id', v_compra,
                            'resultado', v_res);
END $$;

-- La puerta es del servidor. Nadie con sesión de persona la alcanza.
REVOKE ALL ON FUNCTION public.aplicar_evento_de_pago(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_evento_de_pago(uuid) TO service_role;



DO $$
DECLARE
  v_compra uuid; v_pedido uuid; v_ev1 uuid; v_ev2 uuid; v_res jsonb;
  v_body jsonb; v_estado text; v_n int; v_correos int; v_correos0 int;
  v_sku uuid; v_cuenta uuid; v_oferta uuid;
BEGIN
  -- ── el actuador se enciende SOLO adentro de esta transacción ───────────────
  -- *Probar un actuador apagado no prueba nada; y encenderlo fuera de una
  --  transacción que se deshace sería encenderlo de verdad.*
  UPDATE app_config SET valor='true' WHERE clave='pagos_actuador_vivo';

  -- ── la compra del laboratorio ────────────────────────────────────────────
  -- 🔴 Se toma una compra REAL en `esperando_pago` en vez de crear una: las
  --    puertas del cliente exigen `auth.uid()` y este arnés corre sin sesión.
  --    Todo pasa in-txn y se deshace — *tomar prestada una fila real y
  --    devolverla intacta es más honesto que fabricar una que el motor nunca
  --    habría producido.*
  SELECT c.id INTO v_compra FROM compras c
   WHERE c.estado='esperando_pago'
     AND EXISTS (SELECT 1 FROM pedidos p WHERE p.compra_id=c.id)
     AND EXISTS (SELECT 1 FROM compra_desglose d WHERE d.compra_id=c.id)
   ORDER BY c.created_at DESC LIMIT 1;
  IF v_compra IS NULL THEN RAISE EXCEPTION 'ARNÉS: no hay compra cobrable para el laboratorio'; END IF;

  -- ── el fixture: el crudo REAL, con el dev_reference apuntando a esta compra ─
  v_body := jsonb_build_object(
    'transaction', jsonb_build_object(
      -- 🔴 El id se VARÍA por corrida, y no por comodidad: `pagos_intentos`
      --    tiene un UNIQUE (proveedor, transaction_id, pedido_id) y el
      --    `DF-2098177` real **ya está tomado por el débito de verdad**.
      --    *Que rebote es una defensa buena: impide reaplicar la misma
      --    transacción del proveedor sobre otro pedido.* El resto del body
      --    sigue siendo el crudo real.
      'id','DF-ARNES-'||substr(gen_random_uuid()::text,1,8),'status','1','amount',(SELECT total FROM compras WHERE id=v_compra),
      'current_status','APPROVED','authorization_code','RqRvA2',
      'application_code','EPETPLACESTG-EC-SERVER','dev_reference',v_compra::text,
      'stoken','486ad60de297b3679ad410a4506e989a48220cad9e5eb2789c6ba86082ea894a',
      'status_detail','3','carrier','DataFast'),
    'user', jsonb_build_object('id','f8dad3bd-be28-4223-971e-6b49e2e140b2'),
    'card', jsonb_build_object('bin','411111','type','vi','number','1111'));

  SELECT count(*) INTO v_correos0 FROM notificacion_intencion
   WHERE clave_dedup = 'comprobante:'||v_compra::text;

  -- ══ CASO ① LLEGA EL WEBHOOK, EL TELÉFONO NO VOLVIÓ ════════════════════════
  INSERT INTO webhook_events (ambiente, proveedor, payload, transaction_id,
                              stoken_valido, resultado, detalle)
    VALUES ('sandbox','nuvei',v_body,'DF-ARNES',true,'recibido',
            'receta=hmac-sha256-v2 · credencial=SERVER · autenticado=true')
    RETURNING id INTO v_ev1;

  v_res := aplicar_evento_de_pago(v_ev1);
  SELECT estado INTO v_estado FROM compras WHERE id=v_compra;
  INSERT INTO _r VALUES ('① webhook sin teléfono', 'aplicado=true · compra pagada',
    'aplicado='||(v_res->>'aplicado')||' · compra '||v_estado,
    CASE WHEN (v_res->>'aplicado')::boolean AND v_estado='pagada' THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- el comprobante nació, con los dos códigos que Nuvei exige
  SELECT count(*) INTO v_correos FROM notificacion_intencion
   WHERE clave_dedup='comprobante:'||v_compra::text
     AND datos->>'transaction_id' LIKE 'DF-ARNES-%' AND datos->>'authorization_code'='RqRvA2';
  INSERT INTO _r VALUES ('   ↳ comprobante con los 2 códigos', '1', v_correos::text,
    CASE WHEN v_correos=1 THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ CASO ③ LLEGAN LOS DOS — el segundo no hace nada ═══════════════════════
  INSERT INTO webhook_events (ambiente, proveedor, payload, transaction_id,
                              stoken_valido, resultado, detalle)
    VALUES ('sandbox','nuvei',v_body,'DF-ARNES',true,'recibido',
            'receta=hmac-sha256-v2 · credencial=SERVER · autenticado=true')
    RETURNING id INTO v_ev2;
  v_res := aplicar_evento_de_pago(v_ev2);
  SELECT count(*) INTO v_correos FROM notificacion_intencion
   WHERE clave_dedup='comprobante:'||v_compra::text;
  INSERT INTO _r VALUES ('③ duplicado / tardío',
    'duplicado=true · UN solo correo · los dos con traza',
    'duplicado='||COALESCE(v_res->'resultado'->>'duplicado','∅')||' · correos='||v_correos
      ||' · eventos='||(SELECT count(*) FROM webhook_events WHERE id IN (v_ev1,v_ev2)),
    CASE WHEN COALESCE((v_res->'resultado'->>'duplicado')::boolean,false)
           AND v_correos = v_correos0 + 1 THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ LA LEY DEL ACTUADOR: un evento de ALTA no mueve nada ══════════════════
  INSERT INTO webhook_events (ambiente, proveedor, payload, transaction_id,
                              stoken_valido, resultado, detalle)
    VALUES ('sandbox','nuvei',
            jsonb_set(v_body,'{transaction,application_code}','"EPETPLACESTG-EC-CLIENT"'),
            'DF-ALTA',true,'recibido',
            'receta=hmac-sha256-v2 · credencial=CLIENT · autenticado=false')
    RETURNING id INTO v_ev2;
  v_res := aplicar_evento_de_pago(v_ev2);
  INSERT INTO _r VALUES ('⚖️ evento de ALTA (clave pública)', 'no aplica',
    COALESCE(v_res->>'motivo','aplicó'),
    CASE WHEN (v_res->>'aplicado')::boolean IS FALSE THEN 'VERDE' ELSE '🔴 ROJO' END);

  -- ══ EL APAGADO ES DE VERDAD ══════════════════════════════════════════════
  UPDATE app_config SET valor='false' WHERE clave='pagos_actuador_vivo';
  INSERT INTO webhook_events (ambiente, proveedor, payload, transaction_id,
                              stoken_valido, resultado, detalle)
    VALUES ('sandbox','nuvei',v_body,'DF-OFF',true,'recibido',
            'receta=hmac-sha256-v2 · credencial=SERVER · autenticado=true')
    RETURNING id INTO v_ev2;
  v_res := aplicar_evento_de_pago(v_ev2);
  INSERT INTO _r VALUES ('🔴 apagado', 'motivo=actuador_apagado',
    COALESCE(v_res->>'motivo','∅'),
    CASE WHEN v_res->>'motivo'='actuador_apagado' THEN 'VERDE' ELSE '🔴 ROJO' END);
END $$;

SELECT caso, esperado, obtenido, veredicto FROM _r;
ROLLBACK;
