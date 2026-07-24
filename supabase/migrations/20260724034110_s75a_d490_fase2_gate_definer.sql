-- ─────────────────────────────────────────────────────────────────────
-- S75-A31 · D-490 FASE 2 — el gate de rol entra a los 4 escritores DEFINER
-- clinicos (la RLS de la fase 1 no los alcanza: DEFINER la salta).
-- Guard por la PUERTA UNICA empleado_tiene_rol + COALESCE (A42). Mapa:
-- los 4 -> ['dueño','profesional']. RECEPCION NO (registrar_atencion_
-- mostrador, la recepcion real, NO se toca -> A44). Cuerpos verbatim de
-- pg_get_functiondef + la guarda insertada. 76(g): NO RIGE (cero backfill).
-- ─────────────────────────────────────────────────────────────────────
BEGIN;

-- ══ sedimentar_nota_clinica ══
CREATE OR REPLACE FUNCTION public.sedimentar_nota_clinica(p_cita_id uuid, p_cuenta_comercial_id uuid, p_empleado_id uuid, p_mascota_id uuid, p_nota jsonb, p_caso jsonb DEFAULT NULL::jsonb, p_country_code text DEFAULT 'EC'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_prestador uuid;
  v_cita_evento uuid;
  v_caso_id uuid;
  v_caso_modo text;
  v_ev_hc uuid;
  v_ev uuid;
  v_motivo text; v_diag text;
  v_vitales jsonb;
  v_peso numeric;
  v_item jsonb; v_ex text;
  v_n_med int := 0; v_n_ex int := 0; v_n_cond int := 0; v_n_alg int := 0;
  v_peso_medido boolean := false;
  v_prox date;
  v_idx int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN RAISE EXCEPTION 'cita_requerida' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM evento_historia_clinica_registrada WHERE cita_id = p_cita_id) THEN
    RAISE EXCEPTION 'hc_ya_existe' USING ERRCODE = '22023';   -- UNIQUE(cita_id): una HC por cita
  END IF;

  v_motivo := NULLIF(trim(COALESCE(p_nota->>'motivo','')), '');
  v_diag   := NULLIF(trim(COALESCE(p_nota->>'diagnostico','')), '');
  IF v_motivo IS NULL THEN RAISE EXCEPTION 'nota_sin_motivo' USING ERRCODE = '22023'; END IF;
  IF v_diag IS NULL THEN RAISE EXCEPTION 'nota_sin_diagnostico' USING ERRCODE = '22023'; END IF;

  -- prestador (por empleado, si no primero de la cuenta) — tipadas exigen NOT NULL
  SELECT pe.prestador_id INTO v_prestador FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    SELECT id INTO v_prestador FROM prestadores WHERE cuenta_comercial_id = p_cuenta_comercial_id ORDER BY created_at LIMIT 1;
  END IF;
  IF v_prestador IS NULL THEN RAISE EXCEPTION 'cuenta_sin_prestador' USING ERRCODE = '22023'; END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_rol(v_prestador, ARRAY['dueño','profesional']), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- E3: el evento 'cita_servicio' de la cita (puede ser NULL en citas de presupuesto)
  SELECT evento_id INTO v_cita_evento FROM evento_cita_servicio WHERE id = p_cita_id;

  v_prox := NULLIF(p_nota->>'proximo_control','')::date;

  -- CASO: 'nuevo' | {caso_id} | null
  v_caso_modo := p_caso->>'modo';
  IF v_caso_modo = 'nuevo' THEN
    v_caso_id := public.abrir_caso_clinico(
      p_mascota_id, p_caso->>'condicion', p_cuenta_comercial_id, p_empleado_id,
      COALESCE(NULLIF(p_caso->>'horizonte','')::timestamptz, (v_prox + time '00:00')::timestamptz),
      NULL, p_country_code);
  ELSIF v_caso_modo = 'existente' THEN
    v_caso_id := (p_caso->>'caso_id')::uuid;
    IF NOT public._user_clinica_tratante_del_caso(v_caso_id, v_uid) THEN
      RAISE EXCEPTION 'no_es_tratante' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_caso_id := NULL;
  END IF;

  v_vitales := COALESCE(p_nota->'vitales', '{}'::jsonb);
  v_peso := NULLIF(v_vitales->>'peso_kg','')::numeric;

  -- ── HC (narrativa + vitales medidos) ──
  v_ev_hc := public._crear_padre_constelacion(
    p_mascota_id, 'historia_clinica_registrada', v_prestador, p_empleado_id, v_uid,
    p_country_code, jsonb_build_object('cita_id', p_cita_id, 'diagnostico_principal', v_diag,
      'proximo_control', v_prox), v_cita_evento);

  INSERT INTO evento_historia_clinica_registrada (
    evento_id, cita_id, mascota_id, prestador_id, veterinario_user_id, empleado_id, country_code,
    motivo_consulta, anamnesis, examen_fisico, diagnostico_principal, cie_codigo,
    tratamiento, indicaciones, diagnosticos_secundarios,
    peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal,
    requiere_hospitalizacion, requiere_cirugia, caso_clinico_id
  ) VALUES (
    v_ev_hc, p_cita_id, p_mascota_id, v_prestador, v_uid, p_empleado_id, p_country_code,
    v_motivo,
    NULLIF(trim(COALESCE(p_nota->>'anamnesis','')),''),
    NULLIF(trim(COALESCE(p_nota->>'examen','')),''),
    v_diag,
    NULLIF(trim(COALESCE(p_nota->>'cie_codigo','')),''),
    NULLIF(trim(COALESCE(p_nota->>'plan_terapeutico','')),''),
    NULLIF(trim(COALESCE(p_nota->>'indicaciones','')),''),
    COALESCE(p_nota->'diagnosticos_secundarios', '[]'::jsonb),
    v_peso,
    NULLIF(v_vitales->>'temperatura_c','')::numeric,
    NULLIF(v_vitales->>'frecuencia_cardiaca','')::int,
    NULLIF(v_vitales->>'frecuencia_respiratoria','')::int,
    NULLIF(v_vitales->>'condicion_corporal','')::int,
    COALESCE((p_nota->>'requiere_hospitalizacion')::boolean, false),
    COALESCE((p_nota->>'requiere_cirugia')::boolean, false),
    v_caso_id
  );

  -- ── PESO medido → evento propio (propaga peso_clinico al perfil) ──
  IF v_peso IS NOT NULL THEN
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'peso_medicion', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('peso_kg', v_peso), v_cita_evento);
    INSERT INTO evento_peso_medicion (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      peso_kg, metodo_medicion, fecha_medicion
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_peso, COALESCE(NULLIF(v_vitales->>'peso_metodo',''), 'bascula_clinica'), now()
    );
    v_peso_medido := true;
  END IF;

  -- ── N × MEDICACIÓN PRESCRITA (dosis/frecuencia CONFIRMADAS, guard tipado) ──
  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'formula','[]'::jsonb)) LOOP
    v_idx := v_idx + 1;
    IF NULLIF(trim(COALESCE(v_item->>'nombre','')),'') IS NULL THEN
      RAISE EXCEPTION 'medicamento_sin_nombre: %', v_idx USING ERRCODE = '22023';
    END IF;
    IF NULLIF(trim(COALESCE(v_item->>'dosis','')),'') IS NULL
       OR NULLIF(trim(COALESCE(v_item->>'frecuencia','')),'') IS NULL THEN
      RAISE EXCEPTION 'posologia_incompleta: %', v_idx USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'medicacion_prescrita', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('medicamento', v_item->>'nombre', 'cita_id', p_cita_id),
      v_cita_evento);
    INSERT INTO evento_medicacion_prescrita (
      evento_id, cita_id, mascota_id, prestador_id, empleado_id, country_code,
      nombre_medicamento, principio_activo, concentracion, forma_farmaceutica,
      dosis, frecuencia, duracion_dias, via_administracion, indicaciones_especiales,
      cantidad, orden, caso_clinico_id
    ) VALUES (
      v_ev, p_cita_id, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'nombre',
      NULLIF(trim(COALESCE(v_item->>'principio_activo','')),''),
      NULLIF(trim(COALESCE(v_item->>'concentracion','')),''),
      NULLIF(trim(COALESCE(v_item->>'presentacion','')),''),
      v_item->>'dosis', v_item->>'frecuencia',
      NULLIF(v_item->>'duracion_dias','')::int,
      NULLIF(trim(COALESCE(v_item->>'via','')),''),
      NULLIF(trim(COALESCE(v_item->>'indicaciones','')),''),
      NULLIF(v_item->>'cantidad','')::numeric,
      v_idx, v_caso_id
    );
    v_n_med := v_n_med + 1;
  END LOOP;

  -- ── N × EXAMEN DIAGNÓSTICO estado 'solicitado' (el plan diagnóstico) ──
  v_idx := 0;
  FOR v_ex IN SELECT jsonb_array_elements_text(COALESCE(p_nota->'plan_diagnostico','[]'::jsonb)) LOOP
    v_idx := v_idx + 1;
    IF NULLIF(trim(v_ex),'') IS NULL THEN CONTINUE; END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'examen_diagnostico', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('tipo_examen', v_ex, 'cita_id', p_cita_id), v_cita_evento);
    INSERT INTO evento_examen_diagnostico (
      evento_id, cita_id, mascota_id, prestador_id, empleado_id, country_code,
      tipo_examen, estado, urgencia, orden, caso_clinico_id
    ) VALUES (
      v_ev, p_cita_id, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_ex, 'solicitado', 'rutina', v_idx, v_caso_id
    );
    v_n_ex := v_n_ex + 1;
  END LOOP;

  -- ── CONDICIÓN CRÓNICA — SOLO si el vet la marcó explícita ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'condiciones_cronicas','[]'::jsonb)) LOOP
    IF NULLIF(trim(COALESCE(v_item->>'condicion','')),'') IS NULL THEN
      RAISE EXCEPTION 'condicion_sin_nombre' USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'condicion_cronica_diagnosticada', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('condicion', v_item->>'condicion'), v_cita_evento);
    INSERT INTO evento_condicion_cronica_diagnosticada (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      condicion, cie_codigo, fecha_diagnostico, diagnostico_descripcion,
      manejo_actual, seguimiento_recomendado, estado, caso_clinico_id
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'condicion',
      NULLIF(trim(COALESCE(v_item->>'cie_codigo','')),''),
      COALESCE(NULLIF(v_item->>'fecha_diagnostico','')::date, (now() AT TIME ZONE 'America/Guayaquil')::date),
      NULLIF(trim(COALESCE(v_item->>'diagnostico_descripcion','')),''),
      NULLIF(trim(COALESCE(v_item->>'manejo_actual','')),''),
      NULLIF(trim(COALESCE(v_item->>'seguimiento_recomendado','')),''),
      COALESCE(NULLIF(v_item->>'estado',''), 'activa'), v_caso_id
    );
    v_n_cond := v_n_cond + 1;
  END LOOP;

  -- ── ALERGIA — SOLO si el vet la marcó explícita ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'alergias','[]'::jsonb)) LOOP
    IF NULLIF(trim(COALESCE(v_item->>'alergeno','')),'') IS NULL THEN
      RAISE EXCEPTION 'alergia_sin_alergeno' USING ERRCODE = '22023';
    END IF;
    IF NULLIF(trim(COALESCE(v_item->>'severidad','')),'') IS NULL THEN
      RAISE EXCEPTION 'alergia_sin_severidad' USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'alergia_diagnosticada', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('alergeno', v_item->>'alergeno'), v_cita_evento);
    INSERT INTO evento_alergia_diagnosticada (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      alergeno, categoria_alergeno, severidad, reaccion_descripcion,
      fecha_diagnostico, metodo_diagnostico, manejo_recomendado, estado, caso_clinico_id
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'alergeno',
      NULLIF(trim(COALESCE(v_item->>'categoria_alergeno','')),''),
      v_item->>'severidad',
      NULLIF(trim(COALESCE(v_item->>'reaccion_descripcion','')),''),
      COALESCE(NULLIF(v_item->>'fecha_diagnostico','')::date, (now() AT TIME ZONE 'America/Guayaquil')::date),
      NULLIF(trim(COALESCE(v_item->>'metodo_diagnostico','')),''),
      NULLIF(trim(COALESCE(v_item->>'manejo_recomendado','')),''),
      COALESCE(NULLIF(v_item->>'estado',''), 'confirmada'), v_caso_id
    );
    v_n_alg := v_n_alg + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'evento_hc_id', v_ev_hc,
    'caso_id', v_caso_id,
    'medicaciones', v_n_med,
    'examenes', v_n_ex,
    'peso_medido', v_peso_medido,
    'condiciones', v_n_cond,
    'alergias', v_n_alg,
    'colgado_de_cita_evento', (v_cita_evento IS NOT NULL)
  );
