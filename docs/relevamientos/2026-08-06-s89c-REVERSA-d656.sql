-- REVERSA de 20260806120000_d656_la_cascara_vacia_se_retoma.sql (S89-C)
-- Escrita ANTES de aplicar (regla de la casa). Restaura el body vivo de
-- `crear_cuenta_comercial_inicial` capturado con pg_get_functiondef el
-- 6-ago-2026 (fuente: DB viva, no memoria) y mata el helper.
--
-- ⚠️ NOTA DE DATOS: revertir el código NO revierte los datos — toda cáscara
-- RETOMADA entre la aplicación y esta reversa conserva sus campos nuevos
-- (la retomada queda marcada en metadata.retomada_via = 'wizard_d656';
-- ese es el rastro para auditarlas si esta reversa llegara a correr).
-- Revertir REABRE el bloqueo de D-656: quien tocó el wizard por accidente
-- vuelve a quedar preso de su cáscara.

DROP FUNCTION IF EXISTS public._cuenta_comercial_tiene_uso(uuid);

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
  v_user_ya_tiene_cuenta  boolean;

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

  -- B.2) Guard nuevo: user no debe tener ya una cuenta comercial
  SELECT EXISTS (
    SELECT 1 FROM public.cuentas_comerciales
    WHERE owner_profile_id = v_auth_uid
  )
  INTO v_user_ya_tiene_cuenta;

  IF v_user_ya_tiene_cuenta THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Ya tienes una cuenta comercial registrada. No puedes crear otra desde este flujo.';
    RETURN;
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

  -- F) Identificación disponible (otro user no la tiene)
  SELECT EXISTS (
    SELECT 1
    FROM public.cuentas_comerciales cc
    WHERE cc.country_code = v_country_code
      AND cc.identificacion_fiscal = v_identificacion_trim
  )
  INTO v_existe_duplicado;

  IF v_existe_duplicado THEN
    RETURN QUERY SELECT
      false,
      NULL::uuid,
      'Esta identificación fiscal ya está registrada en e-PetPlace. Si es tu cuenta, inicia sesión. Si crees que alguien usó tu identificación sin autorización, contáctanos.';
    RETURN;
  END IF;

  -- INSERT
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
