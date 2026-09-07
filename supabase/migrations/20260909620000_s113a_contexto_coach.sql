-- ============================================================================
-- S113-A · LOTE 2.0 · A1 — EL CONTEXTO DE NEXO, EN UN SOLO VIAJE
--
-- Nexo tiene que hablar de UNA mascota con lo que la casa ya sabe. Hoy ese
-- conocimiento vive repartido en once lugares. Esta función lo junta.
--
-- 🔴 **UN SOLO VIAJE, y no es una preferencia de estilo: es la tesis medida de
-- S94.** No hay consultas lentas en esta base —ninguna llega al 0,2 % del
-- tiempo acumulado—; lo que cuesta es **la petición**, ~150 ms fijos vaya lo
-- que vaya. Once lecturas encadenadas serían ~1,6 s de pura ida y vuelta antes
-- de que el modelo empiece a pensar. *El techo no lo pone el servidor: lo pone
-- la cantidad de viajes.*
--
-- ── LO QUE **NO** DEVUELVE, y cada ausencia es una decisión ─────────────────
-- · **Nada de otra mascota ni de otra familia** (`A3.5`): la puerta resuelve
--   la familia de ESTA mascota y no sale de ahí.
-- · **Nada aportado por un menor.** Un chico puede anotar cosas en el
--   expediente; que Nexo las repita como hecho es otra cosa. El filtro cruza
--   `creado_por_user_id` contra los miembros con rol `menor` de la familia.
--   *Su rojo SÍ se ejerce* (el cinturón siembra un menor y su evento).
-- · **Nada en memorial.** Rebota por `_coach_puerta`, no por la pantalla.
-- · **Nada de plata**: ni precios, ni saldos, ni medios de pago. Nexo habla
--   del animal. *Lo que no entra al contexto no puede filtrarse por una
--   respuesta del modelo, y ésa es la única garantía dura que existe.*
--
-- ⚠️ Los textos vienen **crudos del expediente**, sin adjetivar. Redactar es
-- del modelo; acá se junta el DATO. *Si esta función ya interpretara, habría
-- dos autores de la misma frase y ninguno responsable.*
--
-- 76(g): **NO RIGE.** Lector puro, cero escritura, cero backfill.
-- ============================================================================

