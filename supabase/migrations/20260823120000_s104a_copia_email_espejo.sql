-- ============================================================================
-- S104-A · LA COPIA QUE MIENTE — `profiles.email` pasa a ESPEJO de `auth.users`
-- ============================================================================
-- Tanda 1 de la Mesa 105, frente 1. Reversa escrita ANTES:
--   docs/relevamientos/2026-08-23-s104a-REVERSA-copia-email.sql
--
-- ── LO MEDIDO QUE ORDENA ESTA MIGRACIÓN (S104-A, turno 1) ──────────────────
--   · 165 profiles = 165 auth.users, cero huérfanos de los dos lados.
--   · DIVERGEN 17 — y el discriminador dice que las 17 son SOLO mayúsculas
--     (`solo_case=17`, `divergencia_real=0`). `profiles` guarda lo tipeado
--     (`Luis@…`), `auth` normaliza a minúsculas.
--   · El trigger `on_auth_user_created` es **AFTER INSERT y solo INSERT** ⇒
--     **nada propaga un cambio de correo**. La divergencia real es 0 no porque
--     el sistema esté sano: es porque **todavía nadie pudo cambiar su correo**.
--   · `miPerfil.ts:37` lee `data?.email ?? sesion.user.email` ⇒ **la tabla GANA
--     sobre auth**. El día que exista la pantalla de cambiar correo, la app
--     mostraría el correo VIEJO como si fuera el de la cuenta.
--
-- ── 76(g) VEDA DE ESCRITURA: RIGE, y por eso el backfill es idempotente ────
--   El bloque (a) toca `profiles` de 17 usuarios reales. Es un UPDATE de
--   NORMALIZACIÓN (`lower(btrim(...))`), no de reemplazo: correrlo dos veces
--   deja el mismo resultado, y una escritura concurrente sobre otra columna no
--   lo pisa. Aun así se declara la veda: **ninguna otra pista escribe
--   `profiles` mientras esta migración corre.**
--
-- ── LA DECISIÓN TÉCNICA DEL BLOQUE (c), informada y no votada (regla 3) ────
--   El mandato pedía «revocar el UPDATE de email a authenticated». **Un
--   `REVOKE UPDATE(email)` NO TIENE EFECTO** mientras exista el `GRANT UPDATE`
--   a nivel de TABLA, que es lo que hay hoy (medido: anon y authenticated
--   tienen ALL sobre `profiles`). Hacerlo por columna exigiría revocar la tabla
--   y **re-conceder 34 columnas** — y entonces **toda columna nueva futura
--   nacería sin grant y rompería en silencio** a la primera migración que
--   agregue algo que el cliente escriba.
--   ⇒ Se usa **el molde que la casa ya tiene medido dos veces**:
--   `prestadores_protege_columnas` (D-389, S61) y
--   `prestador_empleados_protege_gobierno` (D-526, S76). Un trigger de
--   protección **es más fuerte que el revoke**: no depende de los grants,
--   cubre a cualquier rol, y deja pasar a los DEFINER por `current_user`.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- (a) BACKFILL: normalizar las 17 divergentes
-- ─────────────────────────────────────────────────────────────────────────
-- Se normaliza contra sí mismo y NO se copia de `auth.users` a propósito: si
-- alguna fila divergiera de verdad (no por case), copiar de auth la taparía
-- sin que nadie se entere. Acá el assert de abajo es el que decide.
update public.profiles
   set email = lower(btrim(email))
 where email is not null
   and email is distinct from lower(btrim(email));

-- ─────────────────────────────────────────────────────────────────────────
-- (b) EL ESPEJO: `auth.users.email` → `profiles.email`
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._trg_espejar_email_a_profiles()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- Normaliza en la puerta: si GoTrue algún día dejara pasar mayúsculas, el
  -- espejo no las propaga. La copia nunca vuelve a divergir por forma.
  update public.profiles
     set email = lower(btrim(new.email)),
         updated_at = now()
   where id = new.id
     and email is distinct from lower(btrim(new.email));
  return new;
end;
$$;

comment on function public._trg_espejar_email_a_profiles() is
  'S104-A · Propaga el cambio de correo de auth.users a la copia de profiles. '
  'Nace porque on_auth_user_created es AFTER INSERT y SOLO INSERT: sin este '
  'trigger, cambiar el correo dejaba la copia vieja para siempre y miPerfil la '
  'lee primero.';

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public._trg_espejar_email_a_profiles();

-- ─────────────────────────────────────────────────────────────────────────
-- (c) EL GUARD: `profiles.email` deja de ser escribible desde el cliente
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public._trg_profiles_protege_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  -- Molde D-389: los DEFINER y el motor pasan; el cliente con sesión, no.
  -- `authenticated` y `anon` son los roles con los que PostgREST ejecuta.
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
  'S104-A · profiles.email es ESPEJO de auth.users, no dato propio. Medido: '
  'authenticated tiene GRANT UPDATE sobre la columna y profiles_update no '
  'restringe columnas ⇒ sin este guard, cualquiera reescribe su correo por '
  'PostgREST directo y la app lo muestra como verdad.';

drop trigger if exists profiles_protege_email on public.profiles;
create trigger profiles_protege_email
  before update on public.profiles
  for each row
  execute function public._trg_profiles_protege_email();

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — sobre la definición VIVA, no sobre lo que creemos haber escrito
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_divergen int;
  v_case     int;
  v_trg_esp  int;
  v_trg_guard int;
begin
  -- ① el backfill hizo su trabajo: cero divergencia, de ninguna clase
  select count(*) into v_divergen
    from public.profiles p join auth.users u on u.id = p.id
   where p.email is distinct from u.email;
  select count(*) into v_case
    from public.profiles
   where email is distinct from lower(btrim(email));
  if v_divergen <> 0 or v_case <> 0 then
    raise exception 'CINTURON: divergencia post-backfill = % (sin normalizar = %)',
      v_divergen, v_case;
  end if;

  -- ② los dos triggers existen DE VERDAD (no basta que el CREATE no falle)
  select count(*) into v_trg_esp from pg_trigger
   where tgname = 'on_auth_user_email_changed' and not tgisinternal;
  select count(*) into v_trg_guard from pg_trigger
   where tgname = 'profiles_protege_email' and not tgisinternal;
  if v_trg_esp <> 1 or v_trg_guard <> 1 then
    raise exception 'CINTURON: espejo=% guard=% (se esperaba 1 y 1)',
      v_trg_esp, v_trg_guard;
  end if;

  raise notice 'CINTURON VERDE: divergencia=0, espejo y guard vivos.';
end $$;

commit;
