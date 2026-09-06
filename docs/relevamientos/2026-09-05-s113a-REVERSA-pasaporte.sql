-- REVERSA de 20260909460000_s113a_pasaporte.sql (S113-A · sublote 1.3)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE, y hay que leerlo antes de correrla:
-- ① **Los pasaportes emitidos dejan de funcionar en el acto.** Si alguno está
--    impreso en una chapita, en un collar o en un QR pegado a una jaula, esa
--    URL queda muerta y **nadie del otro lado se entera**: quien encuentre al
--    animal va a ver una página que no existe. *Revertir esto no es volver a
--    un estado anterior: es cortar un teléfono que alguien podría estar por
--    marcar.*
-- ② El contador de vistas se pierde entero.
-- ③ Las mascotas marcadas `perdida` NO vuelven a `activa`: eso lo hizo un
--    evento, y revertir código no desanda un hecho.
begin;
drop function if exists public.leer_pasaporte(text);
drop function if exists public.marcar_perdida(uuid, boolean);
drop function if exists public.configurar_pasaporte(uuid, boolean, boolean, boolean, text, text, text);
drop function if exists public.revocar_pasaporte(uuid);
drop function if exists public.emitir_pasaporte(uuid);
drop table if exists public.pasaporte_acceso;
drop table if exists public.pasaporte_config;
drop table if exists public.pasaporte;
commit;
