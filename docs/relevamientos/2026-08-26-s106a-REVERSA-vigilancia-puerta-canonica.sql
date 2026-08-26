-- REVERSA de `20260826330000_s106a_vigilancia_puerta_canonica.sql`.
-- ⚠️ Revertir devuelve la función a la versión que INSERTA DIRECTO en
--    `notificacion_intencion` — que revienta por `en_sombra` NOT NULL y, peor,
--    esquiva la puerta que resuelve sombra, categoría y consentimiento.
--    **Si hay que revertir, se desagenda el job en el mismo acto.**
BEGIN;
SELECT cron.unschedule('vigilar-consumo-video');
DROP FUNCTION IF EXISTS public.vigilar_consumo_video();
COMMIT;
