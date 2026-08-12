-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812180000_s96_b9_recurrencia.sql
-- ⚠️ QUÉ NO DESHACE: las recurrencias configuradas por gente real mueren con
--    la tabla — son configuración del cliente, no historia clínica, y el
--    costo se declara: quien revierta avisa a los dueños afectados.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
SELECT cron.unschedule('avisar-recurrencias');
DROP FUNCTION IF EXISTS public.ejecutar_recurrencias_vencidas();
DROP FUNCTION IF EXISTS public.avisar_recurrencias_proximas();
DROP FUNCTION IF EXISTS public.alternar_recurrencia(uuid, boolean);
DROP FUNCTION IF EXISTS public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, integer, text);
DROP TABLE IF EXISTS public.pedidos_recurrencias;
COMMIT;
