-- REVERSA de 20260912640000_s115a_tope_y_apertura.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: revertir `es_publico` vuelve a esconder el tope de la
--    pantalla del cliente. El SelectorFacturacion deja de poder decidir cuándo
--    pedir datos y —según cómo esté escrito— o rebota o pide SIEMPRE.
UPDATE public.app_config SET es_publico = false WHERE clave = 'fiscal_tope_consumidor_final';
DELETE FROM public.app_config WHERE clave = 'fecha_apertura_comercial';
