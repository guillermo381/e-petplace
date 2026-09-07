-- ============================================================================
-- S113-A · 2.1 · A3 y A4 — EL «CONTANOS» Y LA SUGERENCIA
--
-- ── A3 · UNA PUERTA QUE ELIGE PUERTA ────────────────────────────────────────
-- La familia escribe libre; **D clasifica** y propone; con el sí, esto lo
-- guarda. Y no guarda: **despacha** a la puerta de familia que corresponde,
-- cada una con su procedencia y su `modo_captura` ya resueltos.
--
-- 🔴 **NO SE ESCRIBE NADA NUEVO ACÁ, y es la decisión.** Sería más corto meter
-- el INSERT directo por clase, y sería la tercera vez esta sesión que dos
-- caminos escriben la misma tabla. *Cada hecho tiene una sola puerta; ésta
-- elige cuál, no la reemplaza* — así, el día que la puerta de alergias gane un
-- guard, lo gana también lo que entra por el chat.
--
-- ⚠️ **`medico` NUNCA entra confirmado.** La familia observa; confirmar es del
-- veterinario. Lo garantiza la puerta de abajo (`declarar_condicion_familia`
-- fuerza `sospechada`) y lo verifica el cinturón: *una garantía que sólo vive
-- en el que llama se pierde el día que llame otro.*
--
-- ── A4 · LA SUGERENCIA, Y LO QUE **NO** DEVUELVE ───────────────────────────
-- El brief pedía `{ por_resolver, sugerencia }`. **`por_resolver` NO se
-- devuelve**, y es a propósito: el conteo ya existe, firmado por la mesa, en
-- `apps/cliente/src/lib/pendientes.ts` — cinco clases, con `cita` fuera porque
-- «lo que se nombra resolver no puede incluir algo que no se resuelve».
-- Recalcularlo en SQL crearía **dos verdades** para el mismo número, y la
-- divergencia aparecería recién cuando alguien cambiara una sola de las dos.
-- *Esa lib existe justamente para impedir que el Hogar cuente seis y el perfil
-- cinco.* ⇒ acá sólo nace lo que faltaba: **el próximo hito, UNO** (LOYALTY §2).
--
-- 76(g): **NO RIGE.**
-- ============================================================================

/* 🔴 UNA SOBRECARGA QUE QUEDÓ VIVA, y es la TERCERA vez esta sesión con la
   misma clase. `_coach_puerta(uuid)` y `_coach_puerta(uuid, uuid default null)`
   conviven, y **toda llamada de un argumento es ambigua** (`is not unique`) —
   así que las puertas de memoria e hilo dejaron de resolver.
   *En Postgres, agregar un parámetro con DEFAULT no ensancha una función:
   crea una segunda que compite con la primera en la misma aridad.* La regla
   es la misma que ya se aplicó al contexto: **se REEMPLAZA, no se convive.** */
drop function if exists public._coach_puerta(uuid);

