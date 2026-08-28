-- REVERSA de 20260828170000_s107a_cupo_guarderia_por_rango.sql · ESCRITA ANTES.
-- No deshace nada más: la función de rango es aditiva y no toca datos.
BEGIN;
DROP FUNCTION IF EXISTS public.cupo_guarderia_del_rango(uuid, date, date);
COMMIT;
