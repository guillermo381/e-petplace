-- ============================================================================
-- S91-A · LOS TRES MOTORES QUE LA LÁMINA DEL PERFIL NOMBRA (orden de mesa)
-- ============================================================================
-- Los tres los nombró el ANEXO de A al depositar la lámina, y la mesa los
-- manda construir. Van juntos porque los tres son del perfil y ninguno
-- depende de los otros: si uno se revierte, los otros dos siguen.
--
-- ── ① EL LECTOR DE LA SERIE DE PESO (P2) ───────────────────────────────────
-- La letra: «el peso SE REGISTRA con fecha, jamás se pisa — el histórico es
-- curva futura para Coach y vet». **El motor de escritura YA existía**
-- (`registrar_peso_mascota`, con su fila por medición); lo que faltaba era
-- la LECTURA de la serie. Medido antes: el perfil traía `peso_clinico_kg` de
-- `mascota_perfil_vigente`, que es **el vigente, no la curva** — o sea que la
-- promesa de la letra no tenía de dónde leerse.
--
-- `origen` se DERIVA de `prestador_id`: sin prestador lo pesó la familia en
-- casa, con prestador lo pesó un negocio. **Es dato de confianza, no
-- adorno** — una curva que mezcla básculas de casa con básculas de clínica
-- sin decir cuál es cuál invita a leer una tendencia que no existe.
--
-- ── ② `fecha_montaje` (P7) ─────────────────────────────────────────────────
-- La mesa lo dice y es exacto: **registrarse en e-PetPlace y montarse son dos
-- hechos**, y `fecha_alta` no reemplaza al segundo.
-- **MEDIDO ANTES DE CONSTRUIR, y esto cierra la pregunta de la mesa: el alta
-- NO la pregunta hoy** (grep en `components/alta/`: cero ocurrencias de
-- montaje). Así que **no es el defecto del origen** —ahí el dato se
-- preguntaba y se tiraba—: acá todavía no se pregunta. La columna nace para
-- que cuando alguna superficie la pida (el perfil, o el alta más adelante)
-- tenga dónde caer, y el parámetro viaja ya en las dos RPCs del dueño para
-- que el día que el alta la pregunte no haga falta otra migración.
-- **Solo acuarios**, por CHECK y por guard tipado: un individuo no se monta.
--
-- ── ③ `actualizar_raza_mascota` (P3) ───────────────────────────────────────
-- «raza editable con la gramática del alta». El alta escribe; el perfil
-- necesitaba SU puerta. Angosta: un solo campo, un solo gate.
-- **LA LETRA S59 RIGE IGUAL QUE EN EL ALTA: sugerir jamás imponer.** Es
-- TEXTO LIBRE y NO se valida contra `cat_razas` — validarlo mataría «Mestizo»,
-- «No sé» y la raza que el catálogo no tiene. *La coherencia entre las dos
-- puertas es la letra, no una casualidad.*
-- Y rebota tipado en un acuario (`raza_no_aplica_acuario`, el mismo código
-- que el alta) porque un acuario no tiene raza.
--
-- Veda 76(g): NO RIGE — una columna nullable sin backfill + funciones.
-- D-662: los bundles vivos llaman las dos RPCs por NOMBRE y no mandan
-- `p_fecha_montaje`; con DEFAULT NULL siguen resolviendo (el fixture lo
-- prueba con el set viejo).
-- Reversa (con sus TRES notas de datos):
--   docs/relevamientos/2026-08-08-s91a-REVERSA-tres-motores-perfil.sql
-- ============================================================================

BEGIN;

-- ── ② la columna ────────────────────────────────────────────────────────────
ALTER TABLE public.mascotas ADD COLUMN fecha_montaje date;

ALTER TABLE public.mascotas
  ADD CONSTRAINT chk_mascotas_montaje_solo_acuario
    CHECK (fecha_montaje IS NULL OR sujeto = 'acuario');

COMMENT ON COLUMN public.mascotas.fecha_montaje IS
  'S91 (P7 de la lámina del perfil): cuándo se MONTÓ el acuario. NO es fecha_alta — registrarse en e-PetPlace y montarse son dos hechos distintos, y confundirlos fabricaría dato. Solo acuarios (CHECK). El alta todavía no la pregunta: la columna y el parámetro nacen para que cuando alguna superficie la pida no haga falta otra migración.';

