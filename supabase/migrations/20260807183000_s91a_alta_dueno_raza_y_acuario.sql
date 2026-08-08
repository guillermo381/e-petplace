-- ============================================================================
-- S91-A · LAS DOS RPCs DEL DUEÑO GANAN RAZA — y la cláusula del pez, motor
-- ============================================================================
-- Medido antes (7-ago-2026): mascotas.raza la escriben SOLO las tres RPCs del
-- prestador (crear_alta_asistida_existente / _pendiente / crear_mascota_walkin);
-- las dos del dueño no tenían el parámetro. Esta migración se lo da.
--
--   · p_raza: TEXT LIBRE. El catálogo (cat_razas, D-379) SUGIERE en la
--     pantalla; acá NO se valida contra el catálogo A PROPÓSITO — la letra
--     dice que el dueño CONFIRMA y que «Mestizo / No sé» son primera clase.
--     Vacío/espacios → NULL honesto.
--   · Cláusula del pez (firma founder 7-ago, opción A): especie 'pez' ⟹ la
--     fila nace sujeto='acuario' — LA MARCA LA ESTAMPA EL MOTOR, el cliente
--     no la manda. El campo dos es p_tipo_agua (dulce/marino, opcional) EN
--     ESPEJO de la raza: por eso pez con p_raza rebota tipado
--     (raza_no_aplica_acuario) y no-pez con p_tipo_agua rebota
--     (tipo_agua_solo_pez).
--
-- L-119: DROP explícito de las firmas viejas (agregar parámetros con DEFAULT
-- vía CREATE OR REPLACE crearía SOBRECARGA zombi). Cinturón sobrecargas=1.
-- D-662 (bundles vivos): cliente 1.0.3 (embebido + OTA 019fde4c) llama estas
-- RPCs con los argumentos viejos NOMBRADOS (PostgREST) → resuelven contra la
-- firma nueva porque los parámetros nuevos tienen DEFAULT NULL y los nombres
-- viejos no cambian. Compatible-hacia-atrás; el fixture lo prueba llamando
-- con el set viejo de argumentos.
-- Veda 76(g): NO RIGE — cero backfill; cambia código, no datos.
-- Reversa escrita ANTES (con los bodies vivos embebidos — su única fuente):
--   docs/relevamientos/2026-08-07-s91a-REVERSA-alta-dueno-raza-acuario.sql
-- ============================================================================

BEGIN;

DROP FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text);
DROP FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text);

CREATE FUNCTION public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text
)
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
  v_raza       text := nullif(btrim(coalesce(p_raza, '')), '');
  v_tipo_agua  text := nullif(btrim(coalesce(p_tipo_agua, '')), '');
  v_sujeto     text;
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

  -- Cláusula del pez (S91, firma founder): pez ⟹ el sujeto es el ACUARIO.
  -- La marca la estampa el motor; el campo dos (tipo de agua) reemplaza a
  -- la raza — espejo de los CHECKs de mascotas (guards tipados).
  if p_especie = 'pez' then
    v_sujeto := 'acuario';
    if v_raza is not null then
      raise exception 'raza_no_aplica_acuario';
    end if;
    if v_tipo_agua is not null and v_tipo_agua not in ('dulce', 'marino') then
      raise exception 'tipo_agua_invalida';
    end if;
  else
    v_sujeto := 'individuo';
    if v_tipo_agua is not null then
      raise exception 'tipo_agua_solo_pez';
    end if;
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
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
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

CREATE FUNCTION public.agregar_mascota_a_familia(
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text
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
  v_raza       text := nullif(btrim(coalesce(p_raza, '')), '');
  v_tipo_agua  text := nullif(btrim(coalesce(p_tipo_agua, '')), '');
  v_sujeto     text;
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

  -- Cláusula del pez (S91, firma founder): pez ⟹ el sujeto es el ACUARIO.
  if p_especie = 'pez' then
    v_sujeto := 'acuario';
    if v_raza is not null then
      raise exception 'raza_no_aplica_acuario';
    end if;
    if v_tipo_agua is not null and v_tipo_agua not in ('dulce', 'marino') then
      raise exception 'tipo_agua_invalida';
    end if;
  else
    v_sujeto := 'individuo';
    if v_tipo_agua is not null then
      raise exception 'tipo_agua_solo_pez';
    end if;
  end if;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

-- L-140: toda función nueva nace con EXECUTE para anon — se cierra explícito.
REVOKE EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text) TO authenticated;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_n int;
  v_acl text;
BEGIN
  -- L-119: exactamente UNA sobrecarga por nombre (la vieja murió de verdad).
  SELECT count(*) INTO v_n FROM pg_proc p
   JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public' AND p.proname = 'crear_familia_con_primera_mascota';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_rpc: % sobrecargas de crear_familia_con_primera_mascota (esperaba 1)', v_n;
  END IF;

  SELECT count(*) INTO v_n FROM pg_proc p
   JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public' AND p.proname = 'agregar_mascota_a_familia';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_rpc: % sobrecargas de agregar_mascota_a_familia (esperaba 1)', v_n;
  END IF;

  -- L-140: proacl sin anon en las dos.
  FOR v_acl IN
    SELECT p.proacl::text FROM pg_proc p
     JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.proname IN ('crear_familia_con_primera_mascota', 'agregar_mascota_a_familia')
  LOOP
    IF v_acl LIKE '%anon=%' THEN
      RAISE EXCEPTION 'cinturon_rpc: anon sigue en proacl: %', v_acl;
    END IF;
  END LOOP;
END $$;

COMMIT;
