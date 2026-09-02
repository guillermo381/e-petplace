-- REVERSA de 20260907920000_s112a_storage_vidriera.sql
-- ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE, y es lo que hay que leer antes de correrla:
--   · Revertir esto **vuelve a matar la vidriera anonima**: la policy vieja
--     `mascotas_select_vidriera_anon` no puede dar verdadero nunca (medido por
--     E: el EXISTS lee tres tablas que `anon` no alcanza), asi que la lista y
--     la ficha vuelven a dibujarse SIN FOTO.
--   · Revertir esto **le saca al refugio la capacidad de subir fotos**: las
--     policies viejas de `adopcion-fotos` son `is_admin()` y nada mas.
--   · Revertir esto **le devuelve a `anon` el catalogo entero en un pedido**
--     sobre `v_adoptables_publicos`, salteando paginacion y tope.
--   · Los OBJETOS ya subidos al bucket **no se tocan** y siguen siendo publicos
--     por URL: `adopcion-fotos` es un bucket publico por diseño.

BEGIN;

DROP POLICY IF EXISTS adopcion_fotos_refugio_sube    ON storage.objects;
DROP POLICY IF EXISTS adopcion_fotos_refugio_borra   ON storage.objects;
DROP POLICY IF EXISTS adopcion_fotos_refugio_edita   ON storage.objects;
DROP POLICY IF EXISTS mascotas_select_vidriera_anon  ON storage.objects;

CREATE POLICY mascotas_select_vidriera_anon ON storage.objects FOR SELECT TO anon
USING ((bucket_id = 'mascotas') AND (EXISTS (
  SELECT 1 FROM public.mascotas m
    JOIN public.adopcion_publicacion p ON p.mascota_id = m.id AND p.estado = 'publicada'
    JOIN public.cat_estados_adopcion e ON e.estado = m.estado_adopcion AND e.visible_en_vidriera
   WHERE m.foto_url = objects.name)));

DROP FUNCTION IF EXISTS public._objeto_es_portada_de_adoptable(text);
DROP FUNCTION IF EXISTS public._path_es_de_mi_publicacion(text);

GRANT SELECT ON public.v_adoptables_publicos TO anon;

COMMIT;
