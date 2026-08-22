-- ═══════════════════════════════════════════════════════════════════════════
-- S103 · EL ACTUADOR DEJA DE HABLAR SÓLO NUVEI — N1 · N2 · N4
--
-- Cuerpo de N1, N2 (predicado) y N4: **autoría S103-D**, copiados VERBATIM de
-- `docs/relevamientos/S103-D-migracion-motor-multiproveedor-SIN-NUMERO.sql`.
-- **El cuerpo del ACTUADOR lo escribe A contra el objeto leído** — que es
-- exactamente lo que D pidió al entregar su diff conceptual: *«el cuerpo se
-- escribe contra el objeto, jamás de memoria»*.
-- Numerada y depositada por A (S103-A, 22-ago-2026) · `L-331`.
--
-- 🔴 **N3 NO ENTRA ACÁ, Y ES A PROPÓSITO.** `pagos_pendientes_de_conciliar`
--    CAMBIA DE FIRMA (`(integer)` → `(integer,text)`), y la edge function
--    `pagos-conciliar` la llama con la vieja. **El DROP+CREATE va en la MISMA
--    ventana que su redeploy** o el barrido queda roto — precedente medido:
--    el orden cron→deploy de `D-713`. *Aplicarla hoy para «avanzar» dejaría el
--    barrido caído sin que nada lo diga.*
--
-- 🔴 **N4 SÍ ENTRA, aunque el barrido todavía no se despliegue** — y su razón
--    es de D: `pagos-deuna-barrido` referencia `hallazgo` **seis veces**, y sin
--    la columna el barrido *no rompe: repite.* Su `marcar()` loguea el error y
--    sigue ⇒ **escalaría los mismos huérfanos en cada pasada, porque nunca
--    puede anotar que ya los miró.** *Repetir sin dejar rastro es la clase que
--    se descubre cuando alguien pregunta por qué el mismo caso aparece tres
--    días seguidos.* Entra ANTES de que el barrido exista, no después.
--
-- 📌 76(g) — LA VEDA: **NO RIGE.** Reemplaza cuerpos de función y agrega DDL
--    aditiva. Cero backfill, cero anclas a filas vivas.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- Las reversas de N1 y N4 viven comentadas en el archivo de origen de D, con
-- su nota de qué NO deshacen. La del actuador: volver a poner el bloque
-- literal de `credencial=SERVER`, `dev_reference` y `p_proveedor => 'nuvei'`.
-- ⚠️ QUÉ NO DESHACE: si ya entró un cobro DeUna, revertir **no lo
-- desconfirma** — deja el motor sin poder reconocer los siguientes.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;


