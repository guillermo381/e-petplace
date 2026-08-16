-- REVERSA de 20260817200000 (viajes_por_repartidor) y 20260817210000
-- (proponer_skus_vendedor_lote) — escrita ANTES de aplicar.
-- Qué deshace: las dos funciones (lectores/puertas puras — cero tablas,
-- cero datos; el lote NO deja residuo propio: cada fila entra por
-- proponer_sku_vendedor, que ya existía). Un bundle que las llame recibe
-- PGRST202 tipado por el wrapper.
DROP FUNCTION IF EXISTS public.viajes_por_repartidor(uuid);
DROP FUNCTION IF EXISTS public.proponer_skus_vendedor_lote(uuid, jsonb, text);
