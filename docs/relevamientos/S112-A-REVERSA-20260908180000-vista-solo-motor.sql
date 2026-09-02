-- REVERSA de 20260908180000_s112a_vista_solo_motor.sql — ESCRITA ANTES.
-- QUE NO DESHACE: revertir esto le devuelve a cualquier usuario logueado el
-- catalogo entero en un pedido, salteando la paginacion y el tope de 50.
BEGIN;
GRANT SELECT ON public.v_adoptables_publicos TO authenticated;
COMMIT;
