-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812210000_s96_firmas_marca_e2e_y_parametro.sql
--
-- Deshace: la columna de marca de datos de prueba en `pedidos` y el parámetro
-- de expiración del código de mostrador (la función vuelve a su literal de
-- 90 días — capturada pre-M10 en scripts/s96/functiondef-pre-m10.sql).
--
-- ⚠️ QUÉ NO DESHACE: nada de datos — la marca muere con la columna, y eso
--    DESMARCA los 2 pedidos E2E de S95-K: quien revierta esto vuelve a dejar
--    dos pedidos de prueba indistinguibles en las métricas (el problema
--    exacto que la firma del founder vino a cerrar).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.pedidos DROP COLUMN IF EXISTS created_by_sistema;

DELETE FROM public.app_config WHERE clave = 'mostrador_reclamo_dias';
-- registrar_venta_mostrador: re-aplicar el cuerpo de
--   scripts/s96/functiondef-pre-m10.sql (vuelve el literal '90 days')

COMMIT;
