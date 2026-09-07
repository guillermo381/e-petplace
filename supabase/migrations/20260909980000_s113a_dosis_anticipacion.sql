-- ============================================================================
-- S113-A · LA DOSIS DE LA ANTICIPACIÓN (LOYALTY §8 · silencio por defecto)
--
-- 🔴 EL PROBLEMA, medido con datos reales y no supuesto: al firmarse las 22
-- reglas, **Thor recibió 4 avisos el mismo día y Zeus 5**. La regla «uno por
-- tema y por etapa» se cumplía — nadie había limitado **cuántos temas por
-- día**. *Cinco avisos juntos no son cinco veces más útiles que uno: son la
-- razón por la que alguien apaga los avisos.*
--
-- ── LA DOSIS ────────────────────────────────────────────────────────────────
-- **Una anticipación por mascota cada 7 días. Nunca dos el mismo día.** Las
-- demás quedan `en_cola` —visibles y medibles, no descartadas— y salen de a
-- una.
--
-- El orden de la cola, y cada criterio tiene su porqué:
--   ① **la que tiene chequeo Y cita en los próximos 30 días** — el aviso llega
--      cuando se puede hacer algo con él; *decirle a alguien que hable con su
--      vet la semana que no lo ve es pedirle que se acuerde solo*
--   ② **la que entra a una etapa NUEVA** (≤60 días) — se adelanta, que es el
--      punto entero de la pieza; ésta **salta la cola**
--   ③ el resto, en el orden del catálogo (estable y auditable)
--
-- ── ③ SI HAY CITA, EL AVISO SE ATA A ELLA ───────────────────────────────────
-- Con una cita veterinaria próxima el detalle lleva su fecha, para que Nexo
-- diga «en su chequeo del 12» en vez de soltar una tarea nueva. *Un consejo
-- atado a algo que ya va a pasar cuesta menos que uno que inventa una gestión.*
--
-- 76(g): **NO RIGE.** Columnas aditivas + reemplazo del generador y del lector.
-- ============================================================================

alter table public.avisos_coach
  add column if not exists estado text not null default 'entregado',
  add column if not exists prioridad integer,
  add column if not exists entregado_en timestamptz;

alter table public.avisos_coach drop constraint if exists chk_aviso_estado;
alter table public.avisos_coach
  add constraint chk_aviso_estado check (estado in ('entregado', 'en_cola'));

comment on column public.avisos_coach.estado is
  '`en_cola` = nació y espera su turno. La cola es VISIBLE a propósito: una '
  'dosis que descarta en vez de encolar no se puede auditar.';

/* Los avisos que ya existen quedan `entregado`: el default lo resuelve, y es
   correcto — nacieron antes de que hubiera cola y la familia ya los tiene. */
create index if not exists idx_avisos_cola
  on public.avisos_coach (mascota_id, prioridad) where estado = 'en_cola';

