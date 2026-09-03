/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · LA BURBUJA DE PENDIENTES — un viaje, lista blanca, y la RLS
   como puerta.

   🟢 Pedido del founder (3-sep): `contar_pendientes()` con
   `{ mensajesSinLeer, hilosConSinLeer[], solicitudesPorRevisar }` para la
   cuenta que pregunta, **en un viaje**.

   ⚠️ 76(g) — LA VEDA NO RIGE. Cero backfill, cero anclas: una función de sólo
   lectura y una tabla que entra a la publicación. Nada que reescribir.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══ ① POR QUÉ ES `INVOKER` Y NO `DEFINER` ═════════════════════════════════
   Toda la casa escribe sus lectores `DEFINER` y repite el predicado adentro.
   **Acá eso sería el defecto**, no la costumbre: el predicado de «qué mensajes
   son míos» YA existe y es la policy de `adopcion_mensaje` —solicitante O
   publicador O admin—. *Un `DEFINER` que lo copia crea una SEGUNDA regla que
   puede divergir de la que sirve los mensajes, y el día que diverjan la
   burbuja va a contar hilos que la pantalla no muestra.*

   Con `INVOKER` **la puerta ES la RLS**, y no puede divergir de sí misma.
   Medido antes de elegirlo: `authenticated` tiene `SELECT` sobre las tres
   tablas y las tres tienen RLS encendida ⇒ alcanza.

   🔴 Y la contracara, dicha: sin `SELECT` la función devolvería CEROS en vez
   de fallar. Por eso el cinturón no prueba «da un número»: prueba que **un
   tercero da cero mientras la familia da distinto de cero**. *Un cero puede
   ser la verdad o puede ser un permiso faltante, y los dos se leen igual.* */

CREATE OR REPLACE FUNCTION public.contar_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_u uuid := auth.uid();
  v_msgs int; v_hilos uuid[]; v_rev int;
BEGIN
  IF v_u IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  /* ═══ EL MISMO PREDICADO QUE LA LISTA, LETRA POR LETRA ═══════════════════
     `autor_user_id IS DISTINCT FROM` + `creado_en > COALESCE(leido_hasta,
     '-infinity')` es **exactamente** lo que ya cuentan
     `obtener_mis_solicitudes_adopcion` y
     `obtener_solicitudes_de_mis_publicaciones` (medido: las dos lo tienen
     idéntico). *Si la burbuja dijera «3» y la lista mostrara 5, nadie sabría
     cuál de los dos números está bien* — por eso se copia el predicado y no
     se mejora.

     Lo propio del autor no cuenta: **mandar un mensaje no te deja un
     pendiente a vos mismo.** */
  SELECT COALESCE(sum(t.n), 0)::int,
         COALESCE(array_agg(t.solicitud_id ORDER BY t.solicitud_id), '{}'::uuid[])
    INTO v_msgs, v_hilos
    FROM (
      SELECT am.solicitud_id, count(*)::int AS n
        FROM adopcion_mensaje am
       WHERE am.autor_user_id IS DISTINCT FROM v_u
         AND am.creado_en > COALESCE(
               (SELECT l.leido_hasta FROM adopcion_lectura l
                 WHERE l.solicitud_id = am.solicitud_id AND l.user_id = v_u),
               '-infinity'::timestamptz)
       GROUP BY am.solicitud_id
    ) t;

  /* ═══ «POR REVISAR» ES LO QUE YA DECÍA EL LECTOR, NO UNA DEFINICIÓN NUEVA ═
     `estado IN ('recibida','en_conversacion')` es el literal de
     `obtener_solicitudes_de_mis_publicaciones(p_solo_por_revisar => true)`.
     *Contar sólo `recibida` habría dado un número más chico y más razonable —
     y habría discrepado con la lista que abre al tocar la burbuja.*

     🔴 El brazo del publicador va EXPLÍCITO aunque la RLS también deje ver
     las solicitudes propias: sin él, **una familia contaría sus propias
     solicitudes como «por revisar»**, y nadie revisa lo que él mismo pidió. */
  SELECT count(*)::int INTO v_rev
    FROM adopcion_solicitud s
   WHERE s.estado IN ('recibida','en_conversacion')
     AND public._user_publico_esta_publicacion(s.publicacion_id, v_u);

  /* ═══ LA LISTA BLANCA, ENTERA ════════════════════════════════════════════
     Viajan **tres cosas y nada más**: dos números y una lista de ids de hilos
     que quien pregunta ya puede abrir. **Cero cuerpos de mensaje, cero
     nombres, cero estados, cero fechas.** *Un id es un filtro, jamás un
     permiso* (molde `D-455`): con el id en la mano, abrir el hilo sigue
     pasando por la misma RLS.

     Lo que a propósito NO viaja: el número por hilo. **Ya viaja en el lector
     de la lista**, fila por fila. *Mandarlo dos veces por caminos distintos
     es fabricar la divergencia que este diseño evita.* */
  RETURN jsonb_build_object(
    'mensajes_sin_leer',       v_msgs,
    'hilos_con_sin_leer',      to_jsonb(v_hilos),
    'solicitudes_por_revisar', v_rev);
