-- ═════════════════════════════════════════════════════════════════════
-- S54 — BACKFILL cuenta_roles (pedido 1 de la Sesión B, literal aprobado
-- por arquitecto + founder) + enmienda a crear_prestador_inicial.
--
-- El hueco: MODELO_FINANCIERO §7.5 manda "crear cuenta comercial NO crea
-- roles — después del INSERT hay que insertar en cuenta_roles", y el
-- flujo vivo del wizard (crear_cuenta_comercial_inicial →
-- crear_prestador_inicial) lo venía violando: prestadores reales con
-- cuenta sin rol → crear_evento_economico rebota (probado en B2.0-T6).
-- Pre-conteo relevado (11-Jul): 2 prestadores en el hueco (Satori Latam
-- y Carlos, ambos con cuenta pendiente_validacion).
-- ═════════════════════════════════════════════════════════════════════

-- ── 1 · Backfill (literal aprobado; único ajuste: casts explícitos a
--        los enums — en INSERT…SELECT Postgres no coerce literales text
--        como sí lo hace en VALUES; 42804 en el primer push) ───────────

INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
SELECT DISTINCT p.cuenta_comercial_id,
       'prestador_servicios'::tipo_actor_enum,
       'activo'::estado_cuenta_rol_enum
FROM prestadores p
WHERE NOT EXISTS (
  SELECT 1 FROM cuenta_roles cr
  WHERE cr.cuenta_comercial_id = p.cuenta_comercial_id
    AND cr.tipo_actor = 'prestador_servicios'
);

-- ── 2 · Enmienda a crear_prestador_inicial: el rol nace con la sede ─────
-- Re-emisión VERBATIM del body vivo (pg_get_functiondef, 11-Jul) + el
-- INSERT del rol al final, con ON CONFLICT (cuenta_comercial_id,
-- tipo_actor) DO NOTHING — jamás reactiva un rol suspendido por esta vía.
-- MISMA firma → sin zombis (L-119).

