-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806220000_s89a_huella_mide_lo_nuevo.sql
-- Escrita ANTES de aplicar. Mata tabla y RPCs enteras — las tres nacieron en
-- esa migración; `hay_avisos_sin_leer` NUNCA se tocó (sigue viva para los
-- bundles publicados), así que no hay nada que restaurar de ella.
-- Nota de datos: se pierden las visitas registradas (la huella vuelve a
-- medir lo no-leído en los wrappers que hayan migrado — revertir el código
-- TS es aparte).
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.hay_novedades();
DROP FUNCTION IF EXISTS public.registrar_visita_campana();
DROP TABLE IF EXISTS public.notificacion_campana_visita;
