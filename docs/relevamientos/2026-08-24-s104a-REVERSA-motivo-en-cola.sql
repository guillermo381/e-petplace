-- REVERSA de `20260824020000_s104a_motivo_en_cola_invitacion.sql` · S104-A
-- Revertir deja la cola CIEGA otra vez: un 'fallido' vuelve a ser
-- indistinguible entre «no se pudo componer el correo» y «Resend rebotó».
begin;
alter table public.invitacion_correo_pendiente drop column if exists motivo;
commit;
