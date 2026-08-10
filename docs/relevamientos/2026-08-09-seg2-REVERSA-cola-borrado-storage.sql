-- ════════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260809040000_seg2_cola_borrado_storage.sql`  (D-731)
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- ── QUÉ DESHACE ─────────────────────────────────────────────────────────────
-- Todo: el trigger, su función, la vista y la tabla de la cola.
--
-- ── 🔴 QUÉ **NO** DESHACE, Y ES LO QUE HAY QUE LEER ANTES DE CORRERLA ───────
-- ① **REABRE EL AGUJERO.** Con esta reversa aplicada, borrar una fila de
--    `prestador_documentos` —o borrar el prestador, que las cascadea— vuelve a
--    dejar el documento de identidad en Storage **para siempre**. Es
--    exactamente el defecto D-731. No es un efecto colateral: es la función
--    entera de lo que se revierte.
-- ② **LO YA ENCOLADO SE PIERDE.** Si al momento de revertir hay filas
--    `pendiente` que el barredor todavía no procesó, sus objetos quedan
--    huérfanos y **sin registro de que debían borrarse**. La cola es la única
--    memoria de esa intención. *Antes de revertir, vaciar la cola corriendo el
--    barredor, o exportar sus filas.*
-- ③ **NO RESUCITA NADA.** Los objetos que el barredor ya borró no vuelven.
--
-- El barredor (`barrer-storage`) y su tick de cron NO los toca esta reversa:
-- se retiran a mano (borrar la function y `cron.unschedule('barrer-storage')`).
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_prestador_documentos_encola_borrado ON public.prestador_documentos;
DROP FUNCTION IF EXISTS public._encolar_borrado_de_storage();
DROP VIEW IF EXISTS public.v_storage_borrado_atascado;
DROP TABLE IF EXISTS public.storage_borrado_pendiente;

COMMIT;
