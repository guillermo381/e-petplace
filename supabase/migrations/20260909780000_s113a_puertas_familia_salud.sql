-- ============================================================================
-- S113-A · LO QUE LA FAMILIA SABE Y NO TENÍA DÓNDE PONER
--
-- ── EL CENSO, antes de escribir ─────────────────────────────────────────────
-- `pg_proc` por CUERPO (`alergia`, `comportamiento`, `condicion_cronica`):
--   · `declarar_sin_alergias_conocidas` — declara la AUSENCIA, no una alergia.
--   · `registrar_entendimiento_alergia` — es de la despensa (la familia
--     entiende que un producto trae un alérgeno). Otra pregunta.
--   · `sedimentar_nota_clinica` — el VETERINARIO escribe alergias.
-- ⇒ **Ninguna puerta de familia.** Nada que ensanchar, nada que duplicar.
--
-- Las tablas ya admiten a la familia: `evento_alergia_diagnosticada` y
-- `evento_condicion_cronica_diagnosticada` tienen `prestador_id` **nullable**
-- (a diferencia de `evento_archivo_adjunto`, que no). Y
-- `observacion_comportamiento` existe como tipo con `tabla_tipada` NULL: su
-- detalle vive en `eventos_mascota.datos`.
--
-- 🔴 **LA FAMILIA DECLARA `'sospechada'`, NUNCA `'confirmada'`, y es LA
-- decisión de esta migración.** Que a un perro se le hinche la cara con pollo
-- es un hecho que la familia observó y que **tiene que estar en el
-- expediente**; llamarlo diagnóstico sería otra cosa. Con `'sospechada'`:
--   · la franja de seguridad **la muestra** (el pasaporte y el perfil ya leen
--     todo lo que no esté `resuelta`/`descartada`),
--   · y el plan y guardería **no la tratan como diagnóstico**, porque miran el
--     estado.
-- *La procedencia sola no alcanzaba: un lector que filtra por «tiene alergia»
-- no mira quién lo dijo. El estado sí lo mira todo el mundo.*
--
-- ⚠️ Y la severidad **la elige la familia entre las cuatro del CHECK**, sin
-- default. *Poner «leve» por comodidad sería inventar un dato clínico en el
-- único campo que decide si alguien corre a una clínica.*
--
-- 76(g): **NO RIGE.** Funciones nuevas, sin backfill.
-- ============================================================================

create or replace function public.registrar_observacion_comportamiento(
  p_mascota_id uuid, p_texto text, p_fecha timestamptz default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_country text; v_evento uuid; v_marcados int; v_fecha timestamptz;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;
  if p_texto is null or length(trim(p_texto)) = 0 then
    raise exception 'texto_requerido' using errcode='22023';
  end if;
  if length(trim(p_texto)) > 1000 then
    raise exception 'texto_muy_largo' using errcode='22023';
  end if;

  v_fecha := coalesce(p_fecha, now());
  if v_fecha > now() + interval '1 minute' then
    raise exception 'fecha_futura' using errcode='22023';
  end if;

  select country_code into v_country from mascotas where id = p_mascota_id;

  /* El tipo existe con `tabla_tipada` NULL: el detalle vive en `datos`, y por
     eso el evento se escribe directo en vez de por una tabla tipada. */
  insert into eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
                               creado_por_user_id, country_code, datos, procedencia)
  values (p_mascota_id, 'observacion_comportamiento', 'comportamiento', v_fecha,
          auth.uid(), v_country,
          jsonb_build_object('texto', trim(p_texto)), 'declarado_por_familia')
  returning id into v_evento;

  v_marcados := public._marcar_modo_captura_evento(array[v_evento], 'tecleado');
  if v_marcados <> 1 then raise exception 'marca_incompleta: % de 1', v_marcados; end if;

  return jsonb_build_object('ok', true, 'evento_id', v_evento);
end $function$;

create or replace function public.declarar_alergia_familia(
  p_mascota_id uuid, p_alergeno text, p_severidad text,
  p_reaccion text default null, p_desde date default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_country text; v_id uuid; v_evento uuid; v_marcados int;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;
  if p_alergeno is null or length(trim(p_alergeno)) = 0 then
    raise exception 'alergeno_requerido' using errcode='22023';
  end if;
  if p_severidad is null or p_severidad not in ('leve','moderada','severa','anafilactica') then
    raise exception 'severidad_invalida: %', coalesce(p_severidad,'(vacía)') using errcode='22023';
  end if;
  if p_desde is not null and p_desde > public.hoy_local() then
    raise exception 'fecha_futura' using errcode='22023';
  end if;

  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into evento_alergia_diagnosticada
    (mascota_id, country_code, alergeno, severidad, reaccion_descripcion,
     fecha_diagnostico, estado, metodo_diagnostico)
  values
    (p_mascota_id, v_country, trim(p_alergeno), p_severidad,
     nullif(trim(coalesce(p_reaccion,'')),''),
     coalesce(p_desde, public.hoy_local()),
     -- ⭐ la familia OBSERVA; confirmar es del veterinario
     'sospechada',
     'observacion_de_la_familia')
  returning id, evento_id into v_id, v_evento;

  v_marcados := public._marcar_modo_captura_evento(array[v_evento], 'tecleado');
  if v_marcados <> 1 then raise exception 'marca_incompleta: % de 1', v_marcados; end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'evento_id', v_evento, 'estado', 'sospechada');
