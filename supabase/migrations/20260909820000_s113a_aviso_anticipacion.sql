-- ============================================================================
-- S113-A · 2.1 · A2 — NEXO SE ADELANTA
--
-- «Thor entra a senior en marzo; los Bulldog inglés suelen tener problemas de
-- cadera: vale la pena hablar con tu vet de un estudio de cadera en su próximo
-- chequeo.»
--
-- 🔴 **LO DISPARA EL MOTOR, NO UN MODELO.** La raza, la etapa y la regla son
-- tres datos que la base ya tiene; preguntárselos a un modelo sería introducir
-- la posibilidad de que se equivoque en una fecha. *Nexo lo REDACTA; que el
-- aviso deba existir lo decide una consulta.*
--
-- ── «UNA VEZ POR (mascota, predisposición, etapa)» ES OTRA UNICIDAD ─────────
-- Los tres tipos que ya existían son de HOY: se repiten cada día mientras la
-- vacuna siga vencida, y su UNIQUE es `(mascota, tipo, fecha)`.
-- Éste es distinto: **se dice UNA VEZ EN LA VIDA** por cada tema y cada etapa.
-- *Repetirlo cada día convertiría un dato útil en la razón por la que alguien
-- apaga los avisos.* ⇒ nace `clave` y su índice único **sin la fecha adentro**.
--
-- ⚠️ La etapa QUE VIENE se calcula corriendo el nacimiento hacia atrás: la
-- etapa depende de la edad, así que `calcular_etapa_vida(nac - 60 días)` es
-- exactamente «qué etapa va a tener en 60 días». *Sin eso, el aviso llegaría
-- el día que la etapa cambia y no antes — y «se adelanta» era el punto.*
--
-- 76(g): **NO RIGE.** Columna aditiva + índice + un brazo más en el generador.
-- ============================================================================

alter table public.avisos_coach
  drop constraint if exists avisos_coach_tipo_check;
alter table public.avisos_coach
  add constraint avisos_coach_tipo_check
  check (tipo in ('vacuna_vence','antiparasitario_vence','cita_manana','anticipacion'));

/* `clave` identifica el HECHO del que habla el aviso, no el día.
   Los tres tipos viejos la dejan NULL y siguen con su unicidad por fecha. */
alter table public.avisos_coach add column if not exists clave text;

comment on column public.avisos_coach.clave is
  'Identifica el hecho, no el día: para avisos que se dicen UNA vez en la vida '
  '(anticipación por raza y etapa). NULL en los avisos diarios.';

create unique index if not exists uq_avisos_coach_por_clave
  on public.avisos_coach (mascota_id, clave) where clave is not null;

