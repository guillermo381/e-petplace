-- REVERSA de 20260912730000_s115a_tasa_congelada.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: revertir devuelve el bloqueo — la mitad gravada del
--    catálogo (15 de 30 tipos) vuelve a no poder cobrarse. Y los desgloses
--    backfilleados PIERDEN su tasa: el dato no se reconstruye solo, hay que
--    volver a correr el backfill con la fecha de servicio de cada cita.
ALTER TABLE public.cita_desglose DROP COLUMN IF EXISTS codigo_iva;
ALTER TABLE public.cita_desglose DROP COLUMN IF EXISTS tarifa_pct;
-- El cuerpo previo del trigger está en 20260912420000.
