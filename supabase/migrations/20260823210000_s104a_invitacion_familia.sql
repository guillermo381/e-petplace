-- ============================================================================
-- S104-A · TANDA 2 — LA INVITACIÓN DE FAMILIA
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-23-s104a-REVERSA-invitacion-familia.sql
-- 76(g): NO RIGE — DDL + funciones. Cero backfill, cero fila de datos tocada.
--
-- ── SE HEREDA EL MOLDE DE `empleado_invitaciones`, JAMÁS SU ALCANCE ───────
-- *Invitar a trabajar en un negocio no es invitar a ver el expediente de una
-- mascota.* Lo que se copia es la MECÁNICA (correo + token + expiración +
-- estado + lectura pública por token para quien todavía no tiene cuenta); lo
-- que NO se copia es a quién deja entrar ni a qué.
--
-- ⚠️ **Y el molde está incompleto, medido:** de las CINCO RPCs vivas que tocan
-- `empleado_invitaciones`, **ninguna CREA la invitación** — el INSERT vive en un
-- wrapper. Así que el acto de invitar **se construye de cero acá**, y nace por
-- RPC como manda la puerta única.
--
-- ── LO QUE DECIDE LA FIRMA 5.1 ────────────────────────────────────────────
-- El invitado entra como **`adulto_autorizado`**, jamás como co-dueño. No es
-- preferencia: **el motor lo exige.** `trg_codueño_es_titular` obliga a que un
-- co-dueño sea `adulto_titular` activo de la familia, y `trg_codueño_no_es_
-- familiar` + `trg_familiar_no_es_codueño` **prohíben ser las dos cosas desde
-- los dos lados**. ⇒ **ascender a co-dueño es una TRANSICIÓN (cerrar una fila,
-- abrir otra), no un alta** — y es v2.
--
-- ── EL DEFAULT DE PERMISOS, Y POR QUÉ NO SE ESCRIBE EN `permisos` ─────────
-- `MODELO_PRODUCTO` §4.3 promete permisos configurables (lectura filtrada,
-- autorizar en emergencia, agendar sí/no…). **Medido en S104: la columna
-- `permisos` existe en `mascota_familiar_autorizado` con default `'{}'`, sin
-- CHECK, y CERO funciones y CERO policies la leen.** ⇒ la tabla es **binaria**:
-- se entra o no se entra. **En v1 el permiso ES EL ESCALÓN**, y el default de
-- §4.3 se obtiene eligiendo `adulto_autorizado`, no escribiendo un jsonb que
-- nadie va a consultar. *Escribirlo sería fabricar la evidencia de una
-- configuración que el motor no honra.* **La configuración fina queda como
-- deuda declarada, con su disparo: el primer lector de `permisos`.**
--
-- ── MENORES: FUERA, Y NO POR ALCANCE ─────────────────────────────────────
-- `familia_miembro` **no tiene `fecha_nacimiento`** (§4.6 declaró el drift de
-- `permisos_jsonb` y no el de la fecha). El rol `menor` se puede escribir y
-- **nada puede verificar que la persona lo sea** ⇒ **P5 no se puede sostener** y
-- el rol queda rechazado en la puerta con error tipado, en vez de aceptado a
-- ciegas.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- ① LOS DUPLICADOS SE VUELVEN INEXPRESABLES (antes de que la RPC los pueda crear)
-- ─────────────────────────────────────────────────────────────────────────
-- Medido antes de crearlos: 0 duplicados activos en las tres tablas. *Aceptar
-- dos veces la misma invitación creaba dos vínculos y nada lo impedía.*
create unique index if not exists ux_familia_miembro_activo
  on public.familia_miembro (familia_id, user_id) where hasta is null;

create unique index if not exists ux_mascota_familiar_autorizado_activo
  on public.mascota_familiar_autorizado (mascota_id, user_id) where hasta is null;

-- ─────────────────────────────────────────────────────────────────────────
-- ② LA TABLA
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.familia_invitaciones (
  id            uuid primary key default gen_random_uuid(),
  familia_id    uuid not null references public.familia(id) on delete cascade,
  email         text not null,
  nombre        text,
  -- El escalón con el que entra. Hoy uno solo, y el CHECK lo dice: el día que
  -- entre otro, entra por decisión y no por descuido.
  rol_invitado  text not null default 'adulto_autorizado'
                check (rol_invitado = 'adulto_autorizado'),
  token         text not null unique,
  -- P13: la invitación expira; el dato clínico JAMÁS.
  expira_en     timestamptz not null default (now() + interval '30 days'),
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','aceptada','revocada','expirada')),
  invitado_por  uuid not null references auth.users(id),
  aceptada_por  uuid references auth.users(id),
  aceptada_en   timestamptz,
  created_at    timestamptz not null default now(),
  -- Un estado que miente es peor que uno que falta: aceptada ⟺ con quién y cuándo.
  constraint chk_familia_inv_aceptada_coherente check (
    (estado = 'aceptada' and aceptada_por is not null and aceptada_en is not null)
    or (estado <> 'aceptada' and aceptada_por is null and aceptada_en is null)
  )
);

