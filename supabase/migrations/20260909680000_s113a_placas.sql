-- ============================================================================
-- S113-A · LOTE 2.1 · A5 — LOTES DE PLACAS Y ACTIVACIÓN POR ESCANEO
--
-- Una chapita se fabrica ANTES de saber de qué animal va a ser. Se imprimen
-- cien con cien códigos, se venden, y cada familia activa la suya escaneando.
--
-- 🔴 **DOS TABLAS Y NO UN `mascota_id` NULLABLE EN `pasaporte`.** Aflojar esa
-- columna volvería expresable «un pasaporte de nadie», y con él se caen el
-- índice único de una-viva-por-mascota y todo lector que hoy asume que un
-- pasaporte tiene dueño. *Una placa fabricada y un pasaporte emitido son dos
-- cosas distintas: la primera es un objeto, el segundo es un vínculo.*
--
-- ⚠️ **AL ACTIVAR, EL PASAPORTE NACE CON EL TOKEN DE LA PLACA.** No se genera
-- uno nuevo: el código ya está GRABADO EN METAL y colgando de un collar.
-- *Cualquier diseño en el que el token cambie al activar convierte la chapita
-- en un adorno el mismo día que la familia la usa.*
--
-- ── EL TOKEN DE PLACA ES EL MISMO FORMATO ──────────────────────────────────
-- 128 bits en base64url (22 caracteres), como el del pasaporte, porque la
-- misma URL tiene que servir antes y después de activarse. La edge resuelve
-- primero `pasaporte` y después `pasaporte_placa`: un token sin activar
-- contesta «esta placa espera a su mascota», no un 404 — *un 404 le dice a
-- quien acaba de comprarla que le vendieron algo roto.*
--
-- 76(g): **NO RIGE.** Tablas nuevas, sin backfill.
-- ============================================================================

create table if not exists public.pasaporte_lote (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  cantidad   integer not null check (cantidad between 1 and 5000),
  proveedor  text,
  creado_en  timestamptz not null default now(),
  creado_por uuid references auth.users(id)
);

create table if not exists public.pasaporte_placa (
  token       text primary key,
  lote_id     uuid not null references public.pasaporte_lote(id) on delete restrict,
  serie       integer not null,
  activada_en timestamptz,
  mascota_id  uuid references public.mascotas(id) on delete set null,
  constraint chk_placa_token_forma check (token ~ '^[A-Za-z0-9_-]{22}$'),
  constraint chk_placa_activada_con_mascota
    check ((activada_en is null and mascota_id is null)
        or (activada_en is not null and mascota_id is not null)),
  constraint uq_placa_serie_por_lote unique (lote_id, serie)
);

comment on table public.pasaporte_placa is
  'Chapitas fabricadas. El token está grabado en metal ANTES de tener dueño: '
  'al activarse, el pasaporte nace con ESE token, nunca con uno nuevo.';

create index if not exists idx_placa_sin_activar on public.pasaporte_placa (lote_id) where activada_en is null;

alter table public.pasaporte_lote enable row level security;
alter table public.pasaporte_placa enable row level security;
revoke all on public.pasaporte_lote, public.pasaporte_placa from anon, authenticated;

-- ── CREAR UN LOTE ───────────────────────────────────────────────────────────
-- Es acto de operación, no de familia: sólo admin.
create or replace function public.crear_lote_placas(
  p_nombre text, p_cantidad integer, p_proveedor text default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_lote uuid; v_i int; v_tok text;
begin
  if not public.is_admin() then
    raise exception 'solo_admin' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad < 1 or p_cantidad > 5000 then
    raise exception 'cantidad_invalida' using errcode = '22023';
  end if;

  insert into pasaporte_lote (nombre, cantidad, proveedor, creado_por)
  values (p_nombre, p_cantidad, p_proveedor, auth.uid())
  returning id into v_lote;

  for v_i in 1..p_cantidad loop
    -- mismo generador que el pasaporte: `extensions.` calificado porque el
    -- search_path está fijo y `gen_random_bytes` no vive en `public`.
    loop
      v_tok := rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '=');
      exit when not exists (select 1 from pasaporte_placa where token = v_tok)
            and not exists (select 1 from pasaporte where token = v_tok);
    end loop;
    insert into pasaporte_placa (token, lote_id, serie) values (v_tok, v_lote, v_i);
  end loop;

  return jsonb_build_object('ok', true, 'lote_id', v_lote, 'cantidad', p_cantidad);
end $function$;

create or replace function public.listar_placas_de_lote(p_lote_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'solo_admin' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'serie', serie, 'token', token, 'activada', activada_en is not null)
         order by serie), '[]'::jsonb)
    into v from pasaporte_placa where lote_id = p_lote_id;
  return jsonb_build_object('ok', true, 'placas', v);
end $function$;

