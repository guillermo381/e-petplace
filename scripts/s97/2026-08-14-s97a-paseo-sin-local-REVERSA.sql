-- REVERSA de 20260814160000_s97a_paseo_sin_local.sql (escrita ANTES)
--
-- 🔴 QUÉ NO DESHACE: los 9 paseos vuelven a `atiende_local = true`, que es
--    el DATO FALSO que esta migración vino a curar. Revertir reintroduce la
--    afirmación de que un paseador atiende en su local.
--    SELECT probatorio ANTES:
--      SELECT id, prestador_id, atiende_local, atiende_domicilio
--        FROM prestador_servicios WHERE tipo_servicio = 'paseo';
BEGIN;
DROP TRIGGER IF EXISTS trg_ps_paseo_sin_local ON public.prestador_servicios;
DROP FUNCTION IF EXISTS public._trg_ps_paseo_sin_local();
UPDATE public.prestador_servicios SET atiende_local = true WHERE tipo_servicio = 'paseo';
COMMIT;
