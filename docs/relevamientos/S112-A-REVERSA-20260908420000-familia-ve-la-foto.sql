-- REVERSA de 20260908420000_s112a_familia_ve_la_foto.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto le saca a la familia el derecho a BAJAR la
-- foto de su propio animal — la sigue LISTANDO y no la puede ver, que es el
-- defecto que esta migracion cura. No pierde datos.
BEGIN;
DROP POLICY IF EXISTS guarderia_media_storage_select ON storage.objects;
CREATE POLICY guarderia_media_storage_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guarderia-media'
         AND public.user_puede_acceder_prestador((split_part(name,'/',1))::uuid));
DROP FUNCTION IF EXISTS public._media_guarderia_es_de_mi_mascota(text);
COMMIT;
