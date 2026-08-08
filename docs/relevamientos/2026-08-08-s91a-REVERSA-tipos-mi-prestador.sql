-- REVERSA de 20260808090000_s91a_tipos_mi_prestador.sql
-- Solo corrige tipos de un RETURNS TABLE. Revertir la deja con `numeric`
-- donde la tabla tiene `double precision` y la función vuelve a rebotar
-- 42804 en tiempo de EJECUCIÓN. No hay razón para correrla.
BEGIN; SELECT 1; COMMIT;
