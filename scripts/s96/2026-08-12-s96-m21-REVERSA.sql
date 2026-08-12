-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813010000_s96_firma_catalogo_canonico.sql
--
-- Deshace: la separación catálogo canónico / oferta del vendedor —
-- `proponer_sku_vendedor` vuelve a su cuerpo pre-M21 (capturado del objeto
-- vivo en scripts/s96/functiondef-pre-m21.sql: re-aplicarlo entero) y
-- `proponer_producto_canonico` muere.
--
-- ⚠️ QUÉ NO DESHACE Y POR QUÉ NO SE CORRE A LA LIGERA: revertir REABRE las
--    dos puertas que la firma del founder vino a cerrar — ① cualquier
--    vendedor vuelve a poder REESCRIBIR el canónico (composición y alérgenos
--    incluidos) proponiendo un producto con el mismo nombre, y ② el stock
--    vuelve a pisarse sin ledger (D-780 RESUCITA). Con el catálogo real
--    cargado, revertir es reabrir la autoría mezclada sobre cientos de filas.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.proponer_producto_canonico(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text);
-- → re-aplicar acá el CREATE de scripts/s96/functiondef-pre-m21.sql
--   + REVOKE ALL ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;

COMMIT;
