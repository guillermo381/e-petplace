-- REVERSA de 20260908340000_s112a_purga_recupera_el_formulario.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto deja la purga anonimizando la IDENTIDAD y
-- CONSERVANDO EL FORMULARIO — el hogar declarado (cuantos adultos, cuantos
-- menores por rango) queda para siempre. Es la mitad de lo que el founder firmo
-- el 1-sep, y su incumplimiento es SILENCIOSO. No se revierte.
BEGIN;
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
