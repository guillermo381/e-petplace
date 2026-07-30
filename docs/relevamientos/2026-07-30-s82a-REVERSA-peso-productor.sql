-- REVERSA de 20260730012000_s82_registrar_peso.sql — escrita ANTES.
--
-- NOTA DE DATOS: la migración NO crea tabla (evento_peso_medicion es
-- pre-existente, S66/S70) — solo la PUERTA del dueño. Revertir mata la
-- puerta; las mediciones ya registradas por ella QUEDAN (son expediente:
-- el dato clínico jamás se borra por revertir código — precedente P13).

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_peso_mascota(uuid, numeric, text, timestamptz, text);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='registrar_peso_mascota') THEN
    RAISE EXCEPTION 'reversa incompleta: la puerta sigue viva';
  END IF;
END $$;

COMMIT;
