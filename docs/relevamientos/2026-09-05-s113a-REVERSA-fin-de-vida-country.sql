-- REVERSA de 20260909420000_s113a_fin_de_vida_country_code.sql (S113-A)
-- 🔴 Revertir devuelve la puerta a su estado ROTO: `registrar_fin_de_vida`
-- vuelve a rebotar con 23502 en toda llamada. No hay caso en que convenga.
begin;
-- (se deja a propósito sin cuerpo: revertir esto es reintroducir un defecto que
--  bloquea una pantalla. Si hiciera falta, se restaura de 20260909200000.)
select 'esta reversa no se ejecuta: revertir reintroduce el 23502' as nota;
commit;
