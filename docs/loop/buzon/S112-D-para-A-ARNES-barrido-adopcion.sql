/* ═══════════════════════════════════════════════════════════════════════════
   S112-D · ARNÉS DEL BARRIDO DIARIO — corre PEGADO a la migración, y termina
   en ROLLBACK. Residuo 0.
   ═══════════════════════════════════════════════════════════════════════════
   🔑 **Prueba el TEXTO de la migración, no una copia.** El runner concatena el
   archivo real (sin su `BEGIN;`/`COMMIT;`) con este arnés dentro de UNA
   transacción que se deshace. *Un arnés que reimplementa lo que mide prueba su
   propia copia.*
   ═══════════════════════════════════════════════════════════════════════════ */
DO $arnes$
DECLARE
  v_rol text := current_user;
  v_m1 uuid; v_m2 uuid; v_cuenta uuid; v_owner uuid; v_otro uuid;
  v_pub1 uuid; v_pub2 uuid;
  v_reloj uuid; v_mem uuid; v_s89 uuid; v_s90 uuid; v_sacc uuid;
  v_r jsonb; v_n int; v_k int; v_rojo boolean; v_msg text;
  v_id uuid; v_motivo text; v_anon timestamptz;
BEGIN
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_owner FROM cuentas_comerciales c LIMIT 1;
  SELECT u.id INTO v_otro FROM auth.users u WHERE u.id <> v_owner LIMIT 1;
  SELECT id INTO v_m1 FROM mascotas WHERE familia_id IS NOT NULL
     AND estado_vida IS NOT DISTINCT FROM 'activa' ORDER BY id LIMIT 1;
  SELECT id INTO v_m2 FROM mascotas WHERE familia_id IS NOT NULL
     AND estado_vida IS NOT DISTINCT FROM 'activa' AND id <> v_m1 ORDER BY id LIMIT 1;
  IF v_m1 IS NULL OR v_m2 IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'ARNES: sin sujetos reales';
  END IF;

  BEGIN
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en)
         VALUES (v_cuenta, 'refugio', 'activo', now());

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_pub1 := (public.publicar_adoptable(v_m1, v_cuenta)->>'publicacion_id')::uuid;
    v_pub2 := (public.publicar_adoptable(v_m2, v_cuenta)->>'publicacion_id')::uuid;

    /* ── LAS TERMINALES PRIMERO: el índice `uq_solicitud_viva` sólo deja UNA
       viva por (publicación, persona), así que las cerradas se fabrican antes
       de dejar la viva del reloj. */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_otro, 'role','authenticated')::text);

    -- ① la de 89 días (control NEGATIVO de la purga)
    v_s89 := (public.crear_solicitud_adopcion(v_pub1, 'postulo 89')->>'solicitud_id')::uuid;
    PERFORM public.cerrar_solicitud_adopcion(v_s89, 'declinada');

    -- ② la de 91 días, CON respuesta del refugio para poder discriminar autores
    v_s90 := (public.crear_solicitud_adopcion(v_pub1, 'postulo 90')->>'solicitud_id')::uuid;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    PERFORM public.responder_solicitud_adopcion(v_s90, 'te respondo yo, el refugio');
    PERFORM public.cerrar_solicitud_adopcion(v_s90, 'declinada');

    -- ③ la CONCRETADA (control NEGATIVO duro)
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_otro, 'role','authenticated')::text);
    v_sacc := (public.crear_solicitud_adopcion(v_pub1, 'postulo y me la dan')->>'solicitud_id')::uuid;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    PERFORM public.cerrar_solicitud_adopcion(v_sacc, 'aceptada');

    -- ④ las dos VIVAS del reloj
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_otro, 'role','authenticated')::text);
    v_reloj := (public.crear_solicitud_adopcion(v_pub1, 'hola, me interesa')->>'solicitud_id')::uuid;
    v_mem   := (public.crear_solicitud_adopcion(v_pub2, 'hola, me interesa')->>'solicitud_id')::uuid;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    -- se las envejece
    UPDATE adopcion_solicitud SET creada_en = now() - interval '6 days'
     WHERE id IN (v_reloj, v_mem);
    UPDATE adopcion_solicitud SET cerrada_en = now() - interval '89 days' WHERE id = v_s89;
    UPDATE adopcion_solicitud SET cerrada_en = now() - interval '91 days' WHERE id = v_s90;
    UPDATE adopcion_solicitud SET cerrada_en = now() - interval '200 days' WHERE id = v_sacc;
    -- y la segunda mascota entra en MEMORIAL
    UPDATE mascotas SET estado_vida = 'fallecida' WHERE id = v_m2;

