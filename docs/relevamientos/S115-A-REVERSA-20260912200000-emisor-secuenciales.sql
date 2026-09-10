-- REVERSA de 20260912200000_s115a_emisor_y_secuenciales.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: si ya se tomaron secuenciales, el contador se PIERDE. Un
--    secuencial consumido ante el SRI no se reutiliza JAMÁS ⇒ revertir después de
--    emitir obliga a re-sembrar `ultimo_secuencial` con el último realmente usado,
--    leído de documentos_fiscales. Verificar antes:
--    SELECT max(secuencial) FROM documentos_fiscales WHERE sentido='emitido';
BEGIN;
DROP FUNCTION IF EXISTS public.tomar_secuencial_fiscal(text, text, text, public.fiscal_tipo_enum);
DROP TABLE IF EXISTS public.fiscal_sequences;
DROP TABLE IF EXISTS public.fiscal_emisor;
COMMIT;
