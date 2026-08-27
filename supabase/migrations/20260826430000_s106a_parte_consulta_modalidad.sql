-- ============================================================================
-- S106-A tanda 3 · EL PARTE DE CONSULTA DICE SU MODALIDAD
--
-- `LETRA_TELEMEDICINA` §7 firma que la consulta **queda marcada como atendida
-- por videoconsulta**. C midió con control positivo que el parte no la traía —
-- y es **la lectura clínica**: la pantalla que alguien abre para leer qué pasó
-- en esa consulta, meses o años después.
--
-- > *En el timeline la marca ayuda a ubicarse; acá cambia cómo se lee lo que
-- > dice. Un examen físico hecho por video y uno hecho con el animal sobre la
-- > mesa no son la misma evidencia, y el papel tiene que decir cuál fue.*
--
-- ── EL CAMINO, MEDIDO ──────────────────────────────────────────────────────
-- `evento_historia_clinica_registrada` **ya lleva `cita_id`** —esta misma
-- función lo usa dos veces para juntar fórmula y exámenes— así que la
-- modalidad está a un `SELECT` de distancia. **No hace falta ningún join
-- nuevo ni ninguna columna.** Es §7② al pie: *el padre es la propia cita, y
-- los lectores derivan la marca de ella.*
--
-- ── LO QUE NO HACE ─────────────────────────────────────────────────────────
-- No traduce: devuelve el código del motor (`telemedicina`), jamás el de la
-- pieza (`teleconsulta`). La voz es de la pantalla, Ley 3.
--
-- ── VEDA 76(g): NO RIGE. `CREATE OR REPLACE`, misma firma, cero backfill.
-- ── L-119: NO RIGE — la firma no cambia.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-parte-consulta-modalidad.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_parte_consulta(p_evento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_hc record;
  v_negocio text;
  v_prox text;
  v_formula jsonb;
  v_examenes jsonb;
  v_caso_cond text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT h.*, e.datos AS ev_datos INTO v_hc
  FROM evento_historia_clinica_registrada h
  JOIN eventos_mascota e ON e.id = h.evento_id
  WHERE h.evento_id = p_evento_id;
  IF v_hc.evento_id IS NULL THEN RAISE EXCEPTION 'parte_no_encontrado' USING ERRCODE = '22023'; END IF;

  IF NOT public._user_es_familia_de_mascota(v_hc.mascota_id, v_uid) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  SELECT nombre_comercial INTO v_negocio FROM prestadores WHERE id = v_hc.prestador_id;
  v_prox := v_hc.ev_datos->>'proximo_control';
  IF v_hc.caso_clinico_id IS NOT NULL THEN
    SELECT condicion INTO v_caso_cond FROM caso_clinico WHERE id = v_hc.caso_clinico_id;
  END IF;

  -- fórmula (por cita_id, el ancla de la constelación) — el original clínico
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'nombre', mp.nombre_medicamento, 'presentacion', mp.forma_farmaceutica,
    'cantidad', mp.cantidad, 'dosis', mp.dosis, 'frecuencia', mp.frecuencia,
    'duracion_dias', mp.duracion_dias, 'via', mp.via_administracion,
    'indicaciones', mp.indicaciones_especiales, 'principio_activo', mp.principio_activo
  ) ORDER BY mp.orden), '[]'::jsonb) INTO v_formula
  FROM evento_medicacion_prescrita mp WHERE mp.cita_id = v_hc.cita_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tipo_examen', ed.tipo_examen, 'estado', ed.estado
  ) ORDER BY ed.orden), '[]'::jsonb) INTO v_examenes
  FROM evento_examen_diagnostico ed WHERE ed.cita_id = v_hc.cita_id;

  RETURN jsonb_build_object(
    'evento_id', p_evento_id,
    'mascota_id', v_hc.mascota_id,
    'fecha', v_hc.completado_en,
    'negocio_nombre', v_negocio,
    'consulta', jsonb_build_object(
      'motivo', v_hc.motivo_consulta,
      'diagnostico', v_hc.diagnostico_principal,
      'anamnesis', v_hc.anamnesis,
      'examen', v_hc.examen_fisico,
      'plan_terapeutico', v_hc.tratamiento,
      'indicaciones', v_hc.indicaciones
    ),
    'vitales', jsonb_strip_nulls(jsonb_build_object(
      'peso_kg', v_hc.peso_kg, 'temperatura_c', v_hc.temperatura_c,
      'frecuencia_cardiaca', v_hc.frecuencia_cardiaca,
      'frecuencia_respiratoria', v_hc.frecuencia_respiratoria,
      'condicion_corporal', v_hc.condicion_corporal
    )),
    'formula', v_formula,
    'examenes', v_examenes,
    'proximo_control', v_prox,
    'caso_condicion', v_caso_cond,
    -- ═══ S106 t3 · LA MARCA DE §7 EN LA LECTURA CLÍNICA ═══════════════════
    -- Código del motor, sin traducir. `NULL` es legítimo (partes viejos sin
    -- modalidad escrita): decir `presencial` por ellos sería INVENTAR, y
    -- justo en un papel clínico.
    'modalidad', (SELECT c.modalidad FROM evento_cita_servicio c WHERE c.id = v_hc.cita_id)
  );
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.obtener_parte_consulta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_parte_consulta(uuid) TO authenticated;

-- ── CINTURÓN: EJERCE POR EL CAMINO REAL ────────────────────────────────────
-- Corre la RPC con el JWT de la familia dueña de un parte real y exige que la
-- clave venga. *«La clave está en el jsonb» no prueba nada —`jsonb_build_object`
-- la pone igual con NULL adentro— así que se compara contra la modalidad de SU
-- cita, leída aparte.*
DO $cinturon$
DECLARE
  v_rol_mig text := current_user;   -- ⚠️ jamás RESET ROLE
  v_ev uuid; v_uid uuid; v_esperada text; v_out jsonb; v_vino text;
BEGIN
  IF has_function_privilege('anon','public.obtener_parte_consulta(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el parte quedo alcanzable por anon';
  END IF;

  SELECT h.evento_id, fm.user_id, c.modalidad
    INTO v_ev, v_uid, v_esperada
  FROM evento_historia_clinica_registrada h
  JOIN mascotas m         ON m.id = h.mascota_id
  JOIN familia_miembro fm ON fm.familia_id = m.familia_id AND fm.hasta IS NULL
  JOIN evento_cita_servicio c ON c.id = h.cita_id
  WHERE c.modalidad IS NOT NULL
  LIMIT 1;

  IF v_ev IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay ningun parte con cita de modalidad conocida para ejercer';
  END IF;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_uid, 'role', 'authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_out := public.obtener_parte_consulta(v_ev);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  v_vino := v_out->>'modalidad';
  IF v_vino IS DISTINCT FROM v_esperada THEN
    RAISE EXCEPTION 'cinturon: la modalidad no viajo — la cita dice %, el parte devolvio %',
                    v_esperada, coalesce(v_vino,'(ausente)');
  END IF;

  RAISE NOTICE 'cinturon parte: OK · evento % · modalidad %', v_ev, v_vino;
END;
$cinturon$;
