-- REVERSA de 20260907380000_s109a_estadias_por_rango.sql
--
-- ⚠️ Revertir NO rompe nada hoy: `obtener_estadias_del_dia` queda intacta y
--    sigue siendo la que usan sus consumidores. Lo que se pierde es la
--    posibilidad de traer el rango en UN viaje — la superficie volvería a
--    re-consultar al cambiar de día.

BEGIN;
DROP FUNCTION IF EXISTS public.obtener_estadias_por_rango(uuid, date, date);
COMMIT;
