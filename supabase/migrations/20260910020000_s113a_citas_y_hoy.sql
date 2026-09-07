-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 2.2 — A2 LAS CITAS DE UNA MASCOTA · A3 EL «HOY», UNA SOLA COSA
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A2 ─────────────────────────────────────────────────────────────────────
-- Censado antes de escribir: NINGUNA función del motor devuelve las citas de
-- UNA mascota para su familia. `obtener_citas_por_coordinar` es del prestador;
-- `obtenerCitasActivasHogar` (wrapper) es del HOGAR entero y sólo las activas.
-- Hoy la agenda de una mascota sólo se ve en «Ponte al día», que es otra cosa.
create or replace function public.obtener_citas_de_mascota(p_mascota_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_hoy date := (now() at time zone 'America/Guayaquil')::date;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode = '42501';
  end if;

  return jsonb_build_object('ok', true,
    -- Futuras primero y ascendente: lo que viene se lee de arriba hacia abajo.
    'futuras', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'fecha', c.fecha, 'hora', c.hora,
               'servicio', c.tipo_servicio, 'estado', c.estado,
               'prestador', pr.nombre_comercial)
             order by c.fecha, c.hora)
        from evento_cita_servicio c
        left join prestadores pr on pr.id = c.prestador_id
       where c.mascota_id = p_mascota_id and c.fecha >= v_hoy
         and c.estado in ('confirmada','pendiente')), '[]'::jsonb),
    -- Pasadas descendente: lo último que pasó es lo primero que se busca.
    -- Con techo: una mascota con 103 citas no manda 103 filas a un teléfono
    -- para pintar una lista que se lee por arriba.
    'pasadas', coalesce((
      select jsonb_agg(x order by (x->>'fecha') desc)
        from (select jsonb_build_object(
                 'id', c.id, 'fecha', c.fecha, 'hora', c.hora,
                 'servicio', c.tipo_servicio, 'estado', c.estado,
                 'prestador', pr.nombre_comercial) as x
                from evento_cita_servicio c
                left join prestadores pr on pr.id = c.prestador_id
               where c.mascota_id = p_mascota_id and c.fecha < v_hoy
                 and c.estado in ('confirmada','completada','no_show')
               order by c.fecha desc, c.hora desc
               limit 50) s), '[]'::jsonb),
    'pasadas_total', (select count(*) from evento_cita_servicio
                       where mascota_id = p_mascota_id and fecha < v_hoy
                         and estado in ('confirmada','completada','no_show'))
  );
end;
$$;

revoke all on function public.obtener_citas_de_mascota(uuid) from public, anon;
grant execute on function public.obtener_citas_de_mascota(uuid) to authenticated;


-- ── A3 · EL «HOY» ──────────────────────────────────────────────────────────
-- UNA cosa, nunca dos. La prioridad es FIJA y vive acá, en el servidor:
--   ① aviso de Nexo vivo  ② cita en 48 h  ③ vacuna que vence en 7 días
--   ④ antiparasitario vencido  ⑤ tip del día  ⑥ null
--
-- 🔴 **LA PRIORIDAD NO PUEDE VIVIR EN LA PANTALLA.** Si la superficie recibe
-- las cinco cosas y elige, cada superficie elige distinto — y el día que entre
-- una sexta hay que acordarse de todas. Acá se devuelve UNA, ya elegida.
--
-- ⑤ EL TIP · cuarto nivel (firma del founder, 6-sep). Rota sin repetir en 30
-- días por mascota, y eso **no necesita tabla nueva**: `avisos_coach` ya guarda
-- qué se sirvió y cuándo, con su `clave` única. *Una tabla de «tips servidos»
-- al lado de una tabla de avisos servidos son dos verdades del mismo hecho.*
-- Este motor sirve el DATO (qué predisposición toca); la plantilla la escribe D.
alter table public.avisos_coach drop constraint if exists avisos_coach_tipo_check;
alter table public.avisos_coach add constraint avisos_coach_tipo_check
  check (tipo = any (array['vacuna_vence','antiparasitario_vence','cita_manana',
                           'anticipacion','tip_del_dia']));

