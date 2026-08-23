-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL ACTUADOR APRENDE LOS CUATRO SUJETOS — el último cable del
--          cobro recurrente.
--
-- Tres actos, y van juntos porque el tercero no puede existir sin los dos
-- primeros:
--   Ⓐ `crear_pedido_despensa` deja de exigir una SESIÓN y acepta el usuario
--      como PARÁMETRO (aditivo, con guard).
--   Ⓑ nace `crear_pedido_de_recurrencia_cobrada` — el ACTO 2 de la despensa,
--      espejo exacto de `renovar_plan_cobrado`.
--   Ⓒ el actuador gana las dos ramas que le faltaban.
--
-- ═══ EL ESTADO ANTES DE ESTA MIGRACIÓN, medido ═════════════════════════════
-- El motor del recurrente está entero y probado; el reloj está cableado e
-- inerte; y **un intento con `recurrencia_id` rebota en `sujeto_no_aplicable`**
-- ⇒ *el cobro corre y no se aplica.* Ésa es la única pieza que falta.
--
-- ═══ Ⓐ POR QUÉ HAY QUE TOCAR `crear_pedido_despensa` ═══════════════════════
--
-- Medido en su cuerpo vivo: `v_uid uuid := auth.uid();` y
-- `IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido'`.
--
-- **El actuador corre SIN SESIÓN** —lo llama el webhook o el barrido— así que
-- llamarla tal cual reventaría con `auth_requerido`.
--
-- 🔴 **Y la salida obvia está PROHIBIDA POR FIRMA:** que el cron fabrique un
--    JWT de usuario con `service_role` (`L-340`). *No es una preferencia de
--    estilo: un proceso de servidor que se disfraza de persona rompe toda
--    auditoría posterior — el registro dice que lo hizo el cliente.*
--
-- ⇒ **la salida correcta es que el usuario sea PARÁMETRO, no AMBIENTE.**
--   `auth.uid()` es un ambiente implícito: sirve cuando hay una persona del
--   otro lado, y no tiene respuesta cuando el que actúa es el sistema.
--
-- **El cambio es ADITIVO y está GUARDADO:**
--   · `p_user_id uuid DEFAULT NULL` al final ⇒ **el único llamador vivo (el
--     wrapper `despensa-pedido.ts`) no lo pasa y se comporta idéntico** — lo
--     prueba el brazo ⑤ del arnés, no lo argumenta esta prosa;
--   · **guard con el molde que la casa ya usa** (el de `confirmar_pago_compra`):
--     *si hay sesión y no es admin, no podés pedir a nombre de otro*;
--   · y el rastro dice la verdad: `movido_por_rol` pasa a **`'sistema'`**
--     cuando el pedido lo crea el motor. *Registrar «cliente» sobre un pedido
--     que la persona no tocó sería mentirle al historial en el único lugar
--     donde alguien va a ir a buscar qué pasó.*
--
-- ⚠️ **`DROP` + `CREATE`, no `CREATE OR REPLACE`:** agregar un parámetro crea
--    una SOBRECARGA, y con dos firmas la llamada de 8 argumentos se vuelve
--    ambigua. Es `L-119`. El arnés **asserta `sobrecargas = 1`**.
--
-- ═══ Ⓑ EL ACTO 2 DE LA DESPENSA ════════════════════════════════════════════
--
-- No existía. El de servicios sí (`renovar_plan_cobrado`), y esta función es su
-- espejo deliberado, con las mismas tres defensas:
--   ① **exige un intento `aprobado`** para esa recurrencia y ese período —
--      *la plata dispara el acto, jamás el reloj*;
--   ② **idempotente**: si el período ya avanzó, dice `ya_aplicada` y no repite;
--   ③ **el pedido se crea con la clave de idempotencia del período**, así que
--      dos corridas no producen dos pedidos.
--
-- ═══ Ⓒ LAS DOS RAMAS ═══════════════════════════════════════════════════════
--
-- El orden importa y está medido: **`renovar_plan_cobrado` exige que el intento
-- YA esté `aprobado`** ⇒ el actuador marca primero y dispara después. Al revés
-- devolvería `sin_cobro_aprobado` sobre un cobro que sí ocurrió.
--
-- 🔴 **Y el acto 2 se llama en un bloque que ATRAPA su fallo, a propósito:** si
--    renovar o crear el pedido falla, **el cobro ya ocurrió** y el intento tiene
--    que quedar `aprobado` igual. *Dejar caer la excepción revertiría la marca
--    del pago y el proveedor reintentaría contra un cobro ya hecho.* El fallo se
--    escribe en el evento con su nombre, para que una persona lo vea.
--
-- ═══ VEDA 76(g) ════════════════════════════════════════════════════════════
-- **NO RIGE.** Cero backfill, cero filas de negocio tocadas.
--
-- 🔴 **Y una trampa que el arnés casi se lleva puesta, declarada porque es la
--    clase de la sesión:** su brazo del camino real dispara el ACTO 2 sobre
--    **la única suscripción VIVA de la base** — o sea que *lo habría renovado
--    de verdad*: período movido, citas generadas, precios reescritos y **un
--    aviso saliendo a una familia**, todo desde una migración que nadie
--    autorizó a mover negocio.
--    ⇒ **los dos brazos que escriben corren en SUBTRANSACCIÓN que se deshace
--      sola**: el esquema queda, sus datos no. Precedente: el arnés de
--      `20260822235000`.
--    *Un arnés que para probar el circuito lo EJECUTA de verdad es un arnés
--     que hace lo que vino a vigilar.*
--
-- ═══ REVERSA ═══════════════════════════════════════════════════════════════
-- `docs/relevamientos/2026-08-22-s103a-REVERSA-20260822270000.sql`, escrita
-- ANTES, y declara que **repone «el cobro corre y no se aplica»**, que **no
-- revierte plata**, y **por qué `p_user_id` se queda**.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Ⓑ EL ACTO 2 DE LA DESPENSA ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_pedido_de_recurrencia_cobrada(
  p_recurrencia_id uuid, p_periodo date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_res jsonb; v_prox date;
BEGIN
  SELECT * INTO v_r FROM pedidos_recurrencias WHERE id = p_recurrencia_id FOR UPDATE;
  IF v_r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'recurrencia_no_existe');
  END IF;

  /* ① LA PLATA DISPARA EL ACTO, JAMÁS EL RELOJ. Sin un intento aprobado para
     ESTE período, esto no crea nada — es la misma defensa que
     `renovar_plan_cobrado`, y es la que impide que un reintento del cron
     fabrique pedidos sin cobro. */
  IF NOT EXISTS (SELECT 1 FROM pagos_intentos
                  WHERE recurrencia_id = p_recurrencia_id
                    AND recurrencia_periodo = p_periodo AND estado = 'aprobado') THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_cobro_aprobado');
  END IF;

  /* ② IDEMPOTENTE por el período: si ya avanzó, este acto ya ocurrió. */
  IF v_r.proximo_pedido_fecha <> p_periodo THEN
    RETURN jsonb_build_object('ok', true, 'aplicada', false, 'motivo', 'ya_aplicada');
  END IF;

  /* ③ El pedido se crea A NOMBRE DE LA FAMILIA, con el usuario como PARÁMETRO
     —no como sesión— y con la clave del período: dos corridas no producen dos
     pedidos. */
  v_res := crear_pedido_despensa(
    p_cuenta_comercial_id => v_r.cuenta_comercial_id,
    p_items               => v_r.items,
    p_entrega             => v_r.entrega,
    p_clave_idempotencia  => 'rec-ped:' || p_recurrencia_id::text || ':' || p_periodo::text,
    p_metodo_entrega      => COALESCE(v_r.metodo_entrega, 'despacho'),
    p_user_id             => v_r.user_id);

  IF COALESCE((v_res->>'ok')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'pedido_no_creado', 'detalle', v_res);
  END IF;

  /* ④ La serie avanza. `frecuencia_dias` manda; si no lo tiene, es mensual. */
  v_prox := CASE
    WHEN v_r.frecuencia_dias IS NOT NULL AND v_r.frecuencia_dias > 0
      THEN p_periodo + v_r.frecuencia_dias
    ELSE (p_periodo + interval '1 month')::date END;

  UPDATE pedidos_recurrencias
     SET proximo_pedido_fecha = v_prox,
         reintentos = 0, ultimo_fallo_en = NULL, ultimo_fallo_causa = NULL,
         updated_at = now()
   WHERE id = p_recurrencia_id;

  PERFORM registrar_intencion_notificacion(
    p_tipo => 'pedido_recurrente_creado', p_destinatario_user_id => v_r.user_id,
    p_mascota_id => NULL, p_evento_id => NULL,
    p_datos => jsonb_build_object('recurrencia_id', p_recurrencia_id,
                                  'periodo', p_periodo,
                                  'pedido_id', v_res->>'pedido_id',
                                  'proximo_pedido_fecha', v_prox),
    p_clave_dedup => 'rec-ped:' || p_recurrencia_id::text || ':' || p_periodo::text);

  RETURN jsonb_build_object('ok', true, 'aplicada', true,
    'pedido_id', v_res->>'pedido_id', 'proximo_pedido_fecha', v_prox);
