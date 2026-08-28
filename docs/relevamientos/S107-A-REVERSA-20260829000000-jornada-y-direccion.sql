-- REVERSA de 20260829000000_s107a_jornada_y_direccion.sql · ESCRITA ANTES.
-- 🔴 NO deshace: las direcciones ya congeladas en las citas creadas con la
--    versión nueva. Se quedan — y está bien: son el domicilio que la familia
--    tenía el día que reservó, que es justamente lo que un snapshot es.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);
-- `reservar_dia_guarderia` vuelve a su versión sin snapshot de dirección.
-- (El cuerpo viejo vive en la migración 20260828230000; revertir esta función
--  deja al cuidador sin saber adónde ir a buscar al animal.)
COMMIT;
