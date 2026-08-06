-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · D-674 — LA BOMBA ANTES QUE EL MOLDE (orden ① de la mesa, 6-ago-2026)
--
-- QUÉ: `fijar_fecha_procedimiento` — el ÚNICO productor de la familia cita —
-- tenía DOS defectos en su rama de notificación (entraron en S87,
-- `20260805080000`, copiados a `20260805320000`):
--   1. Referencia muerta `p_presupuesto_id` (no es parámetro de la función).
--      plpgsql la resuelve AL EJECUTAR ⇒ SQLSTATE 42703 en cuanto la rama
--      corre con dueño real (v_cita.user_id NOT NULL), y sin handler
--      alrededor REVIENTA LA RPC ENTERA: la fecha del procedimiento no se
--      fija. Rojo producido por la RAMA REAL antes de esta migración
--      (fixture in-txn sobre presupuesto aprobado vivo): 42703 confirmado.
--   2. La voz leía `v_cita.fecha` / `v_cita.hora` / `v_cita.prestador_id` —
--      el snapshot PRE-update, donde fecha/hora son NULL POR DEFINICIÓN (el
--      gate de elegibilidad exige `fecha IS NULL`) y el prestador puede
--      cambiar (la asignación re-deriva). La voz pasa a leer los valores
--      POST-update: `p_fecha`, `p_hora`, `v_emp_prestador`.
--
-- POR QUÉ AHORA: D-673 va a clonar este molde para los tres productores de
-- cita. Nada se clona de un molde con bomba.
--
-- 76(g): NO RIGE — CREATE OR REPLACE de una función, cero backfill, cero
--   escritura de datos.
-- D-662 (bundles vivos): CERO cambio de contrato — misma firma, mismo
--   RETURNS; los bundles publicados llaman igual. La migración y el publish
--   NO están acoplados.
-- L-140: CREATE OR REPLACE conserva el proacl existente; no nace función.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-d674-bomba-fijar-fecha.sql
--   (escrita ANTES; su nota: revertir REINTRODUCE la bomba).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fijar_fecha_procedimiento(p_cita uuid, p_fecha date, p_hora time without time zone, p_empleado uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_cita          record;
  v_pres          record;
  v_cuenta        uuid;
  v_emp_prestador uuid;
  v_capacidad     int;
  v_ocupados      int;
  v_ahora         timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_notif_user    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  -- cita + elegibilidad (fecha NULL + presupuesto aprobado)
  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.presupuesto_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_presupuesto' USING ERRCODE = '22023';
  END IF;
  IF v_cita.fecha IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_fijada' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_pres FROM presupuesto WHERE id = v_cita.presupuesto_id;
  IF v_pres.estado <> 'aprobado' THEN
    RAISE EXCEPTION 'presupuesto_no_aprobado: %', COALESCE(v_pres.estado, 'inexistente')
      USING ERRCODE = '22023';
  END IF;
  v_cuenta := v_pres.cuenta_comercial_id;

  -- persona que fija: habilitada de la cuenta
  IF NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- persona asignada (reasignación §2): activa y de la MISMA cuenta
  SELECT pe.prestador_id INTO v_emp_prestador
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  WHERE pe.id = p_empleado
    AND pe.activo = true
    AND pr.cuenta_comercial_id = v_cuenta;
  IF v_emp_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_es_de_cuenta' USING ERRCODE = '22023';
  END IF;

  -- higiene: la fecha coordinada no vive en el pasado (espejo reagendar_cita_suelta)
  IF (p_fecha + p_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- serializar por prestador+fecha (mismo patrón del motor de ventana)
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_emp_prestador::text || ':' || p_fecha::text, 0)
  );

  -- ocupación real del motor de ventana (regla de mezcla V0), duración
  -- SNAPSHOTEADA de la cita respetada; el procedimiento es exclusivo por
  -- default (cupo_techo NULL ⇒ capacidad 1). No se impone la grilla
  -- reservable (fuera_de_horario): la fecha del procedimiento se coordina,
  -- no se reserva contra el horario público.
  v_capacidad := COALESCE(
    (SELECT cupo_techo FROM tipos_servicio WHERE codigo = v_cita.tipo_servicio), 1);
  v_ocupados := public._agenda_ocupacion(
    p_empleado, p_fecha, p_hora, v_cita.duracion_minutos, p_cita, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- fijar fecha/hora/empleado + re-derivar prestador (asignación autoritativa).
  -- PRECIO CONGELADO INTACTO — no se toca `precio`.
  -- S72-A: la todo-libre gana un TIPO CONSUMIBLE al coordinar — sin él, la
  -- cita queda invisible a la agenda vet (los lectores discriminan por el
  -- embed tipos_servicio). COALESCE: jamás pisa un tipo que la cita ya tenga.
  UPDATE evento_cita_servicio
  SET fecha        = p_fecha,
      hora         = p_hora,
      empleado_id  = p_empleado,
      prestador_id = v_emp_prestador,
      tipo_servicio = COALESCE(tipo_servicio, 'procedimiento'),
      metadata     = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                       'fecha_fijada_en', now(),
                       'fijada_por',      v_uid
                     ),
      updated_at   = now()
  WHERE id = p_cita;

  -- si la cita tiene evento de timeline, mover su fecha (no-op si NULL)
  IF v_cita.evento_id IS NOT NULL THEN
    UPDATE eventos_mascota
    SET fecha_evento = (p_fecha + p_hora)
    WHERE id = v_cita.evento_id;
  END IF;

  -- Notificación al dueño SIEMPRE. El caso fantasma sin user en app no tiene
  -- destino in-app (declarado): se notifica cuando hay dueño real.
  -- S89 · D-674: la voz lee los valores POST-update — p_fecha/p_hora (los que
  -- esta llamada acaba de fijar; v_cita.* traía los NULL del snapshot) y
  -- v_emp_prestador (la asignación autoritativa re-derivada). Y el dato del
  -- presupuesto sale de la CITA (v_cita.presupuesto_id): la referencia S87 a
  -- un parámetro que esta firma no tiene daba 42703 en la rama real.
  -- (El nombre del token muerto no se escribe acá A PROPÓSITO: el cinturón lo
  -- busca en prosrc, y prosrc lee los comentarios como código — L-170.)
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'procedimiento_agendado',
      p_destinatario_user_id => v_notif_user,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id,
                                                   'presupuesto_id', v_cita.presupuesto_id)
            || public._voz_notificacion('procedimiento_agendado', v_notif_user, v_cita.mascota_id,
                 jsonb_build_object(
                   'negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_emp_prestador),
                   'fecha',   to_char(p_fecha,'DD/MM'),
                   'hora',    to_char(p_hora,'HH24:MI'))),
      p_clave_dedup          => 'proc-agendado:' || v_cita.id
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita,
    'fecha', p_fecha,
    'hora', p_hora,
    'empleado_id', p_empleado,
    'prestador_id', v_emp_prestador,
    'dueno_notificado', (v_notif_user IS NOT NULL)
  );
END;
$function$;

-- ── CINTURÓN (in-migración): la referencia muerta no puede seguir viva ──────
DO $$
DECLARE v_src text;
BEGIN
  SELECT p.prosrc INTO v_src
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'fijar_fecha_procedimiento';
  IF v_src LIKE '%p_presupuesto_id%' THEN
    RAISE EXCEPTION 'cinturon_d674: la referencia muerta p_presupuesto_id sigue en el body';
  END IF;
  IF v_src NOT LIKE '%v_cita.presupuesto_id%' THEN
    RAISE EXCEPTION 'cinturon_d674: falta la lectura correcta v_cita.presupuesto_id';
  END IF;
  IF v_src NOT LIKE '%to_char(p_fecha%' THEN
    RAISE EXCEPTION 'cinturon_d674: la voz no lee p_fecha (valores POST-update)';
  END IF;
END $$;
