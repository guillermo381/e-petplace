-- REVERSA de 20260909540000_s113a_invitaciones_por_rpc.sql (S113-A)
-- 🔴 REVERTIR REABRE LA FUGA: `anon` vuelve a leer los emails y los tokens de
-- todas las invitaciones de todas las familias, incluidas las revocadas.
begin;
drop function if exists public.mirar_invitacion(text);
create policy familia_inv_publica_por_token on public.familia_invitaciones
  for select to anon, authenticated using (true);
grant select, insert, update, delete on public.familia_invitaciones to anon;
commit;
