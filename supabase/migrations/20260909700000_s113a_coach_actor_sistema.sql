-- ============================================================================
-- S113-A · lote 2 — LAS PUERTAS DE NEXO ACEPTAN AL SISTEMA, SIN ABRIR LA
-- PUERTA A LA SUPLANTACIÓN
--
-- ── EL ROJO QUE LO PARIÓ ────────────────────────────────────────────────────
-- Las edges `coach` y `coach-parte` (de D) corren con `service_role` y
-- resuelven el usuario ellas mismas (`sb.auth.getUser(token)`), porque el
-- token de la familia viaja en el header y no en la conexión. Con
-- `service_role`, **`auth.uid()` dentro de la RPC es NULL** y mis puertas
-- rebotaban con `auth_required`. La razón de D es correcta; faltaba la mitad
-- del contrato de mi lado.
--
-- 🔴 **Y AGREGAR `p_user_id` A SECAS SERÍA UN AGUJERO GRAVE**: cualquiera con
-- una sesión podría pedir el expediente de otra familia pasando el uuid ajeno.
-- *Un parámetro de identidad que el llamador elige no es identidad: es un
-- formulario de suplantación.*
--
-- ⇒ El parámetro **sólo se honra cuando la conexión NO es de un usuario final**
-- (`current_user not in ('authenticated','anon')`), que es el mismo
-- discriminador que usa el trigger de `D-389` para dejar pasar a los DEFINER.
-- Con sesión real, `auth.uid()` manda y `p_user_id` se **ignora**; si además
-- pretende ser otro, **rebota**.
--
-- 76(g): **NO RIGE.** Reemplazo de firmas, sin datos.
-- ============================================================================

-- El guard compartido, ahora con actor explícito.
create or replace function public._coach_puerta(p_mascota_id uuid, p_user_id uuid default null)
returns uuid
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid := auth.uid(); v_estado text;
begin
  /* La suplantación se corta ANTES de mirar nada más: con sesión de usuario,
     `p_user_id` es a lo sumo redundante — jamás una identidad distinta. */
  if v_uid is not null then
    if p_user_id is not null and p_user_id <> v_uid then
      raise exception 'suplantacion_prohibida' using errcode = '42501';
    end if;
  else
    if p_user_id is null then
      raise exception 'auth_required' using errcode = '42501';
    end if;
    if current_user in ('authenticated', 'anon') then
      -- una sesión sin `auth.uid()` no puede nombrar a nadie
      raise exception 'auth_required' using errcode = '42501';
    end if;
    v_uid := p_user_id;
  end if;

  /* `user_es_familiar_adulto_de_mascota()` lee `auth.uid()` por dentro, así que
     con el actor de sistema hay que preguntar por el vínculo directamente.
     *Se pregunta lo mismo, por el mismo camino: familiar ADULTO y vigente.* */
  if not exists (
    select 1 from mascotas m
      join familia_miembro fm on fm.familia_id = m.familia_id
     where m.id = p_mascota_id and fm.user_id = v_uid and fm.hasta is null
       and fm.rol in ('adulto_titular', 'adulto_autorizado')
  ) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;

  select estado_vida into v_estado from mascotas where id = p_mascota_id;
  if v_estado is distinct from 'activa' then
    raise exception 'mascota_en_memorial' using errcode = '22023';
  end if;

  return v_uid;
end;
$function$;

revoke all on function public._coach_puerta(uuid, uuid) from public, anon, authenticated;

-- El contexto, con el actor. **Se REEMPLAZA la de un argumento en vez de
-- convivir con ella**: dos firmas llamables con un solo argumento dejan
-- ambigua toda llamada de la app (`function ... is not unique`), que es
-- exactamente el defecto que S113 ya se cobró con `obtener_plan_vacunal`.
drop function if exists public.obtener_contexto_coach(uuid);

create or replace function public.obtener_contexto_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid;
  v_adoptada boolean := false;
  v_m record;
  v_familia uuid;
  v_menores uuid[];
  v_ctx jsonb;
  v_perfil record;
  v_ficha jsonb;
  v_hoy date := public.hoy_local();
