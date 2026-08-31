-- REVERSA de 20260903140000_s108a_aviso_renovacion_guarderia.sql — ANTES.
-- ⚠️ NO deshace los avisos ya registrados ni los ya enviados. Revertir apaga el
--    aviso: las familias dejan de enterarse tres días antes de que se les cobre.
BEGIN;
SELECT cron.unschedule('avisar-renovacion-guarderia')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='avisar-renovacion-guarderia');
DROP FUNCTION IF EXISTS public.avisar_renovaciones_guarderia();
DELETE FROM cat_notificacion_tipos WHERE codigo='guarderia_renovacion_proxima';
-- El brazo de _voz_notificacion queda: es aditivo y su rama nunca se alcanza
-- sin el tipo. Se declara en vez de reescribir la función entera al revés.
COMMIT;
