-- REVERSA de 20260912260000_s115a_cuentas_modelo_fiscal.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE con exactitud: si después de aplicar alguien cambió a mano el
--    modelo de una cuenta, esta reversa la vuelve a `marketplace_fachada` igual.
--    Es exacta HOY porque las 15 estaban en fachada (medido antes de aplicar).
BEGIN;
UPDATE public.cuentas_comerciales SET modelo_comercial = 'marketplace_fachada';
ALTER TABLE public.cuentas_comerciales ALTER COLUMN modelo_comercial SET DEFAULT 'marketplace_fachada';
ALTER TABLE public.cuentas_comerciales
  DROP COLUMN IF EXISTS regimen_tributario,
  DROP COLUMN IF EXISTS tipo_comprobante_emite,
  DROP COLUMN IF EXISTS verificado_emisor_en;
DROP TYPE IF EXISTS public.regimen_tributario_enum;
DROP TYPE IF EXISTS public.tipo_comprobante_enum;
COMMIT;
