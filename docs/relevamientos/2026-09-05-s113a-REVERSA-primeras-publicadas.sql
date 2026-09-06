-- REVERSA de 20260909260000_s113a_primeras_publicadas.sql (S113-A)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE:
-- ① «Cobaya o Cuy» vuelve al catálogo, pero **su ficha NO vuelve**: el cascade
--    se la llevó y era la vacía por raza no reconocida. Es la que el segundo
--    Batch tampoco va a escribir, así que no se pierde nada que exista.
-- ② Despublicar las tres borra la firma de revisión. *Volver a publicarlas
--    exige volver a leerlas — y eso está bien: la firma es de quien leyó.*
-- ③ El texto vuelve a decir «chicos» en las 23 fichas donde significaba niños.
begin;
update public.razas_contenido
   set activo = false, revisado_por = null, revisado_en = null
 where raza_codigo in ('bulldog-ingles','american-bully','maine-coon');

update public.razas_contenido
   set temperamento = replace(temperamento, 'niños', 'chicos')
 where temperamento ilike '%niños%' and revisado_por is null;

insert into public.cat_razas (especie, slug, nombre, ruta_imagen, activo, creado_en_s113)
values ('roedor','cobaya-o-cuy','Cobaya o Cuy','roedor/cobaya-o-cuy.webp', true, false)
on conflict do nothing;
commit;
