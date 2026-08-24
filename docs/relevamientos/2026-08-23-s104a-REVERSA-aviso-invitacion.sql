-- REVERSA de `20260823230000_s104a_aviso_invitacion_familia.sql` · S104-A · 23-ago-2026
-- Escrita ANTES de aplicar.
--
-- ⚠️ NO deshace las intenciones ya registradas en `notificacion_intencion`: son
-- el registro de que la casa quiso avisar algo, y borrarlas sería reescribir esa
-- historia. Como el tipo nace EN SOMBRA, ninguna llegó a entregarse.
-- Revertir deja de nuevo el token de `invitar_a_familia` SIN NADA QUE LO
-- ENTREGUE — el estado de motor-sin-puerta que esta migración vino a cerrar.
begin;
drop function if exists public.avisar_invitacion_familia(uuid);
delete from public.cat_notificacion_tipos where codigo = 'invitacion_familia';
commit;
