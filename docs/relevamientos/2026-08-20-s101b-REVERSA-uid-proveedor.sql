-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260821060000_s101b_uid_proveedor.sql`
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE:
--  ① **Vuelve a romper el débito.** Sin esta columna, el cobro manda el id del
--     usuario de auth como `uid`, y el proveedor rebota
--     `OperationNotAllowedException: uid does not match` — porque la tarjeta se
--     tokenizó con el HANDLE DEL ALTA. *Revertir no es neutro: reintroduce un
--     defecto medido.*
--  ② El backfill NO se puede rehacer solo: se deriva de `altas_tarjeta`, y si
--     esas filas se purgaran, el vínculo tarjeta↔uid se pierde para siempre.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
ALTER TABLE public.tarjetas_guardadas DROP COLUMN IF EXISTS proveedor_uid;
COMMIT;
