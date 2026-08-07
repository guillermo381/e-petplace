-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 14 ① — LA TRANSICIÓN FIRMADA: FECHA 15-AGO Y EL GATE SUBE
-- A VISIBILIDAD
--
-- LA FIRMA DEL FOUNDER: «todo vet que entre desde el 15-AGO exige documentos
-- cargados para tener VISIBILIDAD (no solo asignación — sin matrícula NO
-- APARECE). Los vets de hoy son cuentas de prueba: la gracia del 1-sep muta
-- a esto.»
--
-- DOS CAMBIOS, los dos con su porqué:
--   ① la constante de gracia: 2026-09-01 → 2026-08-15.
--   ② `obtener_personas_que_atienden` (la vitrina) deja de listar al que no
--      tiene matrícula para un servicio médico. **Ofrecer a quien no puede
--      recibir la cita es prometer** — el gate de asignación ya rebotaba,
--      pero recién ahora la promesa no se hace.
--
-- 76(g): NO RIGE — dos CREATE OR REPLACE, cero backfill.
-- D-662: cero contrato roto (mismas firmas y RETURNS).
-- REVERSA: docs/relevamientos/2026-08-07-s89a-REVERSA-gate-visibilidad.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._empleado_matricula_ok(p_empleado_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_corte  date := DATE '2026-08-15';   -- FIRMADA founder (orden 14 ①)
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

  -- GRACIA (firma founder orden 14 ①): los vets de HOY son cuentas de
  -- prueba, así que la ventana se acorta al 15-AGO. El que nace desde hoy,
  -- nace completo. Desde el corte, sin documentos NO HAY VISIBILIDAD —
  -- el gate dejó de ser solo de asignación (ver la vitrina abajo).
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
    -- D-676 (firma founder orden 14 ①): EL GATE SUBE A VISIBILIDAD. Sin
    -- matrícula el profesional NO APARECE en la vitrina — antes solo no se
    -- le podía asignar, y ofrecer a quien no puede recibir es prometer.
    AND public._empleado_matricula_ok(
          pe.id, (SELECT ps.tipo_servicio FROM prestador_servicios ps WHERE ps.id = p_servicio_id))
  ORDER BY (pe.rol = 'dueño') DESC, pr.nombre ASC, pe.id ASC;
END;
$function$
;

DO $cint$
DECLARE v_src text;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='_empleado_matricula_ok';
  IF v_src NOT LIKE '%2026-08-15%' THEN
    RAISE EXCEPTION 'cinturon_gate_visibilidad: la fecha firmada no quedó en el helper';
  END IF;
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='obtener_personas_que_atienden';
  IF v_src NOT LIKE '%_empleado_matricula_ok%' THEN
    RAISE EXCEPTION 'cinturon_gate_visibilidad: la vitrina no consulta el helper';
  END IF;
END $cint$;