-- ── EL GENERADOR: encola todo, entrega de a una ─────────────────────────────
create or replace function public.generar_avisos_coach()
returns integer language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int := 0; v_hoy date := public.hoy_local(); v_i int; v_f record; v_m record;
begin
  -- ① ② ③ los avisos DE HOY, sin cambios
  for v_f in
    select f.id as familia_id,
           (select fm.user_id from familia_miembro fm
             where fm.familia_id = f.id and fm.rol = 'adulto_titular' and fm.hasta is null limit 1) as titular
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
     on conflict (mascota_id, tipo, fecha) where clave is null do nothing;
    get diagnostics v_i = row_count; v_n := v_n + v_i;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  insert into avisos_coach (mascota_id, tipo, fecha, detalle)
  select d.mascota_id, 'antiparasitario_vence', v_hoy,
         jsonb_build_object('producto', d.producto, 'proxima', d.fecha_proxima)
    from (select distinct on (e.mascota_id) e.mascota_id, e.producto, e.fecha_proxima
            from evento_desparasitacion_aplicada e where e.fecha_proxima is not null
           order by e.mascota_id, e.fecha_aplicada desc nulls last) d
    join mascotas m on m.id = d.mascota_id
    join familia f on f.id = m.familia_id
   where f.avisos_nexo_desde is not null and m.estado_vida = 'activa'
     and d.fecha_proxima <= v_hoy + 7
   on conflict (mascota_id, tipo, fecha) where clave is null do nothing;
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
   on conflict (mascota_id, tipo, fecha) where clave is null do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  /* ④ LA ANTICIPACIÓN — nace TODA `en_cola`, con su prioridad calculada. */
  insert into avisos_coach (mascota_id, tipo, fecha, clave, estado, prioridad, detalle)
  select m.id, 'anticipacion', v_hoy,
         'anticipacion:' || cp.codigo || ':' || et.etapa,
         'en_cola',
         /* ② la que entra a una etapa nueva SALTA la cola (0);
            ① la que tiene cita en 30 días va después (1);
            ③ el resto, en el orden del catálogo — desempate estable. */
         case when et.etapa <> et.etapa_hoy then 0
              when cita.fecha is not null then 1
              else 2 end * 1000 + cp.orden,
         jsonb_build_object(
           'predisposicion', cp.codigo, 'nombre', cp.nombre, 'etapa', et.etapa,
           'ya_esta_en_la_etapa', et.etapa = et.etapa_hoy, 'raza', m.raza,
           'descripcion_familia', cp.descripcion_familia,
           'chequeo_sugerido', cp.chequeo_sugerido, 'oficio', cp.oficio,
           /* ③ si hay cita, el aviso se ata a ella en vez de nacer suelto */
           'cita_fecha', cita.fecha, 'cita_servicio', cita.servicio)
    from mascotas m
    join familia f on f.id = m.familia_id
    join cat_razas cr on cr.nombre = m.raza
    join raza_predisposicion rp on rp.raza_codigo = cr.slug and rp.estado = 'revisada'
    join (select codigo, nombre, descripcion_familia, chequeo_sugerido, oficio, etapas,
                 row_number() over (order by codigo) as orden
            from cat_predisposiciones where activo) cp
      on cp.codigo = rp.predisposicion_codigo
    join razas_contenido rc on rc.raza_codigo = cr.slug and rc.activo
    cross join lateral (
      select public.calcular_etapa_vida(m.fecha_nacimiento, m.especie) as etapa_hoy,
             unnest(array[
               public.calcular_etapa_vida(m.fecha_nacimiento, m.especie),
               public.calcular_etapa_vida(m.fecha_nacimiento - 60, m.especie)]) as etapa) et
    left join lateral (
      select c.fecha, coalesce(ts.nombre, c.tipo_servicio) as servicio
        from evento_cita_servicio c
        left join tipos_servicio ts on ts.codigo = c.tipo_servicio
       where c.mascota_id = m.id and c.fecha between v_hoy and v_hoy + 30
         and c.estado in ('confirmada','pendiente')
         and coalesce(ts.es_medico, false)
       order by c.fecha limit 1) cita on true
   where f.avisos_nexo_desde is not null
     and m.estado_vida = 'activa'
     and m.fecha_nacimiento is not null
     and et.etapa = any(cp.etapas)
   on conflict (mascota_id, clave) where clave is not null do nothing;
  get diagnostics v_i = row_count; v_n := v_n + v_i;

  /* ── LA ENTREGA: UNA por mascota, y sólo si pasaron 7 días ────────────────
     El ritmo vive acá y no en el INSERT: encolar es barato y reversible;
     entregar es lo que le llega a una persona. *Separar las dos cosas es lo
     que hace que la cola se pueda auditar sin haberle hablado a nadie.* */
  for v_m in
    select distinct a.mascota_id from avisos_coach a where a.estado = 'en_cola'
  loop
    -- ¿ya recibió una anticipación en los últimos 7 días?
    continue when exists (
      select 1 from avisos_coach x
       where x.mascota_id = v_m.mascota_id and x.tipo = 'anticipacion'
         and x.estado = 'entregado'
         and coalesce(x.entregado_en, x.creado_en) > now() - interval '7 days');

    update avisos_coach
       set estado = 'entregado', entregado_en = now(), fecha = v_hoy
     where id = (select a.id from avisos_coach a
                  where a.mascota_id = v_m.mascota_id and a.estado = 'en_cola'
                  order by a.prioridad nulls last, a.creado_en limit 1);
  end loop;

  return v_n;
end $function$;

revoke all on function public.generar_avisos_coach() from public, anon, authenticated;

-- ── LOS LECTORES SÓLO VEN LO ENTREGADO ──────────────────────────────────────
create or replace function public.obtener_avisos_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid; v jsonb;
begin
  v_uid := public._coach_puerta(p_mascota_id, p_user_id);
  select coalesce(jsonb_agg(x order by x->>'orden'), '[]'::jsonb) into v from (
    select jsonb_build_object(
      'tipo', a.tipo,
      'titulo', case a.tipo
        when 'vacuna_vence' then 'La vacuna ' || coalesce(a.detalle->>'vacuna','pendiente') ||
             case when a.detalle->>'estado' = 'vencida' then ' está vencida' else ' vence pronto' end
        when 'antiparasitario_vence' then 'Toca el antiparasitario' ||
             coalesce(' (' || (a.detalle->>'producto') || ')','')
        when 'cita_manana' then 'Mañana tiene ' || coalesce(a.detalle->>'servicio','una cita') ||
             coalesce(' a las ' || substring(a.detalle->>'hora' from 1 for 5),'')
        when 'anticipacion' then coalesce(a.detalle->>'raza','Su raza') || ' ' ||
             coalesce(a.detalle->>'descripcion_familia','')
        else a.tipo end,
      'detalle', case when a.tipo='anticipacion' then a.detalle->>'chequeo_sugerido'
                      else a.detalle->>'proxima' end,
      'dias', case when (a.detalle->>'proxima') is not null
                   then (a.detalle->>'proxima')::date - public.hoy_local() end,
      'severidad', case when a.detalle->>'estado'='vencida' then 'vencido'
                        when a.tipo in ('cita_manana','anticipacion') then 'info'
                        else 'pronto' end,
      'orden', case a.tipo when 'vacuna_vence' then '1' when 'antiparasitario_vence' then '2'
                           when 'cita_manana' then '3' else '4' end
    ) as x
    from avisos_coach a
   where a.mascota_id = p_mascota_id and a.leido_en is null
     and a.estado = 'entregado'          -- la cola NO se muestra
     and a.fecha > public.hoy_local() - 7
  ) t;
  return v;
end $function$;

revoke all on function public.obtener_avisos_coach(uuid, uuid) from public, anon;
grant execute on function public.obtener_avisos_coach(uuid, uuid) to authenticated, service_role;
