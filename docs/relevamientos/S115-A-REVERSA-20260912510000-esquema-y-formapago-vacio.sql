-- REVERSA de 20260912510000 · escrita ANTES.
-- ⚠️ Repone `moneda_literal` y VUELVE A CARGAR el mapeo de formas de pago con
--    valores tomados por parecido — que es justo lo que la migración retiró.
ALTER TABLE public.fiscal_emisor DROP COLUMN IF EXISTS version_esquema;
ALTER TABLE public.fiscal_emisor ADD COLUMN IF NOT EXISTS moneda_literal text NOT NULL DEFAULT 'US Dollar';
UPDATE public.cat_tasas_impuesto SET fuente_codigo='ficha_sri_tabla17' WHERE codigo='EC_IVA_0';
INSERT INTO public.cat_forma_pago_sri (country_code, medio, codigo_sri, nombre, fuente_codigo) VALUES
  ('EC','credito','19','Tarjeta de credito','ficha_sri_tabla24'),
  ('EC','debito', '16','Tarjeta de debito','ficha_sri_tabla24'),
  ('EC','deuna',  '20','Otros con utilizacion del sistema financiero','xml_real_crecermed_2026'),
  ('EC','saldo',  '01','Sin utilizacion del sistema financiero','ficha_sri_tabla24')
ON CONFLICT DO NOTHING;
