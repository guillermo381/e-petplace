-- ═════════════════════════════════════════════════════════════════════
-- S45-B4-datos — RPCs del onboarding dueño (decisión arquitecto S45:
-- el onboarding NO usa INSERTs directos por RLS — nace RPC atómica).
--
-- 1) mascotas.fecha_nacimiento_precision (NUEVA, nullable + CHECK):
--    relevado contra information_schema (regla 22): mascotas tiene
--    fecha_nacimiento date y sexo, pero NINGUNA columna de precisión.
--    El modelo la necesita desde S16 (perfil cobaya: "Edad estimada
--    típica — rara vez se conoce fecha exacta"); el onboarding F1
--    pregunta la fecha con esa gradación. CHECK y no enum: mismo
--    patrón de todos los vocabularios de la casa (sexo, origen, rol).
--    Nullable: las filas existentes quedan NULL (sin precisión
--    declarada) y el dato es opcional. Coherencia: precisión sin
--    fecha es inválida.
--
-- 2) crear_familia_con_primera_mascota(...) — atómica: familia
--    (estandar) + familia_miembro (adulto_titular) + mascota.
--    Guards con errores tipados (vocabulario existente de la casa:
--    especie_invalida_o_inactiva es el mismo código que levanta
--    crear_alta_asistida_*). origen='desconocido': el onboarding F1
--    no pregunta origen (valor del CHECK pensado para eso; cumple
--    mascotas_origen_coherencia_check con criadero/refugio NULL).
--    Los triggers existentes completan el resto — NO se duplican:
--    _trg_mascotas_auto_crear_visibilidad_config,
--    _trg_mascotas_crear_perfil_vigente,
--    _trg_mascotas_espejar_user_id_a_titular.
--
-- 3) get_estado_onboarding_dueno() — shape mínimo para el routing
--    del front al abrir la app: {tiene_familia, familia_id,
--    mascotas_count}.
--
-- Patrón canónico (skill epetplace-db): SECURITY DEFINER +
-- SET search_path + gate de auth + REVOKE PUBLIC + GRANT authenticated.
-- Funciones NUEVAS (sin firma previa → sin DROP, L-119 no aplica).
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) Precisión de la fecha de nacimiento ────────────────────────────────
alter table mascotas
  add column if not exists fecha_nacimiento_precision text;

alter table mascotas
  drop constraint if exists chk_mascotas_fecha_nacimiento_precision;

alter table mascotas
  add constraint chk_mascotas_fecha_nacimiento_precision check (
    (
      fecha_nacimiento_precision is null
      or fecha_nacimiento_precision in ('exacta', 'aproximada', 'estimada')
    )
    and (fecha_nacimiento_precision is null or fecha_nacimiento is not null)
  );

-- 2) crear_familia_con_primera_mascota ──────────────────────────────────
create or replace function public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date default null,
  p_precision_fecha text default null,
  p_sexo text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_miembro_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_familia, '')) = '' then
    raise exception 'nombre_familia_requerido';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- Un onboarding por user: si ya es miembro vigente de una familia
  -- estandar, el front debe mandarlo al home, no acá.
  if exists (
    select 1
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
    where fm.user_id = v_uid
      and fm.hasta is null
      and f.tipo = 'estandar'
  ) then
    raise exception 'familia_ya_existe';
  end if;

  -- Mismo guard y código que crear_alta_asistida_* (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  -- Guards tipados espejo de los CHECKs (el error de constraint no es tipado)
  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  -- familia: tipo estandar + cuenta NULL (chk_familia_virtual_tiene_cuenta),
  -- created_by_user_id seteado + created_by_sistema NULL (chk_familia_creador_xor)
  insert into familia (nombre, tipo, created_by_user_id)
  values (btrim(p_nombre_familia), 'estandar', v_uid)
  returning id into v_familia_id;

  insert into familia_miembro (familia_id, user_id, rol, motivo_alta)
  values (v_familia_id, v_uid, 'adulto_titular', 'onboarding_dueno')
  returning id into v_miembro_id;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo
  )
  values (
    btrim(p_nombre_mascota), p_especie, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$$;

revoke all on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text) from public;
grant execute on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text) to authenticated;

-- 3) get_estado_onboarding_dueno ────────────────────────────────────────
create or replace function public.get_estado_onboarding_dueno()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_mascotas   integer := 0;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  -- La familia estandar vigente del user (la más antigua si hubiera >1)
  select f.id into v_familia_id
  from familia f
  join familia_miembro fm on fm.familia_id = f.id
  where fm.user_id = v_uid
    and fm.hasta is null
    and f.tipo = 'estandar'
  order by fm.desde asc
  limit 1;

  if v_familia_id is not null then
    select count(*) into v_mascotas
    from mascotas
    where familia_id = v_familia_id;
  end if;

  return jsonb_build_object(
    'tiene_familia', v_familia_id is not null,
    'familia_id', v_familia_id,
    'mascotas_count', v_mascotas
  );
end;
$$;

revoke all on function public.get_estado_onboarding_dueno() from public;
grant execute on function public.get_estado_onboarding_dueno() to authenticated;

commit;
