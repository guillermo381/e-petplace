-- ============================================================================
-- S60-A7 — DOS PIEZAS CORTAS (literales de la B, reporte S60-C2, con visto):
--
-- 1) GATE TEMPORAL DEL MOTOR en iniciar_atencion_paseo E
--    iniciar_atencion_grooming: hoy solo la UI impedía iniciar la cita de
--    MAÑANA — la palanca de devengo anticipado se cierra en el motor.
--    CAUTELA DEL ARQUITECTO cumplida: el literal proponía current_date
--    (reloj del SERVIDOR, UTC); el precedente S57 `cita_aun_no_ocurre` de
--    marcar_no_show_cita resuelve contra `now() AT TIME ZONE
--    'America/Guayaquil'` — SE ESPEJA EXACTO. La tz del país por hardcode
--    es el hueco COMPARTIDO ya anotado (D-320, disparo multi-país):
--    coherencia sobre perfección, cero deuda nueva.
--
-- 2) RENAME DE SEEDS a la letra §1 de MODELO_GROOMING: los dos comprables
--    hablan con el nombre firmado — 'Baño' / 'Baño y corte'. La marca
--    es_seed_preliminar queda INTACTA (§10.3 sigue vigente: la
--    conversación con el groomer real bloquea la apertura, no esto).
--
-- L-140 en las firmas recreadas (mismas firmas — CREATE OR REPLACE — pero
-- la ley exige REVOKE+GRANT explícitos y sonda proacl en la verificación).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1a · iniciar_atencion_paseo — cuerpo VERBATIM + el gate temporal
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.iniciar_atencion_paseo(p_cita_id uuid, p_empleado_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_tipo_servicio   text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_paseo_id        uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ecs.tipo_servicio, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_mascota_id, v_prestador_id,
       v_country_code, v_tipo_servicio, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'paseo' THEN
    RAISE EXCEPTION 'cita_no_es_paseo' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- S60-A7: la cita de MAÑANA no se inicia — el devengo anticipado se
  -- cierra en el MOTOR (antes solo la UI). Espejo EXACTO del reloj del
  -- precedente S57 (cita_aun_no_ocurre de marcar_no_show_cita); la tz
  -- hardcodeada del país es D-320, hueco compartido heredado a propósito.
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_paseo_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_paseo_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_paseo' USING ERRCODE = '22023';
  END IF;

  -- 1. Hito en eventos_mascota (cita_id en datos jsonb, metadata del hito)
  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_paseo_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, p_empleado_id, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  -- 2. Capa de atención (cita_id vive acá)
  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'paseo', v_mascota_id, v_prestador_id, p_empleado_id,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  -- 3. Detalle de oficio: solo el puente; GPS nace NULL (se resuelve en el Durante/cierre)
  INSERT INTO eventos_mascota_paseo (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, p_empleado_id, v_country_code
  )
  RETURNING id INTO v_paseo_id;

  -- 4. Mover la cita a en_curso
  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'paseo_id', v_paseo_id,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1b · iniciar_atencion_grooming — cuerpo VERBATIM + el gate temporal
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.iniciar_atencion_grooming(p_cita_id uuid, p_empleado_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_tipo_servicio   text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_grooming_id     uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ecs.tipo_servicio, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_mascota_id, v_prestador_id,
       v_country_code, v_tipo_servicio, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'grooming' THEN
    RAISE EXCEPTION 'cita_no_es_grooming' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- S60-A7: espejo EXACTO del gate del paseo (precedente S57 + D-320).
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_grooming_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_grooming_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_grooming' USING ERRCODE = '22023';
  END IF;

  -- 1. Hito en eventos_mascota (cita_id queda en datos jsonb, metadata del hito)
  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_grooming_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, p_empleado_id, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  -- 2. Capa de atención (cita_id vive ACÁ ahora)
  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'grooming', v_mascota_id, v_prestador_id, p_empleado_id,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  -- 3. Detalle de oficio: SOLO el puente. SIN cita_id (vive en la capa).
  INSERT INTO eventos_mascota_grooming (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, p_empleado_id, v_country_code
  )
  RETURNING id INTO v_grooming_id;

  -- 4. Mover la cita a en_curso
  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'grooming_id', v_grooming_id,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2 · RENAME DE SEEDS a la letra §1 (es_seed_preliminar INTACTA)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE public.tipos_servicio SET nombre = 'Baño'         WHERE codigo = 'grooming';
UPDATE public.tipos_servicio SET nombre = 'Baño y corte' WHERE codigo = 'grooming_completo';

-- ────────────────────────────────────────────────────────────────────────────
-- L-140 — REVOKE+GRANT explícitos en las firmas recreadas
-- ────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.iniciar_atencion_paseo(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.iniciar_atencion_paseo(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.iniciar_atencion_grooming(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.iniciar_atencion_grooming(uuid, uuid) TO authenticated;
