/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2e · LA CAMPANA PUEDE LLEVAR A LOS AVISOS DEL VERTICAL
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Se recrea un lector; cero datos.

   Lo midio C, y es el segundo consumidor del MISMO hueco que su propia cabecera
   ya habia declarado para autorizacion:

     ① `AvisoDeCampana` no trae `solicitud_id` ni `datos` ni `ruta`.
     ② Los cinco avisos del vertical **no llevan `mascota_id` a proposito** —
        pasarla los descarta con `descartada_sin_acceso`, porque ni el refugio
        ni el postulante son «familia» del adoptable antes de la entrega (lo
        midio D). El `solicitud_id` viaja en `datos`.
     ③ ⇒ `tiene_destino` da FALSE para los cinco, y la fila aparece **sin llevar
        a ningun lado**. Degrada honesto —la lamina se cumple— pero el founder
        va a tocar «el refugio respondio» y no va a pasar nada.

   ── LA TENSION, DECLARADA Y NO ABSORBIDA. La cabecera de `destino-aviso.ts`
      dice *«el motor NO manda rutas: manda tipo + referentes, y CADA app arma
      la suya»*, y D acaba de hacer que el motor mande `ruta` para la push.
      **No se contradicen** —D emite una intencion POR DESTINATARIO, asi que
      cada `ruta` ya es de una sola app— pero hoy hay **dos mecanismos para lo
      mismo**, y la campana estaba del lado que no tiene el dato.

      Se resuelve exponiendo `ruta` y **dejando el mapeo por tipo vivo**: la
      campana usa la ruta cuando existe y cae al mapeo cuando no. Los avisos
      viejos no cambian **y la ruta pasa por el MISMO filtro que la push**, con
      `verify:rutas-de-aviso` de D vigilando los dos caminos. *Un guard que
      sirve a dos consumidores no puede discrepar consigo mismo.*

   ── 🔴 `tiene_destino` AHORA CUENTA LA RUTA. Sin esto, el campo seguiria
      diciendo `false` sobre un aviso que SI tiene a donde ir, y la fila se
      pintaria no-tocable teniendo destino: *el defecto exacto que la lamina
      existe para evitar, en el sentido contrario.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* Cambia el RETURNS TABLE (una columna mas) ⇒ hay que bajarla. `L-119`: se
   re-crea entera en el mismo acto, jamas se deja caida. */
DROP FUNCTION IF EXISTS public.obtener_mis_avisos(integer);

CREATE OR REPLACE FUNCTION public.obtener_mis_avisos(p_limite integer DEFAULT 50)
 RETURNS TABLE(id uuid, titulo text, mensaje text, tipo text, categoria text,
               mascota_id uuid, mascota_nombre text, evento_id uuid, ruta text,
               tiene_destino boolean, creado_en timestamptz, leida boolean, leida_en timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.datos->>'titulo'  AS titulo,
    i.datos->>'mensaje' AS mensaje,
    i.tipo,
    i.categoria,
    i.mascota_id,
    -- «de que mascota habla» (lamina §2). El JOIN no filtra: un aviso de una
    -- mascota borrada conserva su fila con el nombre en NULL.
    m.nombre AS mascota_nombre,
    i.evento_id,
    /* LA RUTA que el motor emitio para ESTE destinatario. `null` cuando la
       intencion nacio sin ella — la app cae a su mapeo por tipo. */
    i.datos->>'ruta' AS ruta,
    /* 🔴 La ruta CUENTA como destino. Antes esto miraba solo los referentes, y
       los cinco avisos del vertical no llevan `mascota_id` a proposito. */
    (i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL
     OR NULLIF(btrim(coalesce(i.datos->>'ruta','')), '') IS NOT NULL) AS tiene_destino,
    i.created_at,
    (i.estado = 'leida') AS leida,
    i.leida_en
  FROM notificacion_intencion i
  LEFT JOIN mascotas m ON m.id = i.mascota_id
  WHERE i.destinatario_user_id = auth.uid()
    /* ⚖️ S88 — LA CAMPANA ES EL REGISTRO, NO EL CANAL (firma del founder).
       Se conserva verbatim: `para_transporte` es lo que significa ENTREGADO y
       sigue excluyendo lo descartado (memorial incluido), lo retenido y lo que
       esta en sombra, sin nombrar ninguno. */
    AND i.resuelto_como->>'despacho' = 'para_transporte'
  ORDER BY i.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 50), 200));
END $function$;

REVOKE ALL ON FUNCTION public.obtener_mis_avisos(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_avisos(integer) TO authenticated;

DO $cint$
DECLARE v_cols text[]; v_admin uuid; v_n int;
BEGIN
  SELECT array_agg(a.attname::text ORDER BY a.attnum) INTO v_cols
    FROM pg_proc p, unnest(p.proargnames) WITH ORDINALITY AS a(attname, attnum)
   WHERE p.oid = 'public.obtener_mis_avisos(integer)'::regprocedure;
  IF NOT ('ruta' = ANY(v_cols)) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la campana sigue sin exponer la ruta';
  END IF;
  -- CONTROL NEGATIVO: el instrumento ve las columnas de verdad.
  IF NOT ('tiene_destino' = ANY(v_cols)) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: el censo de columnas no ve nada';
  END IF;

  -- ② El lector corre desde un asiento real y no rompe.
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);
  SELECT count(*) INTO v_n FROM public.obtener_mis_avisos(5);
  RAISE NOTICE 'CINTURON A2e: 2 brazos verdes · el lector devolvio % fila(s)', v_n;
END $cint$;

COMMIT;
