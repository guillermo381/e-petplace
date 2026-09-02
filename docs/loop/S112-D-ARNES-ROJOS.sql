/* ═══════════════════════════════════════════════════════════════════════════
   S112-D · LOS TRES ROJOS DEL HILO — contra la base VIVA, con ROLLBACK.
   ═══════════════════════════════════════════════════════════════════════════
   Cada rojo va con su CONTROL POSITIVO: sin el par, un "no ve nada" no
   distingue "la RLS lo frena" de "el arnés miraba al lado equivocado".
   Residuo: CERO — todo cae por RAISE al final.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $arnes$
DECLARE
  v_rol text := current_user;
  v_masc uuid; v_cuenta uuid; v_owner uuid; v_solicitante uuid; v_tercero uuid;
  v_pub uuid; v_sol uuid; v_n int; v_rojo boolean; v_msg text; v_admin boolean;
BEGIN
  SELECT m.id INTO v_masc FROM mascotas m WHERE m.familia_id IS NOT NULL LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_owner FROM cuentas_comerciales c LIMIT 1;
  SELECT u.id INTO v_solicitante FROM auth.users u WHERE u.id <> v_owner LIMIT 1;
  SELECT u.id INTO v_tercero FROM auth.users u
   WHERE u.id <> v_owner AND u.id <> v_solicitante LIMIT 1;
  IF v_masc IS NULL OR v_cuenta IS NULL OR v_solicitante IS NULL OR v_tercero IS NULL THEN
    RAISE EXCEPTION 'ARNES: sin sujetos reales';
  END IF;

  BEGIN
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en)
         VALUES (v_cuenta, 'refugio', 'activo', now());

    /* ── El tercero NO puede ser admin, o el rojo seria FALSO ────────────── */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_tercero, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT public.is_admin() INTO v_admin;
    IF v_admin THEN
      RAISE EXCEPTION 'ARNES: el tercero es ADMIN — su ceguera no probaria nada';
    END IF;

    /* ── Setup: el publicador publica, el solicitante postula ────────────── */
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_pub := (public.publicar_adoptable(v_masc, v_cuenta)->>'publicacion_id')::uuid;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_solicitante, 'role','authenticated')::text);
    v_sol := (public.crear_solicitud_adopcion(v_pub, 'Hola, me interesa.')->>'solicitud_id')::uuid;

    /* ═══ CONTROL POSITIVO — los DOS que SI deben ver, ven ═══════════════ */
    SELECT count(*) INTO v_n FROM public.obtener_mis_solicitudes_adopcion() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES CP-1: el solicitante NO ve su hilo (n=%)', v_n; END IF;
    SELECT count(*) INTO v_n FROM adopcion_mensaje m WHERE m.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES CP-2: el solicitante NO lee el mensaje por RLS (n=%)', v_n; END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES CP-3: el publicador NO ve la solicitud (n=%)', v_n; END IF;

    /* ═══ ROJO ① · UN TERCERO NO LEE UN HILO AJENO ═══════════════════════
       Se mide en las TRES puertas: los dos lectores Y la RLS de las tablas.
       Un lector con un WHERE correcto sobre una tabla sin RLS pasaria este
       arnes por las dos primeras y dejaria la tercera abierta. */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_tercero, 'role','authenticated')::text);

    SELECT count(*) INTO v_n FROM public.obtener_mis_solicitudes_adopcion() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-1a: un TERCERO ve el hilo por el lector de la familia (n=%)', v_n; END IF;

    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-1b: un TERCERO ve el hilo por el lector del publicador (n=%)', v_n; END IF;

    SELECT count(*) INTO v_n FROM adopcion_solicitud s WHERE s.id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-1c: la RLS de adopcion_solicitud deja pasar a un TERCERO (n=%)', v_n; END IF;

    SELECT count(*) INTO v_n FROM adopcion_mensaje m WHERE m.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-1d: la RLS de adopcion_mensaje deja LEER LOS MENSAJES a un TERCERO (n=%)', v_n; END IF;

    /* y tampoco puede ESCRIBIR en el hilo ajeno */
    v_rojo := false;
    BEGIN PERFORM public.responder_solicitud_adopcion(v_sol, 'me meto');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'sin_acceso%' THEN
      RAISE EXCEPTION 'ROJO-1e: un TERCERO escribio en un hilo ajeno (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    /* ═══ ROJO ③ · EL HILO DECLINADO NO ACEPTA ESCRITURA ═════════════════
       Control positivo PRIMERO: mientras vive, el mismo llamado FUNCIONA.
       Sin esto, "rebota" no prueba nada: una puerta que siempre dice que no
       tambien rebota (L-438). */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_solicitante, 'role','authenticated')::text);
    PERFORM public.responder_solicitud_adopcion(v_sol, 'sigo interesado');
    SELECT count(*) INTO v_n FROM adopcion_mensaje m WHERE m.solicitud_id = v_sol;
    IF v_n <> 2 THEN RAISE EXCEPTION 'ARNES CP-4: el hilo VIVO no acepto escritura (n=%)', v_n; END IF;

    PERFORM public.cerrar_solicitud_adopcion(v_sol, 'declinada');

    /* el SOLICITANTE no escribe mas */
    v_rojo := false;
    BEGIN PERFORM public.responder_solicitud_adopcion(v_sol, 'insisto');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'solicitud_terminal%' THEN
      RAISE EXCEPTION 'ROJO-3a: se escribio en un hilo DECLINADO (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    /* y el PUBLICADOR tampoco — el cierre es del hilo, no de una de las partes */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    v_rojo := false;
    BEGIN PERFORM public.responder_solicitud_adopcion(v_sol, 'reabro');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'solicitud_terminal%' THEN
      RAISE EXCEPTION 'ROJO-3b: el PUBLICADOR escribio en un hilo declinado (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    /* ── §5.4: declinado se LEE siempre — material de una disputa ───────── */
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES CP-5: el hilo declinado DESAPARECIO del publicador (n=%)', v_n; END IF;
    SELECT count(*) INTO v_n FROM adopcion_mensaje m WHERE m.solicitud_id = v_sol;
    IF v_n <> 2 THEN RAISE EXCEPTION 'ARNES CP-6: los mensajes del hilo declinado no se leen (n=%)', v_n; END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'ARNES_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'ARNES_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'ARNES VERDE · ROJO-1 el tercero no ve NI por los dos lectores NI por la RLS de las dos tablas, y tampoco escribe · ROJO-3 el hilo declinado no acepta escritura de NINGUNA de las dos partes, y sigue LEYENDOSE · controles positivos: los dos legitimos ven, y el hilo VIVO si acepta escritura';
END
$arnes$;
