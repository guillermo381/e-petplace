-- S112-A · LA ESPECIE EN EL LECTOR DEL PUBLICADOR (pedido de C)
-- 76(g) — NO RIGE: lector, sin backfill, sin anclas. L-119: DROP + re-crear.
DROP FUNCTION IF EXISTS public.obtener_solicitudes_de_mis_publicaciones(boolean);
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_de_mis_publicaciones(p_solo_por_revisar boolean DEFAULT false)
 RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text, creada_en timestamp with time zone, cerrada_en timestamp with time zone, solicitante_user_id uuid, solicitante_nombre text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, mensajes jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         s.solicitante_user_id, pr.nombre,
         /* 🟢 La especie, pedida por C: sin ella no puede resolver la cara de
            la casa y **el refugio ve una huella genérica donde la familia ve
            la cara** — la misma solicitud con dos caras según quién mire.
            El lector de la familia ya la traía; éste no. */
         m.id, m.nombre, m.especie, m.foto_url,
         public._hilo_mensajes(s.id)
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    LEFT JOIN profiles pr       ON pr.id = s.solicitante_user_id
   
   WHERE public._user_publico_esta_publicacion(s.publicacion_id, auth.uid())
     AND (NOT p_solo_por_revisar OR s.estado IN ('recibida','en_conversacion'))
   ORDER BY s.creada_en DESC;
END $function$

;
REVOKE ALL ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) TO authenticated;

-- ═══ CINTURÓN ═══
DO $c$
DECLARE v_r text;
BEGIN
  v_r := pg_get_function_result('public.obtener_solicitudes_de_mis_publicaciones(boolean)'::regprocedure);
  IF v_r NOT ILIKE '%mascota_especie%' THEN
    RAISE EXCEPTION 'CINTURON: no quedo mascota_especie';
  END IF;
  /* L-119: lo que ya traía no se puede haber perdido al re-crear. */
  IF v_r NOT ILIKE '%mensajes%' OR v_r NOT ILIKE '%mascota_foto_url%'
     OR v_r NOT ILIKE '%solicitante_nombre%' THEN
    RAISE EXCEPTION 'CINTURON: se perdio una columna al re-crear (L-119)';
  END IF;
  IF (SELECT array_to_string(proacl,',') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='obtener_solicitudes_de_mis_publicaciones') ILIKE '%anon=%'
  THEN RAISE EXCEPTION 'CINTURON: anon en proacl (L-140)'; END IF;
  RAISE NOTICE 'CINTURON VERDE: el publicador ve la especie';
END $c$;
