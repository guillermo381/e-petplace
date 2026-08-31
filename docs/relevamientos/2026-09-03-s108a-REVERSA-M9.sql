-- REVERSA de 20260903120000_s108a_ancla_dia_de_cobro.sql — escrita ANTES.
-- ⚠️ NO deshace: los `dia_de_cobro` ya escritos se pierden con la columna, y con
--    ellos la memoria del día original. Si algún plan ya recuperó su día, el
--    encadenado vuelve a ser el que BAJA y no sube.
BEGIN;
DROP FUNCTION IF EXISTS public.guarderia_proximo_cobro(smallint, date);
ALTER TABLE public.guarderia_suscripciones DROP CONSTRAINT IF EXISTS chk_dia_de_cobro_valido;
ALTER TABLE public.guarderia_suscripciones DROP COLUMN IF EXISTS dia_de_cobro;
COMMIT;