create or replace function public.guardar_hecho_clasificado(
  p_mascota_id uuid, p_clase text, p_texto text, p_campos jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_r jsonb;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;
  if p_texto is null or length(trim(p_texto)) = 0 then
    raise exception 'texto_requerido' using errcode='22023';
  end if;

  case p_clase
    when 'comportamiento' then
      v_r := public.registrar_observacion_comportamiento(p_mascota_id, p_texto);

    when 'rasgo' then
      /* Un rasgo es lo que Nexo tiene que recordar («es glotón», «le teme a
         los truenos»), no un evento del expediente clínico. Va a la memoria,
         y **como `familia`**: lo escribió una persona, no lo propuso el
         modelo. */
      v_r := public.agregar_memoria_coach(p_mascota_id, p_texto, 'familia');

    when 'medico' then
      /* Con un alérgeno nombrado es una alergia; si no, una condición. Las dos
         entran `sospechada` por sus propias puertas — acá no se elige eso. */
      if coalesce(p_campos->>'alergeno', '') <> '' then
        v_r := public.declarar_alergia_familia(
                 p_mascota_id, p_campos->>'alergeno',
                 coalesce(p_campos->>'severidad', 'leve'),
                 nullif(p_texto, ''), null);
      else
        v_r := public.declarar_condicion_familia(
                 p_mascota_id, coalesce(nullif(p_campos->>'condicion',''), left(p_texto, 120)),
                 p_texto, null);
      end if;

    when 'recuerdo' then
      v_r := public.registrar_recuerdo_familia(
               p_mascota_id, p_texto,
               nullif(p_campos->>'fecha','')::date,
               nullif(p_campos->>'foto_url',''));

    else
      raise exception 'clase_invalida: %', coalesce(p_clase,'(vacía)') using errcode='22023';
  end case;

  return jsonb_build_object('ok', true, 'clase', p_clase, 'resultado', v_r);
end $function$;

create or replace function public.obtener_sugerencia_conociendolo(p_mascota_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_m record; v_tiene_memoria boolean; v_tiene_peso boolean;
        v_tiene_comportamiento boolean; v_tiene_recuerdo boolean;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;

  select nombre, especie, raza, fecha_nacimiento, estado_vida
    into v_m from mascotas where id = p_mascota_id;

  /* En memorial no se sugiere nada. *Pedirle a alguien que complete el
     expediente de un animal que murió es la peor forma de acompañar.* */
  if v_m.estado_vida is distinct from 'activa' then
    return jsonb_build_object('ok', true, 'sugerencia', null);
  end if;

  select exists(select 1 from coach_memoria where mascota_id=p_mascota_id and activo),
         exists(select 1 from evento_peso_medicion where mascota_id=p_mascota_id),
         exists(select 1 from eventos_mascota where mascota_id=p_mascota_id and tipo='observacion_comportamiento'),
         exists(select 1 from eventos_mascota where mascota_id=p_mascota_id and tipo='recuerdo_familia')
    into v_tiene_memoria, v_tiene_peso, v_tiene_comportamiento, v_tiene_recuerdo;

  /* 🔴 UNO SOLO, y en este orden (LOYALTY §2). *Una lista de cinco huecos es
     una lista de deberes; uno solo es una invitación.* El orden va de lo que
     más cambia lo que Nexo puede decir a lo que menos. */
  return jsonb_build_object('ok', true, 'sugerencia',
    case
      when v_m.fecha_nacimiento is null then jsonb_build_object(
        'clase', 'nacimiento', 'texto', '¿Sabés cuándo nació ' || v_m.nombre || '?',
        'porque', 'Con la fecha puedo decirte en qué momento de su vida está.')
      when v_m.raza is null then jsonb_build_object(
        'clase', 'raza', 'texto', '¿Qué raza es ' || v_m.nombre || '?',
        'porque', 'Con la raza sé qué conviene chequear a cada edad.')
      when not v_tiene_comportamiento then jsonb_build_object(
        'clase', 'comportamiento', 'texto', 'Contame algo del carácter de ' || v_m.nombre,
        'porque', 'Lo que me cuentes lo uso para acompañarlo mejor.')
      when not v_tiene_peso then jsonb_build_object(
        'clase', 'peso', 'texto', '¿Cuánto pesa ' || v_m.nombre || '?',
        'porque', 'Con dos pesos puedo ver si está estable.')
      when not v_tiene_memoria then jsonb_build_object(
        'clase', 'rasgo', 'texto', '¿Qué hace único a ' || v_m.nombre || '?',
        'porque', 'Lo tengo presente cada vez que hablamos de él.')
      when not v_tiene_recuerdo then jsonb_build_object(
        'clase', 'recuerdo', 'texto', 'Guardá un recuerdo de ' || v_m.nombre,
        'porque', 'Su vida no es sólo lo clínico.')
      else null   -- no hay nada que pedir, y eso también se dice
    end);
end $function$;

revoke all on function public.guardar_hecho_clasificado(uuid,text,text,jsonb) from public, anon;
revoke all on function public.obtener_sugerencia_conociendolo(uuid) from public, anon;
grant execute on function public.guardar_hecho_clasificado(uuid,text,text,jsonb) to authenticated;
grant execute on function public.obtener_sugerencia_conociendolo(uuid) to authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_sombra uuid := '93553b79-8b8b-4f66-821c-124244f1a2b9';
  v_r jsonb; v_rebotes int := 0; v_cond text;
  v_marca text := 'ZZ-' || substr(md5(random()::text),1,6);
begin
  begin perform public.guardar_hecho_clasificado(v_thor,'rasgo','x');
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  begin perform public.guardar_hecho_clasificado(v_thor,'inventada','x');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  begin perform public.guardar_hecho_clasificado(v_thor,'rasgo','   ');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  if v_rebotes <> 3 then raise exception 'CINTURON: se esperaban 3 rebotes y hubo %', v_rebotes; end if;

  -- las cuatro clases, por su puerta
  v_r := public.guardar_hecho_clasificado(v_thor,'comportamiento','Le teme a los truenos ' || v_marca);
  if (v_r->>'ok')::boolean is not true then raise exception 'CINTURON: comportamiento'; end if;
  v_r := public.guardar_hecho_clasificado(v_thor,'rasgo','Es glotón ' || v_marca);
  if (v_r->>'ok')::boolean is not true then raise exception 'CINTURON: rasgo'; end if;
  v_r := public.guardar_hecho_clasificado(v_thor,'recuerdo','Hoy corrió en la playa ' || v_marca);
  if (v_r->>'ok')::boolean is not true then raise exception 'CINTURON: recuerdo'; end if;

  /* 🔴 EL ROJO DEL BRIEF · `medico` NUNCA confirmada */
  v_r := public.guardar_hecho_clasificado(v_thor,'medico','Le cuesta subir escaleras ' || v_marca,
                                          jsonb_build_object('condicion','ZZ-cond-' || v_marca));
  select estado into v_cond from evento_condicion_cronica_diagnosticada
   where id = ((v_r->'resultado')->>'id')::uuid;
  if v_cond <> 'sospechada' then
    raise exception 'CINTURON: `medico` entró como % — la familia no confirma diagnósticos', v_cond;
  end if;

  -- la sugerencia: UNA sola, y en memorial ninguna
  if jsonb_typeof(public.obtener_sugerencia_conociendolo(v_thor)->'sugerencia') not in ('object','null') then
    raise exception 'CINTURON: la sugerencia debe ser UNA o ninguna';
  end if;
  if public.obtener_sugerencia_conociendolo(v_sombra)->'sugerencia' <> 'null'::jsonb then
    raise exception 'CINTURON: se sugirió completar el expediente de una mascota en memorial';
  end if;

  /* Y el control que evita la CUARTA vez: ninguna función de coach puede
     tener dos versiones llamables con la misma cantidad de argumentos. */
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like '%coach%'
     group by p.proname
    having count(*) > 1
       and max(p.pronargs) - max(p.pronargdefaults) <= min(p.pronargs)
       and min(p.pronargs) >= max(p.pronargs) - max(p.pronargdefaults)
       and count(distinct p.pronargs) > 0
       and bool_or(p.pronargdefaults > 0)
  ) then
    -- se nombra cuál, para que curarlo no exija volver a censar
    raise exception 'CINTURON: sobrecarga ambigua viva en %',
      (select string_agg(distinct proname, ', ') from pg_proc p
        join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and proname like '%coach%'
       group by proname having count(*) > 1 and bool_or(pronargdefaults > 0));
  end if;

  raise notice 'CINTURON OK · 3 rojos · las cuatro clases por su puerta · medico sospechada · memorial sin sugerencia · cero sobrecargas ambiguas';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
