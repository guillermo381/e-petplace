-- REVERSA de 20260907140000_s109a_el_riel_del_plan_viaja.sql
--
-- ⚠️ QUÉ NO DESHACE: los links ya emitidos por `emitir_link_mensual` quedan en
--    `cobro_link_mensual`, y los `auto_renovar=false` que `vencer_links_mensuales`
--    haya escrito NO se reponen — revertir el código no revierte los datos.
--    Si hace falta, se repone a mano con la lista de `cobro_link_mensual`
--    `estado='vencido'` y su `suscripcion_servicio_id`.
--
-- ⚠️ Y LO MÁS IMPORTANTE: revertir esto **vuelve a dejar que un plan de riel
--    `deuna` se cobre por tarjeta**, con su intento estampado `nuvei` sobre una
--    suscripción que no tiene tarjeta. Ese es el defecto que la migración cura.

BEGIN;

SELECT cron.unschedule('vencer-links-mensuales');

-- El emisor vuelve a leer el precio de la suscripción en vez del desglose.
-- (Cuerpo previo: ver la migración 20260906200000.)
-- El selector del plan vuelve a barrer TODOS los planes sin mirar el riel.
-- (Cuerpo previo: ver la migración 20260906120000 y sus predecesoras.)
--
-- No se transcriben acá: los dos cuerpos viven completos en sus migraciones y
-- `pg_get_functiondef` los da del objeto. *Copiar un cuerpo largo a mano es
-- cómo una reversa termina restaurando algo que no era.*

COMMIT;
