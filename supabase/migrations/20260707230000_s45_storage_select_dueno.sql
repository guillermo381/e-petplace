-- ═════════════════════════════════════════════════════════════════════
-- S45-B5.1 — lectura del dueño en storage 'cita-archivos'.
-- Bloqueante confirmado de B5 (relevamiento S45): las 4 tablas del
-- timeline se leen por user_tiene_acceso_a_mascota ✓, pero la ÚNICA
-- policy SELECT del bucket era del prestador — el dueño veía las
-- filas de evento_archivo_adjunto y no podía descargar los objetos.
--
-- Vínculo path→adjunto RELEVADO contra datos reales (regla 22):
--   evento_archivo_adjunto.storage_path = storage.objects.name
--   (igualdad exacta, ej: 'de300000-…e5/foto-paseo-1783394352514.jpg')
--   + evento_archivo_adjunto.bucket = 'cita-archivos'.
--
-- La policy del prestador (cita_archivos_storage_select) NO se toca:
-- las policies se OR-ean. Ésta abre SELECT a authenticated solo si el
-- objeto pertenece a un adjunto de una mascota a la que el user tiene
-- acceso (user_tiene_acceso_a_mascota — misma puerta que el timeline;
-- hoy: dueño directo/prestador/admin, co-dueño cuando se cierre esa
-- brecha en la función). Idempotente: DROP IF EXISTS + CREATE.
-- ═════════════════════════════════════════════════════════════════════
begin;

drop policy if exists cita_archivos_storage_select_acceso_mascota on storage.objects;

create policy cita_archivos_storage_select_acceso_mascota
on storage.objects for select
to authenticated
using (
  bucket_id = 'cita-archivos'
  and exists (
    select 1
    from public.evento_archivo_adjunto a
    where a.bucket = 'cita-archivos'
      and a.storage_path = storage.objects.name
      and public.user_tiene_acceso_a_mascota(a.mascota_id)
  )
);

commit;
