-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827020000_s106a_cerrar_teleconsulta.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: borra `cerrar_teleconsulta`.
--
-- ⚠️ QUÉ NO DESHACE:
--    · **las citas ya cerradas se quedan `completada`** — y está bien: la
--      consulta ocurrió y alguien la terminó a propósito. Revertir el código
--      no reabre lo que ya cerró.
--    · **nada de trabajo clínico.** Los borradores viven en la cita, no en la
--      sala, y esta función nunca los tocó.
--
-- 🔴 Revertir REINTRODUCE el defecto: sin esta puerta, **colgar es puramente
--    local** y para el motor la cita sigue `confirmada` y `pagada` — o sea,
--    con su sala abierta. Los dos actores pueden volver a entrar a una
--    consulta que ya terminó.
-- ════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.cerrar_teleconsulta(uuid);
