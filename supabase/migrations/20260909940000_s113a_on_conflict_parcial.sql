-- ============================================================================
-- S113-A · LOS TRES `ON CONFLICT` DIARIOS REPITEN EL PREDICADO DEL ÍNDICE
--
-- Al volver parcial `uq_avisos_coach_uno_por_tipo_por_dia` (`where clave is
-- null`), Postgres deja de resolver `on conflict (mascota_id, tipo, fecha)`:
--   42P10 · there is no unique or exclusion constraint matching...
-- **Un `ON CONFLICT` contra un índice parcial tiene que repetir su predicado**,
-- y son tres los que lo usan.
--
-- *La segunda mitad del mismo cambio: acotar un índice no es sólo tocar el
-- índice — es tocar a todos los que lo nombraban.* Lo cazó correr el
-- generador, no leer el diff.
--
-- 76(g): **NO RIGE.**
-- ============================================================================

create or replace function public.generar_avisos_coach()
returns integer language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_n int := 0; v_hoy date := public.hoy_local(); v_i int; v_f record;
begin
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
     on conflict (mascota_id, tipo, fecha) where clave is null do nothing;
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

  /* ④ LA ANTICIPACIÓN — **sólo sobre reglas REVISADAS**.
     Es la misma compuerta que la ficha publicada, un piso más adentro: no
     alcanza con que la ficha esté firmada, la REGLA que se extrajo de ella
     también tiene que estarlo. *Una regla que nadie leyó no le habla a una
     familia de la salud de su animal.* */
  insert into avisos_coach (mascota_id, tipo, fecha, clave, detalle)
  select m.id, 'anticipacion', v_hoy,
         'anticipacion:' || cp.codigo || ':' || et.etapa,
         jsonb_build_object(
           'predisposicion', cp.codigo, 'nombre', cp.nombre, 'etapa', et.etapa,
           'ya_esta_en_la_etapa', et.etapa = et.etapa_hoy, 'raza', m.raza,
           'descripcion_familia', cp.descripcion_familia,
           'chequeo_sugerido', cp.chequeo_sugerido, 'oficio', cp.oficio)
    from mascotas m
    join familia f on f.id = m.familia_id
    join cat_razas cr on cr.nombre = m.raza
    join raza_predisposicion rp on rp.raza_codigo = cr.slug and rp.estado = 'revisada'
    join cat_predisposiciones cp on cp.codigo = rp.predisposicion_codigo and cp.activo
    join razas_contenido rc on rc.raza_codigo = cr.slug and rc.activo
    cross join lateral (
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

do $$
declare v_n int;
begin
  v_n := public.generar_avisos_coach();
  raise notice 'CINTURON OK · el generador corre entero y produjo % aviso(s)', v_n;
end $$;
