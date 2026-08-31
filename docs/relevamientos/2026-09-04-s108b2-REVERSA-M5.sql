-- REVERSA de 20260904100000_s108b2_renovacion_guarderia_apagada.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE, y es lo que hay que leer antes de correrla:
--    Si la llave `app_config.guarderia_recurrente_vivo` está ENCENDIDA, revertir
--    deja el AVISO vivo y el COBRO muerto — que es exactamente el estado que
--    esta migración existe para volver inconstruible: la familia recibe «te
--    vamos a cobrar el 28» y no se le cobra nada.
--    🔴 ANTES DE REVERTIR: apagar la llave. En ese orden y no al revés.
--
--    SELECT valor FROM app_config WHERE clave='guarderia_recurrente_vivo';
--    -- si dice 'true': apagarla PRIMERO.
--
--    Y hay que coordinar con `avisar_renovaciones_guarderia()` (de la pista A),
--    que consume el mismo accesor: revertir esta migración le saca la función
--    que lee la llave y el aviso queda llamando a algo que no existe.

BEGIN;
DROP FUNCTION IF EXISTS public.verificar_llave_unica_guarderia();
DROP FUNCTION IF EXISTS public.ejecutar_renovaciones_guarderia();
DROP FUNCTION IF EXISTS public.mensualidades_vencidas_pendientes();
DROP FUNCTION IF EXISTS public.guarderia_recurrente_vivo();
-- el cron:
-- SELECT cron.unschedule('renovar-mensualidades-guarderia');
COMMIT;
