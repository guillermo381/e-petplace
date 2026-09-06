-- REVERSA de 20260909440000_s113a_marca_de_fixture.sql (S113-A)
-- 🔴 QUÉ NO DESHACE: al soltar la columna se pierde QUÉ mascota era fixture, y
-- eso no se puede reconstruir mirando los datos — una mascota de prueba se ve
-- igual que una real. *Volver a marcarlas exigiría la firma del founder otra
-- vez, mascota por mascota.*
begin;
alter table public.mascotas drop column if exists creado_por_sistema;
commit;