CREATE OR REPLACE FUNCTION public._pago_aprobado(p_crudo jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $function$
  SELECT
    -- ── NUVEI: intacto, tal cual estaba ──────────────────────────────────
    (
      ( lower(coalesce(p_crudo->'transaction'->>'status','')) IN ('1','success')
        OR upper(coalesce(p_crudo->'transaction'->>'current_status','')) = 'APPROVED' )
      AND upper(coalesce(p_crudo->'transaction'->>'current_status','APPROVED'))
          NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED')
    )
    -- ── DEUNA: status plano en la raíz, medido en payment/info ───────────
    -- 🔴 `APPROVED` Y NADA MÁS. `PENDING` no confirma, y `REVERSED` /
    --    `REVERSED_FAILED` menos todavía. *Ante señales que se contradicen no
    --    se confirma: un cobro confirmado de más es plata que hay que ir a
    --    devolver.* (misma ley que la rama de arriba)
    OR (
      upper(coalesce(p_crudo->>'status','')) = 'APPROVED'
      -- 🔴 EL CANDADO DEL FANTASMA — §2quater. Una consulta por algo que NO
      --    EXISTE devuelve HTTP 200 con status PENDING y `amount: 0`. Si
      --    alguna vez el proveedor devolviera APPROVED con amount 0, sería un
      --    registro vacío y no un cobro. **Nunca se confirma con monto cero.**
      AND coalesce((p_crudo->>'amount')::numeric, 0) > 0
    );
$function$;

COMMENT ON FUNCTION public._pago_aprobado(jsonb) IS
  'Dos vocabularios: Nuvei (transaction.status/current_status) y DeUna (status plano + amount>0). La rama DeUna exige monto porque una consulta a algo inexistente devuelve 200/PENDING/amount 0 — S103-D §2quater.';

-- ── CINTURÓN N1: los dos vocabularios, y los dos contra-casos ──────────────
DO $$
BEGIN
  -- Nuvei sigue exactamente igual (regresión)
  IF NOT _pago_aprobado('{"transaction":{"status":"success"}}'::jsonb)
    THEN RAISE EXCEPTION 'N1: se rompio Nuvei success'; END IF;
  IF _pago_aprobado('{"transaction":{"status":"success","current_status":"REJECTED"}}'::jsonb)
    THEN RAISE EXCEPTION 'N1: Nuvei confirma con current_status REJECTED'; END IF;

  -- DeUna aprueba
  IF NOT _pago_aprobado('{"status":"APPROVED","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna APPROVED no confirma'; END IF;

  -- 🔴 CONTRA-CASOS: lo que NO debe confirmar
  IF _pago_aprobado('{"status":"PENDING","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma un PENDING'; END IF;
  IF _pago_aprobado('{"status":"APPROVED","amount":0}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma con amount 0 — el fantasma paso'; END IF;
  IF _pago_aprobado('{"status":"REVERSED","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma un REVERSED'; END IF;
  IF _pago_aprobado('{}'::jsonb)
    THEN RAISE EXCEPTION 'N1: confirma un payload vacio'; END IF;

  RAISE NOTICE 'cinturon N1 OK: dos vocabularios, cuatro contra-casos, Nuvei sin regresion';
END $$;

-- ── REVERSA N1 (escrita ANTES) ─────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: si ya hubo cobros DeUna confirmados, revertir **no los
--   desconfirma** — deja el motor sin poder reconocer los siguientes.
-- CREATE OR REPLACE FUNCTION public._pago_aprobado(p_crudo jsonb)
-- RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
--   SELECT
--     ( lower(coalesce(p_crudo->'transaction'->>'status','')) IN ('1','success')
--       OR upper(coalesce(p_crudo->'transaction'->>'current_status','')) = 'APPROVED' )
--     AND upper(coalesce(p_crudo->'transaction'->>'current_status','APPROVED'))
--         NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED');
-- $$;

-- ───────────────────────────────────────────────────────────────────────────
-- N2 · EL ACTUADOR DEJA DE HABLAR SÓLO NUVEI
--
-- 🔴 EL DEFECTO CENTRAL, y es exactamente `L-318`: la puerta autentica con
--    `detalle NOT ILIKE '%credencial=SERVER%'`, que es el stoken de Nuvei.
--    **DeUna no tiene stoken.** Su defensa son dos capas distintas (§7):
--      ① secreto propio en header, validado en el buzón;
--      ② consulta activa obligatoria — sólo la respuesta VERIFICADA alimenta.
--    Sin esta migración, un evento DeUna sale por `evento_no_autenticado_o_no_server`
--    y **la compra/cita se queda quieta, sin error, sin log y sin síntoma.**
--
-- La cura no relaja la puerta: **la hace por proveedor**, y para DeUna exige
-- una marca que SÓLO el buzón puede poner después de verificar contra el API.
-- ───────────────────────────────────────────────────────────────────────────

-- El vocabulario de `webhook_events.resultado` gana el estado del reverso.
ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_resultado_check;
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_resultado_check
  CHECK (resultado IN ('recibido','aplicado','duplicado','stoken_invalido',
                       'monto_no_coincide','desconocido','ilegible',
                       -- nuevos, DeUna:
                       'secreto_invalido',        -- ① falló el header propio
                       'no_verificado',           -- ② la consulta activa no confirmó
                       'reversado','reverso_fallido'));

-- 🔴 EL PREDICADO DE AUTENTICIDAD, POR PROVEEDOR Y EN UN SOLO LUGAR.
--    *Duplicar esta decisión entre el actuador y el buzón es garantizar que
--     algún día digan cosas distintas.*
CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
RETURNS boolean LANGUAGE sql STABLE
SET search_path TO 'public','pg_temp' AS $function$
  SELECT CASE p_evento.proveedor
    -- NUVEI: intacto. stoken válido Y credencial SERVER (la CLIENT es pública
    -- por diseño — la sirve nuestra propia página de pago).
    WHEN 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%credencial=SERVER%'
    -- DEUNA: no hay stoken. `stoken_valido` guarda el veredicto del SECRETO
    -- PROPIO del header, y la marca `verificado=si` **sólo la escribe el buzón
    -- después de que `payment/info` confirmó** (§7 capa ②).
    -- 🔴 Las dos condiciones, jamás una: un webhook con el secreto correcto y
    --    datos falsos muere en la consulta.
    WHEN 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%verificado=si%'
    -- 🔴 FAIL-CLOSED: un proveedor que nadie enseñó NO se autentica.
    --    *Es la lección L-318 escrita como default: lo desconocido no pasa,
    --     en vez de pasar en silencio.*
    ELSE false
  END;
$function$;

REVOKE ALL ON FUNCTION public._evento_autenticado(webhook_events) FROM anon, authenticated, PUBLIC;

-- ── CINTURÓN N2 ────────────────────────────────────────────────────────────
DO $$
DECLARE e webhook_events;
BEGIN
  e.proveedor:='nuvei'; e.stoken_valido:=true; e.detalle:='receta=… · credencial=SERVER · autenticado=true';
  IF NOT _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: regresion Nuvei SERVER'; END IF;
  e.detalle:='credencial=CLIENT';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: Nuvei acepto CLIENT'; END IF;

  e.proveedor:='deuna'; e.stoken_valido:=true; e.detalle:='secreto=ok · verificado=si';
  IF NOT _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna verificado no pasa'; END IF;
  -- 🔴 las dos capas son AND, no OR
  e.detalle:='secreto=ok · verificado=no';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna paso SIN consulta activa'; END IF;
  e.stoken_valido:=false; e.detalle:='secreto=ok · verificado=si';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna paso con secreto invalido'; END IF;

  -- fail-closed del desconocido
  e.proveedor:='inventado'; e.stoken_valido:=true; e.detalle:='verificado=si · credencial=SERVER';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: un proveedor desconocido se autentico'; END IF;

  RAISE NOTICE 'cinturon N2 OK: Nuvei sin regresion, DeUna exige sus DOS capas, lo desconocido no pasa';
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- N4 · EL HALLAZGO CON NOMBRE — `huerfano_deuna_vencido`
--
-- `LETRA_DEUNA` §3.5 lo pide por nombre. Nace como DATO, no como string suelto
-- en el código (precedente: 46 transiciones como dato en S95).
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS hallazgo text,
  ADD COLUMN IF NOT EXISTS hallazgo_en timestamptz;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_hallazgo_vocabulario
    CHECK (hallazgo IS NULL OR hallazgo IN (
      'confirmado_tardio',        -- llegó por consulta activa, no por webhook
      'reversado_mismo_dia',      -- huérfano detectado y reversado a tiempo
      'huerfano_escalado',        -- Nuvei: pasó el corte de lote
      'huerfano_deuna_vencido',   -- DeUna: >7 días, el proveedor ya no responde
      'monto_no_coincide',
      'reverso_fallido'           -- REVERSED_FAILED: 🔴 jamás se resuelve solo
    ));

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_hallazgo_con_fecha
    CHECK ((hallazgo IS NULL) = (hallazgo_en IS NULL));

COMMENT ON COLUMN public.pagos_intentos.hallazgo IS
  'Resolución del barrido, vocabulario cerrado (LETRA_MOTOR_PAGOS §6 y LETRA_DEUNA §3.5). huerfano_deuna_vencido: pasados 7 dias DeUna deja de responder y NOT_FOUND nunca se emite — el corte lo pone nuestro reloj.';

-- ── REVERSA N4 ─────────────────────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: se pierden los hallazgos ya registrados — que son
--   justamente la traza de los casos que alguien tuvo que ir a resolver a mano.
-- ALTER TABLE public.pagos_intentos
--   DROP CONSTRAINT IF EXISTS chk_hallazgo_con_fecha,
--   DROP CONSTRAINT IF EXISTS chk_hallazgo_vocabulario,
--   DROP COLUMN IF EXISTS hallazgo_en, DROP COLUMN IF EXISTS hallazgo;

-- ═══════════════════════════════════════════════════════════════════════════
-- N2b · EL ACTUADOR — cuerpo escrito por A CONTRA EL OBJETO LEÍDO
--
-- 🔴 LO QUE APARECIÓ AL ESCRIBIRLO, Y EL DIFF CONCEPTUAL NO LO CUBRÍA:
--    **el actuador extrae CINCO cosas del payload y el diff tocaba UNA.**
--
--      v_ref    ← payload->'transaction'->>'dev_reference'        ← cubierto
--      v_estado ← payload->'transaction'->>'status'               ← NO
--      v_monto  ← payload->'transaction'->>'amount'               ← NO
--      v_tx     ← payload->'transaction'->>'id'                   ← NO
--      v_auth   ← payload->'transaction'->>'authorization_code'   ← NO
--
--    **DeUna contesta PLANO** (forma medida contra QA, S103-D §2quater):
--      {"status":…,"internalTransactionReference":…,"amount":…,
--       "transactionId":…,"transferNumber":…,"currency":"USD",…}
--
--    ⇒ con sólo las tres correcciones del diff, un evento DeUna habría llegado
--    hasta acá con **`v_monto` NULL y `v_tx` NULL**, y eso NO FALLA — hace dos
--    cosas peores, las dos en silencio:
--      ① `IF v_monto IS NOT NULL AND v_monto <> …` **se saltea la verificación
--         de monto entera** — se confirma sin comparar contra el desglose
--         congelado, que es justamente lo que S101 puso ahí para no creerle al
--         proveedor un número que nosotros nunca prometimos;
--      ② `WHERE … proveedor_transaction_id = v_tx` con `v_tx` NULL **no matchea
--         NINGUNA fila** (NULL = NULL nunca es cierto) ⇒ **el intento queda
--         abierto para siempre** mientras la cita figura pagada.
--
--    *Es la variante grave de `L-318` otra vez: no hay error, no hay log, no
--    hay síntoma — hay silencio con cara de normalidad.* **Lo encontró escribir
--    el cuerpo contra el objeto, que es exactamente para lo que D entregó un
--    diff conceptual en vez de un cuerpo de memoria.**
--
-- 🔴 `transferNumber` ES EL `authorization_code` DE DEUNA. No es una
--    equivalencia cómoda: `LETRA_DEUNA` §3.6 lo exige **por nombre** en el
--    comprobante. Sin este mapeo el comprobante DeUna sale sin su respaldo.
--
-- 🔴 EL SUJETO SE RESUELVE POR TABLA, JAMÁS PARSEANDO EL STRING (§4).
--    Y se resuelve **junto con el id del intento**, en la misma consulta: sin
--    eso el `UPDATE` del intento vuelve a depender de un campo de Nuvei.
--
-- ⚖️ EL MOTIVO DEL SIN-REFERENCIA: Nuvei conserva `sin_dev_reference`
--    **byte-idéntico** y DeUna emite `sin_referencia_corta` — código NUEVO para
--    riel nuevo. *Reusar el viejo haría que un tablero contara dos cosas
--    distintas bajo el mismo nombre; cambiarlo movería lo que ese tablero ya
--    muestra.* **Ninguna de las dos: se agrega.**
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e record; v_vivo boolean; v_ref uuid; v_monto numeric; v_estado text;
  v_tx text; v_auth text; v_res jsonb; v_user uuid; v_negocio text; v_moneda text;
  v_es_cita boolean; v_intento uuid; v_refcorta text; v_tocadas int;
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

  /* (2) LAS CINCO EXTRACCIONES, POR VOCABULARIO. */
  IF v_e.proveedor = 'deuna' THEN
    v_refcorta := NULLIF(v_e.payload->>'internalTransactionReference','');
    SELECT i.id, COALESCE(i.compra_id, i.cita_id) INTO v_intento, v_ref
      FROM pagos_intentos i WHERE i.referencia_corta = v_refcorta;
    IF v_ref IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
        'motivo', 'sin_referencia_corta', 'referencia', v_refcorta);
    END IF;
    v_estado := v_e.payload->>'status';
    v_monto  := NULLIF(v_e.payload->>'amount','')::numeric;
    v_tx     := v_e.payload->>'transactionId';
    v_auth   := NULLIF(v_e.payload->>'transferNumber','');   -- §3.6
  ELSE
    -- NUVEI: byte-idéntico a lo que había. No se mueve un signo.
    v_ref := NULLIF(v_e.payload->'transaction'->>'dev_reference','')::uuid;
    IF v_ref IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'sin_dev_reference');
    END IF;
    v_estado := v_e.payload->'transaction'->>'status';
    v_monto  := NULLIF(v_e.payload->'transaction'->>'amount','')::numeric;
    v_tx     := v_e.payload->'transaction'->>'id';
    v_auth   := v_e.payload->'transaction'->>'authorization_code';
  END IF;

  IF NOT _pago_aprobado(v_e.payload) THEN
    UPDATE webhook_events SET resultado='desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: status=' || COALESCE(v_estado,'0') || ' no confirma'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'status_no_aprobado', 'status', v_estado);
  END IF;

  /* 🔴 QUÉ SUJETO ES — se pregunta a los datos, no se supone por el formato.
     *El `dev_reference` es un uuid en los dos casos: mirarlo no alcanza.* */
  SELECT EXISTS (SELECT 1 FROM evento_cita_servicio WHERE id = v_ref) INTO v_es_cita;

  IF v_es_cita THEN
    -- ══ LA CITA ══════════════════════════════════════════════════════════
    -- Idempotencia al grano de la cita: el duplicado y el tardío mueren acá.
    IF EXISTS (SELECT 1 FROM evento_cita_servicio
                WHERE id = v_ref AND estado_reserva = 'pagada') THEN
      UPDATE webhook_events SET resultado='duplicado' WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'cita_ya_pagada');
    END IF;

    /* 🔴 EL MONTO SE VERIFICA CONTRA EL DESGLOSE CONGELADO, igual que la
       compra. *Confirmar sin comparar sería creerle al proveedor un número que
       nosotros nunca prometimos.* */
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

    /* 🔴 EL INTENTO SE CIERRA POR SU ID CUANDO LO TENEMOS.
       Nuvei conserva su `WHERE` de siempre; DeUna usa el id que ya resolvió la
       referencia corta. *Con el `WHERE` viejo y `v_tx` NULL este UPDATE tocaba
       CERO filas y no se quejaba — la cita quedaba pagada y el intento abierto
       para siempre.* Y el conteo se MIDE, no se supone. */
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

    /* 🔴 EL MISMO COMPROBANTE. *La familia no tiene por qué notar que compró un
       paseo en vez de un producto: una casa, un motor, dos puertas.* */
    PERFORM registrar_intencion_notificacion(
      p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
      p_mascota_id => NULL, p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo','Tu pago quedó confirmado',
        'mensaje','Guarda estos datos: son el respaldo de tu pago.',
        'negocio', v_negocio, 'concepto', _concepto_de_pago(v_ref),
        'transaction_id', v_tx, 'authorization_code', v_auth,
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
        /* La clave se llama `sujeto_id`: la anterior decía `compra_id` **para
           una cita**. *Un campo que nombra al sujeto viejo es el mismo defecto
           que el `dev_reference` — el dato del camino viejo colándose en el
           nuevo, esta vez en el nombre.* */
        'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);

    UPDATE webhook_events SET resultado='aplicado',
      detalle = COALESCE(detalle,'') || ' · actuador: CITA confirmada · intentos=' || v_tocadas
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','cita',
                              'cita_id', v_ref, 'intentos_cerrados', v_tocadas);
  END IF;

  -- ══ LA COMPRA ══════════════════════════════════════════════════════════
  -- (3) EL PROVEEDOR sale de la fila del evento, no de un literal.
  v_res := confirmar_pago_compra(
    p_compra_id => v_ref, p_proveedor => v_e.proveedor, p_referencia => v_tx,
    p_clave_idempotencia => 'wh:' || p_evento_id::text, p_payload => v_e.payload,
    p_confirmado_por => 'webhook', p_transaction_id => v_tx, p_monto => v_monto,
    p_authorization_code => v_auth, p_marca => v_e.payload->'card'->>'type',
    p_bin => v_e.payload->'card'->>'bin', p_ultimos4 => v_e.payload->'card'->>'number');

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
END $function$;

-- ── CINTURÓN N2b · LAS CINCO EXTRACCIONES, CONTRA LA FORMA MEDIDA ──────────
-- ⚠️ ALCANCE DECLARADO, para que su verde no se lea de más: esto prueba **el
--    mapeo y que el cuerpo perdió los literales de Nuvei**. **NO prueba el
--    camino de punta a punta** — eso exige una cita viva con su desglose y un
--    evento real, y va en el ARNÉS, no en una migración. *Un cinturón que
--    dijera «DeUna cobra» sin haber cobrado sería un verde flojo.*
DO $cinturon$
DECLARE
  p jsonb := '{"status":"APPROVED","internalTransactionReference":"EP01abc9zz",
               "amount":12.50,"transactionId":"tx-deuna-1","transferNumber":"TR-0009",
               "currency":"USD"}'::jsonb;
  v_def text;
