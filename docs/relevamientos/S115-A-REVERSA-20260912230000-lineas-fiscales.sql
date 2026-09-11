-- REVERSA de 20260912230000_s115a_lineas_fiscales.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: las líneas escritas de pagos ya emitidos se PIERDEN, y con
--    ellas la base imponible con la que se facturó. Verificar antes:
--    SELECT count(*) FROM pagos_desglose_lineas;
BEGIN;
DROP FUNCTION IF EXISTS public.escribir_lineas_del_intento(uuid);
DROP FUNCTION IF EXISTS public.totales_fiscales_del_intento(uuid);
DROP TABLE IF EXISTS public.pagos_desglose_lineas;
COMMIT;