-- ── ACTIVAR UNA PLACA ───────────────────────────────────────────────────────
create or replace function public.activar_placa(p_token text, p_mascota_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid := auth.uid(); v_placa record; v_estado text; v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;

  select estado_vida into v_estado from mascotas where id = p_mascota_id;
  if v_estado is distinct from 'activa' then
    raise exception 'mascota_en_memorial' using errcode='22023';
  end if;

  select * into v_placa from pasaporte_placa where token = p_token for update;
  if v_placa is null then
    raise exception 'placa_no_existe' using errcode='22023';
  end if;
  if v_placa.activada_en is not null then
    -- No se dice DE QUIÉN es: quien tiene una placa ajena en la mano no tiene
    -- por qué enterarse de nada de esa familia.
    raise exception 'placa_ya_activada' using errcode='22023';
  end if;

  /* Una viva por mascota: si ya tenía pasaporte, se revoca en el mismo acto.
     La chapita anterior deja de resolver — que es lo correcto y lo que la
     familia está pidiendo al activar una nueva. */
  update pasaporte set revocado_en = now()
   where mascota_id = p_mascota_id and revocado_en is null;

  insert into pasaporte (mascota_id, token, emitido_por)
  values (p_mascota_id, p_token, v_uid)
  returning id into v_id;

  update pasaporte_placa
     set activada_en = now(), mascota_id = p_mascota_id
   where token = p_token;

  return jsonb_build_object('ok', true, 'pasaporte_id', v_id, 'token', p_token);
end $function$;

revoke all on function public.crear_lote_placas(text,integer,text) from public, anon;
revoke all on function public.listar_placas_de_lote(uuid) from public, anon;
revoke all on function public.activar_placa(text,uuid) from public, anon;
grant execute on function public.crear_lote_placas(text,integer,text) to authenticated;
grant execute on function public.listar_placas_de_lote(uuid) to authenticated;
grant execute on function public.activar_placa(text,uuid) to authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_sombra uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';
  v_lote uuid; v_tok text; v_r jsonb; v_rebotes int := 0; v_antes int;
begin
  -- El lote se crea como admin (rol de la conexión), antes de simular sesión.
  insert into pasaporte_lote (nombre, cantidad, proveedor) values ('cinturon', 3, 'prueba')
  returning id into v_lote;
  insert into pasaporte_placa (token, lote_id, serie) values
    ('AAAAAAAAAAAAAAAAAAAAAA', v_lote, 1),
    ('BBBBBBBBBBBBBBBBBBBBBB', v_lote, 2),
    ('CCCCCCCCCCCCCCCCCCCCCC', v_lote, 3);

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  -- ROJO 1 · un token que no existe
  begin perform public.activar_placa('ZZZZZZZZZZZZZZZZZZZZZZ', v_thor);
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 2 · memorial
  begin perform public.activar_placa('AAAAAAAAAAAAAAAAAAAAAA', v_sombra);
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 3 · mascota de otra familia
  begin perform public.activar_placa('AAAAAAAAAAAAAAAAAAAAAA',
    (select id from mascotas where familia_id <> (select familia_id from mascotas where id=v_thor) limit 1));
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 4 · crear lote sin ser admin
  begin perform public.crear_lote_placas('x', 1);
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  if v_rebotes <> 4 then raise exception 'CINTURON: se esperaban 4 rebotes y hubo %', v_rebotes; end if;

  -- VERDE · activar de verdad, y el pasaporte nace CON EL TOKEN DE LA PLACA
  select count(*) into v_antes from pasaporte where mascota_id = v_thor and revocado_en is null;
  v_r := public.activar_placa('AAAAAAAAAAAAAAAAAAAAAA', v_thor);
  if (v_r->>'token') <> 'AAAAAAAAAAAAAAAAAAAAAA' then
    raise exception 'CINTURON: el pasaporte no nació con el token de la placa';
  end if;
  if not exists (select 1 from pasaporte
                  where mascota_id = v_thor and token = 'AAAAAAAAAAAAAAAAAAAAAA'
                    and revocado_en is null) then
    raise exception 'CINTURON: no hay pasaporte vivo con el token de la placa';
  end if;
  -- y el anterior quedó revocado: UNA viva por mascota
  if (select count(*) from pasaporte where mascota_id = v_thor and revocado_en is null) <> 1 then
    raise exception 'CINTURON: quedó más de un pasaporte vivo para la misma mascota';
  end if;

  -- ROJO 5 · la misma placa, dos veces
  begin perform public.activar_placa('AAAAAAAAAAAAAAAAAAAAAA', v_thor);
    raise exception 'CINTURON: una placa ya activada se dejó activar de nuevo';
  exception when sqlstate '22023' then null; end;

  raise notice 'CINTURON OK · 4 rojos + la placa doble · el pasaporte hereda el token grabado';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
