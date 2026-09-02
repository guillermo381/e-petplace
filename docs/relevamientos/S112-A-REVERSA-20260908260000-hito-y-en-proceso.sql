-- REVERSA de 20260908260000_s112a_hito_y_en_proceso.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto vuelve a hacer que la SEGUNDA firma reviente
-- ⇒ el traspaso nunca se completa y no hay adopcion posible. No se revierte.
-- Los hitos ya escritos NO se borran: son eventos del expediente de una familia.
BEGIN;
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
