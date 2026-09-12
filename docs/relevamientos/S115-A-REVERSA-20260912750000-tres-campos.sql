-- REVERSA de 20260912750000_s115a_tres_campos.sql — escrita ANTES.
-- ⚠️ Revertir deja «Tus facturas» sin poder distinguir el trabado de agencia
--    —que la familia NO puede resolver— del que sí puede. El cuerpo previo
--    está en la migración que creó `fiscal_mis_documentos`.
DROP FUNCTION IF EXISTS public.fiscal_mis_documentos();