begin
  v_uid := public._coach_puerta(p_mascota_id, p_user_id);

  /* 🔴 EL CONTEXTO ADOPTA LA IDENTIDAD DEL ACTOR, y no es un rodeo: **tres**
     de las funciones que compone —`resolver_ficha_de_raza`,
     `obtener_plan_vacunal`, la memoria— exigen `auth.uid()` por dentro. Con
     actor de sistema rebotan todas, una tras otra.
     Parchear cada una le cambiaría el contrato a funciones vivas de otras
     pistas; envolver cada llamada en un `exception` degradaría la respuesta en
     silencio (Nexo hablaría sin la ficha de raza y nadie lo notaría).
     ⇒ Se declara la identidad UNA vez, y es local a la transacción
     (`set_config(..., true)`): lo que sigue ve exactamente lo que vería la
     familia. *La puerta de arriba ya probó que este actor puede.* */
  /* ⚠️ Y SE DESHACE AL SALIR. `set_config(..., true)` es local a la
     TRANSACCIÓN, no a la función: sin restaurarlo, esta llamada le deja la
     identidad puesta a todo lo que siga en la misma transacción. En la edge no
     se nota —una RPC es una transacción— pero **mi propio cinturón se
     contaminó con eso**: después del primer verde, `auth.uid()` ya no era
     null y un rojo dejó de rebotar. *Un efecto lateral que sólo aparece
     cuando alguien encadena dos llamadas es el que nadie va a diagnosticar.* */
  if auth.uid() is null then
    v_adoptada := true;
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  end if;

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
       where p.user_id = v_uid
         and p.estado not in ('entregado','cancelado_cliente','cancelado_vendedor','cancelado_sistema')),

    'memoria', (select coalesce(jsonb_agg(jsonb_build_object(
                   'id', id, 'hecho', hecho, 'fuente', fuente, 'creado_en', creado_en
                 ) order by creado_en), '[]'::jsonb)
                 from coach_memoria where mascota_id = p_mascota_id and activo)
  );

  -- la identidad prestada se devuelve
  if v_adoptada then
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
  end if;

  return v_ctx;
end;
$function$;


-- Los avisos, por mascota y con actor
create or replace function public.obtener_avisos_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid; v jsonb;
begin
  v_uid := public._coach_puerta(p_mascota_id, p_user_id);
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'mascota_id', a.mascota_id, 'mascota', m.nombre,
           'tipo', a.tipo, 'fecha', a.fecha, 'detalle', a.detalle)
         order by a.creado_en desc), '[]'::jsonb)
    into v
    from avisos_coach a join mascotas m on m.id = a.mascota_id
   where a.mascota_id = p_mascota_id and a.leido_en is null
     and a.fecha > public.hoy_local() - 7;
  return jsonb_build_object('ok', true, 'avisos', v);
end $function$;

revoke all on function public.obtener_contexto_coach(uuid, uuid) from public, anon;
revoke all on function public.obtener_avisos_coach(uuid, uuid) from public, anon;
grant execute on function public.obtener_contexto_coach(uuid, uuid) to authenticated, service_role;
grant execute on function public.obtener_avisos_coach(uuid, uuid) to authenticated, service_role;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_otro uuid; v_r jsonb; v_rebotes int := 0;
begin
  select fm.user_id into v_otro from familia_miembro fm
   where fm.familia_id <> (select familia_id from mascotas where id = v_thor) limit 1;

  -- VERDE 1 · como SISTEMA (rol de la conexión ≠ authenticated): pasa
  v_r := public.obtener_contexto_coach(v_thor, v_titular);
  if v_r->'mascota'->>'nombre' <> 'Thor' then
    raise exception 'CINTURON: el actor de sistema no pudo leer el contexto';
  end if;

  -- ROJO 1 · como sistema, un usuario que NO es de la familia
  if v_otro is not null then
    begin perform public.obtener_contexto_coach(v_thor, v_otro);
    exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  else v_rebotes := v_rebotes + 1; end if;

  -- ROJO 2 · sin uid y sin parámetro
  begin perform public.obtener_contexto_coach(v_thor, null);
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  /* 🔴 EL ROJO QUE JUSTIFICA TODO EL DISEÑO: con sesión real, pretender ser
     otro rebota. *Sin este brazo, `p_user_id` sería un formulario de
     suplantación con forma de parámetro.* */
  if v_otro is not null then
    begin perform public.obtener_contexto_coach(v_thor, v_otro);
      raise exception 'CINTURON: un usuario logueado pudo hacerse pasar por otro';
    exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  else v_rebotes := v_rebotes + 1; end if;

  -- VERDE 2 · con sesión real y sin parámetro, sigue andando
  if (public.obtener_contexto_coach(v_thor))->'mascota'->>'nombre' <> 'Thor' then
    raise exception 'CINTURON: la firma de un argumento dejó de andar';
  end if;

  if v_rebotes <> 3 then raise exception 'CINTURON: se esperaban 3 rebotes y hubo %', v_rebotes; end if;

  raise notice 'CINTURON OK · sistema pasa · sistema con usuario ajeno rebota · logueado suplantando rebota';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
