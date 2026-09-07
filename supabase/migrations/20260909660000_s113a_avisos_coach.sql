-- ============================================================================
-- S113-A · LOTE 2.1 · A6 — EL DISPARO DETERMINÍSTICO
--
-- Nexo deja de esperar a que le pregunten. Tres avisos, y **ninguno los decide
-- un modelo**: salen de fechas que el expediente ya tiene.
--   · `vacuna_vence`          — el plan vacunal dice vencida o por vencer
--   · `antiparasitario_vence` — `fecha_proxima` de la última desparasitación
--   · `cita_manana`           — una cita firme para mañana
--
-- 🔴 **DETERMINÍSTICO Y NO GENERATIVO, y esa es la decisión.** Un aviso que
-- sale de un modelo puede equivocarse de fecha y nadie lo notaría hasta que
-- una familia llegue tarde a una vacuna. *Lo que se puede calcular no se
-- pregunta.* El modelo redacta la charla; los avisos los produce una consulta.
--
-- ── OPT-IN, y por qué NO en `user_notificacion_prefs` ───────────────────────
-- Esa tabla existe y sería la casa obvia, pero su contrato firmado (S55 · B4)
-- es **«fila ausente = habilitada»**, y acá hace falta lo contrario. Meter una
-- categoría cuya ausencia significa lo opuesto que las demás convierte esa
-- tabla en un campo minado: el próximo que lea «no hay fila» va a acertar o
-- errar según de qué categoría hable. *Un contrato que vale para unas filas y
-- no para otras deja de ser un contrato.*
-- ⇒ `familia.avisos_nexo_desde`: NULL es «nunca lo pidió», y de paso guarda
-- CUÁNDO dijo que sí — así no se avisa de cosas anteriores a su decisión.
--
-- ── UNO POR TIPO POR DÍA (LOYALTY §8) ───────────────────────────────────────
-- No es un `if` en el generador: es un **UNIQUE**. *Un tope que vive en el
-- código se salta el día que alguien llama al generador dos veces; uno que
-- vive en un índice no se puede saltar.*
--
-- ⚠️ **Nunca en memorial.** El generador filtra `estado_vida = 'activa'`, y
-- ése es el único lugar donde puede vivir: un aviso de vacuna para un animal
-- que murió no es un error de pantalla, es una crueldad.
--
-- 76(g): **NO RIGE.** Tabla nueva + columna aditiva, sin backfill.
-- ============================================================================

alter table public.familia
  add column if not exists avisos_nexo_desde timestamptz;

comment on column public.familia.avisos_nexo_desde is
  'Cuándo la familia encendió los avisos de Nexo. NULL = nunca los pidió. '
  'Opt-in explícito: la ausencia no habilita nada.';

create table if not exists public.avisos_coach (
  id          uuid primary key default gen_random_uuid(),
  mascota_id  uuid not null references public.mascotas(id) on delete cascade,
  tipo        text not null check (tipo in ('vacuna_vence','antiparasitario_vence','cita_manana')),
  fecha       date not null default (public.hoy_local()),
  detalle     jsonb not null default '{}'::jsonb,
  leido_en    timestamptz,
  creado_en   timestamptz not null default now()
);

-- El tope de LOYALTY §8, hecho inexpresable.
create unique index if not exists uq_avisos_coach_uno_por_tipo_por_dia
  on public.avisos_coach (mascota_id, tipo, fecha);

create index if not exists idx_avisos_coach_sin_leer
  on public.avisos_coach (mascota_id) where leido_en is null;

alter table public.avisos_coach enable row level security;
revoke all on public.avisos_coach from anon, authenticated;

-- ── EL OPT-IN ───────────────────────────────────────────────────────────────
create or replace function public.activar_avisos_nexo(p_familia_id uuid, p_activar boolean default true)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not exists (select 1 from familia_miembro fm
                  where fm.familia_id = p_familia_id and fm.user_id = v_uid
                    and fm.hasta is null and fm.rol in ('adulto_titular','adulto_autorizado')) then
    raise exception 'no_access_to_familia' using errcode='42501';
  end if;
  update familia set avisos_nexo_desde = case when p_activar then now() else null end
   where id = p_familia_id;
  return jsonb_build_object('ok', true, 'activos', p_activar);
end $function$;

