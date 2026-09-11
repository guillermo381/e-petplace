-- REVERSA de 20260912210000_s115a_app_config_fiscal.sql (escrita ANTES de aplicar)
BEGIN;
DELETE FROM public.app_config
 WHERE clave IN ('fiscal_tope_consumidor_final','fiscal_proveedor','fiscal_ambiente');
COMMIT;
