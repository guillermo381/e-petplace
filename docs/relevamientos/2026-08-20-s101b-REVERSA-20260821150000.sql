-- REVERSA de 20260821150000 — el comprobante no se difiere por techo. ESCRITA ANTES.
-- 🔴 Revertir devuelve el comprobante al techo de categoría ⇒ una familia que
--    compra varias veces en un día **deja de recibir el comprobante de sus
--    últimas compras**, y eso INCUMPLE el requisito de certificación de Nuvei.
--    No es neutra: rompe una obligación con el proveedor.
ALTER TABLE public.cat_notificacion_tipos DROP COLUMN IF EXISTS ignora_techo;