-- ── EL GENERADOR ────────────────────────────────────────────────────────────
create or replace function public.generar_avisos_coach()
returns integer language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int := 0; v_hoy date := public.hoy_local(); v_i int; v_f record;
begin
  /* `on conflict do nothing` en los tres: el UNIQUE es la regla y esto sólo
     evita que una segunda corrida del día explote. */

  /* ① VACUNA — y acá hay una decisión que costó un rojo.
     `obtener_plan_vacunal` **exige sesión** (`auth_required`), y este job
     corre por cron sin ninguna. Las salidas eran tres y dos son malas:
     re-implementar su cálculo acá lo duplica (periodicidad, derivadas,
     estados: la próxima corrección se haría en un solo lado), y aflojarle el
     gate a una función viva de otra pista cambia su contrato para todos.
     ⇒ El job **calcula desde el punto de vista del TITULAR de cada familia**,
     familia por familia. No es un rodeo: el aviso ES para esa familia, y su
     plan vacunal es exactamente lo que el titular ve. La simulación se hace
     explícita y **se deshace al final**, para no dejar la transacción
     hablando con la identidad de nadie. */
  for v_f in
    select f.id as familia_id,
           (select fm.user_id from familia_miembro fm
             where fm.familia_id = f.id and fm.rol = 'adulto_titular' and fm.hasta is null
             limit 1) as titular
      from familia f
     where f.avisos_nexo_desde is not null
  loop
    continue when v_f.titular is null;   -- familia sin titular: no se inventa uno

    perform set_config('request.jwt.claim.sub', v_f.titular::text, true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_f.titular, 'role', 'authenticated')::text, true);

    insert into avisos_coach (mascota_id, tipo, fecha, detalle)
    select m.id, 'vacuna_vence', v_hoy,
           jsonb_build_object('vacuna', pv.nombre, 'estado', pv.estado, 'proxima', pv.proxima)
      from mascotas m
      cross join lateral public.obtener_plan_vacunal(m.id, v_hoy, 30) pv
     where m.familia_id = v_f.familia_id
       and m.estado_vida = 'activa'
       and pv.estado in ('vencida','por_vencer')
       and pv.obligatoria
     order by m.id, case pv.estado when 'vencida' then 0 else 1 end, pv.proxima
     on conflict (mascota_id, tipo, fecha) do nothing;
    get diagnostics v_i = row_count; v_n := v_n + v_i;
  end loop;

  -- La identidad simulada se deshace acá: lo que sigue es del sistema.
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- ② ANTIPARASITARIO
  insert into avisos_coach (mascota_id, tipo, fecha, detalle)
  select d.mascota_id, 'antiparasitario_vence', v_hoy,
         jsonb_build_object('producto', d.producto, 'proxima', d.fecha_proxima)
    from (select distinct on (e.mascota_id) e.mascota_id, e.producto, e.fecha_proxima
            from evento_desparasitacion_aplicada e
           where e.fecha_proxima is not null
           order by e.mascota_id, e.fecha_aplicada desc nulls last) d
    join mascotas m on m.id = d.mascota_id
    join familia f on f.id = m.familia_id
   where f.avisos_nexo_desde is not null
     and m.estado_vida = 'activa'
     and d.fecha_proxima <= v_hoy + 7
   on conflict (mascota_id, tipo, fecha) do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  -- ③ CITA DE MAÑANA. Sólo la firme: una `pendiente` todavía puede caerse, y
  -- avisar de algo que no va a pasar enseña a ignorar los avisos.
  insert into avisos_coach (mascota_id, tipo, fecha, detalle)
  select c.mascota_id, 'cita_manana', v_hoy,
         jsonb_build_object('hora', c.hora, 'servicio', coalesce(ts.nombre, c.tipo_servicio))
    from evento_cita_servicio c
    join mascotas m on m.id = c.mascota_id
    join familia f on f.id = m.familia_id
    left join tipos_servicio ts on ts.codigo = c.tipo_servicio
   where f.avisos_nexo_desde is not null
     and m.estado_vida = 'activa'
     and c.fecha = v_hoy + 1
     and c.estado = 'confirmada'
   on conflict (mascota_id, tipo, fecha) do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  return v_n;
end $function$;

-- ── LOS LECTORES ────────────────────────────────────────────────────────────
create or replace function public.obtener_avisos_coach()
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'mascota_id', a.mascota_id, 'mascota', m.nombre,
           'tipo', a.tipo, 'fecha', a.fecha, 'detalle', a.detalle)
         order by a.creado_en desc), '[]'::jsonb)
    into v
    from avisos_coach a
    join mascotas m on m.id = a.mascota_id
   where a.leido_en is null
     and m.estado_vida = 'activa'
     and m.familia_id in (select fm.familia_id from familia_miembro fm
                           where fm.user_id = v_uid and fm.hasta is null)
     -- el lector también corta por 7 días: un aviso viejo que nadie leyó dejó
     -- de ser un aviso y pasó a ser ruido acumulado.
     and a.fecha > public.hoy_local() - 7;
  return jsonb_build_object('ok', true, 'avisos', v);
