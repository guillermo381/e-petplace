-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807120000_s90a_fix_asignar_cita_matricula.sql
-- Escrita ANTES de aplicar. ⚠️ RESTAURA UN BODY ROTO: el estado anterior
-- crasheaba toda asignación al llegar al gate de matrícula (v_cita sin
-- declarar). Correrla es volver a romper el verbo — solo tiene sentido como
-- paso intermedio de una reversión mayor de D-676.
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
  IF NOT public._empleado_matricula_ok(p_empleado_id, v_cita.tipo_servicio) THEN
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