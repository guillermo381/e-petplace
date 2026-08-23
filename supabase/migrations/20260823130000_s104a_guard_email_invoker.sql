-- ============================================================================
-- S104-A · CURA: el guard de `profiles.email` nació DEFINER y NO FRENABA
-- ============================================================================
-- Reversa: la misma de `20260823120000` (drop del trigger y la función) —
--   docs/relevamientos/2026-08-23-s104a-REVERSA-copia-email.sql
-- 76(g): NO RIGE — DDL puro, sin backfill, sin tocar una fila de datos.
--
-- ── EL DEFECTO, Y CÓMO APARECIÓ ───────────────────────────────────────────
-- `20260823120000` creó `_trg_profiles_protege_email` con `SECURITY DEFINER`.
-- **En una función DEFINER, `current_user` es el OWNER de la función**, no el
-- rol que la invocó ⇒ `current_user in ('authenticated','anon')` es SIEMPRE
-- falso ⇒ **el guard no frenaba nada.**
--
-- El apply salió VERDE: el CREATE no falló, y el cinturón preguntaba «¿existe
-- el trigger?» — y existía. *Un guard presente y un guard que frena son dos
-- afirmaciones distintas, y el cinturón medía la primera.* Lo cazó producir el
-- rojo: un `set local role authenticated` + UPDATE del propio correo **PASÓ**.
-- Es L-192 en su forma limpia (una verificación cuyo modo de falla es el
-- silencio) y L-321 (se prueba la defensa, no la lista).
--
-- ── EL MOLDE, LEÍDO DEL OBJETO Y NO DE MEMORIA ────────────────────────────
-- `_prestadores_protege_columnas` (D-389) es **INVOKER**. Esa es la razón por
-- la que su `current_user = 'authenticated'` funciona. Se copió el nombre del
-- patrón sin copiar la propiedad que lo hace andar.
--
-- ⚠️ HALLAZGO COLATERAL, declarado y NO curado acá (no es de esta tanda):
-- `_prestador_empleados_protege_gobierno` (D-526, S76) es **DEFINER** y también
-- gatea por `current_user = 'authenticated'` ⇒ **es candidato al mismo defecto**
-- y protege algo más caro (el gobierno del vínculo de empleados). Se mide y se
-- ficha aparte: curarlo dentro de una migración que vino a otra cosa sería
-- justo lo que la casa no hace.
-- ============================================================================

begin;

drop trigger if exists profiles_protege_email on public.profiles;
drop function if exists public._trg_profiles_protege_email();

-- INVOKER a propósito: es la propiedad que hace que `current_user` sea el rol
-- real de PostgREST. La función solo levanta una excepción — no lee ni escribe
-- nada — así que no necesita privilegios prestados.
create function public._trg_profiles_protege_email()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if current_user in ('authenticated', 'anon')
     and new.email is distinct from old.email then
    raise exception 'email_no_editable_aqui'
      using errcode = '42501',
            hint = 'El correo se cambia por auth (updateUser), no escribiendo profiles.';
  end if;
  return new;
end;
$$;

comment on function public._trg_profiles_protege_email() is
  'S104-A · profiles.email es ESPEJO de auth.users, no dato propio. INVOKER a '
  'propósito: en DEFINER, current_user es el owner y el guard no frena (defecto '
  'de 20260823120000, cazado produciendo el rojo). Molde: D-389.';

create trigger profiles_protege_email
  before update on public.profiles
  for each row
  execute function public._trg_profiles_protege_email();

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — ahora mide QUE FRENA, no que exista
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_uid uuid; v_nom text; v_freno boolean := false; v_nombre_pasa boolean := false;
begin
  select id, nombre into v_uid, v_nom from public.profiles limit 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

  -- ROJO: el cliente intenta reescribir su propio correo ⇒ tiene que rebotar
  begin
    set local role authenticated;
    update public.profiles set email = 'guard-test@invalido.local' where id = v_uid;
    reset role;
  exception when sqlstate '42501' then
    reset role; v_freno := true;
  end;

  -- CONTRA-CASO: el MISMO rol cambia el nombre ⇒ tiene que PASAR.
  -- Sin esto, un guard que rebota TODO también daría "verde" en el rojo.
  begin
    set local role authenticated;
    update public.profiles set nombre = coalesce(v_nom, 'x') where id = v_uid;
    reset role; v_nombre_pasa := true;
  exception when others then
    reset role;
  end;

  if not v_freno then
    raise exception 'CINTURON: el guard NO frena el UPDATE de email';
  end if;
  if not v_nombre_pasa then
    raise exception 'CINTURON: el guard rompio el guardado normal del perfil';
  end if;
  raise notice 'CINTURON VERDE: email REBOTA (42501) y nombre PASA.';
end $$;

commit;
