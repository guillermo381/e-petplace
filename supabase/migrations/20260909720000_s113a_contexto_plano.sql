-- ============================================================================
-- S113-A · lote 2 — EL CONTEXTO HABLA EL CONTRATO DE LA EDGE
--
-- Dos pistas escribieron las dos mitades del mismo puente y no coincidían.
-- La edge `coach` (D) espera el contexto **plano** (`c.nombre`); el mío agrupa
-- por dominio (`c.mascota.nombre`). Resultado medido: HTTP 403 «No encontramos
-- esa mascota» sobre una mascota que la RPC devuelve perfecto.
--
-- ⇒ Se sirven **las dos formas**: los campos planos que la edge nombra, y los
-- agrupados que ya consume la app. Es aditivo y nadie se rompe. *Elegir una y
-- romper a la otra pista a las dos de la mañana no es una decisión de diseño:
-- es una decisión de horario.*
--
-- ── DOS RECONCILIACIONES QUE NO SON COSMÉTICAS ──────────────────────────────
-- ① **El memorial deja de rebotar en la LECTURA del contexto.** Mi puerta lo
--    cortaba antes de leer; pero D ya escribió la respuesta correcta —una voz
--    serena, **sin llamar al modelo**— y con mi rebote esa rama era inalcanzable
--    y la familia recibía «no pudimos leer el expediente». *Leer el expediente
--    de una mascota que murió es lo que hace la app entera; lo prohibido es
--    HABLAR sobre él, y eso lo decide quien redacta.* Las puertas que ESCRIBEN
--    (memoria, hilo, avisos, placa) siguen rebotando.
-- ② **`estado_vida` viaja como `'memorial'`, no como `'fallecida'`.** La edge
--    compara contra `'memorial'`. Si le mandara el valor crudo de la tabla, su
--    guard no dispararía y **el modelo hablaría de una mascota muerta** — la
--    peor cosa que esta pieza puede hacer. El mapeo se hace acá, una vez.
--
-- 76(g): **NO RIGE.** Reemplazo de un lector, sin datos.
-- ============================================================================

create or replace function public.obtener_contexto_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid; v_adoptada boolean := false;
  v_m record; v_perfil record; v_ficha jsonb; v_base jsonb;
  v_hoy date := public.hoy_local(); v_edad text; v_memorial boolean;
