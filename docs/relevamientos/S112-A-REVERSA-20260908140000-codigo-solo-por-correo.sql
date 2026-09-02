-- REVERSA de 20260908140000_s112a_codigo_solo_por_correo.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE: revertir esto **le devuelve el codigo de firma a quien
-- llame la RPC**, y con eso la firma deja de probar nada: cualquiera con la
-- sesion firma sin pasar por el correo. No se revierte.
BEGIN;
-- (sin cuerpo a proposito: revertir esta cura es reintroducir el defecto)
SELECT 'ESTA REVERSA NO TIENE CUERPO: revertirla reintroduce el defecto' AS nota;
COMMIT;