end $function$;

/* 🔴 LA CONDICIÓN NO TENÍA «sospechada», y la asumí igual a su tabla hermana.
   El CHECK admitía `activa | controlada | remitida | descartada`: sin un
   estado de observación, la familia sólo podía marcarla **activa** — o sea,
   declararla como diagnóstico, que es exactamente lo que esta migración evita
   en la alergia. *Dos tablas hermanas no comparten vocabulario porque se
   parezcan: hay que mirarlo.*
   Se agrega el valor, **aditivo**. Censado antes: su único lector es
   `sedimentar_nota_clinica` (el vet, que escribe `activa`), y ninguna función
   ni wrapper filtra por el estado — así que un valor nuevo no cambia lo que
   nadie ya lee. */
alter table public.evento_condicion_cronica_diagnosticada
  drop constraint if exists chk_condicion_estado;
alter table public.evento_condicion_cronica_diagnosticada
  add constraint chk_condicion_estado
  check (estado = any (array['sospechada','activa','controlada','remitida','descartada']));

create or replace function public.declarar_condicion_familia(
  p_mascota_id uuid, p_condicion text,
  p_descripcion text default null, p_desde date default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_country text; v_id uuid; v_evento uuid; v_marcados int;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode='42501';
  end if;
  if p_condicion is null or length(trim(p_condicion)) = 0 then
    raise exception 'condicion_requerida' using errcode='22023';
  end if;
  if p_desde is not null and p_desde > public.hoy_local() then
    raise exception 'fecha_futura' using errcode='22023';
  end if;

  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into evento_condicion_cronica_diagnosticada
    (mascota_id, country_code, condicion, diagnostico_descripcion,
     fecha_diagnostico, estado)
  values
    (p_mascota_id, v_country, trim(p_condicion),
     nullif(trim(coalesce(p_descripcion,'')),''),
     coalesce(p_desde, public.hoy_local()), 'sospechada')
  returning id, evento_id into v_id, v_evento;

  v_marcados := public._marcar_modo_captura_evento(array[v_evento], 'tecleado');
  if v_marcados <> 1 then raise exception 'marca_incompleta: % de 1', v_marcados; end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'evento_id', v_evento, 'estado', 'sospechada');
end $function$;

do $$
declare f text;
begin
  foreach f in array array[
    'registrar_observacion_comportamiento(uuid,text,timestamptz)',
    'declarar_alergia_familia(uuid,text,text,text,date)',
    'declarar_condicion_familia(uuid,text,text,date)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_r jsonb; v_rebotes int := 0; v_estado text; v_proc text;
  v_ale text := 'ZZ-control-' || substr(md5(random()::text),1,6);
begin
  begin perform public.declarar_alergia_familia(v_thor, 'x', 'leve');
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  begin perform public.declarar_alergia_familia(v_thor, 'x', 'gravisima');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  begin perform public.declarar_alergia_familia(v_thor, '  ', 'leve');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  begin perform public.registrar_observacion_comportamiento(v_thor, '');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  if v_rebotes <> 4 then raise exception 'CINTURON: se esperaban 4 rebotes y hubo %', v_rebotes; end if;

  -- VERDE · la alergia entra SOSPECHADA y con procedencia de familia
  v_r := public.declarar_alergia_familia(v_thor, v_ale, 'moderada', 'Se le hincha la cara.');
  select estado into v_estado from evento_alergia_diagnosticada where id = (v_r->>'id')::uuid;
  if v_estado <> 'sospechada' then
    raise exception 'CINTURON: la familia no puede confirmar un diagnóstico, y entró como %', v_estado;
  end if;
  select procedencia into v_proc from eventos_mascota where id = (v_r->>'evento_id')::uuid;
  if v_proc <> 'declarado_por_familia' then
    raise exception 'CINTURON: procedencia %', v_proc;
  end if;
  if (select modo_captura from eventos_mascota where id=(v_r->>'evento_id')::uuid) <> 'tecleado' then
    raise exception 'CINTURON: sin modo_captura';
  end if;

  /* 🔴 EL ROJO QUE JUSTIFICA `sospechada`: la franja de seguridad SÍ la ve
     (el perfil no filtra por estado salvo resuelta/descartada), y por eso
     tiene que verse. *Si no apareciera, la familia habría declarado algo que
     nadie va a leer cuando importe.* */
  if not exists (
    select 1 from mascota_perfil_vigente p, jsonb_array_elements(coalesce(p.alergias,'[]'::jsonb)) a
     where p.mascota_id = v_thor and a->>'alergeno' = v_ale) then
    raise exception 'CINTURON: la alergia declarada por la familia NO llega al perfil — nadie la vería';
  end if;

  -- VERDE · la observación de comportamiento
  v_r := public.registrar_observacion_comportamiento(v_thor, 'Le tiene miedo a los truenos.');
  if (select tipo from eventos_mascota where id=(v_r->>'evento_id')::uuid) <> 'observacion_comportamiento' then
    raise exception 'CINTURON: el tipo del evento no es el del catálogo';
  end if;

  -- VERDE · la condición
  v_r := public.declarar_condicion_familia(v_thor, 'ZZ-condicion-control');
  if (v_r->>'estado') <> 'sospechada' then raise exception 'CINTURON: la condición no entró sospechada'; end if;

  raise notice 'CINTURON OK · 4 rojos · alergia sospechada visible en el perfil · observación · condición';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;
