-- ============================================================================
-- S91-A · LA EMISIÓN DEL HITO, ENCENDIDA — firma del founder (8-ago-2026)
-- ============================================================================
-- Las dos RPCs del dueño emiten el hito del alta. `CREATE OR REPLACE` sin
-- DROP: la FIRMA no cambia (L-119 no aplica), solo el cuerpo.
--
-- LOS BODIES NO SE RE-ESCRIBIERON A MANO: se tomaron LITERALES de la
-- migración `20260807220000` (la última que los definió) y se les injertó el
-- bloque de emisión por parche programático, con asserts de que el injerto
-- entró una sola vez en cada uno. *Re-tipear 250 líneas de plpgsql para
-- agregar 12 es cómo se pierde un guard sin que nadie lo note.*
--
-- LO QUE EL BLOQUE HACE, y las tres decisiones que lleva adentro:
--   ① la clave la decide `_clave_hito_alta` — UN solo lugar, edad
--      server-side (firma: «jamás en la pantalla»);
--   ② la clave viaja DUPLICADA en `eventos_mascota.datos->>'clave_hito'`
--      porque el lector del timeline no hace join con la hija — patrón
--      `datos->>'vacuna'` de S48, duplicación deliberada;
--   ③ el `country_code` sale de la FILA recién insertada (RETURNING), no de
--      un 'EC' escrito a mano: la mascota ya sabe su país y copiarlo a mano
--      es cómo nacen las dos verdades.
--
-- Veda 76(g): NO RIGE — cero backfill. **Las mascotas vivas NO reciben hito
-- retroactivo**: inventarles un hecho pasado sería fabricar historia.
-- D-662: los bundles vivos no leen `hito_narrativo` todavía — ver la ventana
-- declarada en la migración hermana `20260808000000`.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-hito-emision.sql
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text
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
  v_origen     text := coalesce(nullif(btrim(coalesce(p_origen, '')), ''), 'desconocido');
  v_sujeto     text;
  v_clave      text;
  v_evento_id  uuid;
  v_pais       text;
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

  -- Espejo tipado del CHECK de `mascotas.origen` (9 valores, medido).
  if v_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
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
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
  )
  returning id, pet_hash, country_code into v_mascota_id, v_pet_hash, v_pais;

  -- ── EL HITO DEL ALTA (firma founder 8-ago-2026) ──────────────────────────
  -- La clave la decide `_clave_hito_alta`: la regla vive en UN lugar y la
  -- edad se mide SERVER-SIDE, jamás en la pantalla. Viaja TAMBIÉN en `datos`
  -- porque el lector del timeline no hace join con la hija — patrón exacto
  -- de `datos->>'vacuna'` (S48), duplicación a propósito y con su porqué.
  -- El país sale de la FILA recién creada, nunca de un 'EC' escrito a mano.
  v_clave := public._clave_hito_alta(v_sujeto, p_fecha_nacimiento, p_precision_fecha);

  insert into eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id,
    country_code, procedencia, datos
  ) values (
    v_mascota_id, 'hito_narrativo', 'identidad', now(), v_uid,
    v_pais, 'declarado_por_familia', jsonb_build_object('clave_hito', v_clave)
  ) returning id into v_evento_id;

  insert into evento_hito_narrativo (evento_id, mascota_id, country_code, clave)
  values (v_evento_id, v_mascota_id, v_pais, v_clave);

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.agregar_mascota_a_familia(
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text
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
  v_origen     text := coalesce(nullif(btrim(coalesce(p_origen, '')), ''), 'desconocido');
  v_sujeto     text;
  v_clave      text;
  v_evento_id  uuid;
  v_pais       text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

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

  if v_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
  end if;

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

  insert into mascotas (
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua
  )
  returning id, pet_hash, country_code into v_mascota_id, v_pet_hash, v_pais;

  -- ── EL HITO DEL ALTA (firma founder 8-ago-2026) ──────────────────────────
  -- La clave la decide `_clave_hito_alta`: la regla vive en UN lugar y la
  -- edad se mide SERVER-SIDE, jamás en la pantalla. Viaja TAMBIÉN en `datos`
  -- porque el lector del timeline no hace join con la hija — patrón exacto
  -- de `datos->>'vacuna'` (S48), duplicación a propósito y con su porqué.
  -- El país sale de la FILA recién creada, nunca de un 'EC' escrito a mano.
  v_clave := public._clave_hito_alta(v_sujeto, p_fecha_nacimiento, p_precision_fecha);

  insert into eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id,
    country_code, procedencia, datos
  ) values (
    v_mascota_id, 'hito_narrativo', 'identidad', now(), v_uid,
    v_pais, 'declarado_por_familia', jsonb_build_object('clave_hito', v_clave)
  ) returning id into v_evento_id;

  insert into evento_hito_narrativo (evento_id, mascota_id, country_code, clave)
  values (v_evento_id, v_mascota_id, v_pais, v_clave);

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;
-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_c text;
BEGIN
  -- La regla decide bien los TRES casos (rojo producido si no).
  IF public._clave_hito_alta('acuario', NULL, NULL) <> 'mundo_nuevo_empieza' THEN
    RAISE EXCEPTION 'cinturon_hito: el acuario no cae en mundo_nuevo_empieza';
  END IF;
  IF public._clave_hito_alta('individuo', ((now() AT TIME ZONE 'America/Guayaquil')::date - 30), 'exacta')
     <> 'vida_nueva_empieza' THEN
    RAISE EXCEPTION 'cinturon_hito: un cachorro de 30 dias con fecha exacta no cae en vida_nueva_empieza';
  END IF;
  IF public._clave_hito_alta('individuo', ((now() AT TIME ZONE 'America/Guayaquil')::date - 400), 'exacta')
     <> 'llego_a_la_familia' THEN
    RAISE EXCEPTION 'cinturon_hito: un adulto no cae en llego_a_la_familia';
  END IF;
  -- EL PAR QUE PRUEBA EL UMBRAL ESTRICTO: misma fecha reciente, precisión
  -- distinta. Si estas dos dieran lo mismo, la regla de la firma no rige.
  IF public._clave_hito_alta('individuo', ((now() AT TIME ZONE 'America/Guayaquil')::date - 30), 'estimada')
     <> 'llego_a_la_familia' THEN
    RAISE EXCEPTION 'cinturon_hito: una fecha ESTIMADA reciente se colo como vida nueva';
  END IF;
  IF public._clave_hito_alta('individuo', NULL, NULL) <> 'llego_a_la_familia' THEN
    RAISE EXCEPTION 'cinturon_hito: sin fecha no cae en llego_a_la_familia';
  END IF;

  -- Las tres claves existen en el catálogo (la FK las exige al emitir).
  SELECT count(*) INTO v_n FROM cat_hitos_narrativos WHERE activo;
  IF v_n <> 3 THEN RAISE EXCEPTION 'cinturon_hito: % claves activas <> 3', v_n; END IF;

  -- Las DOS RPCs emiten (si una se quedó sin el injerto, esto lo dice).
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
   WHERE ns.nspname='public'
     AND p.proname IN ('crear_familia_con_primera_mascota','agregar_mascota_a_familia')
     AND p.prosrc LIKE '%evento_hito_narrativo%';
  IF v_n <> 2 THEN RAISE EXCEPTION 'cinturon_hito: solo % de 2 RPCs emiten el hito', v_n; END IF;

  -- L-140 tras el REPLACE (una función recreada puede recuperar grants).
  FOR v_c IN SELECT p.proacl::text FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
    WHERE ns.nspname='public'
      AND p.proname IN ('crear_familia_con_primera_mascota','agregar_mascota_a_familia')
  LOOP
    IF v_c LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_hito: anon en proacl: %', v_c; END IF;
  END LOOP;
END $$;

COMMIT;
