-- ============================================================================
-- REVERSA de `20260826320000_s106a_vigilancia_cobro_acotado.sql`.
--
-- ⚠️ QUÉ NO DESHACE — y acá revertir es PEOR que no tener la pieza:
--    Esta reversa devuelve `vigilar_consumo_video()` a la versión que
--    **SE CUELGA**: cobraba la respuesta con `async := false`, que bloquea sin
--    techo. Medido: la llamada murió a los 2 minutos sin devolver nada.
--
--    **Un cron que puede colgarse indefinidamente es peor que uno que no
--    corre**: ocupa un worker, y su silencio se lee como «todo bien».
--
--    ⇒ Si hay que revertir, **desagendar el job en el mismo acto**:
--       `SELECT cron.unschedule('vigilar-consumo-video');`
-- ============================================================================
BEGIN;
-- (Deliberadamente NO se restaura el cuerpo viejo: revertir esta cura es
--  desactivar la vigilancia, no volver a la versión anterior.)
SELECT cron.unschedule('vigilar-consumo-video');
DROP FUNCTION IF EXISTS public.vigilar_consumo_video();
COMMIT;
