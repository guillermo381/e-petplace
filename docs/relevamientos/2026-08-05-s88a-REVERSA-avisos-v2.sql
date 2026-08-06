-- REVERSA de `20260805300000_avisos_badge_y_mascota.sql`. Aditiva pura.
BEGIN;
DROP FUNCTION IF EXISTS public.hay_avisos_sin_leer();
-- obtener_mis_avisos vuelve a su forma sin `mascota_nombre` (S88, 20260805280000).
-- ⚠️ El DROP es obligatorio: cambia el TIPO DE RETORNO, y CREATE OR REPLACE
--    no puede hacerlo (L-119 en su versión de RETURNS TABLE).
DROP FUNCTION IF EXISTS public.obtener_mis_avisos(integer);
COMMIT;
