-- REVERSA de 20260807183000_s91a_alta_dueno_raza_y_acuario.sql
-- (escrita ANTES de aplicar — restaura los bodies VIVOS leídos con
-- pg_get_functiondef el 7-ago-2026, embebidos acá porque esta reversa es su
-- única fuente una vez aplicada la migración.)
-- Nota de datos: revertir el código NO revierte los datos — las mascotas
-- creadas con raza / los acuarios creados quedan como están (el schema los
-- sigue admitiendo; la reversa del schema es el archivo hermano).

BEGIN;

DROP FUNCTION IF EXISTS public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.crear_familia_con_primera_mascota(p_nombre_familia text, p_nombre_mascota text, p_especie text, p_fecha_nacimiento date DEFAULT NULL::date, p_precision_fecha text DEFAULT NULL::text, p_sexo text DEFAULT NULL::text, p_foto_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url
  )
  values (
    btrim(p_nombre_mascota), p_especie, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.agregar_mascota_a_familia(p_nombre_mascota text, p_especie text, p_fecha_nacimiento date DEFAULT NULL::date, p_precision_fecha text DEFAULT NULL::text, p_sexo text DEFAULT NULL::text, p_foto_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- La familia del caller: membresía VIGENTE en familia estandar con rol
  -- adulto. Una sola por diseño (guard familia_ya_existe del onboarding).
  select fm.familia_id
    into v_familia_id
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
   where fm.user_id = v_uid
     and fm.hasta is null
     and f.tipo = 'estandar'
     and fm.rol in ('adulto_titular', 'adulto_autorizado')
   limit 1;

  if v_familia_id is null then
    raise exception 'sin_familia_activa';
  end if;

  -- Mismo guard y código que el onboarding (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

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

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url
  )
  values (
    btrim(p_nombre_mascota), p_especie, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

-- L-140: las funciones recreadas vuelven a nacer con EXECUTE para anon —
-- se re-cierra igual que la migración original de cada una.
REVOKE EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text) TO authenticated;

COMMIT;
