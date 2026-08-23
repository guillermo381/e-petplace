-- ============================================================================
-- REVERSA de `20260823120000_s104a_copia_email_espejo.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
-- S104-A · 23-ago-2026
-- ============================================================================
--
-- ⚠️ LO QUE ESTA REVERSA **NO** DESHACE, y hay que leerlo antes de correrla:
--
--   1. EL BACKFILL `lower()` NO SE REVIERTE. La migración normalizó 17 filas de
--      `profiles.email` que tenían mayúsculas. **El valor original no se guarda
--      en ningún lado**, y no se guarda A PROPÓSITO: conservar una copia del
--      correo tal-como-se-tipeó sería crear una TERCERA fuente del mismo dato,
--      que es justo el defecto que esta migración viene a cerrar.
--      *La forma vieja era la equivocada: `auth.users` ya guardaba minúsculas y
--      la copia era la que divergía.* Revertir devolvería la divergencia.
--
--   2. Si entre el apply y la reversa alguien cambió su correo, el espejo ya
--      propagó ese cambio. Borrar el trigger NO devuelve el valor viejo — y no
--      debería: el valor nuevo es el correcto (`auth.users` es la fuente).
--
--   3. 🔴 REVERTIR REABRE LA ESCRITURA DE `profiles.email` DESDE EL CLIENTE.
--      El trigger `profiles_protege_email` es lo único que hoy impide que un
--      usuario con sesión reescriba su propio correo por PostgREST directo
--      (medido S104: `authenticated` tiene GRANT UPDATE sobre la columna y la
--      policy `profiles_update` no restringe columnas). Quien revierta esto
--      **tiene que saber que deja esa puerta abierta otra vez.**
--
-- ============================================================================

begin;

-- (c) el guard de columna
drop trigger if exists profiles_protege_email on public.profiles;
drop function if exists public._trg_profiles_protege_email();

-- (b) el espejo
drop trigger if exists on_auth_user_email_changed on auth.users;
drop function if exists public._trg_espejar_email_a_profiles();

-- (a) el backfill NO se revierte — ver nota 1 arriba. Deliberadamente no hay
--     sentencia acá: una reversa que restaura un dato peor no es una reversa.

commit;

-- Verificación post-reversa (debe dar 0 filas: los objetos ya no existen).
-- select tgname from pg_trigger
--  where tgname in ('profiles_protege_email','on_auth_user_email_changed');
