-- REVERSA de 20260912430000_s115a_regimen_y_bono.sql (escrita ANTES de aplicar)
-- 🔴 NO revierte los regímenes que los prestadores hayan declarado: ese dato se lee de
--    su RUC y volver a NULL lo perdería. Verificar:
--    SELECT count(*) FROM cuentas_comerciales WHERE regimen_tributario IS NOT NULL;
BEGIN;
DROP FUNCTION IF EXISTS public.declarar_regimen_tributario(uuid, text, text);
UPDATE public.app_config SET valor = '0' WHERE clave = 'saldo_bono_recarga_minimo';
COMMIT;