create or replace function public.obtener_contexto_coach(p_mascota_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_m record;
  v_familia uuid;
  v_menores uuid[];
  v_ctx jsonb;
  v_perfil record;
  v_ficha jsonb;
  v_hoy date := public.hoy_local();
begin
  perform public._coach_puerta(p_mascota_id);

  select m.id, m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento,
         m.fecha_nacimiento_precision, m.familia_id, m.sujeto
    into v_m
    from mascotas m where m.id = p_mascota_id;

  v_familia := v_m.familia_id;

  -- Los menores de ESTA familia. Si no hay, el array queda vacío y el filtro
  -- de abajo no descarta nada — que es lo correcto, no un caso especial.
  select coalesce(array_agg(fm.user_id), '{}')
    into v_menores
    from familia_miembro fm
   where fm.familia_id = v_familia and fm.rol = 'menor' and fm.hasta is null;

  select p.peso_clinico_kg, p.condiciones_cronicas, p.medicacion_actual, p.alergias
    into v_perfil
    from mascota_perfil_vigente p where p.mascota_id = p_mascota_id;

  -- La ficha de raza publicada, o la de la especie. La resuelve la puerta que
  -- ya existe: acá no se re-implementa el descarte por sinónimo.
  v_ficha := public.resolver_ficha_de_raza(v_m.especie, coalesce(v_m.raza, ''));

  v_ctx := jsonb_build_object(
    'ok', true,
    'mascota', jsonb_build_object(
      'id', v_m.id,
      'nombre', v_m.nombre,
      'especie', v_m.especie,
      'raza', v_m.raza,                       -- NULL viaja: «no se declaró»
      'sexo', v_m.sexo,
      'sujeto', v_m.sujeto,
      'fecha_nacimiento', v_m.fecha_nacimiento,
      'precision_nacimiento', v_m.fecha_nacimiento_precision,
      'momento_vital', case when v_m.fecha_nacimiento is not null
                            then public.calcular_etapa_vida(v_m.fecha_nacimiento, v_m.especie)
                            else null end
    ),

    'ficha_raza', case when (v_ficha->>'encontrada')::boolean is true
                       then jsonb_build_object(
                         'es_de_especie', v_ficha->'contenido'->'es_de_especie',
                         'temperamento',  v_ficha->'contenido'->'temperamento',
                         'predisposiciones', v_ficha->'contenido'->'predisposiciones',
                         'esperanza_vida', v_ficha->'contenido'->'esperanza_vida')
                       else null end,

    'salud', jsonb_build_object(
      'peso_kg', v_perfil.peso_clinico_kg,
      'peso_serie', (
        select coalesce(jsonb_agg(jsonb_build_object('kg', t.peso_kg, 'fecha', t.fecha_medicion)
                                  order by t.fecha_medicion desc), '[]'::jsonb)
          from (select peso_kg, fecha_medicion from evento_peso_medicion
                 where mascota_id = p_mascota_id
                 order by fecha_medicion desc limit 2) t),
      'alergias', coalesce(v_perfil.alergias, '[]'::jsonb),
      'condiciones_cronicas', coalesce(v_perfil.condiciones_cronicas, '[]'::jsonb),
      'medicacion_actual', coalesce(v_perfil.medicacion_actual, '[]'::jsonb),
      'desparasitaciones', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'producto', t.producto, 'fecha', t.fecha_aplicada,
                 'proxima', t.fecha_proxima, 'plagas', t.plagas) order by t.fecha_aplicada desc), '[]'::jsonb)
          from (select producto, fecha_aplicada, fecha_proxima, plagas
                  from evento_desparasitacion_aplicada
                 where mascota_id = p_mascota_id
                 order by fecha_aplicada desc nulls last limit 3) t)
    ),

    'plan_vacunal', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre', pv.nombre, 'obligatoria', pv.obligatoria,
               'estado', pv.estado, 'ultima', pv.ultima_aplicada, 'proxima', pv.proxima)), '[]'::jsonb)
        from public.obtener_plan_vacunal(p_mascota_id, v_hoy, 60) pv),

    'proxima_cita', (
      select jsonb_build_object('fecha', c.fecha, 'hora', c.hora,
                                'servicio', ts.nombre, 'estado', c.estado)
        from evento_cita_servicio c
        left join tipos_servicio ts on ts.codigo = c.tipo_servicio
       where c.mascota_id = p_mascota_id
         and c.fecha >= v_hoy
         and c.estado in ('confirmada','pendiente','en_curso')
       order by c.fecha, c.hora limit 1),

    /* Los últimos hechos, en voz de HECHO y sin adjetivar. El filtro de
       menores es un `<> all`, no un `not in`: con el array vacío `not in`
       devolvería NULL y descartaría TODO en silencio. */
    'eventos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'fecha', t.fecha_evento, 'tipo', t.tipo, 'datos', t.datos) order by t.fecha_evento desc), '[]'::jsonb)
        from (select e.fecha_evento, e.tipo, e.datos
                from eventos_mascota e
               where e.mascota_id = p_mascota_id
                 and not e.soft_delete
                 and (e.creado_por_user_id is null or e.creado_por_user_id <> all(v_menores))
               order by e.fecha_evento desc limit 10) t),

    /* Los pedidos son de QUIEN COMPRÓ (`pedidos.user_id`), no de la familia:
       la tabla no tiene `familia_id` y no se lo invento. Así que esto cuenta
       los pedidos de quien está preguntando — que es lo que Nexo puede
       mencionar sin hablar de las compras de otro adulto de la casa. */
    'pedidos_en_curso', (
      select count(*) from pedidos p
       where p.user_id = auth.uid()
         and p.estado not in ('entregado','cancelado_cliente','cancelado_vendedor','cancelado_sistema')),

    'memoria', (public.listar_memoria_coach(p_mascota_id))->'memoria'
  );

  return v_ctx;
end;
$function$;

comment on function public.obtener_contexto_coach is
  'Todo lo que Nexo sabe de UNA mascota, en un viaje. Sin otras mascotas, sin '
  'otras familias, sin lo aportado por menores, sin plata, y nunca en memorial.';

revoke all on function public.obtener_contexto_coach(uuid) from public, anon;
grant execute on function public.obtener_contexto_coach(uuid) to authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor    uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_zeus    uuid;
  v_sombra  uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';
  v_ctx jsonb; v_rebotes int := 0;
  v_menor uuid; v_evento uuid;