/* ═══════════════════ BRAZO (a) · EL RELOJ DE 5 DÍAS ═══════════════════ */

    -- CONTROL POSITIVO: las DOS son candidatas ANTES del filtro de memorial.
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x
     WHERE x.solicitud_id IN (v_reloj, v_mem);
    IF v_n <> 2 THEN
      RAISE EXCEPTION 'ARNES CP-a1: la consulta base no ve las dos (n=%) — el filtro de memorial no probaria nada', v_n;
    END IF;

    v_r := public.avisar_adopcion_sin_respuesta();
    IF (v_r->>'avisadas')::int <> 1 THEN
      RAISE EXCEPTION 'ARNES a2: aviso % en vez de 1 (%)', v_r->>'avisadas', v_r;
    END IF;
    IF (v_r->>'saltadas_memorial')::int <> 1 THEN
      RAISE EXCEPTION 'ROJO-a3: el MEMORIAL no fue excluido (%) — le avisamos a una familia sobre un animal que murio', v_r;
    END IF;

    -- la intención existe para la viva…
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_reloj::text;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES a4: no nacio la intencion (n=%)', v_n; END IF;
    -- …y NO para la del memorial
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_mem::text;
    IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-a5: nacio una intencion para el MEMORIAL (n=%)', v_n; END IF;

    -- 🔴 EL GATE 3, PROBADO EN LOS DOS SENTIDOS ─────────────────────────
    /* Sin este par, «le pasamos NULL» es una preferencia. Con él es un hecho. */
    SELECT motivo INTO v_motivo FROM notificacion_intencion
     WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_reloj::text;
    IF v_motivo IS NOT DISTINCT FROM 'descartada_sin_acceso' THEN
      RAISE EXCEPTION 'ARNES a6: con mascota NULL igual la descarto por acceso';
    END IF;
    -- y ahora el MISMO aviso CON la mascota: tiene que morir en el gate
    v_id := public.registrar_intencion_notificacion(
      p_tipo => 'adopcion_sin_respuesta', p_destinatario_user_id => v_otro,
      p_mascota_id => v_m1, p_evento_id => NULL, p_datos => '{}'::jsonb,
      p_clave_dedup => 'arnes_gate3:' || v_reloj::text);
    SELECT motivo INTO v_motivo FROM notificacion_intencion WHERE id = v_id;
    IF v_motivo IS DISTINCT FROM 'descartada_sin_acceso' THEN
      RAISE EXCEPTION 'ROJO-a7: pasar la mascota NO fue descartado por acceso (motivo=%) — la premisa del diseno era falsa', coalesce(v_motivo,'NULL');
    END IF;

    -- la marca quedó puesta en la avisada y NO en la del memorial
    SELECT aviso_silencio_emitido_en INTO v_anon FROM adopcion_solicitud WHERE id = v_reloj;
    IF v_anon IS NULL THEN RAISE EXCEPTION 'ROJO-a8: aviso y NO sello — va a avisar todos los dias'; END IF;
    SELECT aviso_silencio_emitido_en INTO v_anon FROM adopcion_solicitud WHERE id = v_mem;
    IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ARNES a9: sello una que no aviso'; END IF;

    -- IDEMPOTENCIA: la segunda corrida no hace nada
    v_r := public.avisar_adopcion_sin_respuesta();
    IF (v_r->>'avisadas')::int <> 0 THEN
      RAISE EXCEPTION 'ROJO-a10: la segunda corrida volvio a avisar (%)', v_r;
    END IF;

    /* 🔴 EL ROJO QUE JUSTIFICA EL UPDATE — se le quita el sello y se re-mide.
       Si sin el sello la consulta la devuelve otra vez, el UPDATE es lo unico
       que impide un aviso diario para siempre. */
    UPDATE adopcion_solicitud SET aviso_silencio_emitido_en = NULL WHERE id = v_reloj;
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x
     WHERE x.solicitud_id = v_reloj;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'ARNES a11: sin el sello la consulta NO la devuelve — entonces el UPDATE no era lo que la frenaba (n=%)', v_n;
    END IF;
    -- y la segunda emisión NO duplica: el piso es el índice único
    v_r := public.avisar_adopcion_sin_respuesta();
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_reloj::text;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'ROJO-a12: la intencion se DUPLICO (n=%) — el piso del indice no sostuvo', v_n;
    END IF;

