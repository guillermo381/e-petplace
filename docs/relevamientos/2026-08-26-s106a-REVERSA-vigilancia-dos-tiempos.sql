-- REVERSA de `20260826340000_s106a_vigilancia_dos_tiempos.sql`.
-- ⚠️ Revertir devuelve la vigilancia a la versión que POSTEA Y COBRA EN LA
--    MISMA TRANSACCIÓN — que no puede funcionar nunca, porque `pg_net` no
--    despacha hasta el COMMIT. Su síntoma es el peor posible: un cron puntual
--    que devuelve `sin_medicion` SIEMPRE y en el ledger de jobs se lee «anda».
--    **Si hay que revertir, se desagenda el job en el mismo acto.**
BEGIN;
SELECT cron.unschedule('vigilar-consumo-video');
DROP FUNCTION IF EXISTS public.vigilar_consumo_video();
DROP TABLE IF EXISTS public.vigilancia_consumo_pedido;
COMMIT;
