-- REVERSA de 20260905140000_s108a_lector_de_programas.sql — escrita ANTES.
-- ⚠️ Revertir deja a la superficie del adiestramiento SIN lector de saldo: un
--    programa pendiente vuelve a no poder decirse en ninguna pantalla.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_programas();
COMMIT;
