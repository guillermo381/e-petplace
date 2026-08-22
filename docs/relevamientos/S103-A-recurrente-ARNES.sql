-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL ARNÉS DEL COBRO RECURRENTE — camino real, IN-TXN con ROLLBACK
--
-- **Es la precondición del founder hecha ejecutable:** *«la migración no se
-- aplica hasta que el cuerpo esté escrito y su arnés recorrido — incluida la
-- serie que falla a propósito hasta la pausa»*.
--
-- ── CÓMO SE CORRE ──────────────────────────────────────────────────────────
--   Se aplica el bloque completo dentro de una transacción que TERMINA EN
--   ROLLBACK. **Residuo esperado: 0 filas.** *Un arnés que deja fixtures
--   contamina la próxima medición ajena — la casa ya lo pagó (S95, la sonda que
--   ensució una medición de otra pista).*
--
-- 🔴 **CORRE DESPUÉS de las dos migraciones y ANTES de aceptarlas**: dentro de
--    la misma transacción que las aplica. Si el arnés falla, el `ROLLBACK` se
--    lleva TODO — el esquema incluido. *Ése es el punto: la precondición no es
--    «probar y después aplicar», es «no poder aplicar sin haber probado».*
--
-- ── LO QUE ESTE ARNÉS **NO** PRUEBA, declarado antes de sus verdes ─────────
--   · **El cobro real contra el proveedor.** La edge no está desplegada; acá se
--     simula su efecto escribiendo el estado del intento, que es lo que ella
--     escribiría. *La forma del circuito se prueba; la plata no se mueve.*
--   · **La causa fina del rechazo** — 🔴 `§6` no puede decirla hasta que llegue
--     la tabla de `status_detail` de Erick. **Se construye el cajón con voz
--     genérica DECLARADA; jamás se adivina la etiqueta.**
--   · **El aviso**, que sale de sombra al final y con monto y medio adentro.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

/* 🔴 LOS RESULTADOS VIAJAN EN UNA TABLA, NO EN `RAISE NOTICE`. *Un NOTICE no
   llega al reporte del cliente SQL: el arnés salía verde y su evidencia se
   perdía — el gate del founder es sobre lo RECORRIDO, y lo recorrido tiene que
   poder verse.* (`L-321`: un instrumento que no imprime no midió nada.) */
CREATE TEMP TABLE _arnes (n int GENERATED ALWAYS AS IDENTITY, caso text, assert text, resultado text);

DO $arnes$
DECLARE
  v_uid      uuid;
  v_cuenta   uuid;
  v_tarjeta  uuid;
  v_oferta   uuid;
  v_serie_ok uuid;
  v_serie_no uuid;
  v_r        jsonb;
  v_n        int;
  v_estado   text;
  v_reint    int;
  v_susc     uuid;
  v_meta     jsonb;
