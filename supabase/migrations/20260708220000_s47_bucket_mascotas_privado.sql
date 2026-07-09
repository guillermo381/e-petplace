-- ═════════════════════════════════════════════════════════════════════
-- S47-B0.2 — Bucket `mascotas`: privado + signed URLs + saneo integral.
-- Decisión arquitecto S47 (D-310) sobre el relevamiento S47-B0:
-- un anónimo leía cualquier objeto por la vía pública (probado HTTP 200
-- sin auth); INSERT laxa dejaba subir a carpetas ajenas y UPDATE laxa
-- dejaba PISAR fotos ajenas; el bucket no tenía límite de tamaño ni de
-- mime (los 5MB sintéticos entraron sin resistencia).
--
-- 1) Bucket privado + resistencia server-side (el resize del app era
--    la única defensa y es client-only).
-- 2) DROP de las 4 policies heredadas de v2: 2 SELECT públicas
--    DUPLICADAS (mismo predicado), INSERT laxa (dejaba letra muerta a
--    la estricta por carpeta, que QUEDA), UPDATE laxa (archivos pasan
--    a inmutables — patrón grooming-archivos: reemplazar = subir+borrar).
-- 3) SELECT nueva de dos patas: carpeta propia (dueño) OR join inverso
--    mascotas.foto_url + user_tiene_acceso_a_mascota (el PRESTADOR con
--    acceso ve el avatar en la Agenda — requisito de producto). La
--    firma de URLs evalúa esta policy. Índice parcial nuevo para que
--    la pata B sea un probe.
-- 4) DELETE por carpeta propia (propuesta S47-B0 aprobada tal cual):
--    habilita "reemplazar = subir + borrar" y cura la acumulación de
--    "Cambiar foto" (D-301/D-303).
-- 5) mascotas.foto_url pasa a guardar PATH (no URL pública — la URL
--    firmada es efímera, persistirla sería guardar algo vencido).
--    Hoy: 1 fila (Zeus del founder), literal antes/después en el gate.
--    cita-archivos NO se toca.
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) bucket privado + límites server-side
update storage.buckets
   set public = false,
       file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'mascotas';

-- 2) saneo de policies heredadas (nombres literales relevados en S47-B0)
drop policy "Public read pet photos" on storage.objects;
drop policy "public can view pet photos" on storage.objects;
drop policy "authenticated users can upload pet photos" on storage.objects;
drop policy "authenticated users can update pet photos" on storage.objects;
-- QUEDA VIVA: "Users upload own pet photos" (INSERT estricta por carpeta).

-- 3) índice parcial para la pata B del SELECT (equality probe;
--    mascotas.foto_url no tenía índice — relevado S47-B0.2)
create index if not exists idx_mascotas_foto_url
  on public.mascotas (foto_url)
  where foto_url is not null;

-- SELECT de dos patas: dueño por carpeta / acceso por join inverso.
-- user_tiene_acceso_a_mascota es la MISMA puerta del timeline y de la
-- policy de cita-archivos (S45-B5.1) — hereda a sabiendas D-294.
create policy "mascotas_select_dueno_o_acceso" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mascotas'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or exists (
        select 1
          from public.mascotas m
         where m.foto_url = objects.name
           and public.user_tiene_acceso_a_mascota(m.id)
      )
    )
  );

-- 4) DELETE por carpeta propia
create policy "mascotas_delete_carpeta_propia" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mascotas'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 5) foto_url: URL pública → PATH (idempotente: solo matchea URLs)
update public.mascotas
   set foto_url = regexp_replace(
         foto_url,
         '^https://[^/]+/storage/v1/object/public/mascotas/', '')
 where foto_url like 'https://%/storage/v1/object/public/mascotas/%';

commit;
