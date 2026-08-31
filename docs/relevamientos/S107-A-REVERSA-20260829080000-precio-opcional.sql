-- REVERSA de 20260829080000_s107a_precio_opcional.sql · ESCRITA ANTES.
-- 🔴 ABORTA si alguna oferta quedó con precio NULL: devolverle el NOT NULL a la
--    columna con filas nulas falla, y "arreglarlas" poniéndoles 0 las volvería
--    GRATIS en silencio. Esa decisión no la toma un script.
BEGIN;
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.prestador_servicios WHERE precio IS NULL;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % oferta(s) con precio NULL. Ponerles 0 las haria gratis — decision de mesa.', v_n;
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.obtener_estado_guarderia(uuid);
DROP FUNCTION IF EXISTS public.definir_oferta_guarderia(uuid, numeric, numeric, boolean, jsonb);
ALTER TABLE public.prestador_servicios DROP CONSTRAINT IF EXISTS chk_precio_obligatorio_salvo_guarderia;
ALTER TABLE public.prestador_servicios ALTER COLUMN precio SET NOT NULL;
COMMIT;