begin
  select id into v_zeus from mascotas where id::text like 'a3332037%';

  /* LA SIEMBRA DEL MENOR VA ACÁ, con el rol de la conexión y antes de pasar a
     `authenticated`: escribir `familia_miembro` desde la sesión simulada
     rebotaría por RLS, y el rebote sería del ARNÉS, no del sujeto medido. */
  select u.id into v_menor from auth.users u
   where u.id <> v_titular
     and not exists (select 1 from familia_miembro fm
                      where fm.user_id = u.id
                        and fm.familia_id = (select familia_id from mascotas where id = v_thor))
   limit 1;
  if v_menor is null then raise exception 'CINTURON: no hay un usuario libre para hacer de menor'; end if;

  insert into familia_miembro (familia_id, user_id, rol, desde)
  values ((select familia_id from mascotas where id = v_thor), v_menor, 'menor', now());

  insert into eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
                               creado_por_user_id, country_code, datos)
  values (v_thor, 'nota_dueno', 'salud', now(), v_menor,
          (select country_code from mascotas where id = v_thor), '{}'::jsonb)
  returning id into v_evento;

  -- ROJO 1 · sin sesión
  begin perform public.obtener_contexto_coach(v_thor);
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  -- ROJO 2 · memorial: Nexo no existe ahí
  begin perform public.obtener_contexto_coach(v_sombra);
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;

  -- ROJO 3 · una mascota de otra familia
  begin
    perform public.obtener_contexto_coach(
      (select id from mascotas where familia_id <> (select familia_id from mascotas where id=v_thor) limit 1));
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  if v_rebotes <> 3 then raise exception 'CINTURON: se esperaban 3 rebotes y hubo %', v_rebotes; end if;

  -- VERDE 1 · THOR trae alergia y medicación (el discriminador del brief)
  v_ctx := public.obtener_contexto_coach(v_thor);
  if jsonb_array_length(v_ctx->'salud'->'alergias') < 1 then
    raise exception 'CINTURON: Thor debería traer alergias y trajo %',
      jsonb_array_length(v_ctx->'salud'->'alergias');
  end if;
  if jsonb_array_length(v_ctx->'salud'->'medicacion_actual') < 1 then
    raise exception 'CINTURON: Thor debería traer medicación';
  end if;
  if v_ctx->'mascota'->>'nombre' <> 'Thor' then raise exception 'CINTURON: no es Thor'; end if;
  if v_ctx->'mascota'->>'momento_vital' is null then raise exception 'CINTURON: sin momento vital'; end if;

  -- VERDE 2 · ZEUS sin alergias: el discriminador que prueba que NO es fijo.
  -- *Sin este brazo, un lector que devolviera siempre las de Thor pasaría.*
  v_ctx := public.obtener_contexto_coach(v_zeus);
  if v_ctx->'mascota'->>'nombre' <> 'Zeus' then raise exception 'CINTURON: no es Zeus'; end if;
  if jsonb_array_length(v_ctx->'salud'->'alergias') <> 0 then
    raise exception 'CINTURON: Zeus no debería traer alergias y trajo %',
      jsonb_array_length(v_ctx->'salud'->'alergias');
  end if;

  /* VERDE 3 · EL FILTRO DE MENORES, ejercido de verdad. El evento del menor
     es el MÁS RECIENTE (se sembró recién), así que si el filtro no anduviera
     entraría seguro: está primero en el orden. *Un control que mide algo que
     podría no haber entrado igual no mide el filtro.* */
  if exists (select 1 from jsonb_array_elements((public.obtener_contexto_coach(v_thor))->'eventos') e
              where (e->>'fecha')::timestamptz
                    = (select fecha_evento from eventos_mascota where id = v_evento)) then
    raise exception 'CINTURON: un evento aportado por un menor entró al contexto';
  end if;
  -- y el control de que el evento EXISTE (si no, el brazo de arriba pasa por vacío)
  if not exists (select 1 from eventos_mascota where id = v_evento) then
    raise exception 'CINTURON: el evento del menor no se sembró — el filtro no se midió';
  end if;

  raise notice 'CINTURON OK · 3 rojos · Thor con alergias, Zeus sin, y el evento del menor filtrado';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
