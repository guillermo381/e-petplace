-- REVERSA de 20260909380000_s113a_gato_comun_publicada.sql (S113-A)
-- Escrita ANTES de aplicar. 🔴 Despublicar borra la firma; volver a publicarla
-- exige volver a leerla. Y deja sin ficha a las 14 mascotas que declaran «Gato
-- Común» — más de las que ve cualquiera de las once de raza.
begin;
update public.razas_contenido set activo=false, revisado_por=null, revisado_en=null
 where especie='gato' and raza_codigo='gato-comun';
commit;
