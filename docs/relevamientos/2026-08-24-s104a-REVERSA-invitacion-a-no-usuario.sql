-- REVERSA de `20260824010000_s104a_invitacion_a_no_usuario.sql` · S104-A
--
-- 🔴 LEER ANTES: revertir BORRA LA LISTA DE SUPRESIÓN. Si alguien pidió no
-- recibir más correo, esa decisión vive en `correo_suprimido` y **es lo único
-- que la sostiene** — sin la tabla, una invitación futura al mismo correo
-- volvería a encolar. *Una baja que se pierde no es un dato perdido: es una
-- promesa incumplida a alguien que ya dijo que no.*
-- Si hay que revertir el resto, EXPORTAR `correo_suprimido` primero.
begin;
drop function if exists public.dar_de_baja_correo(text);
drop function if exists public.avisar_invitacion_familia(uuid);
drop table if exists public.invitacion_correo_pendiente;
drop table if exists public.correo_suprimido;
commit;