BEGIN
  -- ── ⓪ EL TERRENO — de datos VIVOS, no fabricados ─────────────────────────
  -- 🔴 Se toma un vendedor REAL con turnos y una oferta REAL publicada. *Un
  --    arnés sobre un vendedor inventado prueba que el SQL corre, no que el
  --    circuito funciona: el que falla en producción es el vendedor de verdad.*
  SELECT cc.id INTO v_cuenta
    FROM cuentas_comerciales cc
   WHERE cc.estado = 'activa'
     AND EXISTS (SELECT 1 FROM entrega_turnos t WHERE t.cuenta_comercial_id = cc.id AND t.activo)
     AND EXISTS (SELECT 1 FROM ofertas o WHERE o.cuenta_comercial_id = cc.id AND o.estado='publicada')
   LIMIT 1;
  IF v_cuenta IS NULL THEN
    RAISE EXCEPTION 'ARNES ABORTA: no hay vendedor vivo con turnos y oferta — el arnes no puede medir nada';
  END IF;

  SELECT o.id INTO v_oferta FROM ofertas o
   WHERE o.cuenta_comercial_id = v_cuenta AND o.estado='publicada' AND o.precio > 0 LIMIT 1;

  SELECT user_id INTO v_uid FROM tarjetas_guardadas WHERE estado='guardada' LIMIT 1;
  IF v_uid IS NULL THEN
    SELECT id INTO v_uid FROM auth.users LIMIT 1;
  END IF;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'ARNES ABORTA: no hay usuario'; END IF;

  /* 🔴 Las columnas SE MIDIERON: `token` y `proveedor` son NOT NULL y no se
     llaman como uno supondría (`token_proveedor` no existe). *Escribirlas de
     memoria hizo fallar la primera corrida — y ese fallo es barato porque
     ocurrió acá; el mismo supuesto dentro del cuerpo del cobro habría salido
     verde en el arnés y roto en producción.* */
  INSERT INTO tarjetas_guardadas (user_id, estado, marca, ultimos4, bin, token, proveedor)
  VALUES (v_uid, 'guardada', 'VISA', '4242', '424242',
          'arnes-tok-' || gen_random_uuid()::text, 'nuvei')
  RETURNING id INTO v_tarjeta;

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO A · LA SERIE QUE COBRA SOLA
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO pedidos_recurrencias
    (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, metodo_entrega,
     proximo_pedido_fecha, tarjeta_id, monto_esperado, estado, aviso_dias)
  VALUES (v_uid, v_cuenta, 30,
     jsonb_build_array(jsonb_build_object('oferta_id', v_oferta, 'cantidad', 1)),
     jsonb_build_object('etiqueta','arnes'), 'despacho',
     (now() AT TIME ZONE 'America/Guayaquil')::date,   -- vencida HOY
     v_tarjeta, 999999, 'activa', 2)
  RETURNING id INTO v_serie_ok;

  v_r := recurrencias_vencidas_pendientes();

  -- A1 · la serie entra a la lista
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A1 FALLA: la serie vencida no entro a para_cobrar. %', v_r;
  END IF;

  -- A2 · 🔴 EL DESGLOSE SE CONGELÓ. *Sin esto la compuerta 2 rebota todo cobro
  --      recurrente — es el defecto que la precondición ya destapó una vez.*
  SELECT count(*) INTO v_n FROM recurrencia_desglose
   WHERE recurrencia_id = v_serie_ok;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A2 FALLA: desgloses congelados = %', v_n; END IF;

  -- A3 · el intento nació con PAGADOR EXPLÍCITO y origen declarado
  SELECT count(*) INTO v_n FROM pagos_intentos
   WHERE recurrencia_id = v_serie_ok
     AND pagador_user_id = v_uid AND pagador_origen = 'recurrencia'
     AND estado = 'iniciado';
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 FALLA: intentos con pagador explicito = %', v_n; END IF;

  -- A4 · 🔴 EL DISCRIMINADOR DE LA COMPUERTA 0 — el cron que corre DOS VECES.
  --      *Es la compuerta crítica de §4bis: sin cliente presente es la única
  --      defensa, y este assert es la ÚNICA prueba de que existe.*
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A4 FALLA: la segunda pasada volvio a listar la serie — el cron cobraria dos veces';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_ok
                    AND x->>'motivo' = 'pago_en_proceso') THEN
    RAISE EXCEPTION 'A4b FALLA: freno sin el motivo pago_en_proceso. %', v_r;
  END IF;

  -- A5 · la edge cobra (se SIMULA su efecto, declarado en la cabecera)
  UPDATE pagos_intentos SET estado='aprobado', cerrado_en=now()
   WHERE recurrencia_id = v_serie_ok;

  -- A6 · con el cobro aprobado, la serie ya NO vuelve a listarse
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A6 FALLA: se lista una serie ya cobrada';
  END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A1','VERDE · la serie vencida ENTRA a para_cobrar');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A2','VERDE · el desglose del periodo se CONGELO (1 fila)');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A3','VERDE · el intento nace con pagador_user_id Y pagador_origen=recurrencia');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A4','VERDE · 🔴 el cron corre DOS VECES y la compuerta 0 contiene el segundo');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A4b','VERDE · el freno dice su motivo: pago_en_proceso');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A6','VERDE · con el cobro aprobado la serie NO vuelve a listarse');
  RAISE NOTICE 'CASO A VERDE — entra · congela · pagador explicito · el cron dos veces NO cobra dos veces · cobrada sale';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO B · LA QUE FALLA A PROPÓSITO Y RECORRE LOS TRES DÍAS HASTA LA PAUSA
  --
  -- 🔴 **ES LA MITAD QUE LA PRECONDICIÓN EXIGE** — y la que despierta, por
  --    primera vez, el mecanismo que espera desde el 6-ago (`L-387`).
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO pedidos_recurrencias
    (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, metodo_entrega,
     proximo_pedido_fecha, tarjeta_id, monto_esperado, estado, aviso_dias)
  VALUES (v_uid, v_cuenta, 30,
     jsonb_build_array(jsonb_build_object('oferta_id', v_oferta, 'cantidad', 1)),
     jsonb_build_object('etiqueta','arnes-falla'), 'despacho',
     (now() AT TIME ZONE 'America/Guayaquil')::date,
     v_tarjeta, 999999, 'activa', 2)
  RETURNING id INTO v_serie_no;

  FOR v_n IN 1..3 LOOP
    v_r := recurrencias_vencidas_pendientes();

    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
                    WHERE (x->>'recurrencia_id')::uuid = v_serie_no) THEN
      RAISE EXCEPTION 'B FALLA en el intento %: la serie no se listo. %', v_n, v_r;
    END IF;

    /* El proveedor rechaza. **La causa va con VOZ GENÉRICA DECLARADA** — 🔴
       `§6` no puede decir la causa fina hasta que llegue la tabla de
       `status_detail` de Erick. *Se construye el cajón; jamás se adivina la
       etiqueta.* */
    UPDATE pagos_intentos SET estado='rechazado', cerrado_en=now(),
           motivo_rechazo='no_aprobado'
     WHERE recurrencia_id = v_serie_no AND recurrencia_periodo = (now() AT TIME ZONE 'America/Guayaquil')::date
       AND estado = 'iniciado';

    UPDATE pedidos_recurrencias
       SET reintentos = reintentos + 1,
           ultimo_fallo_en = now(),
           ultimo_fallo_causa = 'no_aprobado',
           estado = CASE WHEN reintentos + 1 >= 3 THEN 'pausada' ELSE estado END
     WHERE id = v_serie_no;
  END LOOP;

  SELECT estado, reintentos INTO v_estado, v_reint
    FROM pedidos_recurrencias WHERE id = v_serie_no;

  -- B1 · 🔴 LA PAUSA OCURRIÓ, y al TERCER fallo — ni antes ni después
  IF v_estado <> 'pausada' THEN
    RAISE EXCEPTION 'B1 FALLA: tras 3 fallos el estado es % (esperado pausada)', v_estado;
  END IF;
  IF v_reint <> 3 THEN
    RAISE EXCEPTION 'B1b FALLA: reintentos = % (esperado 3)', v_reint;
  END IF;

  -- B2 · 🔴 PAUSADA ≠ CANCELADA. *§6 firma que la pausa es REANUDABLE; si el
  --      motor la cancelara, el cliente perdería la serie por un problema de su
  --      banco.* El discriminador es que sigue existiendo y con su historia.
  IF NOT EXISTS (SELECT 1 FROM pedidos_recurrencias
                  WHERE id = v_serie_no AND ultimo_fallo_causa IS NOT NULL) THEN
    RAISE EXCEPTION 'B2 FALLA: la serie pausada perdio su rastro de fallo';
  END IF;

  -- B3 · una serie PAUSADA ya no se cobra
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_no) THEN
    RAISE EXCEPTION 'B3 FALLA: una serie pausada volvio a listarse para cobro';
  END IF;

  -- B4 · reactivar LIMPIA el rastro — *arrastrar reintentos viejos pausaría la
  --      serie nueva antes de tiempo.*
  UPDATE pedidos_recurrencias SET estado='activa', reintentos=0,
         ultimo_fallo_en=NULL, ultimo_fallo_causa=NULL WHERE id = v_serie_no;
  SELECT reintentos INTO v_reint FROM pedidos_recurrencias WHERE id = v_serie_no;
  IF v_reint <> 0 THEN RAISE EXCEPTION 'B4 FALLA: reactivar no limpio el conteo'; END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B0','VERDE · la serie se lista y se cobra en los TRES intentos');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B1','VERDE · 🔴 PAUSA al TERCER fallo — ni antes ni despues');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B1b','VERDE · reintentos = 3 exactos');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B2','VERDE · PAUSADA != CANCELADA: conserva su rastro de fallo (reanudable)');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B3','VERDE · una serie PAUSADA ya no se lista para cobro');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B4','VERDE · reactivar LIMPIA el conteo (no arrastra reintentos viejos)');
  RAISE NOTICE 'CASO B VERDE — 3 fallos · pausa al TERCERO · pausada != cancelada · pausada no se cobra · reactivar limpia';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO C · LOS FRENOS DE LA RAÍZ DE AUTORIZACIÓN
  -- ══════════════════════════════════════════════════════════════════════════
  UPDATE pedidos_recurrencias SET tarjeta_id = NULL WHERE id = v_serie_no;
  v_r := recurrencias_vencidas_pendientes();
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_no
                    AND x->>'motivo' = 'sin_medio_autorizado') THEN
    RAISE EXCEPTION 'C1 FALLA: sin medio autorizado no freno con su nombre. %', v_r;
  END IF;

  -- C2 · 🔴 EL MEDIO QUE MUERE: la serie NO salta a otra tarjeta (§2)
  UPDATE pedidos_recurrencias SET tarjeta_id = v_tarjeta WHERE id = v_serie_no;
  UPDATE tarjetas_guardadas SET estado = 'rechazada' WHERE id = v_tarjeta;
  v_r := recurrencias_vencidas_pendientes();
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_no
                    AND x->>'motivo' = 'medio_no_disponible') THEN
    RAISE EXCEPTION 'C2 FALLA: con el medio muerto no freno — pudo saltar a otra tarjeta';
  END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('C','C1','VERDE · sin medio autorizado frena con su nombre');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('C','C2','VERDE · 🔴 §2: con el medio MUERTO la serie NO salta a otra tarjeta');
  RAISE NOTICE 'CASO C VERDE — sin medio frena con nombre · medio muerto NO salta a otra tarjeta';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO D · EL PLAN — sin cobro no renueva, y `pago_simulado` está muerto
  -- ══════════════════════════════════════════════════════════════════════════
  SELECT id INTO v_susc FROM suscripciones_servicio
   WHERE tipo_servicio='paseo_mensual' LIMIT 1;

  IF v_susc IS NULL THEN
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D0','⚠️ NO CONCLUYENTE · no hay suscripcion de plan viva para medir');
  ELSE
    -- D1 · 🔴 SIN INTENTO APROBADO NO RENUEVA. *Es el gate que separa este arco
    --      del cuerpo viejo, que renovaba por confianza.*
    v_r := renovar_plan_cobrado(v_susc, (SELECT periodo_fin FROM suscripciones_servicio WHERE id=v_susc));
    IF COALESCE((v_r->>'ok')::boolean, true) IS NOT FALSE
       OR v_r->>'motivo' <> 'sin_cobro_aprobado' THEN
      RAISE EXCEPTION 'D1 FALLA: renovo sin cobro aprobado. %', v_r;
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D1','VERDE · 🔴 sin intento APROBADO del periodo, el plan NO renueva');

    -- D2 · con el cobro aprobado, renueva y las citas nacen
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total)
      SELECT v_susc, periodo_fin, 100, 0, 100 FROM suscripciones_servicio WHERE id=v_susc
      ON CONFLICT DO NOTHING;
    INSERT INTO pagos_intentos (suscripcion_servicio_id, suscripcion_periodo, monto, moneda,
                                estado, forma, proveedor, pagador_user_id, pagador_origen,
                                clave_idempotencia)
      SELECT v_susc, periodo_fin, 100, 'USD', 'aprobado', 'tokenizacion', 'nuvei',
             user_id, 'recurrencia', 'arnes-plan-' || gen_random_uuid()::text
        FROM suscripciones_servicio WHERE id=v_susc;

    v_r := renovar_plan_cobrado(v_susc, (SELECT periodo_fin FROM suscripciones_servicio WHERE id=v_susc));
    IF COALESCE((v_r->>'renovado')::boolean,false) IS NOT TRUE THEN
      RAISE EXCEPTION 'D2 FALLA: con cobro aprobado no renovo. %', v_r;
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D2','VERDE · con el cobro APROBADO renueva y las citas nacen');

    -- D3 · ☠️ `pago_simulado` NO aparece en el cobro nuevo
    SELECT pago_metadata->'cobros'->-1 INTO v_meta
      FROM suscripciones_servicio WHERE id=v_susc;
    IF v_meta ? 'pago_simulado' THEN
      RAISE EXCEPTION 'D3 FALLA: el cobro nuevo sigue marcando pago_simulado';
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D3','VERDE · ☠️ la bandera que decia "ya entrego" no aparece en el cobro nuevo');
  END IF;

  RAISE NOTICE '════ ARNES COMPLETO: A (cobra sola) · B (falla hasta la pausa) · C (raiz de autorizacion) ════';
END $arnes$;

SELECT n, caso, assert, resultado FROM _arnes ORDER BY n;

ROLLBACK;

-- Verificación post-rollback (fuera de la transacción):
--   SELECT count(*) FROM pedidos_recurrencias WHERE entrega->>'etiqueta' LIKE 'arnes%';
--   → esperado 0
