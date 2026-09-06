-- REVERSA de 20260909600000_s113a_coach_memoria_y_hilo.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: las dos tablas (`coach_memoria`, `coach_conversacion`), sus
-- puertas y sus policies.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que hay que leer antes de correrla:
--   · **Se lleva puesto lo que las familias escribieron.** `coach_memoria`
--     guarda hechos que una persona tecleó sobre su animal —«le tiene miedo a
--     los truenos»— y que no existen en ningún otro lado del expediente.
--     *Soltar la tabla no revierte una función: borra el único lugar donde
--     vive ese dato.* Si hay filas, se exportan antes.
--   · El hilo de conversación se pierde entero. Eso duele menos (tiene 30 días
--     de retención por diseño), pero se dice igual.
--
-- ANTES DE CORRER, qué se está por perder:
--   select count(*) from public.coach_memoria where activo;
--   select count(distinct mascota_id) from public.coach_conversacion;

drop function if exists public.borrar_hilo_coach(uuid);
drop function if exists public.guardar_turno_coach(uuid, text, text, integer);
drop function if exists public.leer_hilo_coach(uuid, integer);
drop function if exists public.purgar_conversacion_coach();
drop function if exists public.borrar_memoria_coach(uuid);
drop function if exists public.editar_memoria_coach(uuid, text);
drop function if exists public.agregar_memoria_coach(uuid, text, text);
drop function if exists public.listar_memoria_coach(uuid);
drop table if exists public.coach_conversacion;
drop table if exists public.coach_memoria;
