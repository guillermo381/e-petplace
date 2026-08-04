-- ============================================================================
-- S85-A · `handle_new_user()` al patrón canónico de la casa
--
-- QUÉ HACE, y SOLO esto:
--   ① agrega `SET search_path TO 'public', 'pg_temp'` (la función es SECURITY
--      DEFINER y NO lo tenía — medido: `proconfig` = null)
--   ② retira el `EXECUTE` heredado de `anon` y de PUBLIC (L-140), dejando la
--      decisión ESCRITA en vez de heredada
--
-- ⚠️ EL CUERPO NO SE TOCA. Es byte-idéntico al medido con `pg_get_functiondef`
--   el 3-ago-2026. La clave que lee —`raw_user_meta_data->>'nombre'`, que
--   ningún proveedor manda— es un DEFECTO REAL y está medido en
--   `docs/relevamientos/2026-08-04-s85a-cuadro-de-nombres-y-el-trigger.md`,
--   pero su cura es DECISIÓN DE PRODUCTO y espera firma del founder.
--   Mezclarla acá haría que un endurecimiento y un cambio de comportamiento
--   compartieran reversa: revertir uno obligaría a revertir el otro.
--
-- REGLA 76(g): NO RIGE — no hay backfill, no se toca ni una fila de datos.
--   La función se reemplaza en su lugar; el trigger `on_auth_user_created`
--   (1 trigger medido sobre esta función) sigue apuntando al mismo oid lógico.
--
-- REVERSA: `docs/relevamientos/2026-08-04-s85a-REVERSA-handle-new-user-searchpath.sql`
--   (escrita ANTES de aplicar, con su propio aviso).
--
-- LO QUE ② NO CIERRA, declarado para que nadie lo lea de más: el grant a `anon`
--   era INERTE — Postgres rechaza invocar una función `returns trigger` fuera
--   de un trigger. No se retira porque hubiera una fuga: se retira porque
--   L-140 exige que el grant sea una decisión escrita, y una ACL heredada en
--   silencio es indistinguible de una concedida a propósito.
-- ============================================================================

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
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

-- El trigger corre como el DUEÑO de la función (definer): NINGÚN rol de cliente
-- necesita `EXECUTE` para que dispare. Por eso se retiran los tres heredados y
-- no solo `anon` — `authenticated` estaba en el `proacl` medido por la misma
-- herencia, y dejarlo habría sido la receta a medias que L-198 nombra: el
-- próximo censo leería un grant y no podría distinguirlo de una decisión.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- se deja explícito el único que se conserva, para que el censo lea una
-- decisión y no una herencia.
grant execute on function public.handle_new_user() to service_role;
