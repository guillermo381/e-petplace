-- S112-A · «VER POSTULACIÓN»: las respuestas del formulario al refugio del animal
-- 76(g) — NO RIGE: lector. L-119: DROP porque cambia el TABLE.
DROP FUNCTION IF EXISTS public.obtener_solicitudes_de_mis_publicaciones(boolean);
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_de_mis_publicaciones(p_solo_por_revisar boolean DEFAULT false)
 RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text, creada_en timestamp with time zone, cerrada_en timestamp with time zone, solicitante_user_id uuid, solicitante_nombre text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, mensajes jsonb, sin_leer integer, respuestas jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         s.solicitante_user_id, pr.nombre,
         
         m.id, m.nombre, m.especie, m.foto_url,
         public._hilo_mensajes(s.id),
         
         (SELECT count(*)::int FROM adopcion_mensaje am
           WHERE am.solicitud_id = s.id
             AND am.autor_user_id IS DISTINCT FROM auth.uid()
             AND am.creado_en > COALESCE(
                   (SELECT l.leido_hasta FROM adopcion_lectura l
                     WHERE l.solicitud_id = s.id AND l.user_id = auth.uid()),
                   '-infinity'::timestamptz)),
         /* ═══ «VER POSTULACIÓN» ═══════════════════════════════════════════
            El formulario cerrado, **sólo para el refugio del animal
            solicitado**. No hace falta un gate nuevo: esta función **ya**
            filtra por `_user_publico_esta_publicacion`, así que otro refugio
            no ve la fila **y por lo tanto no ve sus respuestas**. *Agregar
            un guard aparte sería una segunda regla que puede divergir de la
            que ya decide quién ve el hilo.*

            🔴 Y el esquema del formulario **no admite nombres ni edades
            exactas de menores** (§5.9, CHECK en la tabla) ⇒ lo que viaja acá
            ya está acotado en la FUENTE, no por lo que este SELECT elija. */
         s.respuestas
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
