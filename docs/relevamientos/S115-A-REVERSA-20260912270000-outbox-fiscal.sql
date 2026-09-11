-- REVERSA de 20260912270000_s115a_outbox_fiscal.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: los documentos que el outbox haya creado quedan. No se borran
--    acá a propósito: un documento fiscal, aunque sea borrador, es un hecho del libro.
--    Para limpiarlos hace falta una decisión, no una reversa.
BEGIN;
DROP TRIGGER IF EXISTS trg_pago_aprobado_outbox_fiscal ON public.pagos_intentos;
DROP FUNCTION IF EXISTS public._trg_pago_aprobado_outbox_fiscal();
DROP FUNCTION IF EXISTS public.resolver_receptor_fiscal(uuid, numeric);
COMMIT;
