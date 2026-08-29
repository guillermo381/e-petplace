/* REVERSA de `20260830040000_s107a_lector_acta.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos (lectores). Correrla deja el acta
   CONFIRMABLE y NO LEGIBLE — o sea le pide al dueño que firme a ciegas, que es
   exactamente lo que esta migración vino a impedir. Y le saca los dos tramo_id
   a `obtener_mis_estadias_guarderia`, apagando el mapa del punto vivo. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_acta_guarderia(uuid);
-- `obtener_mis_estadias_guarderia` vuelve a su firma anterior desde
-- `S107-A-REVERSA-lector-estadias-antes-de-tramos.sql`.
COMMIT;
