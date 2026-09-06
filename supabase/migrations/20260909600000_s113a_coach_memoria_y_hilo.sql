-- ============================================================================
-- S113-A · LOTE 2.0 · A3 y A4 — LA MEMORIA DE NEXO Y SU HILO
--
-- ── EL CENSO, antes de escribir ─────────────────────────────────────────────
-- ① `pg_proc` por nombre y por cuerpo (`coach`, `nexo`, `buscar`, `contexto`,
--    `tsvector`): 4 funciones, **ninguna de esto** (dos buscadores de cliente
--    para el mostrador, uno de refugios, y `obtener_contexto_arranque`, que es
--    del arranque de la app y no de una mascota).
-- ② `packages/api`: cero wrappers de coach.
-- ③ Cero tablas `%coach%` / `%nexo%` / `%conversac%`.
-- Frente virgen: no hay nada que ensanchar.
--
-- ── POR QUÉ DOS TABLAS Y NO UNA ─────────────────────────────────────────────
-- Son dos cosas con **vidas distintas**: la MEMORIA es del expediente y dura
-- lo que dure la mascota; el HILO es una charla y se borra a los 30 días.
-- *Meterlas juntas obligaría a que una de las dos viva mal: o la charla se
-- guarda para siempre, o la memoria se borra sola.*
--
-- 🔴 LA MEMORIA DECLARA DE DÓNDE VIENE, y no es decoración. `fuente` separa
-- lo que la familia **escribió** de lo que la familia **confirmó** cuando lo
-- propuso el modelo. *Sin esa marca, en un mes nadie puede distinguir un hecho
-- que alguien afirmó de uno que alguien sólo dejó pasar* — y el segundo no
-- tiene el mismo peso cuando Nexo lo usa para hablar de la salud de un animal.
-- Es la misma ley que `procedencia` en los eventos.
--
-- ⚠️ NADA DE ESTO ENTRA EN MEMORIAL. El Coach no existe ahí (LOYALTY §8), y
-- las puertas lo rebotan explícitamente en vez de dejarlo a la pantalla:
-- *un apagado que vive sólo en la UI se enciende solo el día que alguien
-- agrega una ruta nueva.*
--
-- 76(g) — VEDA: **NO RIGE.** Tablas nuevas, sin backfill, sin anclas.
-- ============================================================================

-- ── A3 · LA MEMORIA ─────────────────────────────────────────────────────────
create table if not exists public.coach_memoria (
  id          uuid primary key default gen_random_uuid(),
  mascota_id  uuid not null references public.mascotas(id) on delete cascade,
  hecho       text not null,
  fuente      text not null default 'familia'
              check (fuente in ('familia', 'confirmado_de_ia')),
  creado_por  uuid references auth.users(id),
  creado_en   timestamptz not null default now(),
  editado_en  timestamptz,
  activo      boolean not null default true,
  constraint chk_coach_memoria_hecho_no_vacio check (length(trim(hecho)) between 1 and 400)
);

comment on table public.coach_memoria is
  'Hechos sobre una mascota que la familia escribió o confirmó. `fuente` '
  'distingue lo afirmado de lo sólo aceptado: no es lo mismo cuando Nexo lo usa.';

create index if not exists idx_coach_memoria_mascota
  on public.coach_memoria (mascota_id) where activo;

alter table public.coach_memoria enable row level security;

-- ── A4 · EL HILO ────────────────────────────────────────────────────────────
create table if not exists public.coach_conversacion (
  id          uuid primary key default gen_random_uuid(),
  mascota_id  uuid not null references public.mascotas(id) on delete cascade,
  turno       integer not null,
  rol         text not null check (rol in ('familia', 'nexo')),
  texto       text not null,
  tokens      integer,
  creado_en   timestamptz not null default now(),
  constraint chk_coach_conv_texto_no_vacio check (length(trim(texto)) > 0)
);

comment on table public.coach_conversacion is
  'El hilo de una charla con Nexo, por mascota. Retención 30 días: el lector '
  'no devuelve lo viejo y `purgar_conversacion_coach()` lo borra.';

create index if not exists idx_coach_conv_mascota_turno
  on public.coach_conversacion (mascota_id, turno);
create index if not exists idx_coach_conv_creado
  on public.coach_conversacion (creado_en);

alter table public.coach_conversacion enable row level security;

/* Ninguna de las dos tablas se toca directo desde la app: todo pasa por las
   puertas DEFINER de abajo, que chequean familiar ADULTO y memorial. Sin
   policies, la RLS niega todo — que es exactamente lo que se quiere.
   L-216: un grant sin policy no alcanza nada, y acá no hay ni uno ni otra. */
revoke all on public.coach_memoria from anon, authenticated;
revoke all on public.coach_conversacion from anon, authenticated;

