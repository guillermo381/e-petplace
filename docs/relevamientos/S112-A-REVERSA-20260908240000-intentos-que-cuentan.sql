-- REVERSA de 20260908240000_s112a_intentos_que_cuentan.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto devuelve un OTP de 8 digitos SIN TECHO DE
-- INTENTOS. La ventana de 10 minutos acota el daño, pero el limite de 5 que
-- §5.5 pide deja de existir. No se revierte.
-- ⚠️ Ademas cambia el CONTRATO de firmar_acta_adopcion: los dos casos del
-- codigo pasan de excepcion a `{ok:false, motivo}`. Un bundle que ya lea esa
-- forma se rompe al revertir.
BEGIN;
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
