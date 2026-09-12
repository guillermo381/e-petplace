-- REVERSA de 20260912740000_s115a_exige_edge.sql — escrita ANTES.
-- ⚠️ Revertir devuelve el estado donde una edge vieja puede emitir con código
--    viejo sin que nada la frene. Es el caso que quemó el secuencial 5.
DROP FUNCTION IF EXISTS public.edge_esta_al_dia(text);
DROP TABLE IF EXISTS public.migracion_exige_edge;
