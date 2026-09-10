-- REVERSA de 20260912220000_s115a_tarifa_por_item.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: el historial que se haya escrito en tarifas_iva_historial se PIERDE.
BEGIN;
DROP TRIGGER IF EXISTS trg_cat_tasas_impuesto_historial ON public.cat_tasas_impuesto;
DROP FUNCTION IF EXISTS public._trg_tarifa_iva_historial();
DROP TABLE IF EXISTS public.tarifas_iva_historial;
ALTER TABLE public.tipos_servicio      DROP COLUMN IF EXISTS codigo_iva, DROP COLUMN IF EXISTS tarifa_estado;
ALTER TABLE public.producto_variantes  DROP COLUMN IF EXISTS tarifa_estado;
ALTER TABLE public.producto_variantes  ALTER COLUMN impuesto_codigo DROP NOT NULL;
ALTER TABLE public.pedido_items        ALTER COLUMN impuesto_codigo DROP NOT NULL;
DROP TYPE IF EXISTS public.tarifa_estado_enum;
COMMIT;
