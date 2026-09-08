-- REVERSA de `20260911700000_s114a_backfill_devengo.sql`. Escrita ANTES.
-- 🔴 Borra los eventos económicos que el backfill creó (marcados via='backfill_a6').
--    Es data de PRUEBA (ningún dato de servicio es real, LETRA_POSTVENTA); en
--    producción un backfill de devengo NO se revierte con un DELETE — se conversa.
DELETE FROM eventos_economicos WHERE metadata->>'via' = 'backfill_a6';
