-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260826080000_s105a_cron_barrido_diario_y_encendido.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve el barrido a `*/5 * * * *` y lo APAGA.
--
-- 🔴 QUÉ NO DESHACE: los pagos que el barrido ya haya conciliado quedan
-- conciliados — la plata se movió de verdad.
--
-- ⚠️ Correrla vuelve a 288 corridas diarias contra el rate limit COMPARTIDO
-- con los clientes que están pagando en vivo, para buscar casos que hoy son
-- cero. *Ese era el argumento para bajarla a diaria, y sigue siendo cierto.*
-- Si lo que se quiere es sólo apagarlo:
--     SELECT cron.alter_job(21, active := false);
-- ══════════════════════════════════════════════════════════════════════════

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname='pagos-deuna-barrido-tick'),
  schedule := '*/5 * * * *', active := false);
