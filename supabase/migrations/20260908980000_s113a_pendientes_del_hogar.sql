/* ═══════════════════════════════════════════════════════════════════════════
   S113-A · lote 0 — LOS PENDIENTES DEL HOGAR, CONTADOS POR EL SERVIDOR
   Migración 20260908980000 · reversa: docs/loop/S113-A-REVERSA-20260908980000.sql

   ── LO QUE LA MEDICIÓN ENCONTRÓ, Y POR QUÉ NO NACE UNA FUNCIÓN NUEVA ───────
   El brief pedía construir `obtenerPendientesHogar()` **sólo si la medición
   lo exige**. La medición dice:

   ✅ **CHAT: ya lo cuenta el servidor.** `contar_pendientes()` existe desde
      S112 y devuelve `hilos_con_sin_leer`; `lib/pendientes-adopcion.ts` la
      consume con `useSyncExternalStore` y el shell pinta el número. **No se
      construye nada de chat.**
   🔴 **PEDIDOS: no los cuenta nadie, y el camino de hoy es el defecto.**
      `(tabs)/_layout.tsx:231` trae la LISTA ENTERA con `listarMisPedidos()`
      para responder `length > 0` y decidir si la tab existe;
      `hogar/index.tsx:891` la trae otra vez.
   ⚪ **AVISOS: null honesto, medido** — ver el comentario adentro de la
      función: la tabla existe, tiene 22 sin leer… y CERO productores.

   ── POR QUÉ SE ENSANCHA `contar_pendientes` Y NO NACE OTRA ─────────────────
   Lo pide su propia cabecera, escrita en S112 y citada literal:
     «⚠️ Hoy «pendiente» es sólo adopción. Si mañana entra guardería, se
      ensancha **esta** función: *dos contadores distintos en la misma barra
      terminan discrepando y nadie sabe cuál mirar.*»
   Pedidos es exactamente ese mañana. **Una fuente, una barra.**
   `obtenerPendientesHogar()` existe como PUERTA con la forma que el lote
   pidió, pero es una proyección de esta misma llamada — no un segundo viaje
   ni un segundo criterio.

   ── 76(g) VEDA: **NO RIGE.** Cero escritura, cero backfill. Es un lector.
   ── FUERA DE ALCANCE: el `_sin_leer_por_hilo()` que la cabecera de S112
      reclama sigue sin extraerse — su razón (no tocar dos lectores vivos a
      mitad de lote) sigue valiendo hoy, y C consume esos lectores AHORA.
   ═══════════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public.contar_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_u uuid := auth.uid();
  v_msgs int; v_hilos uuid[]; v_rev int;
  v_pedidos int;                       -- S113-A
BEGIN
  IF v_u IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  /* ═══ LOS MENSAJES SIN LEER — DUPLICACIÓN DECLARADA, NO OLVIDADA ══════════
     El predicado vive HOY dentro de `obtener_mis_solicitudes_adopcion` y de
     `obtener_solicitudes_de_mis_publicaciones`, idéntico en las dos. Acá se
     repite por TERCERA vez, **a sabiendas**, porque la alternativa es peor:
     esos dos lectores devuelven `_hilo_mensajes(...)` —el hilo entero en
     jsonb— y llamarlos para sumar un entero traería **todos los cuerpos de
     todos los mensajes de todas las conversaciones** en cada refresco de una
     burbuja.

     🔴 La cura verdadera es extraer `_sin_leer_por_hilo()` y que los TRES lo
     llamen. No se hace hoy: toca dos lectores que C consume en este mismo
     lote, y *cambiar un lector vivo por elegancia, a mitad de lote, es
     apostar el lote*. Queda como ficha con su disparo, no como intención. */
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

  /* ═══ Y ACÁ, LA FUENTE ÚNICA ══════════════════════════════════════════════
     Se llama a la función que ya existe en vez de repetir su `WHERE`. Es
     `DEFINER` y esta función es `INVOKER`: llamarla desde acá funciona y
     mantiene su propio gate de sesión. */
  v_rev := public.contar_solicitudes_por_revisar();

  /* ═══ S113-A · LOS PEDIDOS, CONTADOS ACÁ Y NO EN LA PANTALLA ══════════════
     🔴 EL DEFECTO QUE ESTO CURA, medido en el árbol antes de escribirlo:
     `apps/cliente/src/app/(tabs)/_layout.tsx:231` llama a `listarMisPedidos()`
     —que trae la LISTA ENTERA con narrativa, promesas y totales— **para
     responder un booleano**: `r.data.length > 0`, y con eso decide si la tab
     existe. `hogar/index.tsx:891` la vuelve a traer. *Traer N filas para
     contestar una pregunta de un número es el viaje que no hacía falta.*

     EL PREDICADO NO SE INVENTA: es el MISMO que la pantalla de pedidos ya usa
     para separar lo vivo de lo histórico —`pedidos/index.tsx:451`,
     `pedidos.filter((p) => !p.es_terminal)`— y `es_terminal` **no es una
     lista en código: es DATO**, la columna de `cat_narrativas_pedido` que
     `v_pedidos_narrativa` proyecta. Medido hoy:
       no terminales → pagando · confirmado · preparando · en_camino · no_llego
       terminales    → entregado · cancelado
     ⇒ «algo por hacer o en camino» = `NOT es_terminal`, sin transcribir
     ningún estado acá. El día que el catálogo gane una narrativa, este
     contador la toma solo.

     La vista es `security_invoker=true` (medido) y `pedidos` tiene RLS con
     `pedidos_select` ⇒ **el gate es el del titular y no hace falta ninguno
     nuevo**: esta función es INVOKER y no lo saltea. */
  SELECT count(*)::int INTO v_pedidos
    FROM v_pedidos_narrativa vp
   WHERE NOT vp.es_terminal;

  RETURN jsonb_build_object(
    'mensajes_sin_leer',       v_msgs,
    'hilos_con_sin_leer',      to_jsonb(v_hilos),
    'solicitudes_por_revisar', v_rev,
    'pedidos',                 v_pedidos,
    /* ═══ AVISOS · NULL HONESTO, Y NO ES UN SUPUESTO ════════════════════════
       Medido en la base viva: `notificaciones` EXISTE, tiene `leida`, RLS y
       policy `notif_owner` — 26 filas, 22 sin leer, 7 usuarios. **Y CERO
       PRODUCTORES**: ninguna función de `pg_proc` hace `INSERT INTO
       notificaciones`, ninguna edge y ningún archivo del monorepo la escribe
       (grep en `packages/`, `apps/` y `supabase/functions/`: cero). La fila
       más nueva es del 2026-08-03.
       ⇒ Contarlas daría un número REAL que **ningún acto del producto puede
       mover**. Un 22 clavado que nadie puede bajar es peor que no tener el
       dato: la familia toca la burbuja, no pasa nada, y aprende a ignorarla.
       `null` dice «todavía no sé», que es la verdad. Cuando exista el motor,
       se enciende ACÁ y la puerta no cambia. */
    'avisos',                  NULL);
