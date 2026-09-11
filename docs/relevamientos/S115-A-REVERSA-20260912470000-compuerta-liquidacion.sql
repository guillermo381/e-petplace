-- REVERSA de 20260912470000_s115a_compuerta_liquidacion.sql · escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: nada de datos (0 liquidaciones al aplicar). Lo que REABRE:
--    revertir esto vuelve a permitir marcar `pagado` una liquidación sin un
--    comprobante validado que la respalde — o sea, girar plata de un tercero
--    sin el papel que la justifica.
DROP TRIGGER IF EXISTS trg_liquidacion_exige_comprobante ON public.liquidaciones;
DROP FUNCTION IF EXISTS public._trg_liquidacion_exige_comprobante();
DROP FUNCTION IF EXISTS public.fiscal_adjuntar_comprobante_liquidacion(uuid, uuid);
DROP FUNCTION IF EXISTS public.liquidacion_respaldo(uuid);
DROP INDEX IF EXISTS public.idx_documentos_fiscales_liquidacion;
ALTER TABLE public.documentos_fiscales DROP COLUMN IF EXISTS liquidacion_id;
DELETE FROM public.app_config WHERE clave = 'liquidacion_tolerancia_comprobante';
