-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · FASE 3 — `estado_de_placa`: avisar ANTES de intentar
--
-- La app no puede leer `pasaporte_placa` —y eso está bien: *una tabla legible
-- es una tabla enumerable, y el token ES la autorización*—. La consecuencia era
-- de producto: la familia se enteraba de que su placa ya estaba activada
-- **después** de elegir la mascota. Esta RPC contesta antes.
--
-- ── LO QUE **NO** DICE, y es todo el diseño ────────────────────────────────
-- Devuelve `libre` o `activada`. **Nada más**: ni de quién, ni cuándo, ni qué
-- mascota. *Con la mascota, cualquiera con un token del suelo sabría a qué
-- animal pertenece antes de que su familia decida mostrarlo.*
--
-- 🔴 Y UN TOKEN INVENTADO DEVUELVE `libre`, NO UN ERROR. Es deliberado: si
-- contestara «no existe», sería un **oráculo de enumeración** —se probarían
-- tokens hasta encontrar los válidos, que es exactamente lo que la falta de
-- GRANT sobre la tabla evita—. *Un error honesto acá sería una filtración: la
-- respuesta que no distingue es la que protege.*
--
-- ── EL LÍMITE ES POR SESIÓN, NO POR TOKEN, y esa diferencia importa ────────
-- El del pasaporte cuenta por `pasaporte_id`; acá eso **no serviría**: una
-- placa libre no tiene pasaporte, así que quien prueba tokens inventados
-- —justo el que hay que frenar— nunca tocaría el contador.
-- *Un rate limit que no cuenta al atacante es decoración.* Quien enumera es
-- una SESIÓN, y por sesión se cuenta.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.placa_consulta (
  user_id uuid not null references auth.users(id) on delete cascade,
  minuto  timestamptz not null,
  n       integer not null default 1,
  primary key (user_id, minuto)
);

alter table public.placa_consulta enable row level security;
-- Sin policies: sólo la escribe la RPC, que es DEFINER. Nadie la lee.
revoke all on public.placa_consulta from anon, public, authenticated;

create or replace function public.estado_de_placa(p_token text)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid    uuid := auth.uid();
  v_minuto timestamptz := date_trunc('minute', now());
  v_n      integer;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;

  insert into placa_consulta (user_id, minuto) values (v_uid, v_minuto)
  on conflict (user_id, minuto) do update set n = placa_consulta.n + 1
  returning n into v_n;

  /* 30 por minuto: una familia escanea una placa, no treinta. El techo está
     lejos del uso real y cerca del abuso — *un límite que molesta al uso normal
     se termina subiendo hasta que deja de limitar.* */
  if v_n > 30 then
    raise exception 'limite' using errcode = '53400';
  end if;

  /* 🔴 `coalesce(..., 'libre')`: token inexistente y token libre dan LO MISMO.
     No es un descuido de la consulta: es la respuesta. */
  return coalesce(
    (select case when pp.mascota_id is null then 'libre' else 'activada' end
       from pasaporte_placa pp where pp.token = p_token),
    'libre');
end;
$$;

revoke all on function public.estado_de_placa(text) from public, anon;
grant execute on function public.estado_de_placa(text) to authenticated;

comment on function public.estado_de_placa(text) is
  'S113-A fase 3 · libre | activada, y NADA más. Un token inventado devuelve '
  '«libre» a propósito: decir «no existe» sería un oráculo de enumeración. '
  'Límite por SESIÓN (30/min), no por token: una placa libre no tiene '
  'pasaporte, así que contar por token no frenaría a quien inventa tokens.';
