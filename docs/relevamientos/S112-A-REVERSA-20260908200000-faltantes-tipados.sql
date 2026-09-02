-- REVERSA de 20260908200000_s112a_faltantes_tipados.sql — ESCRITA ANTES.
-- QUE NO DESHACE: revertir esto vuelve a romper TODA acta a la que le falte
-- algun dato, con un error crudo de Postgres. No se revierte.
BEGIN;
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
