-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807130000_s90a_fechas_matricula_una_sola.sql
-- Escrita ANTES de aplicar. Restaura los DOS bodies anteriores (con sus TRES
-- fechas divergentes — se declara: revertir es volver a la divergencia que
-- la letra founder mandó matar) y borra el helper de la frontera.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public._empleado_matricula_ok(p_empleado_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_corte  date := DATE '2026-08-15';
  v_medico boolean;
  v_mat    text;
  v_creado timestamptz;
BEGIN
  IF p_empleado_id IS NULL THEN RETURN true; END IF;
  SELECT ts.es_medico INTO v_medico FROM tipos_servicio ts WHERE ts.codigo = p_tipo_servicio;
  IF NOT COALESCE(v_medico, false) THEN RETURN true; END IF;
  SELECT pe.matricula_profesional, pe.created_at INTO v_mat, v_creado
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_creado IS NULL THEN RETURN false; END IF;
  IF coalesce(btrim(v_mat), '') <> '' THEN RETURN true; END IF;
  RETURN v_creado < DATE '2026-08-07'
         AND (now() AT TIME ZONE 'America/Guayaquil')::date < v_corte;
END;
$function$;

CREATE OR REPLACE FUNCTION public.vets_sin_matricula()
 RETURNS TABLE(empleado_id uuid, nombre text, negocio text, dias_de_gracia integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT DISTINCT pe.id, pe.nombre, pr.nombre_comercial,
         GREATEST(0, (DATE '2026-09-01' - (now() AT TIME ZONE 'America/Guayaquil')::date))::int
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
  JOIN prestador_servicios ps ON ps.id = pes.servicio_id
  JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio AND ts.es_medico
  WHERE pe.activo
    AND coalesce(btrim(pe.matricula_profesional), '') = ''
    AND public._user_opera_cuenta_comercial(pr.cuenta_comercial_id, auth.uid());
$function$;

DROP FUNCTION IF EXISTS public._corte_matricula();

COMMIT;
