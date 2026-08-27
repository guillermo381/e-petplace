-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826410000_s106a_verificacion_profesional_lector.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: borra el lector `prestador_verificacion_profesional(uuid)`.
--
-- ⚠️ QUÉ **NO** DESHACE, y es lo importante:
--    · **El GATE NO SE VA.** El trigger `trg_ps_verificacion_profesional`
--      existe desde S79 y esta migración no lo toca. Borrar el lector deja el
--      gate exactamente igual de cerrado: lo único que se pierde es **poder
--      preguntar antes de chocar**.
--    · Por eso el efecto de revertir es de SUPERFICIE: la app vuelve a
--      enterarse de que no puede activar **sólo al fallar**. *No es un
--      agujero de seguridad; es un botón que promete y no cumple* — que es lo
--      que la Ley 23 prohíbe.
--    · Cero datos. Esta migración no escribe una sola fila.
-- ════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.prestador_verificacion_profesional(uuid);
