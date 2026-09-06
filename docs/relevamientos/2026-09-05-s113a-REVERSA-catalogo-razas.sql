-- REVERSA de 20260909220000_s113a_catalogo_razas.sql (S113-A)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE:
-- ① Si alguna familia eligió una de las razas nuevas, `mascotas.raza` guarda el
--    NOMBRE como texto libre (D-379: el catálogo sugiere, jamás impone). Borrar
--    la fila del catálogo **no le borra la raza a nadie** — le saca la cara y
--    el selector deja de ofrecerla. *Eso es degradación, no pérdida.*
-- ② Si D ya cargó fichas en `razas_contenido`, el `on delete cascade` de esa
--    tabla **se las lleva**. Exportá antes: regenerarlas cuesta plata.
begin;

-- El orden importa: primero lo agregado, después las erratas.
delete from public.cat_razas where creado_en_s113 = true;
alter table public.cat_razas drop column if exists creado_en_s113;

update public.cat_razas set slug='jack-rusell',                  nombre='Jack Russell'                 where slug='jack-russell';
update public.cat_razas set slug='pitbul-terrier',               nombre='Pitbul Terrier'               where slug='pit-bull-terrier';
update public.cat_razas set slug='stanffordshire-bull-terrier',  nombre='Stanffordshire Bull Terrier'  where slug='staffordshire-bull-terrier';
update public.cat_razas set slug='shnauzer',                     nombre='Shnauzer'                     where slug='schnauzer';

alter table public.cat_razas alter column ruta_imagen set not null;
commit;
