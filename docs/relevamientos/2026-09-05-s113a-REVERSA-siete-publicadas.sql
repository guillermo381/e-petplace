-- REVERSA de 20260909340000_s113a_siete_publicadas.sql (S113-A)
-- Escrita ANTES de aplicar.
-- 🔴 QUÉ NO DESHACE: despublicar borra la firma. Volver a publicarlas exige
-- volver a leerlas — y eso está bien: la firma es de quien leyó, no del estado.
begin;
update public.razas_contenido set activo=false, revisado_por=null, revisado_en=null
 where raza_codigo in ('labrador-retriever','loro-yaco-africano','beagle',
                       'californian','persa','pug','chinchilla');
commit;
