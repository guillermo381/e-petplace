-- REVERSA de 20260907260000_s109a_deuna_sin_tarjeta_y_los_dos_lectores.sql
--
-- ⚠️ REVERTIR EL DEFAULT VUELVE INEXPRESABLE EL MANDATO POR DEUNA desde el
--    cliente tipado: `p_tarjeta_id` sin DEFAULT sale requerido en
--    `database.types.ts` y no hay forma de mandar NULL. El cuerpo seguiría
--    rebotando `deuna_no_lleva_tarjeta`, pero la llamada no se podría escribir.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_mes_pendiente_guarderia();

-- `contratar_mensualidad_guarderia` vuelve a `p_tarjeta_id uuid` SIN default.
-- El cuerpo vive completo en su migración y `pg_get_functiondef` lo da del
-- objeto: no se transcribe acá.

COMMIT;
