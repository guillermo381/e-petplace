-- ════════════════════════════════════════════════════════════════════════
-- D-656 (S89-C) — LA CÁSCARA VACÍA SE RETOMA, JAMÁS BLOQUEA
-- Cura FIRMADA por el founder (4-ago-2026, opción 1): «B.2 distingue una
-- pendiente_validacion SIN USO: la cáscara vacía se retoma o se reemplaza,
-- JAMÁS bloquea el flujo legítimo. Una cuenta que nunca se validó ni se usó
-- no es una cuenta: es un formulario a medio llenar.»
--
-- EL BLOQUEO, REPRODUCIDO ANTES DE CURAR (regla del literal primero,
-- fixture in-txn 6-ago-2026, residuo 0): user real con cáscara
-- pendiente_validacion + datos_bancarios '{}' llamó al RPC por el camino
-- del JWT → success=f · «Ya tienes una cuenta comercial registrada. No
-- puedes crear otra desde este flujo.» — su único intento, consumido.
--
-- LA FORMA DE «SIN USO» (L-169 — la cura no depende del censo): el helper
-- `_cuenta_comercial_tiene_uso` recorre EN VIVO las FKs entrantes de
-- `cuentas_comerciales` contra pg_constraint (hoy 21 tablas; toda FK futura
-- entra sola, sin re-censar). Conservador por construcción: cualquier fila
-- referenciante = uso = el rebote de siempre. Consecuencia medida sobre las
-- 3 pendiente_validacion vivas: las enganchadas a un prestador (Satori,
-- Carlos) TIENEN uso y siguen protegidas por el rebote — no son cáscaras.
--
-- 76(g): NO RIGE — DDL de funciones, sin backfill, cero escritura de datos.
-- BUNDLES VIVOS (D-662): la firma y el RETURNS de
--   crear_cuenta_comercial_inicial NO cambian. Los bundles que la llaman
--   reciben, en el caso cáscara, un success donde antes recibían rebote —
--   eso ES la cura, compatible hacia atrás. Ningún otro caller cambia.
-- REVERSA: docs/relevamientos/2026-08-06-s89c-REVERSA-d656.sql (ANTES).
-- LO QUE ESTA MIGRACIÓN NO CURA (alcance de la ficha): la celda
--   incondicional de cuenta/index.tsx que OFRECE la puerta — superficie,
--   viaja con el lote de roles/barra de tres.
-- ════════════════════════════════════════════════════════════════════════

-- ① EL HELPER: ¿la cuenta tiene uso? — dinámico contra pg_constraint.
CREATE OR REPLACE FUNCTION public._cuenta_comercial_tiene_uso(p_cuenta_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  r record;
  v_existe boolean;
BEGIN
  FOR r IN
    SELECT rel.relname AS tabla, att.attname AS columna
    FROM pg_constraint c
    JOIN pg_class rel      ON rel.oid = c.conrelid
    JOIN pg_namespace ns   ON ns.oid = rel.relnamespace
    JOIN pg_class ref      ON ref.oid = c.confrelid
    JOIN pg_namespace nsr  ON nsr.oid = ref.relnamespace
    CROSS JOIN LATERAL unnest(c.conkey) AS ck(attnum)
    JOIN pg_attribute att  ON att.attrelid = c.conrelid AND att.attnum = ck.attnum
    WHERE nsr.nspname = 'public'
      AND ref.relname = 'cuentas_comerciales'
      AND c.contype = 'f'
      AND ns.nspname = 'public'
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I = $1)', r.tabla, r.columna)
      INTO v_existe USING p_cuenta_id;
    IF v_existe THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

-- L-140: helper interno — se invoca SOLO desde el DEFINER de abajo (corre
-- como owner); nadie lo llama por PostgREST. Cero grants de aplicación.
REVOKE EXECUTE ON FUNCTION public._cuenta_comercial_tiene_uso(uuid) FROM PUBLIC, anon, authenticated;

