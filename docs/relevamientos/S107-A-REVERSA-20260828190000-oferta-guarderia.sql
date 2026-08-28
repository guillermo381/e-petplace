-- REVERSA de 20260828190000_s107a_oferta_guarderia.sql · ESCRITA ANTES.
-- 🔴 NO deshace: las ofertas de guardería ya creadas en `prestador_servicios`.
--    Quedan como filas normales del catálogo; si se quiere sacarlas de la
--    vitrina, se apagan (`activo=false`) — no se borran, porque una oferta
--    borrada se lleva puestas las citas que la referencian.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid);
DROP FUNCTION IF EXISTS public.definir_oferta_guarderia(uuid, numeric, numeric, numeric, boolean);
DROP INDEX IF EXISTS public.uq_oferta_guarderia_por_prestador;
COMMIT;
