-- REVERSA de 20260907900000_s112a_lectores_adoptable.sql
-- ESCRITA ANTES DE APLICAR.
--
-- QUE DESHACE: la tabla de fotos, la vista publica, los dos lectores nuevos y
-- restaura `obtener_adoptables` a su firma vieja de tres argumentos.
--
-- 🔴 QUE **NO** DESHACE:
--   · Los OBJETOS del bucket `adopcion-fotos` NO se borran. La tabla guarda el
--     path; los archivos viven en Storage y sobreviven a este DROP. Quedan
--     huerfanos y hay que barrerlos a mano (`adopcion-fotos` es PUBLICO: un
--     huerfano ahi sigue siendo alcanzable por URL).
--   · El ORDEN de las fotos se pierde con la tabla y no esta en ningun otro
--     lado: el nombre del archivo no lo codifica.
--   · Revertir esto **rompe toda pantalla de C que consuma la vista o los
--     lectores nuevos**: la vidriera anonima deja de tener de donde leer.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_adoptable(uuid);
DROP FUNCTION IF EXISTS public.obtener_adoptables(jsonb, text, integer);
DROP FUNCTION IF EXISTS public.agregar_foto_adoptable(uuid, text);
DROP FUNCTION IF EXISTS public.reordenar_fotos_adoptable(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.borrar_foto_adoptable(uuid);

DROP VIEW IF EXISTS public.v_adoptables_publicos;
DROP TABLE IF EXISTS public.adopcion_foto;

-- Firma vieja de obtener_adoptables (tres argumentos escalares).
CREATE OR REPLACE FUNCTION public.obtener_adoptables(
  p_especie text DEFAULT NULL, p_country_code text DEFAULT NULL, p_limite integer DEFAULT 50)
 RETURNS TABLE(publicacion_id uuid, mascota_id uuid, nombre text, especie text, raza text,
               sexo text, fecha_nacimiento date, foto_url text, publicador_nombre text,
               creada_en timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, m.id, m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.foto_url,
         c.nombre_comercial, p.creada_en
    FROM adopcion_publicacion p
    JOIN mascotas m ON m.id = p.mascota_id
    JOIN cuentas_comerciales c ON c.id = p.cuenta_comercial_id
    JOIN cat_estados_adopcion e ON e.estado = m.estado_adopcion AND e.visible_en_vidriera
   WHERE p.estado = 'publicada'
     AND (p_especie IS NULL OR m.especie = p_especie)
     AND (p_country_code IS NULL OR p.country_code = p_country_code)
   ORDER BY p.creada_en DESC
   LIMIT LEAST(COALESCE(p_limite, 50), 100);
END $function$;

COMMIT;
