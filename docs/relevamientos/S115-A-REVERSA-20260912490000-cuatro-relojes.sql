-- REVERSA de 20260912490000_s115a_cuatro_relojes.sql · escrita ANTES.
-- No deshace datos: son dos lectores. Revertir esto no rompe nada — sólo apaga
-- la única superficie donde un mes que cobró y no facturó se ve solo.
DROP FUNCTION IF EXISTS public.fiscal_conciliacion_relojes(date, date);
DROP FUNCTION IF EXISTS public.fiscal_conciliacion_hallazgos(date, date);
