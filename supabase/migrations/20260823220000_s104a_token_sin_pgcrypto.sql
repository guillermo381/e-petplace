-- ============================================================================
-- S104-A · CURA: `invitar_a_familia` reventaba en su primera línea útil
-- ============================================================================
-- Reversa: la misma de `20260823210000` (drop de las 3 RPCs y la tabla).
-- 76(g): NO RIGE.
--
-- ── EL DEFECTO, Y EL CINTURÓN LO DEJÓ PASAR POR TERCERA VEZ EN EL DÍA ────
-- `invitar_a_familia` generaba el token con `gen_random_bytes(32)`. **Esa
-- función vive en el schema `extensions`, no en `public` ni en `pg_catalog`**, y
-- la RPC declara `set search_path = public, pg_catalog` ⇒ **`42883: function
-- gen_random_bytes(integer) does not exist`, en la línea 35, en TODA llamada.**
--
-- **El apply salió VERDE.** El cinturón preguntaba: ¿existen las 3 RPCs? ¿ninguna
-- alcanzable por anon? ¿están los 3 índices? — **las tres respuestas eran sí, y
-- la función no podía correr ni una vez.** *Existe y funciona son dos
-- afirmaciones distintas, y por tercera vez en esta sesión el cinturón midió la
-- primera creyendo medir la segunda* (L-410 · el guard de `profiles.email` ·
-- el de gobierno de empleados). **Lo cazó el E2E, que es lo único que la ejerce.**
--
-- ── LA CURA, Y POR QUÉ NO ES `extensions.gen_random_bytes` ───────────────
-- Calificar el schema arreglaría hoy y ataría la RPC a dónde está instalada una
-- extensión. **`gen_random_uuid()` es NATIVO de `pg_catalog` desde PG13** —
-- medido: vive en `extensions` **y** en `pg_catalog` — y usa el mismo CSPRNG.
-- Dos UUID concatenados sin guiones = **64 caracteres hex = 256 bits**, la misma
-- fuerza que `gen_random_bytes(32)`, **sin depender del `search_path` ni de que
-- nadie mueva pgcrypto.**
--
-- *Dato del censo: NINGUNA otra RPC de la casa usaba `gen_random_bytes`. El
-- molde de `empleado_invitaciones` genera su token en el wrapper, en JS — o sea
-- que no había precedente que copiar, y se inventó uno que no compilaba.*
-- ============================================================================

begin;

create or replace function public.invitar_a_familia(
  p_familia_id uuid,
  p_email      text,
  p_nombre     text default null
)
returns table (id uuid, token text, expira_en timestamptz)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_token text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.familia_miembro fm
    where fm.familia_id = p_familia_id and fm.user_id = v_uid
      and fm.rol = 'adulto_titular' and fm.hasta is null
  ) then
    raise exception 'solo_titular_invita' using errcode = '42501';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.familia_miembro fm
    join auth.users u on u.id = fm.user_id
    where fm.familia_id = p_familia_id and fm.hasta is null and lower(u.email) = v_email
  ) then
    raise exception 'ya_es_miembro' using errcode = '23505';
  end if;

  -- 256 bits de CSPRNG sin depender de `extensions` (ver cabecera).
  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  return query
  insert into public.familia_invitaciones (familia_id, email, nombre, token, invitado_por)
  values (p_familia_id, v_email, nullif(btrim(coalesce(p_nombre,'')),''), v_token, v_uid)
  returning familia_invitaciones.id, familia_invitaciones.token, familia_invitaciones.expira_en;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — AHORA **EJECUTA** LA RPC, que es lo que faltaba
-- ─────────────────────────────────────────────────────────────────────────
-- Sin `SET LOCAL ROLE` (L-411): el claim alcanza para que `auth.uid()` resuelva,
-- y la RPC es DEFINER. El brazo que ESCRIBE corre en subtransacción que se
-- deshace sola (L-406) — residuo 0 por construcción, no por limpieza.
do $$
declare v_fam uuid; v_tit uuid; v_tok text; v_largo int := 0; v_ok boolean := false;
begin
  select fm.familia_id, fm.user_id into v_fam, v_tit
    from public.familia_miembro fm
   where fm.rol = 'adulto_titular' and fm.hasta is null limit 1;
  if v_fam is null then
    raise exception 'CINTURON: no hay titular para ejercer la RPC';
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_tit, 'role', 'authenticated')::text, true);

  begin
    select token into v_tok
      from public.invitar_a_familia(v_fam, 'cinturon-s104a@invalido.local', 'Cinturon');
    v_largo := length(coalesce(v_tok, ''));
    v_ok := true;
    raise exception 'FIXTURE_ROLLBACK';
  exception when others then
    if sqlerrm <> 'FIXTURE_ROLLBACK' then
      raise exception 'CINTURON: invitar_a_familia NO CORRE — %', sqlerrm;
    end if;
  end;

  if not v_ok then raise exception 'CINTURON: la RPC no llego a devolver token'; end if;
  if v_largo <> 64 then
    raise exception 'CINTURON: el token mide % y se esperaban 64 hex (256 bits)', v_largo;
  end if;

  raise notice 'CINTURON VERDE: la RPC CORRIO de verdad y devolvio un token de 64 hex. Residuo 0 por subtransaccion.';
end $$;

commit;
