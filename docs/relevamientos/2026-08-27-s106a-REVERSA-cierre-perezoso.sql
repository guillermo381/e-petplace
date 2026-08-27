-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827010000_s106a_cierre_perezoso_teleconsulta.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: borra `_cerrar_teleconsulta_si_vencio` y devuelve
-- `puede_entrar_a_videollamada` a STABLE sin la llamada al cierre.
--
-- ⚠️ QUÉ NO DESHACE: **las citas ya cerradas por este mecanismo se quedan
--    `completada`.** Es correcto —ocurrieron de verdad, hay evidencia de sala—
--    pero conviene saberlo: revertir el código no reabre lo que ya cerró.
--
-- 🔴 Y revertir REINTRODUCE el defecto: una teleconsulta que termina con las
--    dos apps cerradas se queda `confirmada` para siempre, y sigue apareciendo
--    como si estuviera por ocurrir.
-- ════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public._cerrar_teleconsulta_si_vencio(uuid);

-- `puede_entrar_a_videollamada` vuelve cargando la migración que la definió por
-- última vez ANTES de ésta. No se transcribe acá: *una copia del cuerpo diverge
-- en silencio.*