create index if not exists familia_invitaciones_familia_idx on public.familia_invitaciones (familia_id);
create index if not exists familia_invitaciones_token_idx   on public.familia_invitaciones (token);
-- Una sola invitación viva por correo y familia (sin bloquear reinvitar tras revocar).
create unique index if not exists ux_familia_inv_pendiente
  on public.familia_invitaciones (familia_id, lower(email)) where estado = 'pendiente';

alter table public.familia_invitaciones enable row level security;

comment on table public.familia_invitaciones is
  'S104-A · Invitación a la familia. Molde de empleado_invitaciones, alcance propio: '
  'el invitado entra como adulto_autorizado (firma 5.1), jamas como co-dueño.';

-- ─────────────────────────────────────────────────────────────────────────
-- ③ RLS — la escritura es SOLO por RPC; acá vive la lectura
-- ─────────────────────────────────────────────────────────────────────────
-- El titular ve las invitaciones de SU familia.
create policy familia_inv_titular_ve on public.familia_invitaciones
  for select to authenticated
  using (exists (
    select 1 from public.familia_miembro fm
    where fm.familia_id = familia_invitaciones.familia_id
      and fm.user_id = auth.uid() and fm.rol = 'adulto_titular' and fm.hasta is null
  ));

-- 🔴 EL INVITADO TODAVÍA NO ES NADIE, y por eso esta policy existe: necesita
-- poder LEER la invitación (quién lo invitó, a qué familia) ANTES de aceptar y
-- a veces antes de tener cuenta. Es el mismo mecanismo de
-- `invitaciones_publica_por_token` del molde. **El token es la credencial**, y
-- por eso es de 32 bytes y va indexado: sin token no se alcanza NADA.
create policy familia_inv_publica_por_token on public.familia_invitaciones
  for select to anon, authenticated using (true);

-- Cero INSERT/UPDATE/DELETE por policy: la escritura entra por las RPCs.

