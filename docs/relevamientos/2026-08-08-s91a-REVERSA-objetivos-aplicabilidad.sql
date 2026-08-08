-- REVERSA de 20260808070000_s91a_objetivos_aplicabilidad.sql (escrita ANTES)
-- ⚠️ Correrla REABRE el agujero que D midió: los 23 objetivos CANINOS vuelven
-- a caer sobre cualquier mascota en la bitácora. Nota de datos: no toca
-- ninguna fila de usuario (los chips de objetivo registrados no se tocan).
-- El body previo de la RPC se repone re-aplicando `20260808030000`.
BEGIN;
ALTER TABLE public.cat_objetivos_adiestramiento DROP COLUMN IF EXISTS especies_aplicables;
ALTER TABLE public.cat_objetivos_adiestramiento DROP COLUMN IF EXISTS sujetos_aplicables;
COMMIT;
