-- S70-A2 (3+4) — EL SEDIMENTO DE LA NOTA CLÍNICA + CASO v1.
-- Relé founder ratificado: la constelación = UN evento padre POR FILA
-- (el UNIQUE(evento_id) de cada tipada lo consagra), todas
-- 'declarado_por_prestador', ancladas por cita_id + caso_clinico_id
-- ("una HC por cita" = unidad, historia_clinica tiene UNIQUE(cita_id)).
-- ADENDA E3: si la cita ya tiene su evento 'cita_servicio' en
-- eventos_mascota (evento_cita_servicio.evento_id), cada padre de la
-- constelación cuelga evento_padre_id hacia él (jerarquía 1 nivel, guard
-- _trg_eventos_validar_profundidad lo permite). Si la cita NO tiene
-- evento (las de presupuesto nacen con evento_id NULL), NO se inventa:
-- cita_id es ancla suficiente (declarado).
-- 76(g): aditiva pura (funciones nuevas). L-140 al cierre.

-- ─────────────────────────────────────────────────────────────────────────
-- helper interno: crea el padre de una fila de la constelación
-- (declarado_por_prestador) y cuelga evento_padre_id si hay evento de cita.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._crear_padre_constelacion(
  p_mascota uuid, p_tipo text, p_prestador uuid, p_empleado uuid,
  p_uid uuid, p_country text, p_datos jsonb, p_cita_evento uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ev uuid;
BEGIN
  v_ev := public._crear_evento_padre_auto(
    p_mascota, p_tipo, 'salud', now(),
    p_prestador, p_empleado, p_uid, NULL, p_country,
    COALESCE(p_datos, '{}'::jsonb), 'declarado_por_prestador');
  -- E3: colgar del evento de la cita si existe (1 nivel).
  IF p_cita_evento IS NOT NULL THEN
    UPDATE eventos_mascota SET evento_padre_id = p_cita_evento WHERE id = v_ev;
  END IF;
  RETURN v_ev;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- abrir_caso_clinico — el cascarón V0 cobra vida (+ productor de evento)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.abrir_caso_clinico(
  p_mascota_id uuid,
  p_condicion text,
  p_cuenta_comercial_id uuid,
  p_empleado_id uuid DEFAULT NULL,
  p_horizonte timestamptz DEFAULT NULL,
  p_evento_origen uuid DEFAULT NULL,
  p_country_code text DEFAULT 'EC'
)
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

-- ─────────────────────────────────────────────────────────────────────────
-- asociar_a_caso — estampa caso_clinico_id en la cita + tipadas por cita_id
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.asociar_a_caso(
  p_caso_id uuid,
  p_cita_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_clinica_tratante_del_caso(p_caso_id, v_uid) THEN
    RAISE EXCEPTION 'no_es_tratante' USING ERRCODE = '42501';
  END IF;

  UPDATE evento_cita_servicio SET caso_clinico_id = p_caso_id WHERE id = p_cita_id;
  UPDATE evento_historia_clinica_registrada SET caso_clinico_id = p_caso_id WHERE cita_id = p_cita_id;
  UPDATE evento_medicacion_prescrita SET caso_clinico_id = p_caso_id WHERE cita_id = p_cita_id;
  UPDATE evento_examen_diagnostico SET caso_clinico_id = p_caso_id WHERE cita_id = p_cita_id;

  RETURN jsonb_build_object('ok', true, 'caso_id', p_caso_id, 'cita_id', p_cita_id);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- sedimentar_nota_clinica — la puerta única de la constelación confirmada
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sedimentar_nota_clinica(
  p_cita_id uuid,
  p_cuenta_comercial_id uuid,
  p_empleado_id uuid,
  p_mascota_id uuid,
  p_nota jsonb,
  p_caso jsonb DEFAULT NULL,
  p_country_code text DEFAULT 'EC'
)
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

-- ─────────────────────────────────────────────────────────────────────────
-- L-140 — cierre de privilegios
-- ─────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public._crear_padre_constelacion(uuid, text, uuid, uuid, uuid, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.abrir_caso_clinico(uuid, text, uuid, uuid, timestamptz, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.abrir_caso_clinico(uuid, text, uuid, uuid, timestamptz, uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.asociar_a_caso(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.asociar_a_caso(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text) TO authenticated;
