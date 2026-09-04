/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de 20260908980000_s113a_pendientes_del_hogar.sql
   Escrita ANTES de aplicar. S113-A · lote 0 · bloque 2.

   ⚠️ QUÉ **NO** DESHACE:
   · Nada de datos: esta migración no escribe una sola fila. Es un lector.
   · No toca `contar_solicitudes_por_revisar` (no la tocó).
   · No toca `v_pedidos_narrativa` ni `cat_narrativas_pedido` (no las tocó).

   EFECTO: `contar_pendientes` vuelve a devolver TRES claves
   (`mensajes_sin_leer`, `hilos_con_sin_leer`, `solicitudes_por_revisar`) y
   deja de contar pedidos.

   ⚠️ ACTO DE DOS LADOS: si ya se publicó bundle con `obtenerPendientesHogar`
   o con el campo `pedidos` del wrapper, revertir la base sin revertir el
   bundle deja `pedidos` en 0 para siempre — **un 0 que se lee «no tenés
   nada»**. Se revierten juntos.

   Cuerpo previo capturado del OBJETO (`pg_get_functiondef`) antes de aplicar.
   ═══════════════════════════════════════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.contar_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
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
END $function$
;

/* VERIFICACIÓN posterior:
     SELECT jsonb_object_keys(public.contar_pendientes());
     -- esperado: mensajes_sin_leer · hilos_con_sin_leer · solicitudes_por_revisar
     --           (SIN pedidos, SIN avisos)                                      */
