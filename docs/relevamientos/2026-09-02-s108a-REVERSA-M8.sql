-- REVERSA de 20260902160000_s108a_reactivar_mensualidad.sql — escrita ANTES.
-- ⚠️ NO deshace: las suscripciones que hayan vuelto a `activa` se quedan
--    activas. Revertir quita la PUERTA y el PISO — o sea que vuelve a ser
--    posible escribir `activa` sobre un período vencido, que es exactamente el
--    estado que esta migración hace inexpresable. Revertir REABRE eso.
BEGIN;
DROP TRIGGER IF EXISTS trg_susc_guarderia_no_revive_vencida ON public.guarderia_suscripciones;
DROP FUNCTION IF EXISTS public._trg_susc_guarderia_no_revive_vencida();
DROP FUNCTION IF EXISTS public.reactivar_mensualidad_guarderia(uuid);
COMMIT;
