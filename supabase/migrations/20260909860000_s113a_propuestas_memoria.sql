-- ============================================================================
-- S113-A · «confirmado_de_ia» DEJA DE SER UNA PALABRA QUE CUALQUIERA PUEDE DECIR
--
-- 🔴 EL DEFECTO (E · `pista/s113-e-2.0 @ 3048343e`): `agregar_memoria_coach`
-- aceptaba `p_fuente = 'confirmado_de_ia'` **desde el cliente**. El CHECK sólo
-- verificaba que la palabra estuviera en la lista, así que la procedencia era
-- **una afirmación de quien llama**, no un hecho del sistema: cualquiera podía
-- escribir un hecho y decir que lo había propuesto la IA y la familia
-- confirmado.
--
-- *Un vocabulario cerrado que sólo vive en un parámetro no cierra nada: dice
-- qué palabras son válidas, no quién puede decirlas.* Es la misma clase que el
-- veredicto de autenticación que vivía en un campo de log (`L-402`).
--
-- ── LA CURA VUELVE EL ESTADO INEXPRESABLE, no lo vigila ─────────────────────
-- ① Las propuestas de Nexo nacen en **su propia tabla**, escrita por la edge
--    con `service_role`. Un cliente **no puede insertar ahí**: no es que se le
--    rechace el valor — es que no tiene la puerta.
-- ② `confirmar_propuesta_memoria(id)` copia el hecho a `coach_memoria` y
--    **pone `'confirmado_de_ia'` ella misma**. El valor deja de viajar.
-- ③ `agregar_memoria_coach` **pierde el parámetro**. No queda un valor que
--    rechazar: queda un parámetro que no existe.
--
-- ⚠️ Medido antes de tocar: **cero filas con `confirmado_de_ia`** en
-- `coach_memoria`. El agujero estaba abierto y **nunca se ejerció** — la cura
-- no repara nada, cierra algo. *Un daño de cero no vuelve opcional la cura:
-- vuelve barato hacerla ahora.*
--
-- 76(g): **NO RIGE.** Tabla nueva + reemplazo de firma, sin backfill.
-- ============================================================================

create table if not exists public.propuestas_memoria (
  id          uuid primary key default gen_random_uuid(),
  mascota_id  uuid not null references public.mascotas(id) on delete cascade,
  hecho       text not null,
  /** La clase que el modelo propuso. Se guarda para poder medir después si
   *  clasificaba bien — sin esto, la exactitud del router no es auditable. */
  clase       text,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente','confirmada','rechazada')),
  /** El turno del hilo donde nació, para poder volver a la conversación. */
  turno_id    uuid,
  creada_en   timestamptz not null default now(),
  resuelta_en timestamptz,
  resuelta_por uuid references auth.users(id),
  constraint chk_propuesta_hecho check (length(trim(hecho)) between 1 and 400),
  constraint chk_propuesta_resuelta check (
    (estado = 'pendiente' and resuelta_en is null and resuelta_por is null)
    or (estado <> 'pendiente' and resuelta_en is not null))
);

comment on table public.propuestas_memoria is
  'Lo que Nexo PROPONE recordar. Nace por service_role (la edge); se vuelve '
  'memoria sólo cuando la familia confirma, y ahí la RPC pone la fuente.';

create index if not exists idx_propuestas_pendientes
  on public.propuestas_memoria (mascota_id) where estado = 'pendiente';

alter table public.propuestas_memoria enable row level security;
/* Nadie escribe desde el cliente. **No hay policy de INSERT y no hay grant**:
   la única forma de crear una propuesta es `service_role`, que salta la RLS.
   *La imposibilidad no está en un guard: está en la ausencia de camino.* */
revoke all on public.propuestas_memoria from anon, authenticated;