END $function$;

/* L-140 · la puerta de afuera. El guard de adentro queda igual: si un día un
   `default privileges` vuelve a conceder, la función sigue rebotando sola. */
REVOKE ALL ON FUNCTION public.contar_pendientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contar_pendientes() TO authenticated;

/* ═══ ② `adopcion_lectura` A LA PUBLICACIÓN ═════════════════════════════════
   Para que la burbuja se apague **al marcar leído**, que es la mitad del
   pedido. Su policy es `user_id = auth.uid()` sobre ALL ⇒ el socket sólo
   entrega **las filas de quien escucha**: es la tabla más angosta que se
   puede publicar.

   ⚠️ En el aparato que marca, C podría refrescar solo. Lo que esto agrega es
   **el otro aparato de la misma persona** — y ahí un refresco local no llega.

   ⚠️ Costo declarado: una tabla más para el poller de WAL, que ya es el 60 %
   del tiempo de la base (`D-739`). Es de escritura rarísima —una fila por
   hilo por persona, actualizada al abrir— así que el costo es de existir en
   la lista, no de tráfico. */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                  WHERE pubname='supabase_realtime' AND schemaname='public'
                    AND tablename='adopcion_lectura') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.adopcion_lectura;
  END IF;
END $$;

/* ═══ ③ EL CINTURÓN — CON SU SONDA, QUE SE DESHACE SOLA ═════════════
   `L-459`: la primera prueba de un guard nuevo no es que dé verde, es que dé
   ROJO sobre el primer caso real. */
DO $cinturon$
DECLARE
  v_fam  uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';  -- solicitante de los 3 hilos
  v_ref  uuid := '632727a3-9682-4fa7-b569-19a6399736ff';  -- publicador de los 6 animales
  v_otro uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';  -- ni solicitante ni publicador
  r jsonb; v_lista int; v_total int;
