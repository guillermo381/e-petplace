-- REVERSA de 20260821130000 — el canal forzado. ESCRITA ANTES.
-- 🔴 Revertir devuelve el comprobante al selector de canal ⇒ vuelve a salir por
--    push y DEJA DE CUMPLIR el requisito de certificación de Nuvei.
--    *No es neutra: rompe una obligación con el proveedor.*
ALTER TABLE public.cat_notificacion_tipos DROP COLUMN IF EXISTS canal_forzado;
