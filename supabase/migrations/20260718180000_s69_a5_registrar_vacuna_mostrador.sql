-- ============================================================================
-- S69-A5 — REGISTRABLE DE VACUNACIÓN DEL MOSTRADOR (cierra D-434)
-- El walk-in registra una vacuna: del catálogo cat_vacunas (7 seeds EC) O texto
-- libre ("Otra" — §12 intacta). Viaja por la tipada existente
-- evento_vacuna_aplicada; el trigger de A1bis estampa declarado_por_prestador
-- (hay prestador_id). NO toca la RLS del dueño ni registrarVacunasDeCarnet.
--
-- DECLARACIÓN 76(g): 1 función nueva + verificación con fixtures self-contained
-- y ROLLBACK. NO RIGE VEDA.
-- ============================================================================

CREATE FUNCTION public.registrar_vacuna_mostrador(
  p_cita_id uuid, p_vacuna_codigo text DEFAULT NULL,
  p_nombre_libre text DEFAULT NULL, p_fecha_aplicacion date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_mascota uuid; v_prestador uuid; v_cuenta uuid; v_country text; v_origen text;
  v_codigo text := NULLIF(trim(p_vacuna_codigo), '');
  v_libre text := NULLIF(trim(p_nombre_libre), '');
  v_nombre text;
  v_evento uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT ecs.mascota_id, ecs.prestador_id, ecs.country_code, ecs.metadata ->> 'origen'
  INTO v_mascota, v_prestador, v_country, v_origen
  FROM evento_cita_servicio ecs WHERE ecs.id = p_cita_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023'; END IF;

  SELECT p.cuenta_comercial_id INTO v_cuenta FROM prestadores p WHERE p.id = v_prestador;
  IF v_cuenta IS NULL OR NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- cita de mostrador O al menos acceso vigente a la mascota
  IF v_origen IS DISTINCT FROM 'mostrador' AND NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = v_mascota AND map.cuenta_comercial_id = v_cuenta
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  -- catálogo XOR libre
  IF (v_codigo IS NOT NULL) = (v_libre IS NOT NULL) THEN
    RAISE EXCEPTION 'vacuna_xor' USING ERRCODE = '22023',
      DETAIL = 'Pasá un código de cat_vacunas O un nombre libre — exactamente uno.';
  END IF;

  IF v_codigo IS NOT NULL THEN
    SELECT nombre INTO v_nombre FROM cat_vacunas WHERE codigo = v_codigo AND activo = true;
    IF v_nombre IS NULL THEN RAISE EXCEPTION 'vacuna_codigo_invalido' USING ERRCODE = '22023'; END IF;
  ELSE
    v_nombre := v_libre;
  END IF;

  -- La tipada + su trigger (A1bis) crean el evento padre con procedencia
  -- declarado_por_prestador (hay prestador_id).
  INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, fecha_aplicada, prestador_id, country_code, cita_id)
  VALUES (v_mascota, v_nombre, COALESCE(p_fecha_aplicacion, current_date), v_prestador, COALESCE(v_country, 'EC'), p_cita_id)
  RETURNING evento_id INTO v_evento;

  RETURN v_evento;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.registrar_vacuna_mostrador(uuid, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_vacuna_mostrador(uuid, text, text, date) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN IMPERATIVA (fixtures self-contained, ROLLBACK residuo 0)
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid; v_mascota uuid; v_cita uuid;
  v_ev1 uuid; v_ev2 uuid; v_proc text; v_nombre text; v_ok boolean; v_bad text;
BEGIN
  BEGIN
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','s69a5-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', 'A5-9999', 'Clínica A5', 'A5 Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_vet, 'clinica_veterinaria', 'A5 Vet', '0999555000', v_cuenta) RETURNING id INTO v_prestador;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);
    v_mascota := crear_mascota_walkin(v_prestador, 'Vac Pet', 'perro', 'EC');
    -- cita de mostrador directa (origen mostrador ⇒ pasa el gate)
    INSERT INTO evento_cita_servicio (mascota_id, prestador_id, tipo_servicio, precio, duracion_minutos, estado, estado_reserva, country_code, metadata)
    VALUES (v_mascota, v_prestador, 'vacunacion', 15, 20, 'confirmada', 'pendiente_pago', 'EC', jsonb_build_object('origen','mostrador'))
    RETURNING id INTO v_cita;

    -- catálogo: antirrábica ⇒ declarado_por_prestador
    v_ev1 := registrar_vacuna_mostrador(v_cita, 'antirrabica');
    SELECT procedencia INTO v_proc FROM eventos_mascota WHERE id = v_ev1;
    SELECT nombre_vacuna INTO v_nombre FROM evento_vacuna_aplicada WHERE evento_id = v_ev1;
    IF v_proc <> 'declarado_por_prestador' THEN RAISE EXCEPTION 'A5 abort: catálogo con procedencia % (esperado declarado_por_prestador)', v_proc; END IF;
    IF v_nombre <> 'antirrábica' THEN RAISE EXCEPTION 'A5 abort: nombre del catálogo = % (esperado antirrábica)', v_nombre; END IF;

    -- libre ("Otra"): también declarado_por_prestador
    v_ev2 := registrar_vacuna_mostrador(v_cita, NULL, 'Vacuna importada X');
    SELECT procedencia INTO v_proc FROM eventos_mascota WHERE id = v_ev2;
    SELECT nombre_vacuna INTO v_nombre FROM evento_vacuna_aplicada WHERE evento_id = v_ev2;
    IF v_proc <> 'declarado_por_prestador' THEN RAISE EXCEPTION 'A5 abort: libre con procedencia % (esperado declarado_por_prestador)', v_proc; END IF;
    IF v_nombre <> 'Vacuna importada X' THEN RAISE EXCEPTION 'A5 abort: nombre libre = %', v_nombre; END IF;

    -- XOR: ambos ⇒ error
    v_ok := false;
    BEGIN PERFORM registrar_vacuna_mostrador(v_cita, 'antirrabica', 'y libre');
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%vacuna_xor%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A5 abort: ambos (codigo+libre) no reventó el XOR'; END IF;
    -- XOR: ninguno ⇒ error
    v_ok := false;
    BEGIN PERFORM registrar_vacuna_mostrador(v_cita, NULL, NULL);
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%vacuna_xor%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A5 abort: ninguno (ni codigo ni libre) no reventó el XOR'; END IF;
    -- código inválido
    v_ok := false;
    BEGIN PERFORM registrar_vacuna_mostrador(v_cita, 'no_existe_xyz');
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%vacuna_codigo_invalido%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A5 abort: código inválido no reventó'; END IF;

    -- sonda L-140
    SELECT string_agg(p.proname, ', ') INTO v_bad
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'registrar_vacuna_mostrador'
      AND array_to_string(COALESCE(p.proacl, ARRAY[]::aclitem[]), ',') LIKE '%anon=%';
    IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'A5 abort L-140: % con anon', v_bad; END IF;

    RAISE EXCEPTION 'S69_A5_ASSERTS_OK -> vacuna mostrador: catálogo + libre, procedencia declarado_por_prestador en ambos, XOR, código inválido, sonda L-140';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A5_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A5.
-- ============================================================================
