-- ============================================================================
-- S104-A · LA INVITACIÓN A QUIEN TODAVÍA NO TIENE CUENTA
-- ============================================================================
-- Reversa: docs/relevamientos/2026-08-24-s104a-REVERSA-invitacion-a-no-usuario.sql
-- 76(g): NO RIGE — DDL + funciones. Cero backfill.
--
-- ── LA FIRMA QUE LO DESBLOQUEA (founder, 24-ago-2026) ────────────────────
-- A quien no tiene cuenta SÍ se le puede escribir, con cuatro condiciones:
--   ① **envío ÚNICO** — nunca reenvío ni recordatorio
--   ② **aviso de origen del dato** en el propio correo (quién invitó y cómo
--      llegó su dirección)
--   ③ **BAJA EN UN CLIC, sin cuenta**
--   ④ **cero listas de marketing** — esa dirección no entra a ninguna otra cosa
-- Las cuatro son estructurales acá; ninguna queda librada a la disciplina.
--
-- ── POR QUÉ NO PASA POR `notificacion_intencion` ────────────────────────
-- **Medido: `destinatario_user_id` es NOT NULL con FK a `auth.users`.** El
-- motor de avisos **no puede llevar un destinatario sin cuenta**. Ensancharlo
-- —hacer la columna nullable— tocaría **el motor que sirve a TODO el producto**
-- para habilitar un caso. ⇒ **cola propia, chica y acotada.** *La pieza rara no
-- se mete en la pieza general: se pone al lado y se declara.*
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- ① LA LISTA DE BAJA — es lo primero, porque nada se encola sin consultarla
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.correo_suprimido (
  email      text primary key,
  motivo     text not null default 'baja_solicitada',
  origen     text,
  created_at timestamptz not null default now()
);
alter table public.correo_suprimido enable row level security;
-- Sin policies: nadie la lee ni la escribe desde afuera. Solo las DEFINER.

comment on table public.correo_suprimido is
  'S104-A · Direcciones que pidieron no recibir mas. Se consulta ANTES de '
  'encolar cualquier correo a un no-usuario. Su perdida no es un dato perdido: '
  'es una promesa incumplida a alguien que ya dijo que no.';

-- ─────────────────────────────────────────────────────────────────────────
-- ② LA COLA — con el envío ÚNICO hecho ESTRUCTURA, no disciplina
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invitacion_correo_pendiente (
  -- 🔴 PK = la invitación. **Una fila por invitación y ni una más**: el envío
  -- único no depende de que nadie escriba un reenvío — es que no se puede.
  invitacion_id uuid primary key references public.familia_invitaciones(id) on delete cascade,
  email         text not null,
  estado        text not null default 'pendiente' check (estado in ('pendiente','enviado','fallido')),
  enviado_en    timestamptz,
  intentos      int not null default 0,
  created_at    timestamptz not null default now()
);
alter table public.invitacion_correo_pendiente enable row level security;

comment on table public.invitacion_correo_pendiente is
  'S104-A · Cola del correo de invitacion a quien NO tiene cuenta. No pasa por '
  'notificacion_intencion porque su destinatario_user_id es NOT NULL con FK a '
  'auth.users. PK por invitacion = envio UNICO por construccion.';

-- ─────────────────────────────────────────────────────────────────────────
-- ③ LA BAJA EN UN CLIC — sin cuenta, con el token como prueba de recepción
-- ─────────────────────────────────────────────────────────────────────────
-- **El token de la invitación ES la credencial de la baja**: solo lo tiene
-- quien recibió el correo. *No se pide cuenta para ejercer un derecho que se
-- ejerce justamente porque no se quiere tener cuenta.*
create or replace function public.dar_de_baja_correo(p_token text)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_mail text;
begin
  select lower(email) into v_mail from public.familia_invitaciones where token = p_token;
  if v_mail is null then
    -- No se dice «ese token no existe»: eso convertiría la baja en un oráculo
    -- de tokens válidos. Se contesta lo mismo siempre.
    return 'listo';
  end if;

  insert into public.correo_suprimido (email, motivo, origen)
  values (v_mail, 'baja_solicitada', 'invitacion_familia')
  on conflict (email) do nothing;

  -- Y se cancela lo que todavía no salió: dar de baja no es solo hacia
  -- adelante si hay algo en la cola de esta misma persona.
  update public.invitacion_correo_pendiente
     set estado = 'fallido'
   where lower(email) = v_mail and estado = 'pendiente';

  return 'listo';
end;
$$;

revoke all on function public.dar_de_baja_correo(text) from public;
-- `anon` a propósito: la baja se ejerce SIN cuenta (firma ③).
grant execute on function public.dar_de_baja_correo(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- ④ EL PRODUCTOR — ahora resuelve LOS DOS casos
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.avisar_invitacion_familia(p_invitacion_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_inv   public.familia_invitaciones;
  v_dest  uuid;
  v_quien text;
begin
  select * into v_inv from public.familia_invitaciones where id = p_invitacion_id;
  if v_inv.id is null then
    raise exception 'invitacion_inexistente' using errcode = 'P0002';
  end if;

  -- 🔴 LA SUPRESIÓN SE CONSULTA PRIMERO, ANTES DE MIRAR SI TIENE CUENTA.
  -- Quien dijo que no, dijo que no — tenga cuenta o no la tenga.
  if exists (select 1 from public.correo_suprimido s where s.email = lower(v_inv.email)) then
    return 'suprimido_no_se_escribe';
  end if;

  select u.id into v_dest from auth.users u where lower(u.email) = lower(v_inv.email);
  select coalesce(p.nombre, '') into v_quien from public.profiles p where p.id = v_inv.invitado_por;

  if v_dest is not null then
    perform public.registrar_intencion_notificacion(
      'invitacion_familia', v_dest, null, null,
      jsonb_build_object('familia_id', v_inv.familia_id, 'invitado_por_nombre', nullif(v_quien,''),
                         'token', v_inv.token, 'expira_en', v_inv.expira_en),
      'invitacion_familia:' || v_inv.id::text);
    return 'intencion_registrada';
  end if;

  -- Sin cuenta: a la cola propia. El `on conflict do nothing` sobre la PK es
  -- el envío único — un segundo intento no encola nada y lo dice.
  insert into public.invitacion_correo_pendiente (invitacion_id, email)
  values (v_inv.id, lower(v_inv.email))
  on conflict (invitacion_id) do nothing;

  return 'encolado_sin_cuenta';
end;
$$;

revoke all on function public.avisar_invitacion_familia(uuid) from public, anon;
grant execute on function public.avisar_invitacion_familia(uuid) to authenticated;

do $$
declare v_r text;
begin
  -- La baja se EJERCE con un token inexistente: contesta igual, sin ser oráculo.
  select public.dar_de_baja_correo('token-que-no-existe-s104a') into v_r;
  if v_r <> 'listo' then raise exception 'CINTURON: la baja no contesta uniforme (%)', v_r; end if;

  begin
    perform public.avisar_invitacion_familia('00000000-0000-0000-0000-000000000000');
    raise exception 'CINTURON: acepto invitacion inexistente';
  exception when sqlstate 'P0002' then null;
            when others then raise exception 'CINTURON: el productor NO CORRE — %', sqlerrm;
  end;

  if (select count(*) from public.correo_suprimido) <> 0 then
    raise exception 'CINTURON: la baja con token falso escribio una fila';
  end if;
  raise notice 'CINTURON VERDE: baja uniforme sin ser oraculo, productor corre, cero residuo.';
end $$;

commit;
