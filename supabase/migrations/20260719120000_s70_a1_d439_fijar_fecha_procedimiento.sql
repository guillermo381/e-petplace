-- S70-A1 — D-439 MOTOR: coordinación de la fecha del procedimiento
-- (bloqueante de apertura, espec firmada en mesa).
--
-- El presupuesto aprobado agenda una cita FIRME con precio congelado y SIN
-- fecha (S69-A1, v1 honesto). D-439 cierra el hueco: el negocio coordina la
-- fecha después. Tres piezas:
--   1. Lector obtener_citas_por_coordinar(p_cuenta) — la bandeja de "por
--      coordinar" de la cuenta; la cita todo-libre (tipo_servicio NULL) ENTRA
--      por LEFT JOIN (hoy es invisible salvo por id).
--   2. RPC fijar_fecha_procedimiento(p_cita, p_fecha, p_hora, p_empleado) —
--      guards en la puerta; fija fecha/hora/empleado (reasignación = derecho
--      del negocio §2), precio congelado INTACTO, notifica al dueño SIEMPRE.
--   3. Cura de paso de la heurística de _agendar_cita_desde_presupuesto: se
--      retira el "primer prestador de la cuenta" (guess arbitrario) — sin
--      persona emisora, prestador NULL honesto; la persona autoritativa la
--      fija fijar_fecha_procedimiento.
--
-- 76(g): DECLARADA "no rige" — la tanda es aditiva pura (funciones nuevas +
-- reemplazo de un helper interno); no hay veda de escritura sobre motor
-- abierto (ninguna fila viva se reescribe).
-- L-140: las tres funciones cierran con REVOKE de PUBLIC/anon + GRANT mínimo.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. LECTOR — la bandeja "por coordinar" de la cuenta
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_citas_por_coordinar(p_cuenta uuid)
RETURNS TABLE(
  cita_id           uuid,
  presupuesto_id    uuid,
  caso_clinico_id   uuid,
  caso_condicion    text,
  mascota_id        uuid,
  mascota_nombre    text,
  mascota_especie   text,
  tipo_servicio     text,
  servicio_nombre   text,
  duracion_minutos  integer,
  total_congelado   numeric,
  empleado_id       uuid,
  items             jsonb,
  creada_en         timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.presupuesto_id,
    c.caso_clinico_id,
    cc.condicion,
    c.mascota_id,
    m.nombre,
    m.especie,
    c.tipo_servicio,
    ts.nombre,
    c.duracion_minutos,
    c.precio,                               -- total congelado (snapshot en la cita)
    c.empleado_id,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'descripcion_libre',    pi.descripcion_libre,
               'tipo_servicio_codigo', pi.tipo_servicio_codigo,
               'precio',               pi.precio,
               'cantidad',             pi.cantidad
             ) ORDER BY pi.created_at)
      FROM presupuesto_item pi
      WHERE pi.presupuesto_id = p.id
    ), '[]'::jsonb),
    c.created_at
  FROM evento_cita_servicio c
  JOIN presupuesto p           ON p.id = c.presupuesto_id
  JOIN mascotas m              ON m.id = c.mascota_id
  LEFT JOIN tipos_servicio ts  ON ts.codigo = c.tipo_servicio   -- todo-libre ENTRA
  LEFT JOIN caso_clinico cc    ON cc.id = c.caso_clinico_id
  WHERE p.cuenta_comercial_id = p_cuenta
    AND c.presupuesto_id IS NOT NULL
    AND c.fecha IS NULL
    AND c.estado = 'confirmada'
  ORDER BY c.created_at;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. RPC — fijar la fecha del procedimiento
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fijar_fecha_procedimiento(
  p_cita     uuid,
  p_fecha    date,
  p_hora     time without time zone,
  p_empleado uuid
)
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
  UPDATE evento_cita_servicio
  SET fecha       = p_fecha,
      hora        = p_hora,
      empleado_id = p_empleado,
      prestador_id = v_emp_prestador,
      metadata    = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                      'fecha_fijada_en', now(),
                      'fijada_por',      v_uid
                    ),
      updated_at  = now()
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
    INSERT INTO notificaciones (
      user_id, country_code, rol_destino, tipo, canal,
      titulo, mensaje, url_accion, datos
    ) VALUES (
      v_notif_user,
      v_cita.country_code,
      'pet_parent',
      'cita_confirmada',
      'in_app',
      'Tu procedimiento quedó agendado',
      'Coordinamos la fecha de tu procedimiento para el '
        || to_char(p_fecha, 'DD/MM/YYYY') || ' a las '
        || to_char(p_hora, 'HH24:MI') || '.',
      '/citas/' || v_cita.mascota_id::text,
      jsonb_build_object('cita_id', p_cita, 'fecha', p_fecha, 'hora', p_hora)
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

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CURA DE PASO — _agendar_cita_desde_presupuesto sin el guess arbitrario
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._agendar_cita_desde_presupuesto(p_presupuesto_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_p presupuesto%ROWTYPE;
  v_prestador_id uuid;
  v_tipo_servicio text;
  v_dur integer;
  v_cita_id uuid;
BEGIN
  SELECT * INTO v_p FROM presupuesto WHERE id = p_presupuesto_id;

  -- prestador SOLO si hay empleado emisor; sin persona emisora, prestador
  -- NULL honesto (D-439: la heurística "primer prestador de la cuenta" se
  -- RETIRA — la persona autoritativa la fija fijar_fecha_procedimiento).
  SELECT pe.prestador_id INTO v_prestador_id
  FROM prestador_empleados pe WHERE pe.id = v_p.empleado_id;

  -- tipo de servicio: el primer ítem con código de catálogo (procedimiento);
  -- si todo es libre, NULL honesto. duración: la del servicio o 30 (default v1).
  SELECT tipo_servicio_codigo INTO v_tipo_servicio
  FROM presupuesto_item
  WHERE presupuesto_id = p_presupuesto_id AND tipo_servicio_codigo IS NOT NULL
  ORDER BY created_at LIMIT 1;

  v_dur := COALESCE((SELECT duracion_default_minutos FROM tipos_servicio WHERE codigo = v_tipo_servicio), 30);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva,
    expira_en, country_code, modalidad, presupuesto_id, caso_clinico_id, metadata
  ) VALUES (
    (SELECT user_id FROM mascotas WHERE id = v_p.mascota_id),
    v_p.mascota_id, v_prestador_id, v_p.empleado_id, v_tipo_servicio,
    NULL, NULL, v_p.total, v_dur, 'confirmada', 'pendiente_pago',
    NULL, v_p.country_code, 'presencial', v_p.id, v_p.caso_clinico_id,
    jsonb_build_object('origen', 'presupuesto_aprobado', 'precio_congelado', true)
  ) RETURNING id INTO v_cita_id;

  RETURN v_cita_id;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────
-- L-140 — cierre de privilegios de cada función tocada
-- ─────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.obtener_citas_por_coordinar(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_citas_por_coordinar(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fijar_fecha_procedimiento(uuid, date, time without time zone, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fijar_fecha_procedimiento(uuid, date, time without time zone, uuid) TO authenticated;

-- helper interno: solo lo llaman RPCs SECURITY DEFINER — sin grant a authenticated/anon
REVOKE EXECUTE ON FUNCTION public._agendar_cita_desde_presupuesto(uuid) FROM PUBLIC, anon, authenticated;
