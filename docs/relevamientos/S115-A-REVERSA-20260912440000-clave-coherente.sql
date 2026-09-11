-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260912440000_s115a_clave_coherente.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ QUÉ NO DESHACE: nada de datos — `documentos_fiscales` tiene 0 filas al
--    aplicar. Lo que SÍ reabre: revertir esto vuelve a permitir que un documento
--    guarde una clave de acceso que NO se deriva de su propia fila, que es
--    exactamente el estado que la migración vino a volver inexpresable.
-- ═══════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_documento_fiscal_clave_coherente ON public.documentos_fiscales;
DROP FUNCTION IF EXISTS public._trg_documento_fiscal_clave_coherente();

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_clave_reconstruible;

ALTER TABLE public.documentos_fiscales
  ALTER COLUMN fecha_emision SET DEFAULT CURRENT_DATE;   -- volvía al reloj UTC del servidor

DROP FUNCTION IF EXISTS public.fiscal_clave_acceso(date, public.fiscal_tipo_enum, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.fiscal_hoy();
DROP FUNCTION IF EXISTS public._fiscal_dv_modulo11(text);

ALTER TABLE public.fiscal_emisor DROP COLUMN IF EXISTS zona_horaria;
