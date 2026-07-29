-- REVERSA de 20260729190000_s81_check_rango_horario.sql
-- Escrita ANTES de aplicar. Nota de datos: el DROP no revive ninguna
-- fila (el CHECK no borró nada — solo impedía entrar).
ALTER TABLE public.prestador_horarios
  DROP CONSTRAINT IF EXISTS chk_horario_rango_valido;