-- ── EL GUARD COMPARTIDO ─────────────────────────────────────────────────────
create or replace function public._coach_puerta(p_mascota_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_estado text;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;
  /* El apagado en memorial vive ACÁ y no en la pantalla: una ruta nueva que
     olvide preguntarlo se encuentra con la puerta cerrada igual. */
  select estado_vida into v_estado from mascotas where id = p_mascota_id;
  if v_estado is distinct from 'activa' then
    raise exception 'mascota_en_memorial' using errcode = '22023';
  end if;
end;
$function$;

revoke all on function public._coach_puerta(uuid) from public, anon, authenticated;

-- ── LAS PUERTAS DE LA MEMORIA ───────────────────────────────────────────────
create or replace function public.listar_memoria_coach(p_mascota_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v jsonb;
begin
  perform public._coach_puerta(p_mascota_id);
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'hecho', hecho, 'fuente', fuente, 'creado_en', creado_en
         ) order by creado_en), '[]'::jsonb)
    into v
    from coach_memoria where mascota_id = p_mascota_id and activo;
  return jsonb_build_object('ok', true, 'memoria', v);
end $function$;

create or replace function public.agregar_memoria_coach(
  p_mascota_id uuid, p_hecho text, p_fuente text default 'familia')
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
  if p_fuente not in ('familia', 'confirmado_de_ia') then
    raise exception 'fuente_invalida: %', p_fuente using errcode = '22023';
  end if;

  /* Un techo por mascota. No es una restricción técnica: **es el contrato con
     el modelo**. La memoria entera viaja en cada pregunta, así que sin techo
     el costo por conversación crece sin que nadie lo decida, y una lista de
     cien hechos deja de ser memoria y pasa a ser ruido. */
  select count(*) into v_n from coach_memoria where mascota_id = p_mascota_id and activo;
  if v_n >= 30 then
    raise exception 'memoria_llena' using errcode = '22023';
  end if;

  insert into coach_memoria (mascota_id, hecho, fuente, creado_por)
  values (p_mascota_id, trim(p_hecho), p_fuente, auth.uid())
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $function$;

create or replace function public.editar_memoria_coach(p_id uuid, p_hecho text)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_mascota uuid;
begin
  select mascota_id into v_mascota from coach_memoria where id = p_id and activo;
  if v_mascota is null then raise exception 'memoria_no_encontrada' using errcode = '22023'; end if;
  perform public._coach_puerta(v_mascota);
  if p_hecho is null or length(trim(p_hecho)) = 0 then
    raise exception 'hecho_requerido' using errcode = '22023';
  end if;
  /* Editar un hecho que propuso la IA lo vuelve de la familia: quien lo
     reescribió se hizo cargo de lo que dice. */
  update coach_memoria
     set hecho = trim(p_hecho), editado_en = now(), fuente = 'familia'
   where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id);
end $function$;

create or replace function public.borrar_memoria_coach(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_mascota uuid;
begin
  select mascota_id into v_mascota from coach_memoria where id = p_id and activo;
  if v_mascota is null then raise exception 'memoria_no_encontrada' using errcode = '22023'; end if;
  perform public._coach_puerta(v_mascota);
  -- `activo=false` y no DELETE: la familia puede querer entender después por
  -- qué Nexo decía algo, y un borrado duro deja esa pregunta sin respuesta.
  update coach_memoria set activo = false, editado_en = now() where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id);
end $function$;

-- ── LAS PUERTAS DEL HILO ────────────────────────────────────────────────────
create or replace function public.leer_hilo_coach(p_mascota_id uuid, p_limite integer default 40)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v jsonb;
begin
  perform public._coach_puerta(p_mascota_id);
  /* La retención es del LECTOR y no sólo del purgador: si el cron no corre,
     el hilo viejo igual no vuelve. *Una retención que depende de que un reloj
     ande es una promesa, no una regla.* */
  select coalesce(jsonb_agg(jsonb_build_object(
           'turno', turno, 'rol', rol, 'texto', texto, 'creado_en', creado_en
         ) order by turno), '[]'::jsonb)
    into v
    from (select * from coach_conversacion
           where mascota_id = p_mascota_id
             and creado_en > now() - interval '30 days'
           order by turno desc limit greatest(1, least(coalesce(p_limite,40), 200))) t;
  return jsonb_build_object('ok', true, 'hilo', v);
end $function$;

