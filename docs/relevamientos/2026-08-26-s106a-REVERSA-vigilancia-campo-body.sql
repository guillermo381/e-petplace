-- REVERSA de `20260826350000_s106a_vigilancia_campo_body.sql`.
-- ⚠️ Revertir devuelve la función a la versión que lee `(response).content`,
--    campo que NO EXISTE en `net.http_response` (sus campos son
--    status_code, headers, body). Su síntoma es un error en cada corrida.
--    Si hay que revertir, desagendar el job en el mismo acto.
BEGIN;
SELECT cron.unschedule('vigilar-consumo-video');
DROP FUNCTION IF EXISTS public.vigilar_consumo_video();
COMMIT;
