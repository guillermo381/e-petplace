-- S70-A5 — LECTORES DEL DUEÑO: la solicitud de autorización pendiente + el
-- PARTE de la consulta (la constelación en voz de familia). 76(g) aditiva.
-- L-140 al cierre. Ambos DEFINER, gateados por familia (L-150).

-- ─────────────────────────────────────────────────────────────────────────
-- (1) las solicitudes pendientes que ME tocan (familia/destino), vigentes
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_pendientes_dueno()
RETURNS TABLE(
  solicitud_id   uuid,
  tipo           text,
  mascota_id     uuid,
  mascota_nombre text,
  negocio_nombre text,
  expira_en      timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.tipo,
    s.mascota_id,
    COALESCE(m.nombre, s.payload_alta->>'nombre'),   -- alta: el nombre propuesto
    cc.nombre_comercial,
    s.expira_en
  FROM solicitud_autorizacion_mostrador s
  JOIN cuentas_comerciales cc ON cc.id = s.cuenta_comercial_id
  LEFT JOIN mascotas m ON m.id = s.mascota_id
  WHERE s.estado = 'pendiente' AND s.expira_en > now()
    AND (
      (s.tipo = 'atencion'     AND public._user_es_familia_de_mascota(s.mascota_id, v_uid)) OR
      (s.tipo = 'alta_mascota' AND s.destino_user_id = v_uid)
    )
  ORDER BY s.created_at DESC;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- (2) el PARTE de una consulta: HC + fórmula + exámenes + próximo control
-- ─────────────────────────────────────────────────────────────────────────
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
    'caso_condicion', v_caso_cond
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_solicitudes_pendientes_dueno() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_solicitudes_pendientes_dueno() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_parte_consulta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_parte_consulta(uuid) TO authenticated;
