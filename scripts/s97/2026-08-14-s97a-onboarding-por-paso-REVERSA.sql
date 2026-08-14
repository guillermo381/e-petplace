-- REVERSA de 20260814110000_s97a_onboarding_por_paso.sql (escrita ANTES)
--
-- QUÉ DESHACE: la tabla de saltos, sus dos puertas y el lector del wizard.
--
-- QUÉ **NO** DESHACE:
--  · Los SALTOS declarados se pierden — son el único dato que esta migración
--    guarda, y no es derivable de nada (todo lo demás se DERIVA de la base).
--    Consecuencia concreta: un negocio que salteó «tu equipo» a propósito
--    vuelve a verlo como pendiente, y su contador SUBE. No rompe nada; miente
--    sobre lo que ya decidió.
--    SELECT probatorio ANTES de revertir:
--      SELECT cuenta_comercial_id, paso, salteado_en FROM cuenta_onboarding_salto;
--  · NADA del negocio se toca: la completitud de los cuatro pasos se deriva
--    de tablas que esta migración jamás escribió.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_estado_onboarding_wizard(uuid);
DROP FUNCTION IF EXISTS public.saltar_paso_onboarding(uuid, text);
DROP FUNCTION IF EXISTS public.retomar_paso_onboarding(uuid, text);
DROP TABLE IF EXISTS public.cuenta_onboarding_salto;

COMMIT;
