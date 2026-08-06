-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806170000_s89a_d673_recordatorio_scan_y_job.sql
-- Escrita ANTES de aplicar. Mata el job y la función-scan enteros — ambos
-- nacieron en esa migración, no hay estado previo que restaurar.
-- Nota de datos: las intenciones de recordatorio ya registradas no se borran;
-- sus claves de dedup quedan (si el scan renace, no re-suena lo ya sonado).
-- ═══════════════════════════════════════════════════════════════════════════

SELECT cron.unschedule('recordatorios-cita');

DROP FUNCTION IF EXISTS public.notificar_recordatorios_cita();
