/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · UNA SOLA FUENTE PARA «POR REVISAR»

   🔴 ESTA MIGRACIÓN EXISTE PORQUE LA ANTERIOR SE EQUIVOCÓ, y el error es
   exactamente el que sus propios comentarios advierten no cometer:
   `contar_solicitudes_por_revisar()` **ya existía**, con el predicado
   `estado IN ('recibida','en_conversacion') AND
   _user_publico_esta_publicacion(...)` **letra por letra**, y
   `contar_pendientes()` lo reescribió.

   Cómo se escapó, medido: el censo previo buscó `%pendiente%`, `%hilo%` y
   `adopcion_lectura`. **Esa función no matchea ninguno de los tres.** `L-437`
   en su forma limpia: *un censo por patrón acota, no cierra.* El que la
   encontró fue mirar los EXPORTS del wrapper, no la base — y el censo que
   habría bastado es por CUERPO (`prosrc like '%adopcion_solicitud%'`), que
   devolvió las 28 funciones del frente.

   Hoy los dos números coinciden. *El problema no es que difieran: es que
   pueden.* Si mañana «por revisar» suma un estado, el que cambie una sola de
   las dos deja la burbuja diciendo un número y la lista mostrando otro — y
   **ningún typecheck ve dos SQL que se parecen.**
   ⚠️ 76(g) NO RIGE: reemplazo de cuerpo, cero backfill.
   ═══════════════════════════════════════════════════════════════════════════ */

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

  RETURN jsonb_build_object(
    'mensajes_sin_leer',       v_msgs,
    'hilos_con_sin_leer',      to_jsonb(v_hilos),
    'solicitudes_por_revisar', v_rev);
END $function$;

REVOKE ALL ON FUNCTION public.contar_pendientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contar_pendientes() TO authenticated;

/* ═══ EL CINTURÓN — QUE LOS DOS CAMINOS DEN EL MISMO NÚMERO ═══════════════════
   Es la única prueba de que se reemplazó una fuente por la otra y no se
   cambió el significado de paso. */
DO $cinturon$
DECLARE
  v_ref uuid := '632727a3-9682-4fa7-b569-19a6399736ff';
  r jsonb; v_directo int;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ref, 'role', 'authenticated')::text, true);
  r := public.contar_pendientes();
  v_directo := public.contar_solicitudes_por_revisar();
  IF (r->>'solicitudes_por_revisar')::int <> v_directo THEN
    RAISE EXCEPTION 'CINTURON: burbuja % != contador directo %',
      r->>'solicitudes_por_revisar', v_directo;
  END IF;
  /* Y sigue rebotando sin sesión — reemplazar el cuerpo no se llevó el guard. */
  PERFORM set_config('request.jwt.claims', NULL, true);
  BEGIN
    r := public.contar_pendientes();
    RAISE EXCEPTION 'CINTURON: sin sesion devolvio %', r;
  EXCEPTION WHEN sqlstate '42501' THEN NULL;
  END;
  SET LOCAL ROLE postgres;
  RAISE NOTICE 'CINTURON una-sola-fuente: 2/2 (por_revisar == contador directo, guard vivo)';
END $cinturon$;

SET LOCAL ROLE postgres;
