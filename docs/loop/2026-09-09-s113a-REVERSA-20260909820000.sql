-- REVERSA de 20260909820000_s113a_aviso_anticipacion.sql · escrita ANTES.
-- QUÉ DESHACE: el tipo 'anticipacion', su clave de unicidad y su brazo en el
--   generador.
-- 🔴 QUÉ **NO** DESHACE: los avisos ya nacidos. Y **volver el CHECK a los tres
--   tipos viejos FALLA** si existe alguno de 'anticipacion' — la reversa se
--   detiene en vez de borrar avisos que una familia ya leyó.
-- ANTES DE CORRER:  select count(*) from public.avisos_coach where tipo='anticipacion';

alter table public.avisos_coach drop constraint if exists avisos_coach_tipo_check;
alter table public.avisos_coach
  add constraint avisos_coach_tipo_check
  check (tipo in ('vacuna_vence','antiparasitario_vence','cita_manana'));
drop index if exists public.uq_avisos_coach_por_clave;
alter table public.avisos_coach drop column if exists clave;
