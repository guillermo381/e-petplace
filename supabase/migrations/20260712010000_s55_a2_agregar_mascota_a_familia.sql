-- ═════════════════════════════════════════════════════════════════════
-- S55-A A2 — RPC agregar_mascota_a_familia: el alta de mascota ADICIONAL
-- para una familia EXISTENTE (el onboarding S45 crea familia + primera
-- mascota una sola vez — guard familia_ya_existe; este es su hermano
-- para el hogar que crece: DISEÑO_EXPERIENCIA §11.3, multi-mascota real).
--
-- Espejo deliberado de crear_familia_con_primera_mascota (verificada con
-- pg_get_functiondef, S55): mismos guards tipados (espejo de los CHECKs
-- relevados — el error de constraint no es tipado), mismo vocabulario de
-- errores, misma inserción de mascota (pet_hash GENERATED, L-080; los
-- triggers de DB completan visibilidad/perfil/espejado). Lo que cambia:
-- la familia NO se crea — se DERIVA server-side de la membresía vigente
-- del caller (jamás por parámetro: la RLS de mascotas no es la puerta
-- de un DEFINER, y una familia_id por parámetro es un confused deputy).
--
-- Quién puede: miembro VIGENTE (hasta IS NULL) de familia tipo estandar
-- con rol adulto_titular o adulto_autorizado (un menor o un cuidador
-- externo no dan de alta; vocabulario de chk_familia_miembro_rol).
-- ═════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.agregar_mascota_a_familia(
  p_nombre_mascota   text,
  p_especie          text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha  text DEFAULT NULL::text,
  p_sexo             text DEFAULT NULL::text,
  p_foto_url         text DEFAULT NULL::text
)
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

-- L-140 (ley en dos partes): REVOKE explícito + GRANT mínimo. Los default
-- privileges ya nacen limpios (migraciones 20260710220000/221500), pero la
-- ley exige declararlo por función y verificar proacl + sonda en el gate.
REVOKE ALL ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text) TO authenticated, service_role;