-- ── LA PUERTA DE LA EDGE (service_role) ─────────────────────────────────────
create or replace function public.proponer_memoria_coach(
  p_mascota_id uuid, p_hecho text, p_clase text default null, p_turno_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_id uuid; v_n int;
begin
  /* Sólo el sistema propone. Con una sesión de usuario esto rebota: si un
     cliente pudiera proponer y después confirmar, habría reinventado el
     agujero por dos pasos en vez de uno. */
  if current_user in ('authenticated', 'anon') then
    raise exception 'solo_sistema' using errcode = '42501';
  end if;
  if p_hecho is null or length(trim(p_hecho)) = 0 then
    raise exception 'hecho_requerido' using errcode = '22023';
  end if;
  if not exists (select 1 from mascotas where id = p_mascota_id and estado_vida = 'activa') then
    raise exception 'mascota_no_disponible' using errcode = '22023';
  end if;

  -- techo de pendientes: una lista de propuestas sin resolver deja de ser una
  -- propuesta y pasa a ser una bandeja.
  select count(*) into v_n from propuestas_memoria
   where mascota_id = p_mascota_id and estado = 'pendiente';
  if v_n >= 10 then raise exception 'demasiadas_pendientes' using errcode = '22023'; end if;

  insert into propuestas_memoria (mascota_id, hecho, clase, turno_id)
  values (p_mascota_id, trim(p_hecho), p_clase, p_turno_id)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $function$;

-- ── LAS PUERTAS DE LA FAMILIA ───────────────────────────────────────────────
create or replace function public.listar_propuestas_memoria(p_mascota_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v jsonb;
begin
  perform public._coach_puerta(p_mascota_id);
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'hecho', hecho, 'clase', clase, 'creada_en', creada_en)
         order by creada_en), '[]'::jsonb)
    into v from propuestas_memoria
   where mascota_id = p_mascota_id and estado = 'pendiente';
  return jsonb_build_object('ok', true, 'propuestas', v);
end $function$;

create or replace function public.confirmar_propuesta_memoria(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_p record; v_id uuid; v_n int;
begin
  select * into v_p from propuestas_memoria where id = p_id for update;
  if v_p is null or v_p.estado <> 'pendiente' then
    -- no se distingue «no existe» de «ya resuelta»: quien prueba ids no
    -- debería enterarse de cuáles fueron reales.
    raise exception 'propuesta_no_encontrada' using errcode = '22023';
  end if;
  -- la puerta compartida: familiar ADULTO de ESA mascota, y no en memorial
  perform public._coach_puerta(v_p.mascota_id);

  select count(*) into v_n from coach_memoria where mascota_id = v_p.mascota_id and activo;
  if v_n >= 30 then raise exception 'memoria_llena' using errcode = '22023'; end if;

  /* 🔴 ACÁ, Y SÓLO ACÁ, NACE `'confirmado_de_ia'`. No llega en un parámetro:
     lo escribe la función que sabe que hubo una propuesta y que alguien de la
     familia la aceptó. *La procedencia deja de ser lo que alguien dice y pasa
     a ser lo que ocurrió.* */
  insert into coach_memoria (mascota_id, hecho, fuente, creado_por)
  values (v_p.mascota_id, v_p.hecho, 'confirmado_de_ia', auth.uid())
  returning id into v_id;

  update propuestas_memoria
     set estado = 'confirmada', resuelta_en = now(), resuelta_por = auth.uid()
   where id = p_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'memoria_id', v_id);
end $function$;

create or replace function public.rechazar_propuesta_memoria(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_p record;
begin
  select * into v_p from propuestas_memoria where id = p_id for update;
  if v_p is null or v_p.estado <> 'pendiente' then
    raise exception 'propuesta_no_encontrada' using errcode = '22023';
  end if;
  perform public._coach_puerta(v_p.mascota_id);
  /* Se marca, no se borra: saber qué propuso el modelo y la familia NO quiso
     es la única forma de medir si clasifica bien. */
  update propuestas_memoria
     set estado = 'rechazada', resuelta_en = now(), resuelta_por = auth.uid()
   where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id);
end $function$;

-- ── ③ EL PARÁMETRO DEJA DE EXISTIR ──────────────────────────────────────────
/* Se DROPEA la de tres argumentos en vez de convivir: dos versiones llamables
   con dos argumentos son ambiguas (`is not unique`) — la clase que esta sesión
   ya se cobró tres veces. */
drop function if exists public.agregar_memoria_coach(uuid, text, text);

create or replace function public.agregar_memoria_coach(p_mascota_id uuid, p_hecho text)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_id uuid; v_n int;
begin
  perform public._coach_puerta(p_mascota_id);
  if p_hecho is null or length(trim(p_hecho)) = 0 then
    raise exception 'hecho_requerido' using errcode = '22023';
  end if;
  if length(trim(p_hecho)) > 400 then
    raise exception 'hecho_muy_largo' using errcode = '22023';
  end if;
  select count(*) into v_n from coach_memoria where mascota_id = p_mascota_id and activo;
  if v_n >= 30 then raise exception 'memoria_llena' using errcode = '22023'; end if;

  /* `'familia'` es lo único que esta puerta puede escribir, y no porque lo
     valide: porque no recibe de dónde viene. Lo que la IA propuso entra por
     `confirmar_propuesta_memoria`, que es otra puerta y otro acto. */
  insert into coach_memoria (mascota_id, hecho, fuente, creado_por)
  values (p_mascota_id, trim(p_hecho), 'familia', auth.uid())
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $function$;

