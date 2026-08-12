-- REVERSA de 20260812200000_s96_b6_fotos_producto.sql
-- ⚠️ Las fotos ya adjuntadas quedan en `productos.imagenes` (dato, no schema).
BEGIN;
DROP FUNCTION IF EXISTS public.adjuntar_fotos_producto(uuid, jsonb);
COMMIT;
