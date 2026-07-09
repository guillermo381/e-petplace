-- ═════════════════════════════════════════════════════════════════════
-- S47 (post gate 1 fallido) — mascotas.foto_url guarda PATH, y la DB
-- lo hace IMPOSIBLE de violar (regla 36 llevada al schema).
--
-- Causa que lo motiva: un bundle JS pre-S47 en el teléfono del founder
-- escribió una URL pública completa en foto_url (formato viejo) y la
-- foto degradó a huella en silencio. Con este CHECK, un cliente viejo
-- falla RUIDOSO en el onboarding en vez de escribir un dato fantasma.
-- Decisión founder+arquitecto S47: hoy los únicos clientes son los
-- teléfonos del founder — mejor error visible hoy que foto fantasma
-- en soft launch.
--
-- Cinturón: se re-corre la normalización idempotente ANTES del CHECK
-- (misma regexp de 20260708220000) por si otra fila con formato viejo
-- entró entre ambas migraciones.
-- ═════════════════════════════════════════════════════════════════════
begin;

update public.mascotas
   set foto_url = regexp_replace(
         foto_url,
         '^https://[^/]+/storage/v1/object/public/mascotas/', '')
 where foto_url like 'https://%/storage/v1/object/public/mascotas/%';

alter table public.mascotas
  add constraint mascotas_foto_url_es_path
  check (foto_url is null or foto_url not like 'http%');

commit;
