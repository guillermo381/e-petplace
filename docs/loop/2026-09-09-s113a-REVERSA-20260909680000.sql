-- REVERSA de 20260909680000_s113a_placas.sql · escrita ANTES.
--
-- QUÉ DESHACE: las tablas de lotes y placas y sus puertas.
--
-- 🔴 QUÉ **NO** DESHACE, y acá es grave de verdad:
--   · **Las chapitas ya fabricadas quedan huérfanas.** Un token de placa está
--     GRABADO EN METAL colgando del collar de un animal. Soltar la tabla no
--     revierte una función: convierte un objeto físico que anda en la calle en
--     un código que no resuelve a nada. *Es la única reversa de esta sesión
--     cuyo daño ocurre fuera de la base de datos.*
--   · Los pasaportes YA ACTIVADOS **sobreviven** (viven en `pasaporte`, que
--     esta reversa no toca): esas chapitas siguen funcionando. Lo que se
--     rompe es lo fabricado y todavía sin activar.
--
-- ANTES DE CORRER, cuántas chapitas quedarían muertas:
--   select count(*) from public.pasaporte_placa where activada_en is null;
--   -- si el número no es CERO, esto no se corre sin hablarlo.

drop function if exists public.activar_placa(text, uuid);
drop function if exists public.crear_lote_placas(text, integer, text);
drop function if exists public.listar_placas_de_lote(uuid);
drop table if exists public.pasaporte_placa;
drop table if exists public.pasaporte_lote;
