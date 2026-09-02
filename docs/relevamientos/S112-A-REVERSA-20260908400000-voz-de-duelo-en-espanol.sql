-- REVERSA de 20260908400000_s112a_voz_de_duelo_en_espanol.sql — ESCRITA ANTES.
-- QUE NO DESHACE: revertir esto le devuelve a una familia hispanohablante el
-- aviso de que su animal murio EN INGLES. No se revierte.
BEGIN;
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
