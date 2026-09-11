-- REVERSA de 20260912380000_s115a_captura_del_1oct.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: el medio de pago y el costo de riel que se hayan capturado se
--    PIERDEN, y son irrecuperables — esa es la razón de ser de esta migración. Verificar:
--    SELECT count(*) FROM eventos_economicos WHERE pago_intento_id IS NOT NULL;
BEGIN;
ALTER TABLE public.eventos_economicos DROP COLUMN IF EXISTS pago_intento_id;
ALTER TABLE public.pagos_intentos
  DROP COLUMN IF EXISTS retencion_renta,
  DROP COLUMN IF EXISTS retencion_iva,
  DROP COLUMN IF EXISTS retenido_en,
  DROP COLUMN IF EXISTS costo_riel;
ALTER TABLE public.fiscal_emisor
  DROP COLUMN IF EXISTS certificado_vence_en,
  DROP COLUMN IF EXISTS certificado_alias;
DROP FUNCTION IF EXISTS public.costo_riel(text, text, numeric, timestamptz);
DROP TABLE IF EXISTS public.cat_costos_riel;
COMMIT;
