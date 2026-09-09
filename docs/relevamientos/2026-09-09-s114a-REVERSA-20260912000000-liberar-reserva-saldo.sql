-- REVERSA de 20260912000000 (reloj de liberación de reservas de saldo).
DROP FUNCTION IF EXISTS public.liberar_reservas_saldo_vencidas();
DROP FUNCTION IF EXISTS public.liberar_reserva_saldo_compra(uuid);
SELECT cron.unschedule('liberar-reservas-saldo') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='liberar-reservas-saldo');
ALTER TABLE public.compras DROP COLUMN IF EXISTS saldo_reservado_hasta;
-- aplicar_saldo_a_compra vuelve a su cuerpo previo (recuperable por git desde 20260911960000).
