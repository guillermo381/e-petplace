-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806150000_s89a_d674_bomba_fijar_fecha_procedimiento.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ REVERTIR REINTRODUCE LA BOMBA D-674: el body de abajo es el VIVO
-- pre-migración (capturado con pg_get_functiondef el 2026-08-06), y contiene
-- la referencia muerta `p_presupuesto_id` (42703 al ejecutar la rama de
-- notificación con dueño real) + la voz que lee el snapshot PRE-update
-- (fecha/hora NULL). Solo tiene sentido revertir si la migración rompió algo
-- PEOR que eso.
-- Nota de datos: revertir el código no borra intenciones ya registradas.
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

  -- notificación al dueño SIEMPRE (canal existente `notificaciones`). El
  -- caso fantasma sin user en app no tiene destino in-app (declarado): se
  -- notifica cuando hay dueño real.
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    -- S87 · LOTE 1 → LA PUERTA. El tipo DECIA 'cita_confirmada' bajo un titulo
    -- que decia 'Tu procedimiento quedo agendado': el vocabulario viejo no
    -- distinguia. Pasa a `procedimiento_agendado` (firmado S87).
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'procedimiento_agendado',
      p_destinatario_user_id => v_notif_user,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object('cita_id', v_cita.id,
                                                   'presupuesto_id', p_presupuesto_id)
            || public._voz_notificacion('procedimiento_agendado', v_notif_user, v_cita.mascota_id, jsonb_build_object('negocio', (SELECT p.nombre_comercial FROM prestadores p WHERE p.id = v_cita.prestador_id), 'fecha', to_char(v_cita.fecha,'DD/MM'), 'hora', to_char(v_cita.hora,'HH24:MI'))),
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
