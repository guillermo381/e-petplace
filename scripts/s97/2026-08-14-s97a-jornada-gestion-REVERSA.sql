-- REVERSA de 20260814130000_s97a_jornada_recepcion_gestion.sql (escrita ANTES)
--
-- QUÉ DESHACE: devuelve `obtener_jornada_recepcion` a su predicado previo
--   v_ve_todo := v_es_titular OR NOT COALESCE(v_tiene_chip, false)
-- y saca `administrador` del gate de entrada.
--
-- 🔴 QUÉ **NO** DESHACE, y es la advertencia: revertir REINTRODUCE el defecto
--    — un administrador CON chips vuelve a perder la agenda de la puerta, y
--    un administrador PURO vuelve a rebotar `sin_acceso` en la entrada.
--    Hoy es inerte (vetadmin tiene 0 chips) y por eso revertir no rompe nada
--    HOY; rompe el día que un administrador gane su primer chip, sin aviso.
--
-- No hay datos que perder: la función no escribe.

BEGIN;
-- Se restaura por CREATE OR REPLACE con la MISMA firma (uuid, date) —
-- jamás DROP: tiene consumidor vivo en la pantalla de recepción.
-- El cuerpo íntegro previo está en la migración 20260726210000 (S78-A6),
-- que es su fuente y sigue viva en el repo. Para revertir: copiar de ahí.
-- Se declara así a propósito en vez de duplicar 90 líneas: esta reversa NO
-- es la única fuente del cuerpo viejo, y copiarlo crearía una segunda.
\echo 'REVERSA: copiar el cuerpo de supabase/migrations/20260726210000_s78a6_motor_de_recepcion.sql'
COMMIT;