BEGIN
  /* ROJO 1 — sin sesión no se cuenta. */
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', NULL, true);
    r := public.contar_pendientes();
    RAISE EXCEPTION 'CINTURON: sin sesion devolvio % en vez de rebotar', r;
  EXCEPTION WHEN sqlstate '42501' THEN NULL;
  END;

  /* ROJO 2 — LA PRUEBA QUE DECIDE. Un tercero legítimo, con la tabla llena de
     mensajes, tiene que ver CERO. Si la RLS no filtrara, acá saldría el total
     de la casa. */
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro, 'role', 'authenticated')::text, true);
  r := public.contar_pendientes();
  IF (r->>'mensajes_sin_leer')::int <> 0
     OR jsonb_array_length(r->'hilos_con_sin_leer') <> 0
     OR (r->>'solicitudes_por_revisar')::int <> 0 THEN
    RAISE EXCEPTION 'CINTURON: un tercero vio %', r;
  END IF;

  /* ═══ ROJO 3 + VERDE 4 — EL DISCRIMINADOR SE FABRICA SU PROPIO CASO ══════
     🔴 Este brazo nació MAL y el propio cinturón lo cazó al primer intento.
     Decía «la familia tiene que ver distinto de cero» **y la familia había
     leído todo**: 0 era la VERDAD, no un permiso faltante. *Un discriminador
     que depende de que los datos vivos no estén vacíos da rojo sobre un
     estado legítimo* — y el día que alguien lo vea, va a bajar la vara para
     que pase, que es exactamente el defecto que el brazo venía a evitar.

     Cura, molde `L-406`: **la sonda escribe en una SUBTRANSACCIÓN QUE SE
     DESHACE SOLA.** Así el discriminador no le pide nada al mundo: se fabrica
     el mensaje sin leer que necesita, mide, y lo devuelve. */
  BEGIN
    SET LOCAL ROLE postgres;
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo)
    VALUES ('1a2b01c4-4599-45a6-800d-227d600aa983'::uuid, v_ref, 'sonda');

    /* La familia AHORA tiene uno sin leer. */
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_fam, 'role', 'authenticated')::text, true);
    r := public.contar_pendientes();
    IF (r->>'mensajes_sin_leer')::int < 1
       OR jsonb_array_length(r->'hilos_con_sin_leer') < 1 THEN
      RAISE EXCEPTION 'CINTURON: la familia no vio la sonda — %', r;
    END IF;

    /* Y LA BURBUJA DICE LO MISMO QUE LA LISTA. Con la sonda adentro el
       número es != 0, así que la igualdad prueba algo: *0 = 0 no prueba que
       se haya reusado el predicado.* */
    SELECT COALESCE(sum(sin_leer),0)::int INTO v_lista
      FROM public.obtener_mis_solicitudes_adopcion();
    IF (r->>'mensajes_sin_leer')::int <> v_lista THEN
      RAISE EXCEPTION 'CINTURON: burbuja % != lista %', r->>'mensajes_sin_leer', v_lista;
    END IF;

    /* Y EL TERCERO SIGUE VIENDO CERO CON LA SONDA PUESTA. Éste es el par que
       decide: el mismo mensaje, dos asientos, dos respuestas distintas. */
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_otro, 'role', 'authenticated')::text, true);
    r := public.contar_pendientes();
    IF (r->>'mensajes_sin_leer')::int <> 0 THEN
      RAISE EXCEPTION 'CINTURON: el tercero vio la sonda ajena — %', r;
    END IF;

    SET LOCAL ROLE postgres;
    /* Deshacer la sonda es el ÚNICO fin de este bloque. */
    RAISE EXCEPTION 'sonda deshecha' USING ERRCODE='ZZ000';
  EXCEPTION WHEN sqlstate 'ZZ000' THEN NULL;  -- todo otro error propaga
  END;

  /* VERDE 5 — el refugio cuenta lo suyo por revisar, y su número también
     coincide con su propia lista. */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ref, 'role', 'authenticated')::text, true);
  r := public.contar_pendientes();
  SELECT count(*)::int INTO v_total
    FROM public.obtener_solicitudes_de_mis_publicaciones(true);
  IF (r->>'solicitudes_por_revisar')::int <> v_total THEN
    RAISE EXCEPTION 'CINTURON: por_revisar % != lista %', r->>'solicitudes_por_revisar', v_total;
  END IF;

  /* 🔴 `RESET ROLE` NO deshace un `SET LOCAL ROLE` — medido en esta misma
     sesión: el cinturón pasaba y después el asiento en el ledger de
     migraciones corría como el rol prestado y volteaba la migración entera,
     incluida la policy que acababa de aprobar su propia prueba. */
  SET LOCAL ROLE postgres;
  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE 'CINTURON contar_pendientes: 6/6 (2 rojos + sonda con su par + 2 verdes)';
END $cinturon$;

SET LOCAL ROLE postgres;