end $function$;

create or replace function public.marcar_aviso_coach_leido(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid := auth.uid(); v_n int;
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  update avisos_coach a set leido_en = now()
   where a.id = p_id and a.leido_en is null
     and exists (select 1 from mascotas m
                  join familia_miembro fm on fm.familia_id = m.familia_id
                 where m.id = a.mascota_id and fm.user_id = v_uid and fm.hasta is null);
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'aviso_no_encontrado' using errcode='22023'; end if;
  return jsonb_build_object('ok', true, 'id', p_id);
end $function$;

-- L-140
revoke all on function public.generar_avisos_coach() from public, anon, authenticated;
revoke all on function public.activar_avisos_nexo(uuid, boolean) from public, anon;
revoke all on function public.obtener_avisos_coach() from public, anon;
revoke all on function public.marcar_aviso_coach_leido(uuid) from public, anon;
grant execute on function public.activar_avisos_nexo(uuid, boolean) to authenticated;
grant execute on function public.obtener_avisos_coach() to authenticated;
grant execute on function public.marcar_aviso_coach_leido(uuid) to authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor    uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_fam     uuid;
  v_n1 int; v_n2 int; v_apagado int; v_rebotes int := 0; v_r jsonb;
begin
  select familia_id into v_fam from mascotas where id = v_thor;

  /* 🔴 EL ROJO QUE MÁS IMPORTA · SIN OPT-IN NO SE GENERA NADA. Se corre el
     generador con la familia apagada y tiene que dar CERO para esa familia.
     *Sin este brazo, «opt-in» sería una palabra en un comentario.* */
  update familia set avisos_nexo_desde = null where id = v_fam;
  perform public.generar_avisos_coach();
  select count(*) into v_apagado from avisos_coach a
    join mascotas m on m.id = a.mascota_id where m.familia_id = v_fam;
  if v_apagado <> 0 then
    raise exception 'CINTURON: con el opt-in APAGADO se generaron % avisos', v_apagado;
  end if;

  -- VERDE · encendido, sí genera (Thor tiene vacunas vencidas: lo medimos antes)
  update familia set avisos_nexo_desde = now() where id = v_fam;
  v_n1 := public.generar_avisos_coach();
  select count(*) into v_n1 from avisos_coach a
    join mascotas m on m.id = a.mascota_id where m.familia_id = v_fam;
  if v_n1 = 0 then
    raise exception 'CINTURON: con el opt-in encendido no generó nada (Thor tiene vacunas vencidas)';
  end if;

  /* EL TOPE · correr el generador otra vez NO duplica. El UNIQUE es la regla;
     esto prueba que la regla está puesta donde no se puede saltar. */
  perform public.generar_avisos_coach();
  select count(*) into v_n2 from avisos_coach a
    join mascotas m on m.id = a.mascota_id where m.familia_id = v_fam;
  if v_n2 <> v_n1 then
    raise exception 'CINTURON: la segunda corrida duplicó (% → %)', v_n1, v_n2;
  end if;

  -- MEMORIAL · ninguna mascota fallecida tiene aviso
  if exists (select 1 from avisos_coach a join mascotas m on m.id = a.mascota_id
              where m.estado_vida <> 'activa') then
    raise exception 'CINTURON: se generó un aviso para una mascota en memorial';
  end if;

  -- El lector, con sesión
  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);
  v_r := public.obtener_avisos_coach();
  if jsonb_array_length(v_r->'avisos') = 0 then
    raise exception 'CINTURON: el lector no devuelve los avisos generados';
  end if;

  -- marcar leído lo saca de la lista
  perform public.marcar_aviso_coach_leido(((v_r->'avisos'->0)->>'id')::uuid);
  if jsonb_array_length(public.obtener_avisos_coach()->'avisos')
     <> jsonb_array_length(v_r->'avisos') - 1 then
    raise exception 'CINTURON: marcar leído no lo sacó de la lista';
  end if;

  -- ROJO · el generador NO es de la app
  begin perform public.generar_avisos_coach();
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  if v_rebotes <> 1 then
    raise exception 'CINTURON: `authenticated` pudo correr el generador';
  end if;

  raise notice 'CINTURON OK · sin opt-in cero · con opt-in % · segunda corrida no duplica · memorial limpio', v_n1;
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