END;
$function$;

-- ══ abrir_caso_clinico ══
CREATE OR REPLACE FUNCTION public.abrir_caso_clinico(p_mascota_id uuid, p_condicion text, p_cuenta_comercial_id uuid, p_empleado_id uuid DEFAULT NULL::uuid, p_horizonte timestamp with time zone DEFAULT NULL::timestamp with time zone, p_evento_origen uuid DEFAULT NULL::uuid, p_country_code text DEFAULT 'EC'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_caso_id uuid;
  v_prestador uuid;
  v_evento uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_condicion IS NULL OR length(trim(p_condicion)) = 0 THEN
    RAISE EXCEPTION 'condicion_requerida' USING ERRCODE = '22023';
  END IF;
  -- D-414 replicado en la puerta (DEFINER bypassa RLS): opera la cuenta + acceso vigente
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  -- prestador de la cuenta (por el empleado si lo hay, si no el primero)
  SELECT pe.prestador_id INTO v_prestador FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    SELECT id INTO v_prestador FROM prestadores WHERE cuenta_comercial_id = p_cuenta_comercial_id ORDER BY created_at LIMIT 1;
  END IF;
  IF v_prestador IS NULL THEN RAISE EXCEPTION 'cuenta_sin_prestador' USING ERRCODE = '22023'; END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_rol(v_prestador, ARRAY['dueño','profesional']), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- empleado_tratante_id → auth.users(id): es el USUARIO del vet (no el
  -- prestador_empleados.id). La persona-empleado viaja en la tipada.
  INSERT INTO caso_clinico (
    mascota_id, condicion, cuenta_comercial_tratante_id, empleado_tratante_id,
    horizonte_proximo_evento, evento_origen_id, abierto_por_user_id, estado
  ) VALUES (
    p_mascota_id, p_condicion, p_cuenta_comercial_id, v_uid,
    p_horizonte, p_evento_origen, v_uid, 'activo'
  ) RETURNING id INTO v_caso_id;

  -- productor del cascarón V0: evento padre 'caso_clinico_abierto' +
  -- la tipada (evento_id NOT NULL) — declarado_por_prestador.
  v_evento := public._crear_evento_padre_auto(
    p_mascota_id, 'caso_clinico_abierto', 'salud', now(),
    v_prestador, p_empleado_id, v_uid, NULL, p_country_code,
    jsonb_build_object('caso_id', v_caso_id, 'condicion', p_condicion),
    'declarado_por_prestador');

  INSERT INTO evento_caso_clinico_abierto (
    evento_id, caso_id, mascota_id, cuenta_comercial_id, empleado_id, condicion, country_code
  ) VALUES (
    v_evento, v_caso_id, p_mascota_id, p_cuenta_comercial_id, p_empleado_id, p_condicion, p_country_code
  );

  RETURN v_caso_id;
END;
$function$;

-- ══ completar_historia_clinica ══
CREATE OR REPLACE FUNCTION public.completar_historia_clinica(input_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  -- IDs de entrada
  v_cita_id        uuid;
  v_mascota_id     uuid;
  v_prestador_id   uuid;
  v_empleado_id    uuid;
  v_country_code   text;

  -- Estado de la cita
  v_cita_existe          boolean;
  v_cita_evento_id_actual uuid;
  v_cita_modalidad        text;
  v_cita_tipo_servicio    text;

  -- Eventos creados
  v_evento_padre_id    uuid;
  v_evento_hc_id       uuid;
  v_evento_peso_id     uuid;  -- NUEVO
  v_evento_receta_id   uuid;
  v_evento_examen_id   uuid;
  v_evento_archivo_id  uuid;

  -- HC creada
  v_historia_id  uuid;

  -- Loop variables
  v_receta   jsonb;
  v_examen   jsonb;
  v_archivo  jsonb;
  v_orden    int;

  -- Peso (NUEVO)
  v_peso_kg           numeric;
  v_metodo_peso       text;

  -- Eje JTBD calculado
  v_eje_jtbd text;
BEGIN
  -- ============================================================
  -- 1. Extraer y validar IDs obligatorios
  -- ============================================================

  v_cita_id      := (input_data->>'cita_id')::uuid;
  v_mascota_id   := (input_data->>'mascota_id')::uuid;
  v_prestador_id := (input_data->>'prestador_id')::uuid;
  v_empleado_id  := NULLIF(input_data->>'empleado_id', '')::uuid;
  v_country_code := COALESCE(input_data->>'country_code', 'EC');

  IF v_cita_id IS NULL OR v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_id, mascota_id y prestador_id son obligatorios';
  END IF;

  -- ============================================================
  -- 2. Validar acceso del usuario al prestador
  -- ============================================================

  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'acceso denegado: no tiene permisos sobre este prestador';
  END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_rol(v_prestador_id, ARRAY['dueño','profesional']), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- ============================================================
  -- 3. Validar integridad de la cita
  -- ============================================================

  SELECT
    EXISTS(SELECT 1 FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT evento_id FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT modalidad FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT tipo_servicio FROM evento_cita_servicio WHERE id = v_cita_id)
  INTO v_cita_existe, v_cita_evento_id_actual, v_cita_modalidad, v_cita_tipo_servicio;

  IF NOT v_cita_existe THEN
    RAISE EXCEPTION 'cita % no existe', v_cita_id;
  END IF;

  IF v_cita_evento_id_actual IS NOT NULL THEN
    RAISE EXCEPTION 'cita % ya tiene evento padre asociado (evento_id=%). La función no es idempotente. Si necesita reintentar, limpie el evento manualmente primero',
      v_cita_id, v_cita_evento_id_actual;
  END IF;

  -- Validar que la cita pertenece al prestador y mascota declarados
  IF NOT EXISTS (
    SELECT 1 FROM evento_cita_servicio
    WHERE id = v_cita_id
      AND prestador_id = v_prestador_id
      AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'cita % no pertenece al prestador % y/o mascota % declarados',
      v_cita_id, v_prestador_id, v_mascota_id;
  END IF;

  -- Validar que la HC no existe ya
  IF EXISTS (SELECT 1 FROM evento_historia_clinica_registrada WHERE cita_id = v_cita_id) THEN
    RAISE EXCEPTION 'ya existe una historia clínica para la cita %', v_cita_id;
  END IF;

  -- ============================================================
  -- 4. Calcular eje JTBD (siempre 'salud' para cita con HC)
  -- ============================================================

  v_eje_jtbd := COALESCE(eje_de_tipo_servicio(v_cita_tipo_servicio), 'salud');

  -- ============================================================
  -- 5. Crear evento padre (cita_servicio)
  -- ============================================================

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    cuenta_comercial_id, prestador_id, empleado_id,
    creado_por_user_id, country_code,
    datos
  ) VALUES (
    v_mascota_id, 'cita_servicio', v_eje_jtbd, now(),
    NULL, v_prestador_id, v_empleado_id,
    auth.uid(), v_country_code,
    jsonb_build_object(
      'cita_id', v_cita_id,
      'tipo_servicio', v_cita_tipo_servicio,
      'modalidad', v_cita_modalidad
    )
  )
  RETURNING id INTO v_evento_padre_id;

  -- Popular evento_cita_servicio.evento_id (cierra el loop)
  UPDATE evento_cita_servicio
  SET
    evento_id = v_evento_padre_id,
    estado = 'completada'
  WHERE id = v_cita_id;

  -- ============================================================
  -- 6. Crear evento hijo HC y registrar historia_clinica
  -- ============================================================

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
    creado_por_user_id, country_code,
    datos
  ) VALUES (
    v_mascota_id, 'historia_clinica_registrada', 'salud', now(),
    v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
    auth.uid(), v_country_code,
    jsonb_build_object('cita_id', v_cita_id)
  )
  RETURNING id INTO v_evento_hc_id;

  INSERT INTO evento_historia_clinica_registrada (
    cita_id, mascota_id, prestador_id, veterinario_user_id, empleado_id, evento_id, country_code,
    motivo_consulta, anamnesis,
    peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal,
    examen_fisico, diagnostico_principal, cie_codigo, diagnosticos_secundarios,
    tratamiento, indicaciones,
    requiere_hospitalizacion, requiere_cirugia,
    completado_en
  ) VALUES (
    v_cita_id, v_mascota_id, v_prestador_id, auth.uid(), v_empleado_id, v_evento_hc_id, v_country_code,
    input_data->>'motivo_consulta',
    input_data->>'anamnesis',
    (input_data->>'peso_kg')::numeric,
    (input_data->>'temperatura_c')::numeric,
    (input_data->>'frecuencia_cardiaca')::int,
    (input_data->>'frecuencia_respiratoria')::int,
    (input_data->>'condicion_corporal')::int,
    input_data->>'examen_fisico',
    input_data->>'diagnostico_principal',
    input_data->>'cie_codigo',
    COALESCE(input_data->'dx_secundarios', '[]'::jsonb),
    input_data->>'tratamiento',
    input_data->>'indicaciones',
    (input_data->>'requiere_hospitalizacion')::boolean,
    (input_data->>'requiere_cirugia')::boolean,
    now()
  )
  RETURNING id INTO v_historia_id;

  -- ============================================================
  -- 6.5. Si la HC trae peso_kg > 0, crear sub-evento peso_medicion
  -- (NUEVO — fix D-107: dispara trigger _trg_peso_propagar_perfil que
  --  actualiza mascota_perfil_vigente.peso_clinico_kg)
  -- ============================================================

  v_peso_kg := (input_data->>'peso_kg')::numeric;

  IF v_peso_kg IS NOT NULL AND v_peso_kg > 0 THEN
    -- Default 'bascula_clinica' para flujo de cita vet; permite override por input.
    v_metodo_peso := COALESCE(input_data->>'metodo_peso', 'bascula_clinica');

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'peso_medicion', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'peso_kg', v_peso_kg,
        'metodo', v_metodo_peso
      )
    )
    RETURNING id INTO v_evento_peso_id;

    INSERT INTO evento_peso_medicion (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      peso_kg, metodo_medicion, fecha_medicion
    ) VALUES (
      v_evento_peso_id, v_mascota_id, v_prestador_id, v_empleado_id, v_country_code,
      v_peso_kg, v_metodo_peso, now()
    );
  END IF;

  -- ============================================================
  -- 7. Insertar recetas: sub-evento + tipada + frecuencia
  -- ============================================================

  v_orden := 1;
  FOR v_receta IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'recetas', '[]'::jsonb))
  LOOP
    -- Evento hijo para esta receta
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'medicacion_prescrita', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'medicamento', v_receta->>'nombre_medicamento'
      )
    )
    RETURNING id INTO v_evento_receta_id;

    -- Tipada
    INSERT INTO evento_medicacion_prescrita (
      cita_id, mascota_id, prestador_id, empleado_id, evento_id, country_code,
      nombre_medicamento, dosis, frecuencia,
      concentracion, principio_activo, forma_farmaceutica,
      via_administracion, duracion_dias, indicaciones_especiales,
      orden
    ) VALUES (
      v_cita_id, v_mascota_id, v_prestador_id, v_empleado_id, v_evento_receta_id, v_country_code,
      v_receta->>'nombre_medicamento',
      v_receta->>'dosis',
      v_receta->>'frecuencia',
      v_receta->>'concentracion',
      v_receta->>'principio_activo',
      v_receta->>'forma_farmaceutica',
      v_receta->>'via_administracion',
      (v_receta->>'duracion_dias')::int,
      v_receta->>'indicaciones_especiales',
      v_orden
    );

    -- Upsert en recetas frecuentes (funcionalidad útil preservada)
    INSERT INTO prestador_recetas_frecuentes (
      prestador_id, country_code,
      nombre_medicamento, dosis, frecuencia,
      concentracion, principio_activo, forma_farmaceutica,
      via_administracion, duracion_dias, indicaciones_especiales,
      contador_uso, ultima_vez_usada, activa, creada_manualmente
    ) VALUES (
      v_prestador_id, v_country_code,
      v_receta->>'nombre_medicamento',
      v_receta->>'dosis',
      v_receta->>'frecuencia',
      v_receta->>'concentracion',
      v_receta->>'principio_activo',
      v_receta->>'forma_farmaceutica',
      v_receta->>'via_administracion',
      (v_receta->>'duracion_dias')::int,
      v_receta->>'indicaciones_especiales',
      1, now(), true, false
    )
    ON CONFLICT ON CONSTRAINT prestador_receta_frecuente_unique
    DO UPDATE SET
      contador_uso     = prestador_recetas_frecuentes.contador_uso + 1,
      ultima_vez_usada = now();

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 8. Insertar exámenes: sub-evento + tipada
  -- ============================================================

  v_orden := 1;
  FOR v_examen IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'examenes', '[]'::jsonb))
  LOOP
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'examen_diagnostico', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'tipo_examen', v_examen->>'tipo_examen'
      )
    )
    RETURNING id INTO v_evento_examen_id;

    INSERT INTO evento_examen_diagnostico (
      cita_id, mascota_id, prestador_id, empleado_id, evento_id, country_code,
      tipo_examen, descripcion, urgencia,
      indicaciones_preparacion, estado, orden
    ) VALUES (
      v_cita_id, v_mascota_id, v_prestador_id, v_empleado_id, v_evento_examen_id, v_country_code,
      v_examen->>'tipo_examen',
      v_examen->>'descripcion',
      COALESCE(v_examen->>'urgencia', 'rutina'),
      v_examen->>'indicaciones_preparacion',
      'solicitado',
      v_orden
    );

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 9. Insertar archivos: sub-evento + tipada
  -- ============================================================

  v_orden := 1;
  FOR v_archivo IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'archivos', '[]'::jsonb))
  LOOP
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'archivo_adjunto', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'categoria', COALESCE(v_archivo->>'categoria', 'otro'),
        'nombre_archivo', v_archivo->>'nombre_archivo'
      )
    )
    RETURNING id INTO v_evento_archivo_id;

    INSERT INTO evento_archivo_adjunto (
      mascota_id, prestador_id, empleado_id, country_code,
      bucket, storage_path, nombre_archivo,
      categoria, mime_type, tamano_bytes, descripcion,
      subido_por_user_id,
      evento_padre_id, evento_id,
      orden
    ) VALUES (
      v_mascota_id, v_prestador_id, v_empleado_id, v_country_code,
      COALESCE(v_archivo->>'bucket', 'cita-archivos'),
      v_archivo->>'storage_path',
      v_archivo->>'nombre_archivo',
      COALESCE(v_archivo->>'categoria', 'otro'),
      v_archivo->>'mime_type',
      (v_archivo->>'tamano_bytes')::bigint,
      v_archivo->>'descripcion',
      auth.uid(),
      v_evento_hc_id,
      v_evento_archivo_id,
      v_orden
    );

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 10. Retornar ID de la historia clínica creada
  -- ============================================================

  RETURN v_historia_id;