create or replace function public.obtener_hoy_mascota(p_mascota_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_hoy    date := (now() at time zone 'America/Guayaquil')::date;
  v_activa boolean;
  v_raza   text;
  v_esp    text;
  r        jsonb;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode = '42501';
  end if;

  select (m.estado_vida is distinct from 'activa') is false, m.raza, m.especie
    into v_activa, v_raza, v_esp
    from mascotas m where m.id = p_mascota_id;
  if not found then
    return jsonb_build_object('ok', false, 'codigo', 'mascota_no_existe');
  end if;

  -- 🔴 NUNCA EN MEMORIAL — ni un aviso, ni un tip. Misma lista blanca que el
  -- tablero: se pregunta por `activa`, no por el valor muerto.
  if not coalesce(v_activa, false) then
    return jsonb_build_object('ok', true, 'hoy', null, 'razon', 'no_activa');
  end if;

  -- ① AVISO DE NEXO VIVO (el entregado más reciente sin leer)
  select jsonb_build_object('tipo','aviso', 'aviso_id', a.id,
           -- 🔴 `titulo` NO es columna: el aviso guarda `detalle` (jsonb) y el
           -- título lo compone el lector. Se manda el detalle crudo y la voz
           -- la pone la superficie, que es donde vive la voz.
           'aviso_tipo', a.tipo, 'detalle', a.detalle,
           'fecha', a.fecha)
    into r
    from avisos_coach a
   where a.mascota_id = p_mascota_id
     and coalesce(a.estado,'entregado') = 'entregado'
     and a.tipo <> 'tip_del_dia'
   order by a.fecha desc, a.creado_en desc limit 1;
  if r is not null then return jsonb_build_object('ok', true, 'hoy', r); end if;

  -- ② CITA EN 48 H
  select jsonb_build_object('tipo','cita', 'cita_id', c.id, 'fecha', c.fecha,
           'hora', c.hora, 'servicio', c.tipo_servicio,
           'prestador', pr.nombre_comercial,
           -- el único cálculo que la pantalla no tiene que hacer
           'faltan_dias', (c.fecha - v_hoy))
    into r
    from evento_cita_servicio c
    left join prestadores pr on pr.id = c.prestador_id
   where c.mascota_id = p_mascota_id
     and c.fecha between v_hoy and v_hoy + 2
     and c.estado in ('confirmada','pendiente')
   order by c.fecha, c.hora limit 1;
  if r is not null then return jsonb_build_object('ok', true, 'hoy', r); end if;

  -- ③ VACUNA QUE VENCE EN 7 DÍAS (o ya vencida)
  select jsonb_build_object('tipo','vacuna', 'vacuna', p.nombre,
           'fecha', p.proxima, 'estado', p.estado,
           -- 🔴 viaja si la fecha es DERIVADA: la superficie tiene que poder
           -- decir «estimada». Una fecha que calculamos nosotros no es una que
           -- alguien escribió en un carnet.
           'derivada', p.proxima_es_derivada,
           'dias', (p.proxima - v_hoy))
    into r
    from public.obtener_plan_vacunal(p_mascota_id, v_hoy, 365) p
   where p.proxima is not null and p.proxima <= v_hoy + 7
   order by p.proxima limit 1;
  if r is not null then return jsonb_build_object('ok', true, 'hoy', r); end if;

  -- ④ ANTIPARASITARIO VENCIDO
  select jsonb_build_object('tipo','antiparasitario', 'fecha', min(d.fecha_proxima),
           'dias', (min(d.fecha_proxima) - v_hoy))
    into r
    from evento_desparasitacion_aplicada d
   where d.mascota_id = p_mascota_id and d.fecha_proxima < v_hoy
  having min(d.fecha_proxima) is not null;
  if r is not null then return jsonb_build_object('ok', true, 'hoy', r); end if;

  -- ⑤ TIP DEL DÍA · sale del catálogo REVISADO, jamás de una ficha sin firma.
  --    Rota sin repetir en 30 días: se excluye lo ya servido a ESTA mascota.
  --    El orden es estable (por código) para que sea reproducible: *un tip al
  --    azar no se puede volver a mirar cuando alguien pregunta por qué salió.*
  select jsonb_build_object('tipo','tip', 'codigo', cp.codigo, 'nombre', cp.nombre,
           'descripcion', cp.descripcion_familia, 'chequeo', cp.chequeo_sugerido,
           'oficio', cp.oficio, 'fuente', 'raza')
    into r
    from raza_predisposicion rp
    join cat_predisposiciones cp on cp.codigo = rp.predisposicion_codigo
   where rp.raza_codigo = v_raza
     and rp.estado = 'revisada'          -- sin firma humana no se muestra
     and cp.activo
     and not exists (
       select 1 from avisos_coach a
        where a.mascota_id = p_mascota_id and a.tipo = 'tip_del_dia'
          and a.clave = 'tip:' || cp.codigo
          and a.fecha > v_hoy - 30)
   order by cp.codigo limit 1;
  if r is not null then return jsonb_build_object('ok', true, 'hoy', r); end if;

  -- ⑥ NADA. Y se dice que no hay nada, que no es lo mismo que un error.
  return jsonb_build_object('ok', true, 'hoy', null, 'razon', 'sin_novedades');
end;
$$;

revoke all on function public.obtener_hoy_mascota(uuid) from public, anon;
grant execute on function public.obtener_hoy_mascota(uuid) to authenticated;

comment on function public.obtener_hoy_mascota(uuid) is
  'S113-A 2.2 · UNA sola cosa para hoy, con prioridad FIJA en el servidor: '
  'aviso > cita 48h > vacuna 7d > antiparasitario vencido > tip > null. '
  'Nunca en memorial. El tip rota sin repetir 30 días sobre avisos_coach.';
