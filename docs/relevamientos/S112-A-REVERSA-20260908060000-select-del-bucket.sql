-- REVERSA de 20260908060000_s112a_select_del_bucket.sql — ESCRITA ANTES DE APLICAR.
-- 🔴 QUE NO DESHACE: revertir esto **le devuelve al refugio un borrado que
-- MIENTE**. Sin policy de SELECT, `remove()` responde exito y no borra ningun
-- objeto — el DELETE de Storage resuelve los paths con un SELECT interno. Un
-- borrado que miente es peor que uno que falla: nadie verifica lo que ya dijo
-- que hizo. Tambien vuelve a romper el reemplazo de una foto (`upsert`).
-- Los objetos ya subidos no se tocan.
BEGIN;
DROP POLICY IF EXISTS adopcion_fotos_refugio_lee ON storage.objects;
DROP FUNCTION IF EXISTS public.quitar_foto_adoptable(uuid);
COMMIT;
