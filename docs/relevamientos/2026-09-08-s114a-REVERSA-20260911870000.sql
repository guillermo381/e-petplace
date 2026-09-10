-- REVERSA de 20260911870000_s114a_cron_vencimiento_caso.sql — escrita ANTES.
SELECT cron.unschedule('vencer-casos-sin-respuesta');
DROP FUNCTION IF EXISTS public.vencer_casos_sin_respuesta();
-- NO revierte casos ya movidos (son historia; el prestador no respondió).