-- ── EL BRAZO NUEVO DEL GENERADOR ────────────────────────────────────────────
create or replace function public.generar_avisos_coach()
returns integer language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int := 0; v_hoy date := public.hoy_local(); v_i int; v_f record;
begin
  /* ① ② ③ — los tres avisos DE HOY, sin cambios. El bloque entero se
     conserva; lo único nuevo es el ④ de más abajo. */
  for v_f in
    select f.id as familia_id,
           (select fm.user_id from familia_miembro fm
             where fm.familia_id = f.id and fm.rol = 'adulto_titular' and fm.hasta is null
             limit 1) as titular
      from familia f where f.avisos_nexo_desde is not null
  loop
    continue when v_f.titular is null;
    perform set_config('request.jwt.claim.sub', v_f.titular::text, true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_f.titular, 'role', 'authenticated')::text, true);

    insert into avisos_coach (mascota_id, tipo, fecha, detalle)
    select m.id, 'vacuna_vence', v_hoy,
           jsonb_build_object('vacuna', pv.nombre, 'estado', pv.estado, 'proxima', pv.proxima)
      from mascotas m
      cross join lateral public.obtener_plan_vacunal(m.id, v_hoy, 30) pv
     where m.familia_id = v_f.familia_id and m.estado_vida = 'activa'
       and pv.estado in ('vencida','por_vencer') and pv.obligatoria
     order by m.id, case pv.estado when 'vencida' then 0 else 1 end, pv.proxima
     on conflict (mascota_id, tipo, fecha) do nothing;
    get diagnostics v_i = row_count; v_n := v_n + v_i;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  insert into avisos_coach (mascota_id, tipo, fecha, detalle)
  select d.mascota_id, 'antiparasitario_vence', v_hoy,
         jsonb_build_object('producto', d.producto, 'proxima', d.fecha_proxima)
    from (select distinct on (e.mascota_id) e.mascota_id, e.producto, e.fecha_proxima
            from evento_desparasitacion_aplicada e
           where e.fecha_proxima is not null
           order by e.mascota_id, e.fecha_aplicada desc nulls last) d
    join mascotas m on m.id = d.mascota_id
    join familia f on f.id = m.familia_id
   where f.avisos_nexo_desde is not null and m.estado_vida = 'activa'
     and d.fecha_proxima <= v_hoy + 7
   on conflict (mascota_id, tipo, fecha) do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  insert into avisos_coach (mascota_id, tipo, fecha, detalle)
  select c.mascota_id, 'cita_manana', v_hoy,
         jsonb_build_object('hora', c.hora, 'servicio', coalesce(ts.nombre, c.tipo_servicio))
    from evento_cita_servicio c
    join mascotas m on m.id = c.mascota_id
    join familia f on f.id = m.familia_id
    left join tipos_servicio ts on ts.codigo = c.tipo_servicio
   where f.avisos_nexo_desde is not null and m.estado_vida = 'activa'
     and c.fecha = v_hoy + 1 and c.estado = 'confirmada'
   on conflict (mascota_id, tipo, fecha) do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  /* ── ④ LA ANTICIPACIÓN ────────────────────────────────────────────────────
     Se cruza la raza de la mascota con las reglas de su raza, y se pregunta si
     la etapa DE HOY o la de dentro de 60 días está entre las que esa
     predisposición vigila.
     ⚠️ **Sólo sobre fichas PUBLICADAS**: la regla puede haber salido de una
     ficha que todavía nadie leyó, y un aviso sobre un texto sin revisar es
     exactamente lo que la firma del founder existe para evitar. */
  insert into avisos_coach (mascota_id, tipo, fecha, clave, detalle)
  select m.id, 'anticipacion', v_hoy,
         'anticipacion:' || cp.codigo || ':' || et.etapa,
         jsonb_build_object(
           'predisposicion', cp.codigo,
           'nombre', cp.nombre,
           'etapa', et.etapa,
           'ya_esta_en_la_etapa', et.etapa = et.etapa_hoy,
           'raza', m.raza,
           'descripcion_familia', cp.descripcion_familia,
           'chequeo_sugerido', cp.chequeo_sugerido,
           'oficio', cp.oficio)
    from mascotas m
    join familia f on f.id = m.familia_id
    join cat_razas cr on cr.nombre = m.raza
    join raza_predisposicion rp on rp.raza_codigo = cr.slug
    join cat_predisposiciones cp on cp.codigo = rp.predisposicion_codigo and cp.activo
    join razas_contenido rc on rc.raza_codigo = cr.slug and rc.activo
    cross join lateral (
      /* la etapa de hoy y la de dentro de 60 días. La segunda se obtiene
         corriendo el nacimiento hacia atrás: la etapa depende de la edad. */
      select public.calcular_etapa_vida(m.fecha_nacimiento, m.especie) as etapa_hoy,
             unnest(array[
               public.calcular_etapa_vida(m.fecha_nacimiento, m.especie),
               public.calcular_etapa_vida(m.fecha_nacimiento - 60, m.especie)
             ]) as etapa
    ) et
   where f.avisos_nexo_desde is not null
     and m.estado_vida = 'activa'
     and m.fecha_nacimiento is not null
     and et.etapa = any(cp.etapas)
   on conflict (mascota_id, clave) where clave is not null do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  return v_n;
