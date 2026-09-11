-- REVERSA de 20260912360000_s115a_tarifa_servicio_y_medios.sql (escrita ANTES de aplicar)
-- 🔴 NO revierte las líneas de tarifa ya escritas en pagos cobrados: son parte de una
--    factura. Verificar antes: SELECT count(*) FROM pagos_desglose_lineas WHERE origen_tipo='tarifa_servicio';
BEGIN;
DROP FUNCTION IF EXISTS public.tarifa_servicio_vigente();
DELETE FROM public.app_config WHERE clave IN
  ('tarifa_servicio_monto','tarifa_servicio_codigo_iva','tarifa_servicio_promo_hasta',
   'medios_pago_orden','pago_diferido_vivo','saldo_bono_recarga_pct','saldo_bono_recarga_minimo');
DELETE FROM public.fee_configs WHERE notas LIKE 'S115 · SUSCRIPCION%';
COMMIT;
