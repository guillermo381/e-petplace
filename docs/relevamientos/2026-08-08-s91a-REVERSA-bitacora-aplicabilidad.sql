-- REVERSA de 20260808030000_s91a_bitacora_valida_aplicabilidad.sql
-- Quita la validación de aplicabilidad: el motor vuelve a aceptar cualquier
-- conducta del catálogo para cualquier mascota (la pantalla seguiría
-- filtrando, pero cualquier otro caller podría colgarle a un acuario una
-- conducta de individuo).
-- Nota de datos: las filas ya registradas NO se tocan.
-- El body previo se repone re-aplicando `20260808020000`, que sigue en el
-- repo — no se duplica acá para que no existan dos fuentes del mismo cuerpo.
BEGIN;
-- (sin DDL: la reversa es re-aplicar la migración anterior)
SELECT 1;
COMMIT;