END;
$function$;

-- ══ registrar_vacuna_mostrador ══
CREATE OR REPLACE FUNCTION public.registrar_vacuna_mostrador(p_cita_id uuid, p_vacuna_codigo text DEFAULT NULL::text, p_nombre_libre text DEFAULT NULL::text, p_fecha_aplicacion date DEFAULT NULL::date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_rol(v_prestador, ARRAY['dueño','profesional']), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
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

DO $cint$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('sedimentar_nota_clinica','abrir_caso_clinico','completar_historia_clinica','registrar_vacuna_mostrador')
     AND p.prosrc LIKE '%rol_sin_escritura_clinica%';
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'CINTURON D-490 fase2: se esperaban 4 con el gate, hay %', v_n;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('sedimentar_nota_clinica','abrir_caso_clinico','completar_historia_clinica','registrar_vacuna_mostrador')
    GROUP BY p.proname
    HAVING count(*) <> 1 OR bool_and(p.prosrc LIKE '%rol_sin_escritura_clinica%') = false
  ) THEN
    RAISE EXCEPTION 'CINTURON D-490 fase2: sobrecarga o copia sin gate (firma cambio)';
  END IF;
  RAISE NOTICE 'CINTURON D-490 fase2 OK: 4/4 con gate, 1 oid por nombre';
END $cint$;

COMMIT;
