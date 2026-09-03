-- S112-A · EL HILO DE LA FAMILIA LLEVA A LA VITRINA DEL REFUGIO
-- 76(g) — NO RIGE: lector, sin backfill. L-119: DROP porque cambia el TABLE.
DROP FUNCTION IF EXISTS public.obtener_mis_solicitudes_adopcion();
CREATE OR REPLACE FUNCTION public.obtener_mis_solicitudes_adopcion()
 RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text, creada_en timestamp with time zone, cerrada_en timestamp with time zone, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, publicador_nombre text, mensajes jsonb, sin_leer integer, publicador_cuenta_id uuid, publicador_foto text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         m.id, m.nombre, m.especie, m.foto_url, c.nombre_comercial,
         public._hilo_mensajes(s.id),
         
         (SELECT count(*)::int FROM adopcion_mensaje am
           WHERE am.solicitud_id = s.id
             AND am.autor_user_id IS DISTINCT FROM auth.uid()
             AND am.creado_en > COALESCE(
                   (SELECT l.leido_hasta FROM adopcion_lectura l
                     WHERE l.solicitud_id = s.id AND l.user_id = auth.uid()),
                   '-infinity'::timestamptz)),
         /* ═══ LA CABECERA TIENE QUE PODER LLEVAR ═══════════════════════════
            Traía `publicador_nombre` y nada más, así que **el toque a la
            cabecera no tenía a dónde ir**: la vitrina se pide por cuenta
            comercial (`obtenerPerfilesPublicosPorCuenta`) y ese id no viajaba.
            *Un nombre sin id es una etiqueta, no una puerta.*

            🔴 LISTA BLANCA, y no se ensancha: **el id y la foto, nada más**.
            Los dos ya son públicos —`v_adoptables_publicos` los devuelve a
            cualquiera en cada fila— así que esto **no abre nada nuevo**. Lo
            demás de la vitrina (ciudad, historia, portadas) lo trae la vitrina
            cuando se abre: *duplicarlo acá crearía una segunda copia que
            envejece sola.* Y nada de teléfono, correo ni dirección: **no se
            filtran — no se pueden nombrar.** */
         p.cuenta_comercial_id,
         (SELECT pr.foto_url FROM prestadores pr
           WHERE pr.cuenta_comercial_id = p.cuenta_comercial_id
             AND pr.estado = 'activo' LIMIT 1)
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    JOIN cuentas_comerciales c  ON c.id = p.cuenta_comercial_id
   WHERE s.solicitante_user_id = auth.uid()
   ORDER BY s.creada_en DESC;
END $function$

;
REVOKE ALL ON FUNCTION public.obtener_mis_solicitudes_adopcion() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_solicitudes_adopcion() TO authenticated;
