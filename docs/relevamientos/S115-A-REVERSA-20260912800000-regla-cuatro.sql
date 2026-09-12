-- REVERSA de 20260912800000_s115a_forma_pago_asumida.sql · escrita ANTES.
-- ⚠️ NO deshace los documentos ya emitidos con forma de pago asumida: un
--    comprobante autorizado no se borra, se anula con nota de crédito. En
--    PRUEBAS no hay efecto fiscal; en producción esta reversa NO alcanza.
UPDATE public.app_config SET valor='false' WHERE clave='fiscal_emision_automatica';
DELETE FROM public.app_config WHERE clave IN
  ('fiscal_forma_pago_asumida','fiscal_forma_pago_asumida_en_produccion');
DROP FUNCTION IF EXISTS public.fiscal_documentos_con_forma_asumida();
ALTER TABLE public.documentos_fiscales DROP COLUMN IF EXISTS forma_pago_asumida;
-- La función vuelve a su versión anterior: ver 20260912500000.
