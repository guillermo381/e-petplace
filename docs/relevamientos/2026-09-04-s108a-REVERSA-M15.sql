-- REVERSA de 20260904140000_s108a_el_indice_suelta.sql — escrita ANTES.
-- ⚠️ Revertir vuelve a BLOQUEAR el día de una mascota cuya reserva expiró: la
--    familia no puede volver a reservar un día que nunca llegó a pagar, y el
--    rebote es un `duplicate key` crudo. Hoy hay 2 días así.
BEGIN;
DROP INDEX IF EXISTS public.uq_guarderia_una_por_mascota_dia;
CREATE UNIQUE INDEX uq_guarderia_una_por_mascota_dia
  ON public.evento_cita_servicio USING btree (mascota_id, fecha)
  WHERE ((tipo_servicio = 'guarderia_dia'::text) AND (mascota_id IS NOT NULL)
         AND (fecha IS NOT NULL)
         AND (estado <> ALL (ARRAY['cancelada'::text, 'rechazada'::text, 'no_realizable'::text])));
COMMIT;
