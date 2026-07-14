-- S61-A2 — D-387 DISPARADA (pulgar founder S61): los 9 registrables de
-- grooming ganan VOZ DE FAMILIA bilingüe. Patrón D-300 (el precedente:
-- cat_novedades_paseo.nombre_familia, 13 textos gateados) — la voz de
-- picker del GROOMER queda INTACTA en `nombre`; la familia lee
-- nombre_familia / nombre_familia_en. La pata en nace acá y ABSORBE LA
-- MITAD de D-388 (la otra mitad — cat_incidencias_grooming y el
-- `nombre` de oficio — sigue abierta).
--
-- ⚠ TEXTOS = PROPUESTA S61-A2 (freno 76b declarado: la tabla del
-- arquitecto con los 9 gateados NO viajó con el pedido ni vive en el
-- repo — MODELO_GROOMING §1 lista códigos sin voz). El re-gate en
-- dispositivo del parte los cubre; si el literal firmado difiere, la
-- corrección es un UPDATE por codigo, una línea cada uno.
--
-- + LA POLICY DE STORAGE QUE EL PARTE NECESITA (hallazgo del
-- relevamiento A2.1): grooming_archivos_select (tabla) ya deja leer al
-- dueño por user_tiene_acceso_a_mascota, pero el bucket
-- 'grooming-archivos' SOLO dejaba firmar URLs al prestador — la foto
-- de entrega jamás podía llegar al dueño. Espejo LITERAL de
-- cita_archivos_storage_select_acceso_mascota (S45-B5.1, el paseo).
-- Nace policy, no función → L-140 no aplica; asserts de lectura abajo
-- en el reporte de la tanda.

alter table public.cat_servicios_grooming
  add column nombre_familia text,
  add column nombre_familia_en text;

update public.cat_servicios_grooming set nombre_familia = 'Baño con shampoo suave',      nombre_familia_en = 'Bath with gentle shampoo'   where codigo = 'shampoo_neutro';
update public.cat_servicios_grooming set nombre_familia = 'Baño con shampoo medicado',   nombre_familia_en = 'Medicated bath'             where codigo = 'shampoo_medicado';
update public.cat_servicios_grooming set nombre_familia = 'Corte al estilo de su raza',  nombre_familia_en = 'Breed-style haircut'        where codigo = 'corte_raza';
update public.cat_servicios_grooming set nombre_familia = 'Corte a su medida',           nombre_familia_en = 'Custom haircut'             where codigo = 'corte_personalizado';
update public.cat_servicios_grooming set nombre_familia = 'Retiro del pelo muerto',      nombre_familia_en = 'De-shedding'                where codigo = 'deslanado';
update public.cat_servicios_grooming set nombre_familia = 'Uñas recortadas',             nombre_familia_en = 'Nails trimmed'              where codigo = 'corte_unas';
update public.cat_servicios_grooming set nombre_familia = 'Oídos limpios',               nombre_familia_en = 'Ears cleaned'               where codigo = 'limpieza_oidos';
update public.cat_servicios_grooming set nombre_familia = 'Cuidado de glándulas',        nombre_familia_en = 'Gland care'                 where codigo = 'expresion_glandulas';
update public.cat_servicios_grooming set nombre_familia = 'Perfume final',               nombre_familia_en = 'Finishing fragrance'        where codigo = 'perfume_final';

alter table public.cat_servicios_grooming
  alter column nombre_familia set not null,
  alter column nombre_familia_en set not null;

comment on column public.cat_servicios_grooming.nombre_familia is
  'D-387: la voz de FAMILIA del registrable (es) — lo que el dueño lee en el parte/vivo. La voz de oficio del picker del groomer sigue en `nombre`. Textos: propuesta S61-A2 pendiente de contraste con la tabla del arquitecto (freno 76b declarado).';
comment on column public.cat_servicios_grooming.nombre_familia_en is
  'D-387/D-388: la pata en de la voz de familia — nace bilingüe (absorbe la mitad de D-388).';

-- El dueño firma la URL de la foto del grooming de SU mascota — espejo
-- de cita_archivos_storage_select_acceso_mascota (S45-B5.1):
create policy grooming_archivos_select_acceso_mascota
  on storage.objects for select to authenticated
  using (
    bucket_id = 'grooming-archivos'
    and exists (
      select 1
      from public.evento_grooming_archivos a
      where a.storage_path = objects.name
        and public.user_tiene_acceso_a_mascota(a.mascota_id)
    )
  );
