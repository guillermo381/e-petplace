-- ============================================================================
-- REVERSA de 20260804110000_s85_handle_new_user_searchpath.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- QUÉ REVIERTE: devuelve `handle_new_user()` a su estado medido el 3-ago-2026
--   · SIN `SET search_path`  (proconfig = null)
--   · CON los grants heredados de los default privileges de Supabase
--     (proacl medido: {=X/postgres, postgres=X, anon=X, authenticated=X,
--      service_role=X})
--
-- ⚠️ AVISO PROPIO DE ESTA REVERSA — se lee ANTES de correrla:
--   REVERTIR REABRE DOS ENDURECIMIENTOS, no una preferencia de estilo.
--   (1) Una SECURITY DEFINER sin `search_path` resuelve nombres no calificados
--       contra el search_path de QUIEN DISPARA. Hoy el cuerpo califica todo
--       (`public.profiles`), así que el riesgo es POTENCIAL y no actual — pero
--       lo que protege el `SET` es el cuerpo FUTURO, no el de hoy.
--   (2) Devuelve `EXECUTE` a `anon` y a PUBLIC. Medido: es INERTE (Postgres
--       rechaza invocar una función `returns trigger` fuera de un trigger),
--       pero el canon (L-140) exige que el grant sea una DECISIÓN ESCRITA y no
--       una herencia silenciosa.
--
-- ⚠️ EL CUERPO NO SE TOCA NI ACÁ NI EN LA MIGRACIÓN. La clave que lee
--   (`raw_user_meta_data->>'nombre'`) es objeto de una DECISIÓN DE PRODUCTO
--   pendiente de firma del founder (ver
--   `docs/relevamientos/2026-08-04-s85a-cuadro-de-nombres-y-el-trigger.md`).
--   Esta migración es SOLO endurecimiento.
-- ============================================================================

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
as $function$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- restaura los grants heredados que la migración retiró
grant execute on function public.handle_new_user() to public;
grant execute on function public.handle_new_user() to anon;
grant execute on function public.handle_new_user() to authenticated;
grant execute on function public.handle_new_user() to service_role;

-- verificación de la reversa (debe dar proconfig = null y anon presente):
--   select proconfig::text, proacl::text from pg_proc
--   where proname = 'handle_new_user';
