-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260821000000_s101_webhook_events.sql
-- S101-A · 19-ago-2026
--
-- 🔴 QUÉ NO DESHACE: revertir BORRA LA AUDITORÍA ACUMULADA.
--    `webhook_events` es append-only y es la única traza de lo que la pasarela
--    mandó — incluido lo que se rechazó. Un `stoken` inválido guardado ahí es
--    la evidencia de un intento de fraude.
--
--    ⇒ Si ya hay eventos REALES (ambiente='produccion', o sandbox con plata de
--      prueba que alguien va a querer reconciliar), EXPORTARLOS ANTES:
--
--        \copy (select * from public.webhook_events order by recibido_en)
--          to 'webhook_events_backup.csv' csv header
--
--    Sin ese export, revertir es una pérdida que no se recupera de ningún lado:
--    la pasarela no reenvía lo que ya dio por entregado.
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS public.ix_webhook_events_recibido;
DROP INDEX IF EXISTS public.ix_webhook_events_txid;
DROP TABLE IF EXISTS public.webhook_events;
