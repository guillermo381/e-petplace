-- REVERSA de 20260730140000_s82_dias_cerrados_por_servicio.sql — escrita ANTES.
--
-- NOTA DE DATOS: NINGUNA. Esta migración solo crea una función LECTORA
-- sobre datos que ya existen (`prestador_dias_cerrados`, `prestador_servicios`);
-- no escribe, no migra, no siembra. Revertirla no pierde un solo dato:
-- vuelve a dejar el lector por-prestador como único camino.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_dias_cerrados_servicio(text);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'obtener_dias_cerrados_servicio') THEN
    RAISE EXCEPTION 'reversa incompleta: el lector por servicio sigue vivo';
  END IF;
END $$;

COMMIT;