create or replace function public.guardar_turno_coach(
  p_mascota_id uuid, p_rol text, p_texto text, p_tokens integer default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_turno int;
begin
  perform public._coach_puerta(p_mascota_id);
  if p_rol not in ('familia', 'nexo') then
    raise exception 'rol_invalido: %', p_rol using errcode = '22023';
  end if;
  if p_texto is null or length(trim(p_texto)) = 0 then
    raise exception 'texto_requerido' using errcode = '22023';
  end if;
  select coalesce(max(turno), 0) + 1 into v_turno
    from coach_conversacion where mascota_id = p_mascota_id;
  insert into coach_conversacion (mascota_id, turno, rol, texto, tokens)
  values (p_mascota_id, v_turno, p_rol, trim(p_texto), p_tokens);
  return jsonb_build_object('ok', true, 'turno', v_turno);
end $function$;

create or replace function public.borrar_hilo_coach(p_mascota_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int;
begin
  perform public._coach_puerta(p_mascota_id);
  delete from coach_conversacion where mascota_id = p_mascota_id;
  get diagnostics v_n = row_count;
  -- Acá SÍ es DELETE: la familia pidió que la charla no exista más, y un
  -- `activo=false` sería decirle que sí y guardarla igual.
  return jsonb_build_object('ok', true, 'borrados', v_n);
end $function$;

create or replace function public.purgar_conversacion_coach()
returns integer language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int;
begin
  delete from coach_conversacion where creado_en < now() - interval '30 days';
  get diagnostics v_n = row_count;
  return v_n;
end $function$;

-- L-140 en las siete: ninguna nace alcanzable por anon ni PUBLIC.
do $$
declare f text;
begin
  foreach f in array array[
    'listar_memoria_coach(uuid)', 'agregar_memoria_coach(uuid,text,text)',
    'editar_memoria_coach(uuid,text)', 'borrar_memoria_coach(uuid)',
    'leer_hilo_coach(uuid,integer)', 'guardar_turno_coach(uuid,text,text,integer)',
    'borrar_hilo_coach(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  -- el purgador es del cron, no de nadie más
  execute 'revoke all on function public.purgar_conversacion_coach() from public, anon, authenticated';
end $$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor    uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_sombra  uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';  -- en memorial
  v_r jsonb; v_id uuid; v_rebotes int := 0;
begin
  -- ROJO 1 · sin sesión
  begin perform public.listar_memoria_coach(v_thor);
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  -- ROJO 2 · MEMORIAL: el Coach no existe ahí, y lo dice la puerta
  begin perform public.agregar_memoria_coach(v_sombra, 'algo');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 3 · leer el hilo de una mascota en memorial tampoco
  begin perform public.leer_hilo_coach(v_sombra);
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 4 · hecho vacío
  begin perform public.agregar_memoria_coach(v_thor, '   ');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 5 · fuente inventada
  begin perform public.agregar_memoria_coach(v_thor, 'x', 'me_lo_dijo_un_pajarito');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  -- ROJO 6 · rol inventado en el hilo
  begin perform public.guardar_turno_coach(v_thor, 'sistema', 'x');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  /* ROJO 7 · LA TABLA NO SE TOCA DIRECTO. Este brazo lo escribió el propio
     cinturón al fallar: un `select` directo desde `authenticated` rebotó con
     42501, y esa es exactamente la garantía que hay que probar. *Sin este
     brazo, un `grant` puesto por prolijidad en el futuro abriría las dos
     tablas y ningún test lo notaría.* */
  begin perform 1 from coach_memoria limit 1;
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  begin perform 1 from coach_conversacion limit 1;
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  if v_rebotes <> 8 then raise exception 'CINTURON: se esperaban 8 rebotes y hubo %', v_rebotes; end if;

  -- VERDE · el camino real de la memoria
  v_r := public.agregar_memoria_coach(v_thor, 'Le tiene miedo a los truenos.');
  v_id := (v_r->>'id')::uuid;
  if jsonb_array_length(public.listar_memoria_coach(v_thor)->'memoria') < 1 then
    raise exception 'CINTURON: la memoria no se lee';
  end if;

  -- editar un hecho de la IA lo vuelve de la familia
  perform public.borrar_memoria_coach(v_id);
  v_r := public.agregar_memoria_coach(v_thor, 'Parece que le molesta el ruido.', 'confirmado_de_ia');
  v_id := (v_r->>'id')::uuid;
  perform public.editar_memoria_coach(v_id, 'Le molesta el ruido fuerte.');
  /* Por la PUERTA y no por la tabla: es lo que la app va a ver, y además la
     tabla está cerrada a `authenticated` a propósito (rojo 7). */
  if not exists (
    select 1 from jsonb_array_elements(public.listar_memoria_coach(v_thor)->'memoria') m
     where (m->>'id')::uuid = v_id and m->>'fuente' = 'familia'
       and m->>'hecho' = 'Le molesta el ruido fuerte.') then
    raise exception 'CINTURON: editar no reasignó la fuente a la familia';
  end if;

  -- VERDE · el hilo numera sus turnos
  perform public.guardar_turno_coach(v_thor, 'familia', '¿Thor está al día?');
  perform public.guardar_turno_coach(v_thor, 'nexo', 'Le falta la antirrábica.', 120);
  if jsonb_array_length(public.leer_hilo_coach(v_thor)->'hilo') <> 2 then
    raise exception 'CINTURON: el hilo no devolvió los dos turnos';
  end if;
  if (public.leer_hilo_coach(v_thor)->'hilo'->1->>'turno')::int <> 2 then
    raise exception 'CINTURON: los turnos no se numeran';
  end if;
  if (public.borrar_hilo_coach(v_thor)->>'borrados')::int <> 2 then
    raise exception 'CINTURON: borrar el hilo no borró los dos';
  end if;

  raise notice 'CINTURON OK · 8 rojos · memoria y hilo por su camino real';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
