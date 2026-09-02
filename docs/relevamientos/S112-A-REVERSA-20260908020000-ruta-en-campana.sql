-- REVERSA de 20260908020000_s112a_ruta_en_campana.sql — ESCRITA ANTES DE APLICAR.
-- QUE NO DESHACE: revertir esto deja **los cinco avisos del vertical de adopcion
-- sin destino en la campana**. La fila aparece y no lleva a ningun lado. No
-- pierde datos: `ruta` vive en `datos` y se sigue escribiendo; lo que se pierde
-- es que el lector la exponga.
-- ⚠️ Ademas cambia la FIRMA (una columna menos en el RETURNS TABLE) ⇒ un bundle
-- que ya consuma `ruta` se rompe. Revertir esto exige revertir tambien el
-- bundle que lo consume.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_avisos(integer);
CREATE OR REPLACE FUNCTION public.obtener_mis_avisos(p_limite integer DEFAULT 50)
 RETURNS TABLE(id uuid, titulo text, mensaje text, tipo text, categoria text,
               mascota_id uuid, mascota_nombre text, evento_id uuid,
               tiene_destino boolean, creado_en timestamptz, leida boolean, leida_en timestamptz)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT i.id, i.datos->>'titulo', i.datos->>'mensaje', i.tipo, i.categoria,
         i.mascota_id, m.nombre, i.evento_id,
         (i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL),
         i.created_at, (i.estado = 'leida'), i.leida_en
    FROM notificacion_intencion i
    LEFT JOIN mascotas m ON m.id = i.mascota_id
   WHERE i.destinatario_user_id = auth.uid()
     AND i.resuelto_como->>'despacho' = 'para_transporte'
   ORDER BY i.created_at DESC
   LIMIT greatest(1, least(coalesce(p_limite,50), 200));
END $function$;
GRANT EXECUTE ON FUNCTION public.obtener_mis_avisos(integer) TO authenticated;
COMMIT;