END $function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Ⓐ + Ⓒ + EL ARNÉS, en un solo bloque porque el «antes» hay que producirlo
-- CONTRA los objetos viejos, y eso sólo se puede hacer antes de reemplazarlos.
-- ═══════════════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════════
-- BLOQUE 1 · EL ANTES — el rojo se PRODUCE contra los objetos VIEJOS, que es
-- lo único que sólo se puede hacer antes de reemplazarlos.
-- Sus datos se deshacen solos: escribe un evento y no tiene por qué quedar.
-- ═══════════════════════════════════════════════════════════════════════════
DO $antes$
DECLARE v_def text; v_ev uuid; v_falso uuid; v_r jsonb;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';
  IF position('  -- S103: EL SUJETO SE VERIFICA, NO SE ASUME.' in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA (1): falta el guard de 20260822250000 — esta migracion va DESPUES';
  END IF;
  IF position('renovar_plan_cobrado' in v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA (1): las ramas YA estan';
  END IF;

  BEGIN
    v_falso := gen_random_uuid();
    INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                                stoken_valido, resultado, detalle, credencial)
    VALUES ('nuvei','sandbox','arnes-s103-antes',
            jsonb_build_object('transaction', jsonb_build_object(
              'dev_reference', v_falso::text, 'status','1', 'amount','1.00',
              'id','arnes-s103-antes', 'authorization_code','ARN4S')),
            true,'recibido','arnes · credencial=SERVER','SERVER')
    RETURNING id INTO v_ev;

    v_r := public.aplicar_evento_de_pago(v_ev);
    IF v_r->>'motivo' IS DISTINCT FROM 'sujeto_no_aplicable' THEN
      RAISE EXCEPTION 'ABORTA (2): esperaba sujeto_no_aplicable, dio %', v_r;
    END IF;
    RAISE NOTICE '(2) ANTES: un sujeto que no es compra ni cita REBOTA — el cobro corre y no se aplica';
    RAISE EXCEPTION 'DESHACER';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'DESHACER' THEN RAISE; END IF;
  END;
END $antes$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOQUE 2 · Ⓐ y Ⓒ — SÓLO DDL. Fuera de toda subtransacción que se deshaga:
-- es lo único de esta migración que tiene que QUEDAR.
-- ═══════════════════════════════════════════════════════════════════════════
DO $ddl$
DECLARE
  v_def text; v_nuevo text; v_sob int;
  ANCLA_GUARD constant text := '  -- S103: EL SUJETO SE VERIFICA, NO SE ASUME.';
BEGIN
  -- ── Ⓐ el usuario como PARÁMETRO ─────────────────────────────────────────
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'crear_pedido_despensa';

  v_nuevo := replace(v_def,
    'p_servicio_envio text DEFAULT ''estandar''::text)',
    'p_servicio_envio text DEFAULT ''estandar''::text, p_user_id uuid DEFAULT NULL::uuid)');
  IF v_nuevo = v_def THEN RAISE EXCEPTION 'ABORTA A: no se hallo la firma'; END IF;

  v_nuevo := replace(v_nuevo, '  v_uid      uuid := auth.uid();',
    '  v_uid      uuid := COALESCE(p_user_id, auth.uid());');
  IF position('COALESCE(p_user_id, auth.uid())' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA A: no se hallo la declaracion de v_uid';
  END IF;

  v_nuevo := replace(v_nuevo,
    '  IF v_uid IS NULL THEN RAISE EXCEPTION ''auth_requerido'' USING ERRCODE = ''42501''; END IF;',
$g$  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  /* S103 · EL USUARIO ES PARAMETRO, NO AMBIENTE — pero solo para quien NO es
     una persona. `auth.uid()` sirve cuando hay alguien del otro lado; no tiene
     respuesta cuando el que actua es el motor (el cobro recurrente). Molde del
     guard: el mismo de `confirmar_pago_compra`.
     🔴 Un cliente NO puede pedir a nombre de otro. */
  IF p_user_id IS NOT NULL AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_podes_pedir_a_nombre_de_otro' USING ERRCODE = '42501';
  END IF;$g$);
  IF position('no_podes_pedir_a_nombre_de_otro' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA A: no se hallo el guard de auth';
  END IF;

  v_nuevo := replace(v_nuevo, '    VALUES (v_ped, ''creado'', v_uid, ''cliente'');',
    '    VALUES (v_ped, ''creado'', v_uid, CASE WHEN p_user_id IS NOT NULL THEN ''sistema'' ELSE ''cliente'' END);');
  IF position('ELSE ''cliente'' END)' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA A: no se hallo el INSERT de pedido_estados';
  END IF;

  /* L-119: agregar un parametro CREA SOBRECARGA. Se dropea la vieja. */
  DROP FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text, date, text);
  EXECUTE v_nuevo;

  SELECT count(*) INTO v_sob FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'crear_pedido_despensa';
  IF v_sob <> 1 THEN RAISE EXCEPTION 'ABORTA A: quedaron % sobrecargas', v_sob; END IF;
  RAISE NOTICE 'A) crear_pedido_despensa: UNA sola firma, con p_user_id y su guard';

  -- ── Ⓒ las dos ramas ─────────────────────────────────────────────────────
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';

  v_nuevo := replace(v_def, ' v_que_es text;', ' v_que_es text; v_acto jsonb;');
  IF position('v_acto jsonb;' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA C: no se hallo el DECLARE';
  END IF;

  v_nuevo := replace(v_nuevo, ANCLA_GUARD, $inj$  -- S103: LOS OTROS DOS SUJETOS — el cobro recurrente.
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

$inj$ || ANCLA_GUARD);
  IF position('renovar_plan_cobrado' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA C: la inyeccion no entro';
  END IF;
  EXECUTE v_nuevo;
  RAISE NOTICE 'C) el actuador gano las dos ramas';
END $ddl$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOQUE 3 · EL DESPUÉS — recorre el circuito de verdad y SE DESHACE SOLO.
--
-- 🔴 Su brazo (4) dispara el ACTO 2 sobre la única suscripción VIVA de la base.
--    Sin la subtransacción la renovaría de verdad: período movido, citas
--    generadas, precios reescritos y un aviso saliendo a una familia.
--    *El esquema queda; sus datos no.*
-- ═══════════════════════════════════════════════════════════════════════════
DO $despues$
DECLARE
  v_ev uuid; v_ev2 uuid; v_falso uuid; v_r jsonb;
  v_susc uuid; v_periodo date; v_int uuid; v_estado text; v_user uuid;
BEGIN
  BEGIN
    -- (3) NO-REGRESIÓN: la rama nueva no puede tragarse un sujeto ajeno
    v_falso := gen_random_uuid();
    INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                                stoken_valido, resultado, detalle, credencial)
    VALUES ('nuvei','sandbox','arnes-s103-huerfano',
            jsonb_build_object('transaction', jsonb_build_object(
              'dev_reference', v_falso::text, 'status','1', 'amount','1.00',
              'id','arnes-s103-huerfano', 'authorization_code','ARN4S')),
            true,'recibido','arnes · credencial=SERVER','SERVER')
    RETURNING id INTO v_ev;
    v_r := public.aplicar_evento_de_pago(v_ev);
    IF v_r->>'motivo' IS DISTINCT FROM 'sujeto_no_aplicable' THEN
      RAISE EXCEPTION 'ABORTA (3): la rama nueva se trago un sujeto ajeno — dio %', v_r;
    END IF;
    RAISE NOTICE '(3) NO-REGRESION: un uuid que no es sujeto de nada SIGUE rebotando';

    -- (4) 🔴 EL CAMINO REAL, de punta a punta, sobre una suscripción viva
    SELECT id, periodo_fin, user_id INTO v_susc, v_periodo, v_user
      FROM suscripciones_servicio WHERE estado='activa' ORDER BY created_at LIMIT 1;
    IF v_susc IS NULL THEN
      RAISE EXCEPTION 'ABORTA (4): no hay suscripcion activa — el brazo NO se corrio, y no medir no es aprobar';
    END IF;

    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_susc, v_periodo, 10.00, 0.00, 10.00, 'USD')
    ON CONFLICT DO NOTHING;

    /* ⚠️ `pagador_user_id` NO es opcional, y lo dijo el CHECK abortando la
       primera corrida: `chk_intento_de_cita_declara_pagador` exige
       `pedido_id IS NOT NULL OR pagador_user_id IS NOT NULL`. El selector real
       ya lo pone; mi fixture no, y el arnés se comió su propio rojo.
       🟡 Y de paso, un hallazgo que dejo anotado y NO curo acá: ese CHECK se
       llama «de_cita» y hoy gobierna los CUATRO sujetos. El nombre quedó viejo
       cuando el CHECK creció — misma clase que el resto de la jornada. */
    INSERT INTO pagos_intentos (suscripcion_servicio_id, suscripcion_periodo, monto, moneda,
                                estado, forma, proveedor, pagador_user_id, pagador_origen,
                                clave_idempotencia)
    VALUES (v_susc, v_periodo, 10.00, 'USD', 'iniciado', 'tokenizacion', 'nuvei',
            v_user, 'recurrencia', 'arnes-s103-susc')
    RETURNING id INTO v_int;

    INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                                stoken_valido, resultado, detalle, credencial)
    VALUES ('nuvei','sandbox','arnes-s103-susc',
            jsonb_build_object('transaction', jsonb_build_object(
              'dev_reference', v_susc::text, 'status','1', 'amount','10.00',
              'id','arnes-s103-susc', 'authorization_code','ARNSUS')),
            true,'recibido','arnes · credencial=SERVER','SERVER')
    RETURNING id INTO v_ev2;

    v_r := public.aplicar_evento_de_pago(v_ev2);
    IF v_r->>'sujeto' IS DISTINCT FROM 'recurrente' THEN
      RAISE EXCEPTION 'ABORTA (4): el actuador NO reconocio la suscripcion — dio %', v_r;
    END IF;
    SELECT estado INTO v_estado FROM pagos_intentos WHERE id = v_int;
    IF v_estado <> 'aprobado' THEN
      RAISE EXCEPTION 'ABORTA (4): el intento quedo en «%», no aprobado', v_estado;
    END IF;
    RAISE NOTICE '(4) CAMINO REAL (suscripcion): sujeto=% · intento=aprobado · acto2.ok=%',
                 v_r->>'sujeto', COALESCE(v_r->'acto2'->>'ok','(sin acto2)');
    IF COALESCE((v_r->'acto2'->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE NOTICE '    ⚠️ el ACTO 2 no aplico: «%» — y el intento queda aprobado IGUAL, que es lo correcto: el cobro ya ocurrio',
                   COALESCE(v_r->'acto2'->>'motivo', v_r->'acto2'->>'causa', '(sin motivo)');
    ELSE
      RAISE NOTICE '    ok el ACTO 2 APLICO: la suscripcion se renovo — y se deshace al salir de este bloque';
    END IF;

    -- (5) 🔴 NO-REGRESIÓN DEL CAMINO DEL CLIENTE
    IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='crear_pedido_despensa'
           AND pg_get_function_identity_arguments(p.oid) LIKE '%p_user_id uuid%') <> 1 THEN
      RAISE EXCEPTION 'ABORTA (5): la firma nueva no quedo';
    END IF;
    BEGIN
      PERFORM crear_pedido_despensa(gen_random_uuid(), '[]'::jsonb, '{}'::jsonb, 'arnes-sin-sesion');
      RAISE EXCEPTION 'ABORTA (5): sin sesion y sin p_user_id NO deberia haber pasado la puerta';
    EXCEPTION WHEN OTHERS THEN
      IF position('auth_requerido' in SQLERRM) = 0 THEN
        RAISE EXCEPTION 'ABORTA (5): esperaba auth_requerido, dio %', SQLERRM;
      END IF;
    END;
    RAISE NOTICE '(5) NO-REGRESION: sin sesion y sin p_user_id sigue exigiendo auth_requerido — el camino del cliente INTACTO';

    RAISE NOTICE 'ARNES VERDE — el actuador aplica los CUATRO sujetos. Sus datos se deshacen ahora.';
    RAISE EXCEPTION 'DESHACER';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'DESHACER' THEN RAISE; END IF;
  END;
END $despues$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN FINAL — sobre lo que QUEDA, ya fuera de toda subtransacción.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_def text; v_residuo int; v_sob int;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';
  IF position('renovar_plan_cobrado' in v_def) = 0
     OR position('crear_pedido_de_recurrencia_cobrada' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON: las ramas no quedaron en el actuador';
  END IF;
  IF position('sujeto_no_aplicable' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON: se perdio el guard del sujeto';
  END IF;

  SELECT count(*) INTO v_sob FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'crear_pedido_despensa';
  IF v_sob <> 1 THEN RAISE EXCEPTION 'CINTURON: % sobrecargas de crear_pedido_despensa', v_sob; END IF;

  SELECT (SELECT count(*) FROM webhook_events WHERE transaction_id LIKE 'arnes-s103%')
       + (SELECT count(*) FROM pagos_intentos WHERE clave_idempotencia LIKE 'arnes-s103%')
    INTO v_residuo;
  IF v_residuo <> 0 THEN RAISE EXCEPTION 'CINTURON: % de residuo del arnes', v_residuo; END IF;

  RAISE NOTICE 'CINTURON VERDE — ramas vivas, 1 sola firma, residuo 0.';
END $cint$;
