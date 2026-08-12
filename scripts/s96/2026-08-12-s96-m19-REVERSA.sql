-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813003000_s96_expiracion_pedidos_sin_pago.sql
--
-- Deshace: la transición creado→cancelado_sistema, el expirador de cabeceras
-- sin pago, su parámetro y su cron.
--
-- ⚠️ QUÉ NO DESHACE: los pedidos YA expirados no vuelven (la historia es
--    append-only y un cancelado_sistema legítimo no se resucita). Y revertir
--    REABRE el hueco de C: la garantía anti-huérfanos vuelve a vivir SOLO en
--    el cliente — un proceso muerto no ejecuta ningún beforeRemove, y las
--    cabeceras `creado` vuelven a acumularse como las 137 de D-749.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

SELECT cron.unschedule('expirar-pedidos-sin-pago')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expirar-pedidos-sin-pago');
DROP FUNCTION IF EXISTS public.expirar_pedidos_sin_pago();
DELETE FROM public.app_config WHERE clave = 'pedido_sin_pago_expira_horas';
DELETE FROM public.cat_transiciones_pedido
 WHERE desde = 'creado' AND hasta = 'cancelado_sistema';

COMMIT;
