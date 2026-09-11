-- REVERSA de 20260912350000_s115a_payout_y_categoria.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: los eventos económicos creados con la regla nueva guardan su
--    snapshot (`regla_payout: base_menos_comision_s115`) y NO se recalculan. Revertir
--    devuelve el código, jamás los eventos. Verificar antes:
--    SELECT count(*) FROM eventos_economicos WHERE fee_calculo_detalle->>'regla_payout' IS NOT NULL;
-- Para revertir de verdad hay que re-crear crear_evento_economico y
-- _trg_cita_congela_desglose con sus cuerpos previos, que viven en el historial de git
-- (migración 20260912350000, el diff muestra el ANTES completo).
BEGIN;
SELECT 'la reversa exige los cuerpos previos: ver el diff de la migración' AS nota;
COMMIT;