/* ═══════════════════ BRAZO (b) · LOS 90 DÍAS ══════════════════════════ */

    -- CONTROL POSITIVO: el hilo de la de 91 tiene sus DOS mensajes
    SELECT count(*) INTO v_n FROM adopcion_mensaje WHERE solicitud_id = v_s90;
    IF v_n <> 2 THEN RAISE EXCEPTION 'ARNES CP-b1: el hilo no tiene 2 mensajes (n=%)', v_n; END IF;

    v_r := public.purgar_postulaciones_vencidas();
    IF (v_r->>'anonimizadas')::int <> 1 THEN
      RAISE EXCEPTION 'ARNES b2: anonimizo % en vez de 1 (%)', v_r->>'anonimizadas', v_r;
    END IF;

    -- la de 91 quedó anónima
    SELECT solicitante_user_id, anonimizada_en INTO v_id, v_anon
      FROM adopcion_solicitud WHERE id = v_s90;
    IF v_id IS NOT NULL OR v_anon IS NULL THEN
      RAISE EXCEPTION 'ROJO-b3: la de 91 dias NO se anonimizo (user=%, anon=%)', v_id, v_anon;
    END IF;

    -- 🔴 APPEND-ONLY INTACTO: los DOS mensajes siguen ahí
    SELECT count(*) INTO v_n FROM adopcion_mensaje WHERE solicitud_id = v_s90;
    IF v_n <> 2 THEN
      RAISE EXCEPTION 'ROJO-b4: la purga BORRO mensajes (n=%) — el hilo es material de una disputa', v_n;
    END IF;
    -- el del postulante quedó anónimo…
    SELECT count(*) INTO v_n FROM adopcion_mensaje
     WHERE solicitud_id = v_s90 AND autor_user_id IS NULL;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-b5: el mensaje del postulante no se anonimizo (n=%)', v_n; END IF;
    -- …y el del REFUGIO NO se tocó (el discriminador de autores)
    SELECT count(*) INTO v_n FROM adopcion_mensaje
     WHERE solicitud_id = v_s90 AND autor_user_id = v_owner;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'ROJO-b6: se anonimizo tambien al REFUGIO (n=%) — se borro la identidad de quien NO se pidio', v_n;
    END IF;

    -- CONTROL NEGATIVO ① · la de 89 días NO se toca
    SELECT solicitante_user_id, anonimizada_en INTO v_id, v_anon
      FROM adopcion_solicitud WHERE id = v_s89;
    IF v_id IS NULL OR v_anon IS NOT NULL THEN
      RAISE EXCEPTION 'ROJO-b7: la de 89 DIAS se anonimizo — el plazo no se respeta';
    END IF;

    -- CONTROL NEGATIVO ② · la CONCRETADA nunca, ni con 200 días
    SELECT solicitante_user_id, anonimizada_en INTO v_id, v_anon
      FROM adopcion_solicitud WHERE id = v_sacc;
    IF v_id IS NULL OR v_anon IS NOT NULL THEN
      RAISE EXCEPTION 'ROJO-b8: se anonimizo una ACEPTADA — es el respaldo de una adopcion que ocurrio';
    END IF;

    -- IDEMPOTENCIA: segunda corrida, nada cambia
    SELECT anonimizada_en INTO v_anon FROM adopcion_solicitud WHERE id = v_s90;
    v_r := public.purgar_postulaciones_vencidas();
    IF (v_r->>'anonimizadas')::int <> 0 THEN
      RAISE EXCEPTION 'ROJO-b9: la segunda corrida volvio a purgar (%)', v_r;
    END IF;
    SELECT count(*) INTO v_n FROM adopcion_solicitud
     WHERE id = v_s90 AND anonimizada_en IS NOT DISTINCT FROM v_anon;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-b10: la segunda corrida MOVIO la marca'; END IF;

/* ═══════════════ LOS DOS ESTADOS QUE NO SE PUEDEN ESCRIBIR ════════════ */

    -- el CHECK: «anonimizada pero con identidad» es inexpresable
    v_rojo := false;
    BEGIN
      UPDATE adopcion_solicitud SET solicitante_user_id = v_otro WHERE id = v_s90;
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo THEN
      RAISE EXCEPTION 'ROJO-c1: se pudo devolver la identidad a una fila anonimizada';
    END IF;

    -- el trigger: un mensaje NACE con autor
    v_rojo := false;
    BEGIN
      INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo)
           VALUES (v_s89, NULL, 'sin autor');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'mensaje_sin_autor%' THEN
      RAISE EXCEPTION 'ROJO-c2: nacio un mensaje SIN autor (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    RAISE EXCEPTION 'ARNES_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'ARNES_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'ARNES VERDE';
END
$arnes$;
