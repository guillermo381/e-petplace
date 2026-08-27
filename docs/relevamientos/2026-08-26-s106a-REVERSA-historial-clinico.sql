-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826450000_s106a_historial_clinico_lector.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: borra el lector `obtener_historial_clinico_mascota`.
--
-- ⚠️ QUÉ NO DESHACE: nada de datos — el lector no escribe una sola fila, y
--    tampoco toca permisos de ninguna tabla. Revertirlo deja al modal del vet
--    **sin poder leer el historial durante la consulta**: no rompe nada, pero
--    le devuelve al profesional la ceguera que este lector vino a curar.
-- ════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.obtener_historial_clinico_mascota(uuid, date, date, uuid, integer);