BEGIN
  -- (a) EL MAPEO: las cinco salen no-nulas de la forma PLANA medida.
  IF NULLIF(p->>'status','')            IS NULL THEN RAISE EXCEPTION 'N2b: status nulo'; END IF;
  IF NULLIF(p->>'amount','')::numeric   IS NULL THEN RAISE EXCEPTION 'N2b: amount nulo'; END IF;
  IF NULLIF(p->>'transactionId','')     IS NULL THEN RAISE EXCEPTION 'N2b: transactionId nulo'; END IF;
  IF NULLIF(p->>'transferNumber','')    IS NULL THEN RAISE EXCEPTION 'N2b: transferNumber nulo'; END IF;
  IF NULLIF(p->>'internalTransactionReference','') IS NULL THEN RAISE EXCEPTION 'N2b: referencia nula'; END IF;

  -- (b) EL DISCRIMINADOR QUE PRUEBA QUE EL DEFECTO EXISTÍA: con el camino VIEJO
  --     —el de Nuvei— esas mismas cinco salen TODAS nulas sobre el mismo
  --     payload. *Sin esta línea, (a) sería una tautología sobre un literal
  --     que yo mismo escribí.*
  IF p->'transaction'->>'amount' IS NOT NULL
     OR p->'transaction'->>'id' IS NOT NULL
     OR p->'transaction'->>'dev_reference' IS NOT NULL THEN
    RAISE EXCEPTION 'N2b: el payload de prueba no discrimina — tiene forma Nuvei';
  END IF;

  -- (c) EL CUERPO VIVO perdió los tres literales de Nuvei y ganó la rama.
  SELECT pg_get_functiondef(to_regprocedure('public.aplicar_evento_de_pago(uuid)')) INTO v_def;
  IF position('credencial=SERVER' IN v_def) > 0 THEN
    RAISE EXCEPTION 'N2b: la puerta sigue autenticando por credencial=SERVER';
  END IF;
  IF position($lit$p_proveedor => 'nuvei'$lit$ IN v_def) > 0 THEN
    RAISE EXCEPTION 'N2b: el proveedor sigue literal en confirmar_pago_compra';
  END IF;
  IF position('internalTransactionReference' IN v_def) = 0
     OR position('transferNumber' IN v_def) = 0 THEN
    RAISE EXCEPTION 'N2b: el cuerpo no lee la forma de DeUna';
  END IF;
  -- Y Nuvei NO se fue: su rama sigue adentro.
  IF position('dev_reference' IN v_def) = 0 THEN
    RAISE EXCEPTION 'N2b: se perdio la rama de Nuvei';
  END IF;

  RAISE NOTICE 'cinturon N2b OK: mapeo DeUna verificado · discriminador contra la forma vieja · cuerpo sin literales de Nuvei y con Nuvei vivo';
END $cinturon$;

COMMIT;