CREATE OR REPLACE FUNCTION public.crear_prestador_inicial(p_cuenta_comercial_id uuid, p_tipo text, p_nombre_comercial text, p_ciudad text, p_descripcion text DEFAULT NULL::text, p_telefono text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_email_contacto text DEFAULT NULL::text, p_sitio_web text DEFAULT NULL::text, p_direccion text DEFAULT NULL::text, p_sector text DEFAULT NULL::text, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision, p_acepta_emergencias boolean DEFAULT NULL::boolean, p_acepta_telemedicina boolean DEFAULT NULL::boolean, p_radio_cobertura_km integer DEFAULT NULL::integer, p_matricula_profesional text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, prestador_id uuid, mensaje text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid              uuid := auth.uid();
  v_nombre_trim           text := trim(p_nombre_comercial);
  v_ciudad_trim           text := trim(p_ciudad);
  v_tipos_validos         text[] := ARRAY[
    'clinica_veterinaria','veterinario_independiente','grooming','paseador',
    'hotel_mascotas','adiestramiento','laboratorio','otro'
  ];
  v_country_code          text;
  v_validacion            record;
  v_existe_prestador      boolean;
  v_user_ya_dueno         boolean;
  v_nuevo_id              uuid;
  v_metadata_safe         jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_metadata_final        jsonb;
  v_descripcion_otro      text;
BEGIN
  -- Validaciones cheap
  IF v_nombre_trim IS NULL OR length(v_nombre_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El nombre comercial es obligatorio.';
    RETURN;
  END IF;

  IF v_ciudad_trim IS NULL OR length(v_ciudad_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'La ciudad es obligatoria.';
    RETURN;
  END IF;

  IF p_tipo IS NULL OR NOT (p_tipo = ANY (v_tipos_validos)) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El tipo de prestador no es válido.';
    RETURN;
  END IF;

  -- Validación específica para tipo 'otro'
  IF p_tipo = 'otro' THEN
    v_descripcion_otro := NULLIF(trim(v_metadata_safe ->> 'tipo_otro_descripcion'), '');

    IF v_descripcion_otro IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'Cuando seleccionas el tipo "Otro", debes describir brevemente tu tipo de servicio.';
      RETURN;
    END IF;

    IF length(v_descripcion_otro) < 5 OR length(v_descripcion_otro) > 200 THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'La descripción del tipo de servicio debe tener entre 5 y 200 caracteres.';
      RETURN;
    END IF;
  END IF;

  -- Guard nuevo: user no debe ser dueño de otro prestador
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores
    WHERE user_id = v_auth_uid
  )
  INTO v_user_ya_dueno;

  IF v_user_ya_dueno THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Ya eres dueño de un prestador. No puedes crear otro desde este flujo.';
    RETURN;
  END IF;

  -- Ownership de la cuenta comercial
  SELECT * INTO v_validacion
  FROM public._validar_ownership_cuenta_comercial(p_cuenta_comercial_id);

  IF NOT v_validacion.valido THEN
    RETURN QUERY SELECT false, NULL::uuid, v_validacion.mensaje;
    RETURN;
  END IF;

  -- Guard preexistente: cuenta no debe tener otro prestador inicial
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  )
  INTO v_existe_prestador;

  IF v_existe_prestador THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Esta cuenta comercial ya tiene un prestador registrado. Para agregar sedes adicionales, hazlo desde el panel de gestión.';
    RETURN;
  END IF;

  -- Heredar country_code de la cuenta
  SELECT cc.country_code INTO v_country_code
  FROM public.cuentas_comerciales cc
  WHERE cc.id = p_cuenta_comercial_id;

  -- Armar metadata final
  v_metadata_final := jsonb_build_object('created_via', 'wizard') || v_metadata_safe;

  -- INSERT
  INSERT INTO public.prestadores (
    user_id,
    cuenta_comercial_id,
    country_code,
    tipo,
    nombre_comercial,
    ciudad,
    descripcion,
    telefono,
    whatsapp,
    email_contacto,
    sitio_web,
    direccion,
    sector,
    lat,
    lon,
    acepta_emergencias,
    acepta_telemedicina,
    radio_cobertura_km,
    matricula_profesional,
    estado,
    metadata
  ) VALUES (
    v_auth_uid,
    p_cuenta_comercial_id,
    v_country_code,
    p_tipo,
    v_nombre_trim,
    v_ciudad_trim,
    NULLIF(trim(p_descripcion), ''),
    NULLIF(trim(p_telefono), ''),
    NULLIF(trim(p_whatsapp), ''),
    NULLIF(trim(p_email_contacto), ''),
    NULLIF(trim(p_sitio_web), ''),
    NULLIF(trim(p_direccion), ''),
    NULLIF(trim(p_sector), ''),
    p_lat,
    p_lon,
    COALESCE(p_acepta_emergencias, false),
    COALESCE(p_acepta_telemedicina, false),
    COALESCE(p_radio_cobertura_km, 5),
    NULLIF(trim(p_matricula_profesional), ''),
    'pendiente',
    v_metadata_final
  )
  RETURNING id INTO v_nuevo_id;

  -- ENMIENDA S54 (tanda B, pedido 1 pieza 2 — cierra el gap §7.5):
  -- el rol financiero nace CON la primera sede. ON CONFLICT DO NOTHING:
  -- si el rol ya existe (activo O suspendido), no se toca — reactivar
  -- un suspendido es decisión de admin (§7.7), jamás de este flujo.
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (p_cuenta_comercial_id, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  RETURN QUERY SELECT true, v_nuevo_id, NULL::text;
END;
$function$;

-- L-140: REVOKE/GRANT explícito post-CREATE (CREATE OR REPLACE conserva
-- el ACL, pero la ley exige declararlo — y verificar proacl después).
REVOKE EXECUTE ON FUNCTION public.crear_prestador_inicial(uuid, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_prestador_inicial(uuid, text, text, text, text, text, text, text, text, text, text, double precision, double precision, boolean, boolean, integer, text, jsonb) TO authenticated, service_role;