END $function$
;

/* ═══════════════════════════════════════════════════════════════════════════
   EL CINTURÓN — el número tiene que ser DEL TITULAR, no del sistema
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  k_con    uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';  -- titular con pedidos vivos (medido)
  k_sin    uuid := '632727a3-9682-4fa7-b569-19a6399736ff';  -- titular SIN pedidos (el del carnet)
  v        jsonb;
  v_global int;
BEGIN
  /* ── ⓪ CONTROL POSITIVO del propio instrumento ──────────────────────────
     Si en el sistema no hubiera pedidos vivos, el "36" de abajo y el "0" del
     discriminador serían indistinguibles de una función que devuelve 0
     siempre. */
  SELECT count(*) INTO v_global FROM v_pedidos_narrativa WHERE NOT es_terminal;
  IF v_global < 1 THEN
    RAISE EXCEPTION 'ARNES: no hay pedidos vivos en la base — el gate no discrimina';
  END IF;

  /* ── ① LA FORMA: las cinco claves, ni una menos ─────────────────────────── */
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_con::text, 'role','authenticated')::text, true);

  v := public.contar_pendientes();
  IF NOT (v ? 'pedidos') THEN RAISE EXCEPTION 'ARNES: falta la clave pedidos'; END IF;
  IF NOT (v ? 'avisos')  THEN RAISE EXCEPTION 'ARNES: falta la clave avisos';  END IF;
  IF NOT (v ? 'hilos_con_sin_leer') THEN RAISE EXCEPTION 'ARNES: se perdió hilos_con_sin_leer'; END IF;
  IF NOT (v ? 'solicitudes_por_revisar') THEN RAISE EXCEPTION 'ARNES: se perdió solicitudes_por_revisar'; END IF;
  IF NOT (v ? 'mensajes_sin_leer') THEN RAISE EXCEPTION 'ARNES: se perdió mensajes_sin_leer'; END IF;

  /* ── ② AVISOS: null de verdad, no el string 'null' ni 0 ────────────────── */
  IF jsonb_typeof(v->'avisos') <> 'null' THEN
    RAISE EXCEPTION 'ARNES avisos: quedó % (%), esperaba null json',
      v->>'avisos', jsonb_typeof(v->'avisos');
  END IF;

  /* ── ③ ✅ VERDE: el titular ve LOS SUYOS ────────────────────────────────── */
  IF (v->>'pedidos')::int < 1 THEN
    RAISE EXCEPTION 'ARNES verde: el titular con pedidos vivos contó %', v->>'pedidos';
  END IF;

  /* ── ④ 🔴 EL DISCRIMINADOR: otro titular, MISMA base, CERO ────────────────
     Sin este brazo, el ③ probaría igual con la RLS apagada — contaría los
     % del sistema entero. */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_sin::text, 'role','authenticated')::text, true);
  v := public.contar_pendientes();
  IF (v->>'pedidos')::int <> 0 THEN
    RAISE EXCEPTION 'ARNES rojo: un titular sin pedidos contó % — la RLS no está gateando', v->>'pedidos';
  END IF;

  /* ── ⑤ 🔴 sin sesión, rebota (el gate de siempre sigue vivo) ───────────── */
  PERFORM set_config('request.jwt.claims', NULL, true);
  BEGIN
    PERFORM public.contar_pendientes();
    RAISE EXCEPTION 'ARNES: sin sesión NO rebotó';
  EXCEPTION WHEN sqlstate '42501' THEN NULL;
  END;

  SET LOCAL ROLE postgres;
  RAISE NOTICE '✅ CINTURÓN S113-A bloque 2 VERDE — % pedidos vivos en la base, titular=% ajeno=0', v_global, 'n>0';
END;
$cinturon$;
