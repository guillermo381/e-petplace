-- REVERSA de 20260909060000 (S113-A · lote 1.0 · A1+A2)
-- Escrita ANTES de aplicar, como manda la casa.
--
-- ⚠️ QUÉ NO DESHACE: los DATOS. Si alguien cargó un carnet con laboratorio o
-- vencimiento_biologico, revertir BORRA esas columnas y con ellas su contenido.
-- No hay forma de devolverlos: no viven en ningún otro lado.
--
-- ⚠️ Y DEJA A LA FUNCIÓN VIEJA SIN LOS CAMPOS: un bundle ya publicado que
-- mande `laboratorio` en el jsonb NO va a fallar —la función vieja ignora las
-- claves que no conoce— pero el dato se pierde en silencio. Revertir el motor
-- sin revertir el bundle es exactamente esa clase de pérdida muda.

begin;

drop function if exists public.registrar_vacunas_de_carnet(uuid, jsonb, text);

alter table public.evento_vacuna_aplicada
  drop constraint if exists chk_vacuna_vencimiento_no_anterior;

alter table public.evento_vacuna_aplicada
  drop column if exists laboratorio,
  drop column if exists vencimiento_biologico;

-- Y ACÁ NO ALCANZA CON ESTO: hay que volver a crear la versión anterior de
-- `registrar_vacunas_de_carnet`. Su cuerpo vive en 20260908960000; se recupera
-- con `git show 58020651:supabase/migrations/20260908960000_*.sql`.

commit;
