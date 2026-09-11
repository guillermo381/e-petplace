-- REVERSA de 20260912460000_s115a_notas_credito.sql · escrita ANTES de aplicar.
-- ⚠️ QUÉ NO DESHACE: las notas de crédito ya emitidas NO se borran — una nota de
--    crédito autorizada es un hecho ante el SRI y su corrección es otro documento,
--    jamás un DELETE. Revertir esto sólo apaga el productor: la plata volvería a
--    salir sin documento, en silencio, que es el estado que la migración vino a cerrar.
DROP TRIGGER IF EXISTS trg_caso_resuelto_nota_credito ON public.casos_postventa;
DROP TRIGGER IF EXISTS trg_reverso_nota_credito ON public.pagos_intentos;
DROP FUNCTION IF EXISTS public._trg_caso_resuelto_nota_credito();
DROP FUNCTION IF EXISTS public._trg_reverso_nota_credito();
DROP FUNCTION IF EXISTS public.emitir_nota_credito(uuid, text, numeric, text, text);
DROP FUNCTION IF EXISTS public.reembolsos_sin_nota_credito();
DROP FUNCTION IF EXISTS public._intento_del_objeto(text, uuid);
DROP INDEX IF EXISTS public.uq_documento_fiscal_origen_reembolso;
ALTER TABLE public.documentos_fiscales DROP COLUMN IF EXISTS origen_reembolso;
