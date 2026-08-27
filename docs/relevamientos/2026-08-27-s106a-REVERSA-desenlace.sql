-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827030000_s106a_desenlace_y_guard_diagnostico.sql`
--
-- QUÉ DESHACE: saca la columna `desenlace` y devuelve `sedimentar_nota_clinica`
-- a su guard estricto (diagnóstico SIEMPRE obligatorio).
--
-- 🔴 REVERTIR VUELVE A ATRAPAR AL VET que concluye «necesita visita
--    presencial»: le exige el diagnóstico que precisamente no puede dar.
-- ⚠️ Y **borra el desenlace ya registrado** de las consultas que lo declararon.
--    Se mide antes: `SELECT count(*) … WHERE desenlace IS NOT NULL`.
--
-- El cuerpo previo de la función se recarga desde la migración que la definió
-- por última vez ANTES de ésta. No se transcribe: *una copia diverge en
-- silencio.*
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.evento_historia_clinica_registrada DROP COLUMN IF EXISTS desenlace;
