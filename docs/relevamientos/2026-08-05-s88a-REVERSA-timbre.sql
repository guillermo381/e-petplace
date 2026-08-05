-- REVERSA de `20260805130000_lote2_pgnet_timbre.sql` (S88-A).
-- Escrita ANTES de aplicar.
-- ⚠️ Revertir APAGA EL TIMBRE: sin cron, el despachador no corre solo y las
-- intenciones quedan en 'nacida' para siempre (el modo sombra accidental de
-- S87, otra vez). El cuerpo anterior de despachar_notificaciones (con el
-- RAISE) vive en la migración 20260805110000.
BEGIN;
SELECT cron.unschedule('despachar-notificaciones-tick');
-- pg_net NO se desinstala a la ligera: otros consumidores pueden nacer.
-- Si hay que quitarla: DROP EXTENSION pg_net; (declarado, no automático)
COMMIT;
