-- ============================================================================
-- S70-B3 — FALLA ANOTADA: el alta fantasma por TELÉFONO revienta con el '+'.
-- ============================================================================
-- Repro founder (verbatim): mostrador → "Registrar mascota nueva" → "Thogo",
-- perro, bulldog → toggle TELÉFONO → '+573005604012' (country EC) → Registrar →
-- "No pudimos registrar, prueba de nuevo".
--
-- Sonda in-txn (payload literal del founder): SQLSTATE 23514, viola el CHECK
-- `cliente_pendiente_registro_telefono_sin_plus` = (telefono IS NULL OR
-- telefono !~ '^\+'). El RPC guardaba `p_telefono` CRUDO (con el '+') en la
-- columna raw `telefono`, que exige plus-less. `telefono_normalizado` ya salía
-- bien: el trigger BEFORE llama normalizar_telefono, que DESCARTA todo no-dígito
-- (regexp_replace(p_texto,'\D','','g')) — el '+' le es indiferente. Al caer a un
-- crudo 23514, el wrapper (falloAlta, S70-B1) no tiene branch → error_desconocido
-- → "No pudimos registrar. Probá de nuevo." (exactamente lo que vio el founder).
--
-- CURA (branch (c) del pedido B3): en la PUERTA del RPC se SANEA el '+' antes de
-- guardar — un '+' solo vive al inicio de un teléfono, jamás en el medio; la
-- normalización es +-agnóstica, así que el matching (cliente_ya_registrado /
-- pendiente_ya_existe / el reclamo) queda IDÉNTICO. No es rechazo tipado: un
-- +57... es un teléfono VÁLIDO; rechazarlo sería hostil. El degenerado (solo
-- símbolos → '' → NULL) lo sigue cubriendo `contacto_requerido` (typed).
--
-- NOTA DE FRONTERA (regla 69): crear_alta_asistida_pendiente es chasis Fase G
-- COMPARTIDO (lado A). Esta cura la AUTORIZA el founder en el pedido B3 (branch
-- c). CREATE OR REPLACE con firma IDÉNTICA (12 params, verificada con
-- pg_get_functiondef) — CERO cambio de firma ⇒ cero regen de tipos. UNA línea
-- cambia (v_telefono).
--
-- 76(g): NO RIGE — reemplazo aditivo de un cuerpo de función; ninguna fila viva
-- se reescribe. L-140: re-declarado abajo (REPLACE preserva ACL; se re-afirma).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crear_alta_asistida_pendiente(
  p_email text, p_nombre_cliente text, p_telefono text, p_prestador_id uuid,
  p_nombre_mascota text, p_especie text, p_country_code text,
  p_raza text DEFAULT NULL::text, p_sexo text DEFAULT NULL::text,
  p_fecha_nacimiento date DEFAULT NULL::date, p_microchip text DEFAULT NULL::text,
  p_foto_url text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email_lower text := NULLIF(LOWER(trim(p_email)), '');
  -- CURA S70-B3: se retira el '+' antes de guardar (la columna raw exige
  -- plus-less; normalizar_telefono es +-agnóstica ⇒ el match no cambia).
  v_telefono text := NULLIF(replace(trim(p_telefono), '+', ''), '');
  v_tel_norm text;
  v_cuenta_comercial_id uuid;
  v_familia_id uuid := gen_random_uuid();
  v_pendiente_id uuid := gen_random_uuid();
  v_mascota_id uuid := gen_random_uuid();
  v_evento_id uuid := gen_random_uuid();
BEGIN
  IF v_auth_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  -- Contacto-flexible: al menos email O teléfono (addendum S69)
  IF v_email_lower IS NULL AND v_telefono IS NULL THEN
    RAISE EXCEPTION 'contacto_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_nombre_cliente IS NULL OR length(trim(p_nombre_cliente)) = 0 THEN
    RAISE EXCEPTION 'nombre_cliente_required' USING ERRCODE = '22023';
  END IF;
  IF p_nombre_mascota IS NULL OR length(trim(p_nombre_mascota)) = 0 THEN
    RAISE EXCEPTION 'nombre_mascota_required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_especies WHERE codigo = p_especie AND acepta_nuevos_registros = true) THEN
    RAISE EXCEPTION 'especie_invalida_o_inactiva' USING ERRCODE = '22023';
  END IF;
  IF p_country_code NOT IN ('EC','CO','MX','PE','CL','BR','AR','US') THEN
    RAISE EXCEPTION 'country_code_invalido' USING ERRCODE = '22023';
  END IF;

  v_tel_norm := public.normalizar_telefono(v_telefono, p_country_code);

  -- ¿Ya registrado? — por email O por teléfono normalizado
  IF v_email_lower IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = v_email_lower) THEN
    RAISE EXCEPTION 'cliente_ya_registrado' USING ERRCODE = '22023';
  END IF;
  IF v_tel_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles WHERE public.normalizar_telefono(telefono, p_country_code) = v_tel_norm
  ) THEN
    RAISE EXCEPTION 'cliente_ya_registrado' USING ERRCODE = '22023';
  END IF;

  -- ¿Pendiente activo con el mismo contacto?
  IF v_email_lower IS NOT NULL AND EXISTS (
    SELECT 1 FROM cliente_pendiente_registro
    WHERE LOWER(email) = v_email_lower AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  ) THEN
    RAISE EXCEPTION 'pendiente_ya_existe' USING ERRCODE = '22023';
  END IF;
  IF v_tel_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM cliente_pendiente_registro
    WHERE country_code = p_country_code AND telefono_normalizado = v_tel_norm
      AND completado_en IS NULL AND soporte_resuelto_en IS NULL
  ) THEN
    RAISE EXCEPTION 'pendiente_ya_existe' USING ERRCODE = '22023';
  END IF;

  SELECT cuenta_comercial_id INTO v_cuenta_comercial_id FROM prestadores WHERE id = p_prestador_id;

  INSERT INTO familia (id, nombre, tipo, country_code, cuenta_comercial_id, created_by_user_id, created_by_sistema)
  VALUES (v_familia_id, 'Familia de ' || p_nombre_cliente, 'pendiente_completar', p_country_code, v_cuenta_comercial_id, v_auth_uid, NULL);

  INSERT INTO cliente_pendiente_registro (
    id, email, nombre, telefono,
    creado_por_prestador_id, creado_por_cuenta_comercial_id, creado_por_user_id,
    country_code, familia_id_placeholder
  ) VALUES (
    v_pendiente_id, v_email_lower, p_nombre_cliente, v_telefono,
    p_prestador_id, v_cuenta_comercial_id, v_auth_uid,
    p_country_code, v_familia_id
  );

  INSERT INTO mascotas (
    id, nombre, especie, raza, sexo, fecha_nacimiento, microchip,
    foto_url, country_code, familia_id, user_id, origen,
    estado_vida, estado_vida_desde, fecha_alta
  ) VALUES (
    v_mascota_id, p_nombre_mascota, p_especie, p_raza, p_sexo, p_fecha_nacimiento, p_microchip,
    p_foto_url, p_country_code, v_familia_id, NULL, 'alta_asistida',
    'activa', now(), now()
  );

  INSERT INTO mascota_acceso_prestador (
    mascota_id, cuenta_comercial_id, metodo_otorgamiento, otorgado_en, otorgado_por_user_id
  ) VALUES (
    v_mascota_id, v_cuenta_comercial_id, 'alta_asistida_creada_por_prestador', now(), v_auth_uid
  );

  INSERT INTO eventos_mascota (
    id, mascota_id, tipo, eje_jtbd, fecha_evento,
    cuenta_comercial_id, prestador_id, creado_por_user_id, datos, country_code
  ) VALUES (
    v_evento_id, v_mascota_id, 'alta_asistida_pendiente_creada', 'administrativo', now(),
    v_cuenta_comercial_id, p_prestador_id, v_auth_uid,
    jsonb_build_object('caso', 'cliente_no_registrado', 'pendiente_id', v_pendiente_id,
                       'email_cliente', p_email, 'telefono_cliente', v_telefono),
    p_country_code
  );

  RETURN jsonb_build_object(
    'pendiente_id', v_pendiente_id, 'familia_id', v_familia_id, 'mascota_id', v_mascota_id,
    'expira_en', (now() + interval '30 days'), 'estado', 'pendiente'
  );
