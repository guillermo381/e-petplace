-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812160000_s96_b7_direcciones.sql
-- ⚠️ QUÉ NO DESHACE: los datos cargados en las columnas nuevas mueren con
--    ellas (places_id, instrucciones). Las direcciones en sí no se tocan.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
ALTER TABLE public.direcciones_guardadas
  DROP CONSTRAINT IF EXISTS chk_direccion_con_punto,
  DROP COLUMN IF EXISTS places_id,
  DROP COLUMN IF EXISTS instrucciones_entrega;
DROP INDEX IF EXISTS uq_direccion_principal;
COMMIT;