begin
  /* La puerta, SIN el corte por memorial (ver ① arriba): se resuelve quién
     pregunta y que tenga acceso, nada más. */
  if auth.uid() is not null then
    if p_user_id is not null and p_user_id <> auth.uid() then
      raise exception 'suplantacion_prohibida' using errcode = '42501';
    end if;
    v_uid := auth.uid();
  else
    if p_user_id is null or current_user in ('authenticated','anon') then
      raise exception 'auth_required' using errcode = '42501';
    end if;
    v_uid := p_user_id;
  end if;

  if not exists (
    select 1 from mascotas m join familia_miembro fm on fm.familia_id = m.familia_id
     where m.id = p_mascota_id and fm.user_id = v_uid and fm.hasta is null
       and fm.rol in ('adulto_titular','adulto_autorizado')
  ) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;

  -- la identidad se presta para lo anidado y **se devuelve al salir**
  if auth.uid() is null then
    v_adoptada := true;
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role','authenticated')::text, true);
  end if;

  select m.*, m.especie as esp into v_m from mascotas m where m.id = p_mascota_id;
  v_memorial := (v_m.estado_vida is distinct from 'activa');

  select p.peso_clinico_kg, p.peso_clinico_medido_en, p.condiciones_cronicas,
         p.medicacion_actual, p.alergias
    into v_perfil from mascota_perfil_vigente p where p.mascota_id = p_mascota_id;

  v_ficha := public.resolver_ficha_de_raza(v_m.especie, coalesce(v_m.raza, ''));

  v_edad := case when v_m.fecha_nacimiento is null then null
    else (extract(year from age(v_hoy, v_m.fecha_nacimiento))::int)::text || ' años' end;

  v_base := jsonb_build_object(
    'ok', true,
    -- ── la forma PLANA, que es la que nombra la edge ──────────────────────
    'nombre', v_m.nombre,
    'especie', v_m.especie,
    'sujeto', v_m.sujeto,
    -- ② la palabra del producto, no la de la tabla
    'estado_vida', case when v_memorial then 'memorial' else 'activa' end,
    'sexo', v_m.sexo,
    'edad_texto', v_edad,
    'etapa', case when v_m.fecha_nacimiento is not null
                  then public.calcular_etapa_vida(v_m.fecha_nacimiento, v_m.especie) end,
    'raza', v_m.raza,
    'peso_kg', v_perfil.peso_clinico_kg,
    'peso_fecha', v_perfil.peso_clinico_medido_en,
    'alergias', (select coalesce(jsonb_agg(a->>'alergeno'), '[]'::jsonb)
                   from jsonb_array_elements(coalesce(v_perfil.alergias,'[]'::jsonb)) a
                  where coalesce(a->>'estado','confirmada') not in ('resuelta','descartada')),
    'medicacion_actual', (select coalesce(jsonb_agg(x->>'medicamento'), '[]'::jsonb)
                            from jsonb_array_elements(coalesce(v_perfil.medicacion_actual,'[]'::jsonb)) x),
    'condiciones_cronicas', (select coalesce(jsonb_agg(
                               case when jsonb_typeof(x) = 'string' then x else to_jsonb(x->>'nombre') end), '[]'::jsonb)
                            from jsonb_array_elements(coalesce(v_perfil.condiciones_cronicas,'[]'::jsonb)) x),
    'proxima_cita', (
      select jsonb_build_object('fecha', c.fecha, 'servicio', ts.nombre, 'prestador', pr.nombre_comercial)
        from evento_cita_servicio c
        left join tipos_servicio ts on ts.codigo = c.tipo_servicio
        left join prestadores pr on pr.id = c.prestador_id
       where c.mascota_id = p_mascota_id and c.fecha >= v_hoy
         and c.estado in ('confirmada','pendiente','en_curso')
       order by c.fecha, c.hora limit 1),
    'plan_vacunal', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'vacuna', pv.nombre, 'estado', pv.estado, 'fecha', pv.proxima)), '[]'::jsonb)
        from public.obtener_plan_vacunal(p_mascota_id, v_hoy, 60) pv),
    'ultimos_eventos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'tipo', t.tipo, 'fecha', t.fecha_evento, 'detalle', t.datos->>'texto')
             order by t.fecha_evento desc), '[]'::jsonb)
        from (select e.tipo, e.fecha_evento, e.datos
                from eventos_mascota e
               where e.mascota_id = p_mascota_id and not e.soft_delete
                 and (e.creado_por_user_id is null or e.creado_por_user_id not in (
                       select fm.user_id from familia_miembro fm
                        where fm.familia_id = v_m.familia_id and fm.rol = 'menor' and fm.hasta is null))
               order by e.fecha_evento desc limit 10) t),
    'ficha_raza', case when (v_ficha->>'encontrada')::boolean is true
      then jsonb_build_object('temperamento', v_ficha->'contenido'->>'temperamento',
                              'cuidados', v_ficha->'contenido'->'cuidados_por_etapa') end,
    'memoria', (select coalesce(jsonb_agg(hecho order by creado_en), '[]'::jsonb)
                  from coach_memoria where mascota_id = p_mascota_id and activo),
    /* Si esta familia puede abrir una teleconsulta AHORA. Se MIDE del catálogo
       en vez de creerle al canon: sin esto, Nexo ofrecería un botón que puede
       no existir — y prometer lo que no se puede dar es peor que ofrecer lo
       que sí. */
    'telemedicina_disponible', exists (
      select 1 from tipos_servicio ts
        join prestador_servicios ps on ps.tipo_servicio = ts.codigo
       where ts.codigo = 'telemedicina' and ts.activo and ts.reservable and ps.activo),

    -- ── la forma AGRUPADA, que ya consume la app ──────────────────────────
    'mascota', jsonb_build_object(
      'id', v_m.id, 'nombre', v_m.nombre, 'especie', v_m.especie, 'raza', v_m.raza,
      'sexo', v_m.sexo, 'sujeto', v_m.sujeto, 'fecha_nacimiento', v_m.fecha_nacimiento,
      'precision_nacimiento', v_m.fecha_nacimiento_precision,
      'momento_vital', case when v_m.fecha_nacimiento is not null
                            then public.calcular_etapa_vida(v_m.fecha_nacimiento, v_m.especie) end),
    'salud', jsonb_build_object(
      'peso_kg', v_perfil.peso_clinico_kg,
      'alergias', coalesce(v_perfil.alergias, '[]'::jsonb),
      'condiciones_cronicas', coalesce(v_perfil.condiciones_cronicas, '[]'::jsonb),
      'medicacion_actual', coalesce(v_perfil.medicacion_actual, '[]'::jsonb),
      'desparasitaciones', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'producto', t.producto, 'fecha', t.fecha_aplicada,
                 'proxima', t.fecha_proxima, 'plagas', t.plagas) order by t.fecha_aplicada desc), '[]'::jsonb)
          from (select producto, fecha_aplicada, fecha_proxima, plagas
                  from evento_desparasitacion_aplicada where mascota_id = p_mascota_id
                 order by fecha_aplicada desc nulls last limit 3) t)),
    'pedidos_en_curso', (select count(*) from pedidos p
                          where p.user_id = v_uid
                            and p.estado not in ('entregado','cancelado_cliente','cancelado_vendedor','cancelado_sistema'))
  );

  if v_adoptada then
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
  end if;
  return v_base;
end $function$;

revoke all on function public.obtener_contexto_coach(uuid, uuid) from public, anon;
grant execute on function public.obtener_contexto_coach(uuid, uuid) to authenticated, service_role;

do $$
declare v jsonb; v_sombra uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';
begin
  -- VERDE · la forma plana que la edge nombra
  v := public.obtener_contexto_coach('d2e31d70-54fc-4d47-b425-1617239257eb',
                                     'dd024680-3d1c-4465-b38b-dedab45da037');
  if v->>'nombre' <> 'Thor' then raise exception 'CINTURON: falta `nombre` en la raíz'; end if;
  if v->>'estado_vida' <> 'activa' then raise exception 'CINTURON: estado_vida'; end if;
  if jsonb_typeof(v->'alergias') <> 'array' then raise exception 'CINTURON: alergias no es array'; end if;
  if jsonb_array_length(v->'alergias') < 1 then raise exception 'CINTURON: Thor debería traer alergias planas'; end if;
  if jsonb_array_length(v->'medicacion_actual') < 1 then raise exception 'CINTURON: medicación plana'; end if;
  -- y la agrupada sigue viva
  if v->'mascota'->>'nombre' <> 'Thor' then raise exception 'CINTURON: se perdió la forma agrupada'; end if;

  -- ① el memorial YA NO REBOTA, y llega con la palabra que la edge compara
  v := public.obtener_contexto_coach(v_sombra, 'dd024680-3d1c-4465-b38b-dedab45da037');
  if v->>'estado_vida' <> 'memorial' then
    raise exception 'CINTURON: en memorial `estado_vida` debe decir «memorial» y dijo %', v->>'estado_vida';
  end if;
  raise notice 'CINTURON OK · plana + agrupada + memorial legible';
end $$;
