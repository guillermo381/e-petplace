-- REVERSA de 20260829100000_s107a_media_y_punto.sql · ESCRITA ANTES.
-- 🔴 ABORTA si ya hay media publicada: los archivos siguen en Storage y sus
--    eventos en el expediente. Borrar las filas dejaría objetos huérfanos y
--    expediente sin respaldo — decisión de mesa, no de un script.
-- 🔴 NO borra el bucket `guarderia-media` ni sus objetos.
BEGIN;
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.guarderia_media;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % media(s) publicadas. Sus archivos y sus eventos de expediente quedarian huerfanos.', v_n;
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.obtener_media_de_mi_mascota(uuid, date);
DROP FUNCTION IF EXISTS public.obtener_media_del_dia(uuid, date);
DROP FUNCTION IF EXISTS public.publicar_media_guarderia(uuid, text, text, text, numeric, uuid[], timestamptz);
DROP FUNCTION IF EXISTS public.obtener_punto_vivo(uuid);
DROP FUNCTION IF EXISTS public.registrar_punto_vivo(uuid, double precision, double precision, timestamptz);
DROP TABLE IF EXISTS public.guarderia_media_etiquetas;
DROP TABLE IF EXISTS public.guarderia_media;
DROP TABLE IF EXISTS public.guarderia_tramo_punto;
DELETE FROM public.cat_tipos_evento WHERE codigo = 'foto_guarderia';
COMMIT;
