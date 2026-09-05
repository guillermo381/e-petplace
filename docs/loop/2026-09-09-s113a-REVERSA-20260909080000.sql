-- REVERSA de 20260909070000 (S113-A · lote 1.0 · A3 · la plaga en el evento)
-- Escrita ANTES de aplicar.
--
-- ⚠️ NO DESHACE LOS DATOS: dropear `plagas` borra qué plaga trataba cada
-- desparasitación, y eso no vive en ningún otro lado. `tipo_desparasitacion`
-- (interna/externa/mixta) NO alcanza para reconstruirlo: «externa» no dice si
-- era pulgas o garrapatas — que es exactamente la razón por la que la columna
-- nace.
begin;
drop function if exists public.registrar_desparasitacion(uuid, text, text, date, date, text, text[]);
alter table public.evento_desparasitacion_aplicada drop constraint if exists chk_desparasitacion_plagas;
alter table public.evento_desparasitacion_aplicada drop column if exists plagas;
-- Y hay que recrear la firma vieja de 6 parámetros: su cuerpo se recupera con
-- `git show 58020651:supabase/migrations/` — la escribió S82-A.
commit;
