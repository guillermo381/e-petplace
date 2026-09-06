-- REVERSA de 20260909660000_s113a_avisos_coach.sql · escrita ANTES.
--
-- QUÉ DESHACE: la tabla `avisos_coach`, sus puertas, el generador y la
-- columna `familia.avisos_nexo_desde`.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · **El opt-in de cada familia.** `avisos_nexo_desde` guarda el instante en
--     que una familia dijo que sí. Soltarla borra ese consentimiento, y si la
--     columna vuelve a nacer, **nadie tiene los avisos encendidos aunque los
--     hubiera pedido**. *Un consentimiento perdido no falla ruidosamente:
--     deja de avisar y nadie se entera.* Exportar antes:
--       select id, avisos_nexo_desde from public.familia where avisos_nexo_desde is not null;
--   · Los avisos ya leídos se pierden; eso no importa (son efímeros por diseño).
--
-- ⚠️ Y si existe el cron, se apaga ANTES de soltar la función, o el job va a
-- fallar cada día en silencio contra una función que no está.

drop function if exists public.marcar_aviso_coach_leido(uuid);
drop function if exists public.obtener_avisos_coach();
drop function if exists public.generar_avisos_coach();
drop function if exists public.activar_avisos_nexo(uuid, boolean);
drop table if exists public.avisos_coach;
alter table public.familia drop column if exists avisos_nexo_desde;
