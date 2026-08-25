-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · EL REVERSO DE NUVEI — la persistencia, con su ventana y su candado
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE.** DDL de una función nueva. Sin
-- backfill, sin anclas, sin tocar una fila. El cinturón escribe y **deshace en
-- subtransacción** (`L-406`).
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-D-REVERSA-20260825201500-reverso-nuvei.sql
--   🔴 Su nota fija el ORDEN: primero se retira la edge, después esta función.
--      Al revés queda plata devuelta sin rastro nuestro.
--
-- ── CERO VOCABULARIO NUEVO — medido antes de escribir ──────────────────────
--   pagos_intentos_estado_check  ya admite 'reversado' y 'reverso_fallido'
--   chk_hallazgo_vocabulario     ya admite 'reversado_mismo_dia' y 'reverso_fallido'
--   pagos_intentos.proveedor_reverso_id  ya existe
-- **Estaban declarados y sin productor.** Esta función es el productor.
--
-- ── 🔴 LO QUE ESTA FUNCIÓN NO HACE, Y ES DECISIÓN, NO OLVIDO ───────────────
--
-- **NO MUEVE EL SUJETO.** El pedido/cita sigue como está. Eso es `D-923`
-- —`aplicar_evento_de_pago` no maneja `REVERSED`— y su dueño es **A**.
--
-- > *Moverlo desde acá duplicaría al actuador: dos piezas que confirman o
-- > revierten pagos es cómo se confirma dos veces.* Es la misma razón por la
-- > que el barrido de DeUna clasifica y no aplica.
--
-- ⇒ **Tras un reverso exitoso el estado es: intento `'reversado'`, sujeto
--   INTACTO.** Es un estado a medias **declarado**, no accidental, y se ve en
--   `hallazgo`. La mitad que falta es de A.
--
-- ── LAS TRES REGLAS QUE VAN POR CONSTRUCCIÓN ───────────────────────────────
--
-- ① **VENTANA: mismo día calendario de Guayaquil Y antes de las 17:00.**
--    Firmada por el founder y coherente con `pagos-conciliar` (corre 16:15,
--    45 min antes del corte de Medianet). *Pasado eso no es un endpoint: es un
--    trámite con el banco* (`LETRA_MOTOR_PAGOS_S101`).
--    🔴 **Se evalúa contra `cerrado_en`** —cuándo se cobró— **jamás contra
--    `creado_en`**: un intento abierto ayer y cobrado hoy tiene su ventana hoy.
--
-- ② **SOLO desde `'aprobado'`.** No se reversa lo que no se cobró.
--    **Idempotente**: si ya está `'reversado'`, devuelve `ya_reversado` sin
--    tocar nada — *el reintento de una red que se cortó no puede parecer un
--    segundo reverso.*
--
-- ③ **EL MONTO NO ES PARÁMETRO.** No se recibe, no se guarda como "lo que
--    pedimos": el reverso en Ecuador es **siempre total**. *Lo que sí se
--    persiste es el `refund_amount` que DEVUELVE el proveedor*, que es un
--    hecho suyo y no una intención nuestra.
--
--    > **La restricción vive en la ausencia del campo, no en un comentario.**
--    > La edge tampoco manda `order.amount` — sin ese campo el proveedor
--    > refunda el total. **Mandarlo parcial es INEXPRESABLE en los dos lados.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.registrar_reverso_nuvei(
  p_intento_id      uuid,
  p_reverso_id      text,     -- el id que devuelve el proveedor (more_info)
  p_status_detail   text,     -- su código: 7 total · 34 parcial · otros
  p_refund_amount   numeric,  -- lo que el proveedor dice haber devuelto
  p_auth_code       text      -- authorization_code del refund (more_info)
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i        pagos_intentos;
  v_ahora    timestamptz := now();
  v_local    timestamp;
  v_hallazgo text;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.proveedor <> 'nuvei' THEN
    /* 🔴 Fail-closed por PROVEEDOR. Esta función habla el vocabulario de
       Nuvei; aplicarla a un intento de DeUna guardaría un `status_detail`
       que en ese riel significa otra cosa. *Los dos rieles ya se cruzaron
       dos veces en esta mesa; acá el cruce es inexpresable.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_nuvei',
                              'proveedor', v_i.proveedor);
  END IF;

  -- ② IDEMPOTENCIA antes que nada: un reintento no es un segundo reverso.
  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_reversado',
                              'reverso_id', v_i.proveedor_reverso_id);
  END IF;

  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;

  -- ① LA VENTANA, contra `cerrado_en` y en hora de Guayaquil.
  IF v_i.cerrado_en IS NULL THEN
    /* Sin fecha de cobro no se puede afirmar que estamos dentro de la ventana.
       *Y no se asume que sí: asumir acá es pedir un refund que el proveedor va
       a rechazar, con un registro nuestro diciendo que lo pedimos bien.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;

  v_local := v_ahora AT TIME ZONE 'America/Guayaquil';
  IF (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date <> v_local::date THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_otro_dia',
      'cobrado', (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date,
      'hoy', v_local::date);
  END IF;

  IF v_local::time >= TIME '17:00' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_corte',
      'hora_local', to_char(v_local, 'HH24:MI'));
  END IF;

  /* ③ EL HALLAZGO DICE LA VERDAD DEL PROVEEDOR, no la nuestra.
     `7` = total (lo esperado) · `34` = PARCIAL. **Nunca pedimos parcial**
     —la edge no manda `order.amount`— pero el código existe en su doc y puede
     llegar. *Un estado del proveedor que no esperábamos no se descarta: se
     registra con nombre, porque es plata que se movió distinto de lo pedido.* */
  v_hallazgo := CASE
    WHEN p_status_detail = '34' THEN 'reverso_fallido'  -- parcial ⇒ a soporte
    ELSE 'reversado_mismo_dia'
  END;

  UPDATE pagos_intentos
     SET estado = 'reversado',
         proveedor_reverso_id = p_reverso_id,
         /* 🔴 El auth del refund NO pisa el del cobro: son dos hechos y el del
            cobro es la evidencia de que se cobró. Va al crudo. */
         payload_crudo = coalesce(payload_crudo, '{}'::jsonb) || jsonb_build_object(
           'reverso', jsonb_build_object(
             'status_detail', p_status_detail,
             'refund_amount', p_refund_amount,
             'authorization_code', p_auth_code,
             'en', v_ahora)),
         hallazgo = v_hallazgo,
         hallazgo_en = v_ahora,
         actualizado_en = v_ahora
   WHERE id = p_intento_id;

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'reversado',
    'hallazgo', v_hallazgo,
    'parcial_inesperado', (p_status_detail = '34'),
    /* 🔴 SE DICE EN LA RESPUESTA, no en un comentario: el sujeto NO se movió.
       *Quien llame a esto tiene que saber que el circuito queda a medias, y
       enterarse acá y no leyendo la migración.* (`D-923`, dueño A) */
    'sujeto_movido', false,
    'nota', 'el sujeto no se mueve: D-923');
