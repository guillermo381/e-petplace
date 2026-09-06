-- REVERSA de 20260909360000_s113a_schnauzer_publicada.sql (S113-A)
-- Escrita ANTES de aplicar. 🔴 Despublicar borra la firma: volver a publicarla
-- exige volver a leerla, y eso está bien — la firma es de quien leyó.
begin;
update public.razas_contenido set activo=false, revisado_por=null, revisado_en=null
 where especie='perro' and raza_codigo='schnauzer-miniatura';
commit;
