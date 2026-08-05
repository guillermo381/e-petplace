-- ============================================================================
-- S87-A · LOTE 1 — MIGRACIONES 4 a 7 DE 7 (avisos 8 a 11 de 11)
--   · _notificar_dueño_prestador ......... 1 (tipo POR PARAMETRO, censado)
--   · cleanup_pendientes_vencidos ........ 1 (destinatario = admin)
--   · fijar_fecha_procedimiento .......... 1 (el tipo mentía: cita_confirmada)
--   · _trg_completar_pendiente_registro .. 2 (dos audiencias = DOS tipos)
--
-- Con estas, LAS ONCE pasan por la puerta y `notificaciones` deja de tener
-- productores. La puerta trasera se cierra en la migración siguiente.
-- VEDA 76(g): NO RIGE. REVERSA: los cuerpos viven en el historial.
-- ============================================================================

CREATE OR REPLACE FUNCTION public."_notificar_dueño_prestador"(p_prestador_id uuid, p_tipo text, p_titulo text, p_mensaje text, p_url_accion text, p_datos jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_country_code text;
  v_notif_id uuid;
BEGIN
  -- Lookup dueño del prestador
  SELECT user_id INTO v_user_id
  FROM prestadores
  WHERE id = p_prestador_id;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Prestador % no existe, no se crea notificación', p_prestador_id;
    RETURN NULL;
  END IF;

  -- Lookup country del user (para FK notificaciones.country_code)
  SELECT COALESCE(country_code, 'EC') INTO v_country_code
  FROM profiles
  WHERE id = v_user_id;

  -- Insertar notificación
  -- S87 · LOTE 1 → LA PUERTA. Recibe el tipo POR PARAMETRO: el censo midio los
  -- SEIS valores reales que le llegan (documento_aprobado/rechazado ·
  -- prestador_aprobado/rechazado/suspendido · el `sistema` que hoy pasa a
  -- `prestador_en_revision`) y los seis estan en catalogo. El aviso es para el
  -- PRESTADOR y no lleva mascota: el gate 1 no aplica y el lector lo dice.
  -- La voz viaja en `datos` -- el motor no compone texto, lo hace la superficie.
  v_notif_id := registrar_intencion_notificacion(
    p_tipo                 => p_tipo,
    p_destinatario_user_id => v_user_id,
    p_mascota_id           => NULL,
    p_datos                => coalesce(p_datos,'{}'::jsonb) || jsonb_build_object(
                                'titulo', p_titulo, 'mensaje', p_mensaje,
                                'url_accion', p_url_accion),
    p_clave_dedup          => NULL
  );

  RETURN v_notif_id;
END;
$function$

;

CREATE OR REPLACE FUNCTION public.cleanup_pendientes_vencidos()
 RETURNS TABLE(pendiente_id uuid, accion text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
BEGIN
  FOR v_pendiente IN
    SELECT * FROM cliente_pendiente_registro
    WHERE expira_en < now()
      AND completado_en IS NULL
      AND soporte_resuelto_en IS NULL
      AND notificado_soporte_en IS NULL   -- terminal: no re-notificar cada noche
  LOOP
    -- S87 · LOTE 1 → LA PUERTA. Destinatario = un admin activo (medido:
    -- admin_users.id ES un auth.users.id, 2 de 2). Sin mascota: el gate 1 no
    -- aplica. Dedup por pendiente: soporte se entera UNA vez.
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'alta_asistida_vencida_soporte',
      p_destinatario_user_id => au.id,
      p_mascota_id           => NULL,
      p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                   'pendiente_nombre', v_pendiente.nombre),
      p_clave_dedup          => 'alta-vencida:' || v_pendiente.id
    )
    FROM admin_users au WHERE au.activo = true LIMIT 1;

    UPDATE cliente_pendiente_registro
    SET notificado_soporte_en = now()
    WHERE id = v_pendiente.id;

    pendiente_id := v_pendiente.id;
    accion := 'notificado_soporte';
    RETURN NEXT;
  END LOOP;
END;
$function$

;

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
                                                   'presupuesto_id', p_presupuesto_id),
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
$function$

;

CREATE OR REPLACE FUNCTION public._trg_completar_pendiente_registro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
  v_mascota_id uuid;
  v_evento_id uuid;
  v_prestador_dueno_user_id uuid;
BEGIN
  -- Match dual: por email O por teléfono normalizado (con el país del pendiente).
  SELECT * INTO v_pendiente
  FROM cliente_pendiente_registro cpr
  WHERE cpr.completado_en IS NULL
    AND cpr.soporte_resuelto_en IS NULL
    AND (
      (cpr.email IS NOT NULL AND NEW.email IS NOT NULL AND LOWER(cpr.email) = LOWER(NEW.email))
      OR (cpr.telefono_normalizado IS NOT NULL AND NEW.telefono IS NOT NULL
          AND cpr.telefono_normalizado = public.normalizar_telefono(NEW.telefono, cpr.country_code))
    )
  LIMIT 1;

  IF v_pendiente.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE cliente_pendiente_registro
  SET completado_en = now(), completado_por_user_id = NEW.id
  WHERE id = v_pendiente.id;

  UPDATE familia
  SET tipo = 'estandar', cuenta_comercial_id = NULL, updated_at = now()
  WHERE id = v_pendiente.familia_id_placeholder;

  INSERT INTO familia_miembro (familia_id, user_id, rol, desde)
  VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

  FOR v_mascota_id IN
    SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
  LOOP
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota_id, NEW.id, v_pendiente.familia_id_placeholder, now(), NEW.id);

    UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;

    v_evento_id := gen_random_uuid();
    INSERT INTO eventos_mascota (
      id, mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, datos, country_code
    ) VALUES (
      v_evento_id, v_mascota_id, 'alta_asistida_completada_por_cliente', 'administrativo', now(),
      NEW.id,
      jsonb_build_object('pendiente_id', v_pendiente.id, 'prestador_origen', v_pendiente.creado_por_prestador_id),
      v_pendiente.country_code
    );
  END LOOP;

  SELECT user_id INTO v_prestador_dueno_user_id
  FROM prestadores WHERE id = v_pendiente.creado_por_prestador_id;

  IF v_prestador_dueno_user_id IS NOT NULL THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_prestador`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_prestador',
        p_destinatario_user_id => v_prestador_dueno_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre),
        p_clave_dedup          => 'registro_completado_prestador:' || v_pendiente.id
      );
  END IF;

  IF v_pendiente.creado_por_user_id IS NOT NULL
     AND v_pendiente.creado_por_user_id <> v_prestador_dueno_user_id THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_cliente`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_cliente',
        p_destinatario_user_id => v_prestador_dueno_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre),
        p_clave_dedup          => 'registro_completado_cliente:' || v_pendiente.id
      );
  END IF;

  RETURN NEW;
END;
$function$

;

REVOKE EXECUTE ON FUNCTION public.trg_prestadores_notif_cambio_estado() FROM PUBLIC, anon;
