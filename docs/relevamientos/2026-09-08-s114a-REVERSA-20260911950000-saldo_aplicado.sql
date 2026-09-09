-- REVERSA de 20260911950000 (columna compras.saldo_aplicado).
-- ⚠️ Revertir esta columna DESPUÉS de que exista un pago mixto DESTRUYE el
--    dato de cuánto saldo se aplicó a cada compra: no se puede reconstruir el
--    reparto per-source de una devolución. Sólo revertir si NINGUNA compra
--    tiene saldo_aplicado > 0 (medir antes).
ALTER TABLE public.compras DROP CONSTRAINT IF EXISTS chk_compra_saldo_aplicado;
ALTER TABLE public.compras DROP COLUMN IF EXISTS saldo_aplicado;
