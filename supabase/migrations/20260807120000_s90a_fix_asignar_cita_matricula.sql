-- ═══════════════════════════════════════════════════════════════════════════
-- S90-A · LA CURA DEL GATE ROTO EN asignar_cita_a_persona
--
-- EL BUG (entró con D-676, medido y con ROJO PRODUCIDO por el camino real):
-- el parche de matrícula insertó `v_cita.tipo_servicio` en una función que
-- usa ESCALARES — `v_cita` no existe en su DECLARE. plpgsql resuelve
-- identificadores al EJECUTAR, no al crear: la función se creó verde y
-- crasheaba en TODA asignación que llegara al gate (o sea, todas las que
-- pasaban los gates 1-5). El fixture lo probó: rebote con `v_cita` en el
-- mensaje, por el camino del titular con cita ruteable real.
--
-- LA CURA: una línea — el tipo ya vive en `v_tipo`, leído de la cita al
-- principio de la función. Nada más se toca.
--
-- 76(g) VEDA: NO RIGE — un CREATE OR REPLACE, cero backfill.
-- D-662: misma firma, mismo RETURNS — cero contrato roto.
-- L-140: CREATE OR REPLACE conserva proacl.
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-asignar-cita.sql
--   (restaura el body anterior, QUE ESTÁ ROTO — se declara: revertir esta
--   cura es volver a romper toda asignación).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.asignar_cita_a_persona(p_cita_id uuid, p_empleado_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_prestador     uuid;
  v_tipo          text;
  v_estado        text;
  v_empleado_hoy  uuid;
  v_es_futura     boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- ── LA CITA EXISTE ────────────────────────────────────────────────────
  SELECT c.prestador_id, c.tipo_servicio, c.estado, c.empleado_id,
         (c.fecha + c.hora) > (now() AT TIME ZONE 'America/Guayaquil')
    INTO v_prestador, v_tipo, v_estado, v_empleado_hoy, v_es_futura
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  -- ── GATE 1 · EL ROL ───────────────────────────────────────────────────
  -- Acá rebota el profesional puro. La ventanilla gatea por MEMBRESÍA
  -- (ley madre S76) y ruteo es ventanilla, no acto clínico.
  IF NOT public.empleado_puede_asignar_citas(v_prestador) THEN
    RAISE EXCEPTION 'rol_sin_asignacion: quien rutea es la recepción, el administrador o el titular'
      USING ERRCODE = '42501';
  END IF;

  -- ── GATE 2 · LA CITA NO TIENE PERSONA ─────────────────────────────────
  -- REASIGNAR ES OTRO VERBO, y su precondición es el aviso a la familia
  -- que todavía NO EXISTE (`notificar_reasignacion_cita`, medido: ausente
  -- — es el mismo artefacto que gatea la vitrina desde S78).
  -- Mover una cita YA asignada sin avisar sería cambiarle el profesional a
  -- una familia por la espalda.
  IF v_empleado_hoy IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_asignada: ya tiene persona (%); reasignar exige el aviso a la familia, que aún no existe',
      v_empleado_hoy USING ERRCODE = '22023';
  END IF;

  -- ── GATE 3 · LA CITA ES RUTEABLE ──────────────────────────────────────
  -- Espeja EXACTAMENTE `_cita_despegable`: estado pendiente/confirmada y en
  -- el futuro. El conjunto de lo ASIGNABLE == el conjunto de lo DESPEGABLE,
  -- a propósito: el verbo no debe alcanzar nada que el despegue no produzca.
  -- Una cita pasada sin persona se queda «de la clínica» — que es lo que
  -- §11(a) firmó — y jamás se reescribe quién la atendió.
  IF v_estado NOT IN ('pendiente', 'confirmada') THEN
    RAISE EXCEPTION 'cita_no_asignable: estado %; solo se rutea lo pendiente o confirmado',
      v_estado USING ERRCODE = '22023';
  END IF;

  IF NOT v_es_futura THEN
    RAISE EXCEPTION 'cita_no_asignable: la cita ya ocurrió; asignarla reescribiría quién atendió'
      USING ERRCODE = '22023';
  END IF;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'cita_sin_tipo_servicio: sin oficio no se puede verificar el chip de la persona'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 4 · LA PERSONA ES DE ESTE NEGOCIO Y ESTÁ ACTIVA ──────────────
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe
    WHERE pe.id = p_empleado_id
      AND pe.prestador_id = v_prestador
      AND pe.activo = true
  ) THEN
    RAISE EXCEPTION 'persona_no_es_del_negocio: no hay vínculo activo con este negocio'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 5 · LA PERSONA TIENE EL OFICIO ───────────────────────────────
  -- Espeja el tercer brazo de `cita_update_prestador` (S77): el chip es por
  -- TIPO de servicio, que es equivalente por construcción a la oferta —
  -- los chips se dan y se quitan a oficio completo.
  IF NOT EXISTS (
    SELECT 1
    FROM prestador_empleado_servicios pes
    JOIN prestador_servicios ps ON ps.id = pes.servicio_id
    WHERE pes.empleado_id = p_empleado_id
      AND ps.tipo_servicio = v_tipo
  ) THEN
    RAISE EXCEPTION 'persona_sin_oficio: no tiene el chip de % en este negocio', v_tipo
      USING ERRCODE = '22023';
  END IF;

  -- ── EL ACTO ───────────────────────────────────────────────────────────
  -- De los 5 triggers de la tabla, este UPDATE dispara SOLO
  -- `trg_evento_cita_servicio_updated_at` (los otros tres son `UPDATE OF
  -- estado` y el quinto es AFTER INSERT) — medido en S77 y citado acá para
  -- que nadie lo vuelva a medir.
    -- D-676 (S89, firma founder): la matrícula es CONDICIÓN DE ELEGIBILIDAD
  -- para recibir citas médicas, no dato decorativo. Un papel firmable exige
  -- firmante completo.
  IF NOT public._empleado_matricula_ok(p_empleado_id, v_tipo) THEN
    RAISE EXCEPTION 'matricula_profesional_faltante' USING ERRCODE = '22023';
  END IF;

UPDATE evento_cita_servicio
  SET empleado_id = p_empleado_id
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'cita_id',     p_cita_id,
    'empleado_id', p_empleado_id
  );
END;
$function$
;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_src text;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'asignar_cita_a_persona';
  IF v_src LIKE '%v!_cita%' ESCAPE '!' THEN
    RAISE EXCEPTION 'cinturon_asignar: el identificador fantasma v_cita sigue en el body';
  END IF;
  IF v_src NOT LIKE '%!_empleado!_matricula!_ok(p!_empleado!_id, v!_tipo)%' ESCAPE '!' THEN
    RAISE EXCEPTION 'cinturon_asignar: el gate de matricula no quedo sobre v_tipo';
  END IF;
END $cint$;
