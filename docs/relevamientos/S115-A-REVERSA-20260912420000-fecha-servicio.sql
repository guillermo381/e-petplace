-- REVERSA de 20260912420000_s115a_fee_por_fecha_servicio.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: los desgloses re-congelados por una reagenda ya cambiaron de fee.
--    Verificar antes: SELECT count(*) FROM cita_desglose WHERE congelado_en > '2026-09-10';
-- Los cuerpos previos viven en el diff de esta migración.
BEGIN;
SELECT 'la reversa exige los cuerpos previos: ver el diff' AS nota;
COMMIT;
