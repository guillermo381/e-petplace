-- REVERSA de 20260912780000_s115a_reloj_de_emision.sql · escrita ANTES de aplicar.
--
-- ⚠️ QUÉ NO DESHACE: los documentos que el reloj haya emitido mientras estuvo
--    encendido. Un comprobante autorizado por el SRI **no se deshace con un
--    DROP** — se anula con una nota de crédito. Revertir apaga el reloj; no
--    borra lo que ya salió.
SELECT cron.unschedule('fiscal-emitir-tick');
DROP FUNCTION IF EXISTS public.fiscal_salud_emision_automatica();
DROP FUNCTION IF EXISTS public.fiscal_anotar_corrida_emision(text, int, int, int, jsonb, int);
DROP TABLE IF EXISTS public.fiscal_emision_corridas;
DELETE FROM public.app_config WHERE clave = 'fiscal_emision_automatica';