-- ── ① el lector de la serie ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_serie_peso(
  p_mascota_id uuid,
  p_limite integer DEFAULT 60
)
 RETURNS TABLE(fecha timestamptz, peso_kg numeric, metodo text, origen text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- La MISMA puerta que todo el expediente: no se inventa un gate nuevo.
  IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT e.fecha_medicion,
         e.peso_kg,
         e.metodo_medicion,
         -- Derivado, jamás una columna nueva: quién lo pesó cambia cómo se
         -- lee la curva.
         CASE WHEN e.prestador_id IS NULL THEN 'familia' ELSE 'prestador' END
    FROM evento_peso_medicion e
   WHERE e.mascota_id = p_mascota_id
   ORDER BY e.fecha_medicion DESC
   LIMIT greatest(1, least(coalesce(p_limite, 60), 500));
END;
$function$;

COMMENT ON FUNCTION public.obtener_serie_peso(uuid, integer) IS
  'S91 (P2): la CURVA de peso, no el vigente. El motor de escritura ya existía (registrar_peso_mascota, una fila por medición); esto es la lectura que faltaba. `origen` se deriva de prestador_id: una curva que mezcla báscula de casa con báscula de clínica sin decir cuál es cuál invita a leer una tendencia que no existe.';

-- ── ③ la puerta de la raza ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.actualizar_raza_mascota(
  p_mascota_id uuid,
  p_raza text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid  uuid := auth.uid();
  v_raza text := nullif(btrim(coalesce(p_raza, '')), '');
  v_suj  text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  -- El gate es de FAMILIA, no de acceso amplio: un prestador con acceso
  -- clínico puede LEER el expediente y no por eso escribe la identidad de la
  -- mascota. (Misma frontera que las dos RPCs del alta.)
  SELECT m.sujeto INTO v_suj
    FROM mascotas m
    JOIN familia_miembro fm ON fm.familia_id = m.familia_id
   WHERE m.id = p_mascota_id
     AND fm.user_id = v_uid
     AND fm.hasta IS NULL
     AND fm.rol IN ('adulto_titular', 'adulto_autorizado')
   LIMIT 1;

  IF v_suj IS NULL THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;

  IF v_suj = 'acuario' AND v_raza IS NOT NULL THEN
    RAISE EXCEPTION 'raza_no_aplica_acuario';
  END IF;

  UPDATE mascotas SET raza = v_raza, updated_at = now() WHERE id = p_mascota_id;

  RETURN jsonb_build_object('ok', true, 'raza', v_raza);
END;
$function$;

COMMENT ON FUNCTION public.actualizar_raza_mascota(uuid, text) IS
  'S91 (P3): la puerta de EDICIÓN de raza del perfil. TEXTO LIBRE, sin validar contra cat_razas — la letra S59 rige acá igual que en el alta: el catálogo SUGIERE, el dueño CONFIRMA; validarlo mataría «Mestizo», «No sé» y la raza que el catálogo no tiene. Gate de FAMILIA (un prestador lee el expediente, no escribe la identidad). Rebota en acuario con el mismo código que el alta.';

-- ── ② el parámetro en las dos RPCs del dueño ────────────────────────────────
DROP FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text);
DROP FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text);

CREATE FUNCTION public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text,
  p_fecha_montaje date DEFAULT NULL::date
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

  -- S91 · la fecha de MONTAJE es del acuario y de nadie mas: un individuo no
  -- se "monta". Guard tipado, espejo del CHECK de la columna.
  if p_fecha_montaje is not null and v_sujeto <> 'acuario' then
    raise exception 'fecha_montaje_solo_acuario';
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
    sujeto, tipo_agua, fecha_montaje
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua, p_fecha_montaje
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

CREATE FUNCTION public.agregar_mascota_a_familia(
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_precision_fecha text DEFAULT NULL::text,
  p_sexo text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text,
  p_raza text DEFAULT NULL::text,
  p_tipo_agua text DEFAULT NULL::text,
  p_origen text DEFAULT NULL::text,
  p_fecha_montaje date DEFAULT NULL::date
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

  -- S91 · la fecha de MONTAJE es del acuario y de nadie mas: un individuo no
  -- se "monta". Guard tipado, espejo del CHECK de la columna.
  if p_fecha_montaje is not null and v_sujeto <> 'acuario' then
    raise exception 'fecha_montaje_solo_acuario';
  end if;

  insert into mascotas (
    nombre, especie, raza, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url,
    sujeto, tipo_agua, fecha_montaje
  )
  values (
    btrim(p_nombre_mascota), p_especie, v_raza, v_origen, v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    v_sujeto, v_tipo_agua, p_fecha_montaje
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
REVOKE EXECUTE ON FUNCTION public.obtener_serie_peso(uuid, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_serie_peso(uuid, integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.actualizar_raza_mascota(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_raza_mascota(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text, date) TO authenticated;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_acl text; v_nom text;
BEGIN
  -- L-119: una sobrecarga por nombre en las cuatro
  FOR v_nom IN SELECT unnest(ARRAY['obtener_serie_peso','actualizar_raza_mascota',
                                   'crear_familia_con_primera_mascota','agregar_mascota_a_familia'])
  LOOP
    SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname = v_nom;
    IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon_tres: % tiene % sobrecargas', v_nom, v_n; END IF;

    SELECT p.proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname = v_nom;
    IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_tres: anon en % → %', v_nom, v_acl; END IF;
  END LOOP;

  -- `p_fecha_montaje` está en LAS DOS (si el injerto falló en una, esto lo dice)
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public'
        AND p.proname IN ('crear_familia_con_primera_mascota','agregar_mascota_a_familia')
        AND pg_get_function_arguments(p.oid) LIKE '%p_fecha_montaje%') <> 2 THEN
    RAISE EXCEPTION 'cinturon_tres: p_fecha_montaje no esta en las DOS firmas';
  END IF;

  -- ③ NO valida contra el catálogo, y eso es la LETRA: si alguien "mejora"
  -- la función agregándole el chequeo, este cinturón lo caza.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='actualizar_raza_mascota'
               AND p.prosrc LIKE '%cat_razas%') THEN
    RAISE EXCEPTION 'cinturon_tres: actualizar_raza_mascota valida contra cat_razas — eso mata «Mestizo» y rompe la letra S59';
  END IF;

  -- ② el CHECK rige: un individuo no se monta (rojo producido)
  BEGIN
    UPDATE mascotas SET fecha_montaje = current_date
     WHERE sujeto = 'individuo' AND id = (SELECT id FROM mascotas WHERE sujeto='individuo' LIMIT 1);
    RAISE EXCEPTION 'cinturon_tres: un individuo acepto fecha_montaje';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- ① el lector nace sin filas propias que inventar: la serie es la que hay
  SELECT count(*) INTO v_n FROM evento_peso_medicion;
  RAISE NOTICE 'serie de peso viva: % filas', v_n;
END $$;

COMMIT;
