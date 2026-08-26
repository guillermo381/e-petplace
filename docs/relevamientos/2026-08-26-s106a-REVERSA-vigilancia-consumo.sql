-- ============================================================================
-- REVERSA de `20260826310000_s106a_vigilancia_consumo_video.sql`. Escrita ANTES.
--
-- ⚠️ QUÉ NO DESHACE:
--    Revertir esto **apaga la vigilancia del consumo de video**. Las
--    notificaciones ya emitidas quedan (son historia), pero **a partir de la
--    reversa nadie avisa al cruzar los 30 GB** — se vuelve al estado que esta
--    migración vino a curar: *una intención, no una alarma.*
--
--    ⇒ Antes de correrla, decidir quién mira el panel a mano. **Que el número
--    haya estado bajo hasta hoy no es razón: el consumo crece con el uso, y
--    esta vigilancia existe justamente para el día en que crezca.**
-- ============================================================================
BEGIN;
SELECT cron.unschedule('vigilar-consumo-video');
REVOKE ALL ON FUNCTION public.vigilar_consumo_video() FROM postgres;
DROP FUNCTION IF EXISTS public.vigilar_consumo_video();
COMMIT;
