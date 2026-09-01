/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · LOS LECTORES DEL HILO — la mitad que faltaba de la mensajería.
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 MOTOR SIN PUERTA, Y ESTA VEZ LO COMETÍ YO ─────────────────────────
   Dejé **tres escritores y un lector de VIGILANCIA**
   (`obtener_solicitudes_en_silencio` es el reloj de los 5 días: sirve para
   AVISAR, no para MOSTRAR) y **ninguna forma de dibujar el hilo**.
   Lo midió C con control (770 `CREATE FUNCTION`): las cuatro RPC existen y
   **cero wrappers**, así que desde `apps/` no se pueden llamar — la puerta
   única es la regla de la casa.

   > ### Es exactamente la lección que el brief de S107 marcó a fuego: *el contrato de una pieza de motor incluye su wrapper.* Seis veces en una sesión, y hoy una séptima.

   *Y la forma en que se ve es la peor: el motor pasa sus pruebas, el typecheck
   está en verde, y las dos superficies que le dan sentido no se pueden empezar.*

   ── DOS LECTORES, NO UNO CON PARÁMETRO ──────────────────────────────────
   C ofreció *«dos lectores, o uno con alcance por rol, como preferís vos»*.
   **Van dos**, y la razón no es estilo: **sus gates son distintos** — uno mira
   `solicitante_user_id = auth.uid()`, el otro mira quién publicó el animal.
   *Un lector con un parámetro de rol tiene los dos predicados adentro y un
   `IF` que elige: el día que uno de los dos cambie, el otro se mueve con él.*

   ── ⚠️ EL CONTADOR VA SEPARADO, Y LO PIDIÓ ASÍ ──────────────────────────
   §9 pide **un contador que pueda llegar a cero**. Si se derivara contando en
   el cliente, el número dependería de cuántas páginas se trajeron.
   > ### Un contador que miente hacia abajo es peor que no tenerlo: dice que no hay trabajo pendiente.
   ⇒ `contar_solicitudes_por_revisar()` cuenta **en el servidor**, sin traer un
   solo hilo.

   ── LOS MENSAJES VIAJAN CON SU HILO ─────────────────────────────────────
   Cada solicitud trae sus mensajes en un `jsonb` ordenado. *Traerlos aparte
   obligaría a la pantalla a hacer N+1 viajes para dibujar una lista de
   conversaciones — el defecto que S94-PERF midió como el techo real del
   producto.*

   **76(g): NO RIGE.** Tres funciones nuevas, cero DDL, cero backfill.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-lectores-hilo.sql`, escrita
   ANTES; declara que **al correrla las dos superficies del hilo se apagan**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* Los mensajes de un hilo, en UN lugar. Los dos lectores lo usan, así que la
   forma del hilo no puede divergir entre la familia y el publicador. */
CREATE OR REPLACE FUNCTION public._hilo_mensajes(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'mensajeId', m.id, 'autorUserId', m.autor_user_id,
           'cuerpo', m.cuerpo, 'automatica', m.automatica, 'creadoEn', m.creado_en)
         ORDER BY m.creado_en), '[]'::jsonb)
    FROM adopcion_mensaje m WHERE m.solicitud_id = p_solicitud_id;
$$;

-- ══ ① EL LADO DE LA FAMILIA ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_mis_solicitudes_adopcion()
RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text,
              creada_en timestamptz, cerrada_en timestamptz,
              mascota_id uuid, mascota_nombre text, mascota_especie text,
              mascota_foto_url text, publicador_nombre text, mensajes jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         m.id, m.nombre, m.especie, m.foto_url, c.nombre_comercial,
         public._hilo_mensajes(s.id)
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    JOIN cuentas_comerciales c  ON c.id = p.cuenta_comercial_id
   WHERE s.solicitante_user_id = auth.uid()
   ORDER BY s.creada_en DESC;
END $$;

-- ══ ② EL LADO DEL PUBLICADOR ═════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_de_mis_publicaciones(
  p_solo_por_revisar boolean DEFAULT false)
RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text,
              creada_en timestamptz, cerrada_en timestamptz,
              solicitante_user_id uuid, solicitante_nombre text,
              mascota_id uuid, mascota_nombre text, mascota_foto_url text,
              mensajes jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         s.solicitante_user_id, pr.nombre,
         m.id, m.nombre, m.foto_url,
         public._hilo_mensajes(s.id)
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    LEFT JOIN profiles pr       ON pr.id = s.solicitante_user_id
   /* 🔴 EL GATE ES LA PUBLICACIÓN, NO EL REFUGIO — §5: *«sólo lo ve el
      publicador del ANIMAL SOLICITADO»*. Es el mismo helper que la RLS. */
   WHERE public._user_publico_esta_publicacion(s.publicacion_id, auth.uid())
     AND (NOT p_solo_por_revisar OR s.estado IN ('recibida','en_conversacion'))
   ORDER BY s.creada_en DESC;
END $$;

-- ══ ③ EL CONTADOR — un número, sin traer un solo hilo ════════════════════
CREATE OR REPLACE FUNCTION public.contar_solicitudes_por_revisar()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* «Por revisar» = la solicitud está viva. **Puede llegar a cero**, que es lo
     que §9 pide de un contador. */
  SELECT count(*) INTO v_n
    FROM adopcion_solicitud s
   WHERE s.estado IN ('recibida','en_conversacion')
     AND public._user_publico_esta_publicacion(s.publicacion_id, auth.uid());
  RETURN v_n;
END $$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_solicitudes_adopcion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.contar_solicitudes_por_revisar() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._hilo_mensajes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_mis_solicitudes_adopcion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_solicitudes_por_revisar() TO authenticated;

-- ══ ④ CINTURÓN — el rojo primero, y el par que discrimina ════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_cuenta uuid; v_owner uuid; v_otro uuid;
  v_pub uuid; v_sol uuid; v_n int; v_msgs jsonb;
BEGIN
  SELECT m.id INTO v_masc FROM mascotas m WHERE m.familia_id IS NOT NULL LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_owner FROM cuentas_comerciales c LIMIT 1;
  SELECT u.id INTO v_otro FROM auth.users u WHERE u.id <> v_owner LIMIT 1;

  BEGIN
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en)
         VALUES (v_cuenta, 'refugio', 'activo', now());
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_pub := (public.publicar_adoptable(v_masc, v_cuenta)->>'publicacion_id')::uuid;

    -- ══ el contador ARRANCA EN CERO, y eso es lo que §9 pide ═══════════
    IF public.contar_solicitudes_por_revisar() <> 0 THEN
      RAISE EXCEPTION 'CINTURON: el contador no arranca en cero';
    END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_otro, 'role','authenticated')::text);
    v_sol := (public.crear_solicitud_adopcion(v_pub, 'Hola, me interesa.')->>'solicitud_id')::uuid;

    -- ══ VERDE ① · la FAMILIA ve SU hilo, con sus mensajes ══════════════
    SELECT count(*) INTO v_n
      FROM public.obtener_mis_solicitudes_adopcion() x WHERE x.solicitud_id = v_sol;
    SELECT x.mensajes INTO v_msgs
      FROM public.obtener_mis_solicitudes_adopcion() x WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la familia no ve su solicitud (n=%)', v_n; END IF;
    IF jsonb_array_length(v_msgs) <> 1 THEN
      RAISE EXCEPTION 'CINTURON: el hilo llego sin sus mensajes (n=%)', jsonb_array_length(v_msgs);
    END IF;

    -- ══ ROJO · UN TERCERO NO VE EL HILO AJENO ══════════════════════════
    /* El par que discrimina: sin este brazo, el verde de arriba diría «se ve»
       sin decir «y sólo lo ve quien debe». */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SELECT count(*) INTO v_n FROM public.obtener_mis_solicitudes_adopcion() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO: el publicador ve la solicitud por el lector de la FAMILIA (n=%)', v_n;
    END IF;

    -- ══ VERDE ② · el PUBLICADOR sí la ve por SU lector, y el contador va a 1
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el publicador no ve la solicitud (n=%)', v_n; END IF;
    IF public.contar_solicitudes_por_revisar() <> 1 THEN
      RAISE EXCEPTION 'CINTURON: el contador no subio a 1';
    END IF;

    -- ══ VERDE ③ · el contador VUELVE A CERO al cerrar ══════════════════
    PERFORM public.cerrar_solicitud_adopcion(v_sol, 'declinada');
    IF public.contar_solicitudes_por_revisar() <> 0 THEN
      RAISE EXCEPTION 'CINTURON: el contador NO vuelve a cero — §9 pide que pueda llegar a cero';
    END IF;
    -- y el hilo cerrado SIGUE visible para el publicador (trazabilidad, §5.4)
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones() x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON: el hilo declinado desaparecio — se pierde el material de una disputa';
    END IF;
    -- pero NO cuenta como «por revisar»
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_de_mis_publicaciones(true) x
     WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: un hilo cerrado sigue contando como por revisar'; END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN
     ('obtener_mis_solicitudes_adopcion','obtener_solicitudes_de_mis_publicaciones',
      'contar_solicitudes_por_revisar')
     AND array_to_string(p.proacl,' ') ILIKE '%anon=%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: anon con EXECUTE (n=%)', v_n; END IF;

  RAISE NOTICE 'CINTURON VERDE · la familia ve SU hilo con sus mensajes · ROJO: el publicador NO lo ve por el lector de la familia · el publicador SI por el suyo · el contador va 0 -> 1 -> 0 y un hilo cerrado sigue VISIBLE pero NO cuenta · anon fuera';
END
$cint$;

COMMIT;