-- ─────────────────────────────────────────────────────────────────────────
-- ④ INVITAR — solo el titular
-- ─────────────────────────────────────────────────────────────────────────
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

  -- SOLO EL TITULAR. No `user_gestiona_prestador` ni helpers de negocio: esto es
  -- la familia, y su gobierno es de P1.
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

  -- Ya es miembro activo ⇒ no se invita de nuevo. Rebota HABLADO en vez de
  -- crear una invitación que al aceptarse chocaría contra el índice único.
  if exists (
    select 1 from public.familia_miembro fm
    join auth.users u on u.id = fm.user_id
    where fm.familia_id = p_familia_id and fm.hasta is null and lower(u.email) = v_email
  ) then
    raise exception 'ya_es_miembro' using errcode = '23505';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  return query
  insert into public.familia_invitaciones (familia_id, email, nombre, token, invitado_por)
  values (p_familia_id, v_email, nullif(btrim(coalesce(p_nombre,'')),''), v_token, v_uid)
  returning familia_invitaciones.id, familia_invitaciones.token, familia_invitaciones.expira_en;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- ⑤ ACEPTAR — crea el vínculo con la familia Y con cada mascota
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.aceptar_invitacion_familia(p_token text)
returns table (familia_id uuid, mascotas_vinculadas int)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_mail text;
  v_inv  public.familia_invitaciones;
  v_n    int := 0;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;

  select lower(u.email) into v_mail from auth.users u where u.id = v_uid;

  select * into v_inv from public.familia_invitaciones
   where token = p_token for update;

  if v_inv.id is null then
    raise exception 'invitacion_inexistente' using errcode = 'P0002';
  end if;
  if v_inv.estado = 'aceptada' then
    raise exception 'invitacion_ya_aceptada' using errcode = '23505';
  end if;
  if v_inv.estado <> 'pendiente' then
    raise exception 'invitacion_no_vigente' using errcode = '22023';
  end if;
  -- Expiración PEREZOSA: el estado se corrige al tocarlo, sin cron (patrón del
  -- hold de S54 y del vencimiento de presupuesto de S69).
  if v_inv.expira_en <= now() then
    update public.familia_invitaciones set estado = 'expirada' where id = v_inv.id;
    raise exception 'invitacion_expirada' using errcode = '22023';
  end if;

  -- 🔴 EL CORREO ES LA LLAVE DE ESTA CASA, y por eso se exige que coincida.
  -- El token solo no alcanza: un enlace se reenvía, se filtra por WhatsApp o
  -- queda en un historial. *Que el invitado tenga el enlace prueba que le
  -- llegó, no que sea él.* Si esto resulta demasiado duro en campo, ablandarlo
  -- es UNA condición — pero se ablanda por decisión, no por omisión.
  if v_mail is distinct from lower(v_inv.email) then
    raise exception 'email_no_coincide' using errcode = '42501';
  end if;

  -- ① el vínculo con la FAMILIA (idempotente contra el índice único nuevo)
  insert into public.familia_miembro (familia_id, user_id, rol, motivo_alta, invitado_por_user_id)
  values (v_inv.familia_id, v_uid, 'adulto_autorizado', 'invitacion_familia', v_inv.invitado_por)
  on conflict do nothing;

  -- ② el vínculo con CADA mascota de la familia.
  --    NO se escribe `permisos`: la columna existe y NADIE la lee (medido) —
  --    escribirla fabricaría la evidencia de una configuración que el motor no
  --    honra. En v1 el permiso ES el escalón.
  insert into public.mascota_familiar_autorizado
    (mascota_id, user_id, familia_id, tipo_autorizado, motivo_alta, agregado_por_user_id)
  select m.id, v_uid, v_inv.familia_id, 'adulto_autorizado', 'invitacion_familia', v_inv.invitado_por
    from public.mascotas m
   where m.familia_id = v_inv.familia_id
  on conflict do nothing;
  get diagnostics v_n = row_count;

  update public.familia_invitaciones
     set estado = 'aceptada', aceptada_por = v_uid, aceptada_en = now()
   where id = v_inv.id;

  return query select v_inv.familia_id, v_n;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- ⑥ REVOCAR — solo el titular, y solo lo que todavía no se aceptó
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.revocar_invitacion_familia(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_uid uuid := auth.uid(); v_fam uuid; v_estado text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  select familia_id, estado into v_fam, v_estado
    from public.familia_invitaciones where id = p_id;
  if v_fam is null then
    raise exception 'invitacion_inexistente' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.familia_miembro fm
    where fm.familia_id = v_fam and fm.user_id = v_uid
      and fm.rol = 'adulto_titular' and fm.hasta is null
  ) then
    raise exception 'solo_titular_revoca' using errcode = '42501';
  end if;
  -- Una invitación aceptada NO se revoca: ya hay una persona adentro, y sacarla
  -- es un acto de gobierno (dar de baja el vínculo), no deshacer un enlace.
  if v_estado = 'aceptada' then
    raise exception 'invitacion_ya_aceptada' using errcode = '23505';
  end if;
  update public.familia_invitaciones set estado = 'revocada' where id = p_id;
end;
$$;

revoke all on function public.invitar_a_familia(uuid, text, text) from public, anon;
revoke all on function public.aceptar_invitacion_familia(text)     from public, anon;
revoke all on function public.revocar_invitacion_familia(uuid)     from public, anon;
grant execute on function public.invitar_a_familia(uuid, text, text) to authenticated;
grant execute on function public.aceptar_invitacion_familia(text)     to authenticated;
grant execute on function public.revocar_invitacion_familia(uuid)     to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — SIN `SET LOCAL ROLE` (L-411: rompe el registro de la migración).
-- La prueba funcional con roles se corre APARTE, después del apply.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare v_n int;
begin
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in
     ('invitar_a_familia','aceptar_invitacion_familia','revocar_invitacion_familia');
  if v_n <> 3 then raise exception 'CINTURON: se esperaban 3 RPCs, hay %', v_n; end if;

  -- L-140: ninguna nace alcanzable por anon.
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname in
       ('invitar_a_familia','aceptar_invitacion_familia','revocar_invitacion_familia')
       and has_function_privilege('anon', p.oid, 'EXECUTE')
  ) then raise exception 'CINTURON: alguna RPC quedo alcanzable por anon'; end if;

  select count(*) into v_n from pg_indexes
   where schemaname='public' and indexname in
     ('ux_familia_miembro_activo','ux_mascota_familiar_autorizado_activo','ux_familia_inv_pendiente');
  if v_n <> 3 then raise exception 'CINTURON: faltan indices unicos (hay %)', v_n; end if;

  raise notice 'CINTURON VERDE: 3 RPCs, cero anon, 3 indices unicos.';
end $$;

commit;
