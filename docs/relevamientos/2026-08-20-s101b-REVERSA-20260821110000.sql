-- REVERSA de 20260821110000 — el predicado único de «aprobado».
-- ESCRITA ANTES. Vuelve cada camino a leer `status` por su cuenta.
-- 🔴 NO deshace las confirmaciones que el predicado nuevo haya producido.
DROP FUNCTION IF EXISTS public._pago_aprobado(jsonb);
