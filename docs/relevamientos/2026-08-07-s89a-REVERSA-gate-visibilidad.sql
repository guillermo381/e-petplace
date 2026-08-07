-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807020000_s89a_matricula_gate_visibilidad.sql
-- Escrita ANTES. Restaura el helper con la fecha vieja (1-sep) y la vitrina
-- sin el gate de visibilidad.
-- ⚠️ REVERTIR baja el gate: un vet sin documentos vuelve a APARECER.
-- ═══════════════════════════════════════════════════════════════════════════


CREATE OR REPLACE FUNCTION public._empleado_matricula_ok(p_empleado_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_corte  date := DATE '2026-09-01';   -- LA TRANSICION, propuesta a mesa (S89)
  v_medico boolean;
  v_mat    text;
  v_creado timestamptz;
BEGIN
  IF p_empleado_id IS NULL THEN RETURN true; END IF;   -- a la pizarra: nadie asignado
  SELECT ts.es_medico INTO v_medico FROM tipos_servicio ts WHERE ts.codigo = p_tipo_servicio;
  IF NOT COALESCE(v_medico, false) THEN RETURN true; END IF;   -- lo no-medico no pide matricula

  SELECT pe.matricula_profesional, pe.created_at INTO v_mat, v_creado
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_creado IS NULL THEN RETURN false; END IF;
  IF coalesce(btrim(v_mat), '') <> '' THEN RETURN true; END IF;

  -- GRACIA: el que ya existia tiene hasta el corte; el que nace hoy, no.
  RETURN v_creado < DATE '2026-08-07'
         AND (now() AT TIME ZONE 'America/Guayaquil')::date < v_corte;
END;
$function$
;


CREATE OR REPLACE FUNCTION public.obtener_personas_que_atienden(p_prestador_id uuid, p_servicio_id uuid)
 RETURNS TABLE(empleado_id uuid, nombre text, tiene_jornada boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    pe.id,
    pr.nombre,
    EXISTS (SELECT 1 FROM prestador_horarios h
             WHERE h.empleado_id = pe.id AND h.activo)
  FROM prestador_empleados pe
  LEFT JOIN profiles pr ON pr.id = pe.user_id
  WHERE pe.prestador_id = p_prestador_id
    AND pe.activo
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
  ORDER BY (pe.rol = 'dueño') DESC, pr.nombre ASC, pe.id ASC;
END;
$function$
;