end $function$;

revoke all on function public.generar_avisos_coach() from public, anon, authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_zeus uuid; v_sombra uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';
  v_fam uuid; v_slug text; v_n1 int; v_n2 int; v_apagado int;
begin
  select id into v_zeus from mascotas where id::text like 'a3332037%';
  select familia_id into v_fam from mascotas where id = v_thor;
  select cr.slug into v_slug from cat_razas cr join mascotas m on m.raza = cr.nombre where m.id = v_thor;
  if v_slug is null then raise exception 'CINTURON: Thor no casa con ninguna raza del catálogo'; end if;

  -- la regla de prueba: la raza de Thor con cadera. Las reales las carga D.
  insert into raza_predisposicion (raza_codigo, predisposicion_codigo, fuente)
  values (v_slug, 'cadera', 'revisado') on conflict do nothing;
  /* La ficha tiene que estar PUBLICADA o la regla no dispara, y eso es a
     propósito. **No se siembra**: medido, `bulldog-ingles` ya está activa y
     firmada por el founder. *Sembrar la precondición de una compuerta es
     exactamente lo que impide descubrir que la compuerta no existe (L-438);
     acá se comprueba en vez de fabricarse.* */
  if not exists (select 1 from razas_contenido
                  where raza_codigo = v_slug and activo) then
    raise exception 'CINTURON: la ficha de % no está publicada — el rojo no se puede ejercer', v_slug;
  end if;

  /* 🔴 ROJO 1 · SIN OPT-IN NO NACE NADA */
  update familia set avisos_nexo_desde = null where id = v_fam;
  delete from avisos_coach where mascota_id in (v_thor, v_zeus, v_sombra) and tipo='anticipacion';
  perform public.generar_avisos_coach();
  select count(*) into v_apagado from avisos_coach where mascota_id = v_thor and tipo='anticipacion';
  if v_apagado <> 0 then raise exception 'CINTURON: con opt-in apagado nacieron % avisos', v_apagado; end if;

  -- VERDE · con opt-in, Thor recibe su anticipación
  update familia set avisos_nexo_desde = now() where id = v_fam;
  perform public.generar_avisos_coach();
  select count(*) into v_n1 from avisos_coach where mascota_id = v_thor and tipo='anticipacion';
  if v_n1 < 1 then raise exception 'CINTURON: Thor (adulto, con regla de cadera) no recibió el aviso'; end if;

  /* 🔴 EL ROJO DEL BRIEF · UNA VEZ, NO DOS. Se corre otra vez y el conteo NO
     puede moverse: la unicidad vive en el índice, no en un `if`. */
  perform public.generar_avisos_coach();
  select count(*) into v_n2 from avisos_coach where mascota_id = v_thor and tipo='anticipacion';
  if v_n2 <> v_n1 then raise exception 'CINTURON: la segunda corrida duplicó (% → %)', v_n1, v_n2; end if;

  -- ZEUS sin raza → cero
  if v_zeus is not null and
     (select count(*) from avisos_coach where mascota_id = v_zeus and tipo='anticipacion') <> 0 then
    raise exception 'CINTURON: Zeus no tiene raza casada y recibió anticipación';
  end if;

  -- SOMBRA en memorial → cero
  if (select count(*) from avisos_coach where mascota_id = v_sombra and tipo='anticipacion') <> 0 then
    raise exception 'CINTURON: nació una anticipación para una mascota en memorial';
  end if;

  -- y el aviso no afirma nada sobre Thor: su texto sale del catálogo
  if not exists (select 1 from avisos_coach
                  where mascota_id = v_thor and tipo='anticipacion'
                    and detalle->>'chequeo_sugerido' ilike '%vet%') then
    raise exception 'CINTURON: el aviso no lleva al veterinario';
  end if;

  raise notice 'CINTURON OK · sin opt-in 0 · Thor % · segunda corrida no duplica · Zeus 0 · Sombra 0', v_n1;
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
