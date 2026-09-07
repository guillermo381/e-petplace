-- REVERSA de 20260909400000_s113a_resolver_ficha_de_raza.sql (S113-A)
-- Escrita ANTES de aplicar.
-- 🔴 QUÉ NO DESHACE:
-- ① Revertir deja otra vez SIN FICHA a toda mascota cuya raza no case: vuelven
--    a ver una pantalla vacía teniendo el texto escrito al lado.
-- ② `raza_sin_casar` se borra con lo que haya juntado — y eso es justo el censo
--    que D-1037 pide que exista. Exportala antes.
-- ③ `perro/criollo` queda despublicada y su firma borrada.
begin;
drop function if exists public.resolver_ficha_de_raza(text, text);
drop table if exists public.raza_sin_casar;
drop table if exists public.raza_sinonimo;
drop index if exists uq_razas_contenido_una_por_especie;
alter table public.razas_contenido drop column if exists es_de_especie;
update public.razas_contenido set activo=false, revisado_por=null, revisado_en=null
 where especie='perro' and raza_codigo='criollo';
commit;
