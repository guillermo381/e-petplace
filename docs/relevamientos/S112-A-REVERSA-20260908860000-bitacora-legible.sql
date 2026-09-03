-- REVERSA de 20260908860000 · muere el lector de la bitácora por estadía y
-- los chips dejan de viajar resueltos.
-- ⚠️ La familia vuelve a ver «anotó algo» sin poder saber QUÉ — la conducta
-- queda escrita y sin lector, que es el estado que esta migración cura.
DROP FUNCTION IF EXISTS public.obtener_bitacora_de_estadia(uuid);
DROP FUNCTION IF EXISTS public.chips_de_bitacora(uuid[]);
