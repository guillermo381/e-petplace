-- REVERSA de 20260829040000_s107a_especies_dos_capas.sql · ESCRITA ANTES.
-- 🔴 NO deshace, y es lo importante: **no devuelve las ofertas a `[]`.**
--    Volver a `[]` las haría invisibles otra vez en su propia vitrina — que es
--    el defecto que esta migración cura (D-959). *Revertir un backfill que
--    restituye una lectura vigente es reintroducir el defecto a mano.*
--    Lo único que se retira es el trigger que recorta contra el universo.
BEGIN;
DROP TRIGGER IF EXISTS trg_ps_recorta_especies ON public.prestador_servicios;
DROP FUNCTION IF EXISTS public._trg_ps_recorta_especies();
COMMIT;