END;
$function$;

-- L-140: REPLACE preserva ACL; se re-afirma explícito (la función es de prestador).
REVOKE EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_alta_asistida_pendiente(text, text, text, uuid, text, text, text, text, text, date, text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (fixture self-contained, ROLLBACK residuo 0) — el repro del
-- founder (+57 con '+') AHORA inserta y el raw queda plus-less.
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid;
  v_res jsonb; v_pend uuid; v_raw text; v_norm text;
BEGIN
  BEGIN  -- savepoint
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_uid, 'authenticated','authenticated','s70b3-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_uid, 'persona_natural', 'B3-9999', 'Clínica B3 Verif', 'B3 Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_uid, 'clinica_veterinaria', 'B3 Vet', '0999000222', v_cuenta) RETURNING id INTO v_prestador;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

    -- EL REPRO: teléfono con '+' (antes: 23514 telefono_sin_plus)
    v_res := crear_alta_asistida_pendiente(
      p_email := '', p_nombre_cliente := 'Prueba B3', p_telefono := '+573005604012',
      p_prestador_id := v_prestador, p_nombre_mascota := 'Thogo', p_especie := 'perro',
      p_country_code := 'EC', p_raza := 'bulldog');
    v_pend := (v_res ->> 'pendiente_id')::uuid;

    IF v_res ->> 'estado' <> 'pendiente' THEN
      RAISE EXCEPTION 'B3 abort: el alta no devolvió estado pendiente (%).', v_res;
    END IF;

    -- el raw quedó SIN '+' (CHECK satisfecho) y el normalizado IDÉNTICO al de-siempre
    SELECT telefono, telefono_normalizado INTO v_raw, v_norm
    FROM cliente_pendiente_registro WHERE id = v_pend;
    IF v_raw ~ '^\+' THEN RAISE EXCEPTION 'B3 abort: el raw guardó el + (%).', v_raw; END IF;
    IF v_raw <> '573005604012' THEN RAISE EXCEPTION 'B3 abort: raw = % (esperado 573005604012)', v_raw; END IF;
    IF v_norm <> public.normalizar_telefono('+573005604012','EC') THEN
      RAISE EXCEPTION 'B3 abort: normalizado cambió (% vs %)', v_norm, public.normalizar_telefono('+573005604012','EC');
    END IF;

    RAISE EXCEPTION 'S70_B3_ASSERTS_OK -> +57 con + ahora inserta · raw plus-less · normalizado intacto';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S70_B3_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S70-B3.
-- ============================================================================