revoke all on function public.proponer_memoria_coach(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.proponer_memoria_coach(uuid,text,text,uuid) to service_role;
do $$
declare f text;
begin
  foreach f in array array[
    'agregar_memoria_coach(uuid,text)', 'listar_propuestas_memoria(uuid)',
    'confirmar_propuesta_memoria(uuid)', 'rechazar_propuesta_memoria(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_ajena uuid; v_prop uuid; v_prop_ajena uuid; v_r jsonb;
  v_rebotes int := 0; v_fuente text;
begin
  select id into v_ajena from mascotas
   where familia_id <> (select familia_id from mascotas where id = v_thor)
     and estado_vida = 'activa' limit 1;

  -- las propuestas nacen como SISTEMA (rol de la conexión), antes de simular
  v_prop := (public.proponer_memoria_coach(v_thor, 'Le teme a los truenos', 'rasgo'))->>'id';
  if v_ajena is not null then
    v_prop_ajena := (public.proponer_memoria_coach(v_ajena, 'Algo de otra familia', 'rasgo'))->>'id';
  end if;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  /* 🔴 ROJO 1 · `confirmado_de_ia` desde un cliente: **el parámetro no existe**.
     No se prueba que lo rechace — se prueba que la firma con tres argumentos
     ya no está, que es más fuerte. */
  if to_regprocedure('public.agregar_memoria_coach(uuid,text,text)') is not null then
    raise exception 'CINTURON: la firma con p_fuente sigue viva — el valor se puede pasar';
  end if;
  v_rebotes := v_rebotes + 1;

  -- ROJO 2 · un cliente NO puede proponer
  begin perform public.proponer_memoria_coach(v_thor, 'me lo propuse yo', 'rasgo');
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  -- ROJO 3 · confirmar una propuesta inexistente
  begin perform public.confirmar_propuesta_memoria('00000000-0000-0000-0000-000000000000');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;

  -- ROJO 4 · confirmar la de OTRA familia
  if v_prop_ajena is not null then
    begin perform public.confirmar_propuesta_memoria(v_prop_ajena);
    exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  else
    raise exception 'CINTURON: no hay mascota de otra familia — el rojo no se puede ejercer';
  end if;

  if v_rebotes <> 4 then raise exception 'CINTURON: se esperaban 4 rebotes y hubo %', v_rebotes; end if;

  /* VERDE · la familia confirma, y la fuente la pone la RPC.
     Se verifica **por la puerta** y no leyendo la tabla: las dos están cerradas
     a `authenticated` a propósito, y además esto es lo que la app va a ver. */
  v_r := public.confirmar_propuesta_memoria(v_prop);
  select m->>'fuente' into v_fuente
    from jsonb_array_elements(public.listar_memoria_coach(v_thor)->'memoria') m
   where (m->>'id')::uuid = (v_r->>'id')::uuid;
  if v_fuente is distinct from 'confirmado_de_ia' then
    raise exception 'CINTURON: la memoria confirmada quedó con fuente %', coalesce(v_fuente,'(no está)');
  end if;
  -- y sale de las pendientes
  if exists (select 1 from jsonb_array_elements(public.listar_propuestas_memoria(v_thor)->'propuestas') x
              where (x->>'id')::uuid = v_prop) then
    raise exception 'CINTURON: la propuesta confirmada sigue apareciendo como pendiente';
  end if;

  -- y confirmarla dos veces rebota
  begin perform public.confirmar_propuesta_memoria(v_prop);
    raise exception 'CINTURON: se confirmó dos veces la misma propuesta';
  exception when sqlstate '22023' then null; end;

  -- lo que escribe la familia sigue siendo 'familia'
  v_r := public.agregar_memoria_coach(v_thor, 'Es glotón');
  select m->>'fuente' into v_fuente
    from jsonb_array_elements(public.listar_memoria_coach(v_thor)->'memoria') m
   where (m->>'id')::uuid = (v_r->>'id')::uuid;
  if v_fuente is distinct from 'familia' then
    raise exception 'CINTURON: la puerta de familia escribió % en vez de `familia`', coalesce(v_fuente,'(nada)');
  end if;

  raise notice 'CINTURON OK · 4 rojos · la fuente la pone la RPC · doble confirmación rebota';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