END $function$;

COMMENT ON FUNCTION public.registrar_reverso_nuvei(uuid, text, text, numeric, text) IS
  'S105-D: persiste un reverso de Nuvei ya ejecutado. Ventana mismo dia < 17:00 '
  'Guayaquil contra cerrado_en. Idempotente. NO mueve el sujeto (D-923, de A).';

REVOKE ALL ON FUNCTION public.registrar_reverso_nuvei(uuid, text, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_reverso_nuvei(uuid, text, text, numeric, text) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — con ROJO PRODUCIDO, sobre datos propios, en SUBTRANSACCIÓN que se
-- deshace sola (`L-406`: un arnés que para probar el circuito lo ejecuta de
-- verdad es un arnés que hace lo que vino a vigilar).
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_id  uuid;
  v_r   jsonb;
  v_est text;
  v_ped uuid;
BEGIN
  /* 🔴 LOS FIXTURES NECESITAN UN SUJETO REAL, y esto lo enseñó el propio
     cinturón abortando la migración en el primer intento: `pagos_intentos`
     tiene `chk_intento_un_solo_sujeto` —exactamente UNO de pedido/cita/
     recurrencia/suscripción— y la primera versión insertaba los cinco casos
     con los cuatro en NULL.
     *El CHECK hizo lo que existe para hacer: no hay intento sin sujeto, ni
     siquiera de prueba.* Se ancla a un pedido existente y **todo se deshace
     en la subtransacción**, así que no lo toca. */
  SELECT id INTO v_ped FROM pedidos LIMIT 1;
  IF v_ped IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay ningun pedido para anclar los fixtures. '
      'No se inventa uno: sin sujeto real este cinturon no mide el caso real.';
  END IF;

  BEGIN   -- ← subtransacción: todo lo que sigue se deshace con el ROLLBACK final
    -- Un intento propio, aprobado y cobrado HOY (dentro de ventana).
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda,
                                pedido_id, proveedor_transaction_id, cerrado_en,
                                clave_idempotencia)
    VALUES ('nuvei','tokenizacion','aprobado', 1.00,'USD',
            v_ped,'CINTURON-S105D', now(), 'cint-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;

    -- ① VERDE: dentro de ventana, desde aprobado ⇒ reversa.
    v_r := registrar_reverso_nuvei(v_id, 'REV-1', '7', 1.00, 'AUTH1');
    IF (v_r->>'ok')::boolean IS NOT TRUE OR v_r->>'codigo' <> 'reversado' THEN
      RAISE EXCEPTION 'CINTURON ①: no reverso un caso valido: %', v_r;
    END IF;
    SELECT estado INTO v_est FROM pagos_intentos WHERE id = v_id;
    IF v_est <> 'reversado' THEN
      RAISE EXCEPTION 'CINTURON ①b: el estado quedo en % y no en reversado', v_est;
    END IF;
    IF (v_r->>'sujeto_movido')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON ①c: declara haber movido el sujeto y no debe';
    END IF;

    -- ② ROJO: idempotencia — el segundo no vuelve a reversar.
    v_r := registrar_reverso_nuvei(v_id, 'REV-2', '7', 1.00, 'AUTH2');
    IF v_r->>'codigo' <> 'ya_reversado' THEN
      RAISE EXCEPTION 'CINTURON ②: un reintento se trato como reverso nuevo: %', v_r;
    END IF;
    IF (SELECT proveedor_reverso_id FROM pagos_intentos WHERE id = v_id) <> 'REV-1' THEN
      RAISE EXCEPTION 'CINTURON ②b: el reintento piso el id del reverso original';
    END IF;

    -- ③ ROJO: fuera de ventana por DÍA (cobrado ayer).
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda,
                                pedido_id, proveedor_transaction_id, cerrado_en,
                                clave_idempotencia)
    VALUES ('nuvei','tokenizacion','aprobado', 1.00,'USD', v_ped,
            'CINTURON-S105D-AYER', now() - interval '1 day', 'cint-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_nuvei(v_id, 'REV-X', '7', 1.00, 'AUTH');
    IF v_r->>'codigo' <> 'fuera_de_ventana_otro_dia' THEN
      RAISE EXCEPTION 'CINTURON ③: reverso algo cobrado AYER: %', v_r;
    END IF;

    -- ④ ROJO: estado no aprobado.
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda,
                                pedido_id, proveedor_transaction_id, cerrado_en,
                                clave_idempotencia)
    VALUES ('nuvei','tokenizacion','pendiente', 1.00,'USD', v_ped,
            'CINTURON-S105D-PEND', now(), 'cint-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_nuvei(v_id, 'REV-Y', '7', 1.00, 'AUTH');
    IF v_r->>'codigo' <> 'intento_no_aprobado' THEN
      RAISE EXCEPTION 'CINTURON ④: reverso un intento que no estaba aprobado: %', v_r;
    END IF;

    -- ⑤ ROJO: proveedor equivocado (el cruce de rieles, inexpresable).
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda,
                                pedido_id, proveedor_transaction_id, cerrado_en,
                                clave_idempotencia)
    VALUES ('deuna','codigo_push','aprobado', 1.00,'USD', v_ped,
            'CINTURON-S105D-DEUNA', now(), 'cint-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_nuvei(v_id, 'REV-Z', '7', 1.00, 'AUTH');
    IF v_r->>'codigo' <> 'proveedor_no_es_nuvei' THEN
      RAISE EXCEPTION 'CINTURON ⑤: acepto un intento de OTRO riel: %', v_r;
    END IF;

    -- ⑥ El parcial inesperado se marca como hallazgo de soporte, no como ok.
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda,
                                pedido_id, proveedor_transaction_id, cerrado_en,
                                clave_idempotencia)
    VALUES ('nuvei','tokenizacion','aprobado', 5.00,'USD', v_ped,
            'CINTURON-S105D-34', now(), 'cint-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_nuvei(v_id, 'REV-P', '34', 2.00, 'AUTH');
    IF v_r->>'hallazgo' <> 'reverso_fallido'
       OR (v_r->>'parcial_inesperado')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'CINTURON ⑥: un parcial no se marco como hallazgo: %', v_r;
    END IF;

    RAISE NOTICE 'CINTURON REVERSO NUVEI: 6/6 verdes (4 rojos producidos).';
    RAISE EXCEPTION 'ROLLBACK_CINTURON';   -- ← deshace TODO lo de arriba
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_CINTURON' THEN RAISE; END IF;
  END;

  -- Residuo 0, verificado y no supuesto.
  IF EXISTS (SELECT 1 FROM pagos_intentos
              WHERE proveedor_transaction_id LIKE 'CINTURON-S105D%') THEN
    RAISE EXCEPTION 'CINTURON: quedo residuo de fixtures.';
  END IF;
  RAISE NOTICE 'CINTURON: residuo 0 verificado.';
END $cinturon$;

COMMIT;