-- ② B.2 DISTINGUE LA CÁSCARA. Firma y RETURNS idénticos (L-119: cero
-- sobrecarga). Los caminos A, B, G, C+D+E quedan byte por byte; cambian
-- B.2 (el guard habla por caso), F (excluye la propia cáscara) y el
-- cierre (INSERT o RETOMA según el caso).
CREATE OR REPLACE FUNCTION public.crear_cuenta_comercial_inicial(p_country_code text, p_tipo_fiscal tipo_fiscal_enum, p_identificacion_fiscal text, p_razon_social text, p_nombre_comercial text)
 RETURNS TABLE(success boolean, cuenta_comercial_id uuid, mensaje text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid              uuid := auth.uid();
  v_country_code          text := upper(p_country_code);
  v_identificacion_trim   text := trim(p_identificacion_fiscal);
  v_razon_social_trim     text := trim(p_razon_social);
  v_nombre_comercial_trim text := trim(p_nombre_comercial);
  v_tipo_fiscal_text      text := p_tipo_fiscal::text;

  v_profile_existe        boolean;

  -- D-656: la cuenta previa se mira POR CASO, no por existencia
  v_cuenta_previa_id      uuid;
  v_cuenta_previa_estado  estado_cuenta_comercial_enum;

  v_pais_activo           boolean;
  v_pais_tipos            text[];
  v_pais_mascaras         jsonb;
  v_pais_moneda           text;

  v_mascara_regex         text;
  v_existe_duplicado      boolean;
  v_nuevo_id              uuid;
BEGIN
  -- A) Sesión válida
  IF v_auth_uid IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Sesión no válida. Inicia sesión para continuar.';
    RETURN;
  END IF;

  -- B) Profile existe
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_auth_uid)
  INTO v_profile_existe;

  IF NOT v_profile_existe THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Tu perfil no fue encontrado. Contacta a soporte.';
    RETURN;
  END IF;

  -- B.2) D-656 (cura firmada, opción 1): la cuenta previa DISTINGUE el caso.
  --  · validada/usada → el rebote de siempre (una cuenta real no se pisa).
  --  · pendiente_validacion SIN USO → cáscara vacía: SE RETOMA abajo, tras
  --    pasar TODAS las guardas de siempre sobre los datos nuevos.
  SELECT cc.id, cc.estado
  INTO v_cuenta_previa_id, v_cuenta_previa_estado
  FROM public.cuentas_comerciales cc
  WHERE cc.owner_profile_id = v_auth_uid;

  IF v_cuenta_previa_id IS NOT NULL THEN
    IF v_cuenta_previa_estado <> 'pendiente_validacion'
       OR public._cuenta_comercial_tiene_uso(v_cuenta_previa_id) THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'Ya tienes una cuenta comercial registrada. No puedes crear otra desde este flujo.';
      RETURN;
    END IF;
    -- cáscara vacía confirmada: el flujo sigue y el cierre la retoma.
  END IF;

  -- G) Campos de texto no vacíos
  IF v_razon_social_trim IS NULL OR length(v_razon_social_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'La razón social es obligatoria.';
    RETURN;
  END IF;

  IF v_nombre_comercial_trim IS NULL OR length(v_nombre_comercial_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El nombre comercial es obligatorio.';
    RETURN;
  END IF;

  IF v_identificacion_trim IS NULL OR length(v_identificacion_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'La identificación fiscal es obligatoria.';
    RETURN;
  END IF;

  -- C+D+E) País + tipo fiscal + máscara
  SELECT cp.activo, cp.tipos_fiscales_soportados, cp.mascara_id_fiscal, cp.moneda_default
  INTO v_pais_activo, v_pais_tipos, v_pais_mascaras, v_pais_moneda
  FROM public.cat_paises cp
  WHERE cp.codigo_iso2 = v_country_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'País no soportado.';
    RETURN;
  END IF;

  IF NOT v_pais_activo THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El país seleccionado no está disponible para registro en este momento.';
    RETURN;
  END IF;

  IF NOT (v_tipo_fiscal_text = ANY (v_pais_tipos)) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Este tipo de identificación fiscal no está habilitado para el país seleccionado.';
    RETURN;
  END IF;

  v_mascara_regex := v_pais_mascaras ->> v_tipo_fiscal_text;
  IF v_mascara_regex IS NULL OR length(v_mascara_regex) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'No hay máscara de validación configurada para este tipo de identificación. Contacta a soporte.';
    RETURN;
  END IF;

  IF v_identificacion_trim !~ v_mascara_regex THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El formato de la identificación fiscal no es válido para el país y tipo seleccionados.';
    RETURN;
  END IF;

  -- F) Identificación disponible — excluyendo la PROPIA cáscara (si la
  -- retoma trae la misma identificación, no es un duplicado: es su fila).
  SELECT EXISTS (
    SELECT 1
    FROM public.cuentas_comerciales cc
    WHERE cc.country_code = v_country_code
      AND cc.identificacion_fiscal = v_identificacion_trim
      AND (v_cuenta_previa_id IS NULL OR cc.id <> v_cuenta_previa_id)
  )
  INTO v_existe_duplicado;

  IF v_existe_duplicado THEN
    RETURN QUERY SELECT
      false,
      NULL::uuid,
      'Esta identificación fiscal ya está registrada en e-PetPlace. Si es tu cuenta, inicia sesión. Si crees que alguien usó tu identificación sin autorización, contáctanos.';
    RETURN;
  END IF;

  -- LA RETOMA (D-656): la cáscara conserva su id (y sus datos_bancarios,
  -- que son de la misma persona); los datos fiscales son los del wizard
  -- de hoy; estado sigue pendiente_validacion (el ciclo de validación
  -- del admin arranca de cero igual que un alta nueva); el rastro queda
  -- en metadata.
  IF v_cuenta_previa_id IS NOT NULL THEN
    UPDATE public.cuentas_comerciales SET
      tipo_fiscal           = p_tipo_fiscal,
      identificacion_fiscal = v_identificacion_trim,
      razon_social          = v_razon_social_trim,
      nombre_comercial      = v_nombre_comercial_trim,
      country_code          = v_country_code,
      moneda                = v_pais_moneda,
      metadata              = metadata || '{"retomada_via": "wizard_d656"}'::jsonb
    WHERE id = v_cuenta_previa_id;

    RETURN QUERY SELECT true, v_cuenta_previa_id, NULL::text;
    RETURN;
  END IF;

  -- INSERT (el camino de siempre, byte por byte)
  INSERT INTO public.cuentas_comerciales (
    owner_profile_id,
    tipo_fiscal,
    identificacion_fiscal,
    razon_social,
    nombre_comercial,
    country_code,
    moneda,
    estado,
    datos_bancarios,
    metadata
  ) VALUES (
    v_auth_uid,
    p_tipo_fiscal,
    v_identificacion_trim,
    v_razon_social_trim,
    v_nombre_comercial_trim,
    v_country_code,
    v_pais_moneda,
    'pendiente_validacion',
    '{}'::jsonb,
    '{"created_via": "wizard"}'::jsonb
  )
  RETURNING id INTO v_nuevo_id;

  RETURN QUERY SELECT true, v_nuevo_id, NULL::text;
END;
$function$;

-- (el proacl de crear_cuenta_comercial_inicial NO se toca: OR REPLACE
-- conserva el ACL vivo — authenticated=X, sin anon. La sonda L-140
-- post-migración verifica AMBAS funciones.)
