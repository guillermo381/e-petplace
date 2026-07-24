-- S76-A2bis — la fila `recepcion` se concede AL ENTRAR, por la PUERTA UNICA
-- (el RPC de aceptacion), jamas por la pantalla (si la escribe la superficie, el
-- link de D-509 la olvida). §1 LETRA_RECEPCION_S76.
--
-- Hallazgo B0.5: aceptar_invitacion_pendiente_login NO tocaba empleado_roles ->
-- la unica fila recepcion del censo es MANUAL, y obtener_contacto_reserva_cita
-- (gatea por PRESENCIA de 'recepcion') le rebota a la recepcionista recien
-- aceptada. Invisible hoy (0 aceptados por el camino real).
--
-- Backfill: 0 empleados activos sin fila de rol (6 activos = 5 dueño + 1
--   recepcion). NO hay backfill. Solo CREATE OR REPLACE. 76(g) NO RIGE.
-- NO toca el CHECK de empleado_invitaciones (D-509/D-486).
-- Idempotente por el UNIQUE(empleado_id, rol) existente.
--
-- asignado_por = EL TITULAR que invito (prestadores.user_id del negocio;
--   NOT NULL, 0 prestadores sin owner verificado) — el piso lo concede el
--   negocio al que la persona entra, no la persona a si misma.
--
-- LEY MADRE (deposito con esta migracion): la fila `recepcion` es MEMBRESIA,
--   JAMAS IDENTIDAD. Va a existir en TODOS los que entran (veterinarios
--   incluidos). NADA puede leer su PRESENCIA como "es recepcionista" — la
--   recepcionista es la AUSENCIA de los otros roles. Trampa directa para D-521.
--
-- DIFF vs el cuerpo vivo: UNA sola adicion (el INSERT del piso). Todo lo demas
--   byte-identico (incluida la voz existente 'No tenés permiso' — su voseo es de
--   otra deuda, fuera de scope: diff minimo).

CREATE OR REPLACE FUNCTION public.aceptar_invitacion_pendiente_login(p_empleado_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_empleado_user_id uuid;
  v_prestador_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Sin sesión');
  END IF;

  -- Obtener datos del empleado
  SELECT user_id, prestador_id INTO v_empleado_user_id, v_prestador_id
  FROM prestador_empleados
  WHERE id = p_empleado_id AND activo = false;

  IF v_empleado_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'mensaje', 'Empleado no encontrado o ya activado'
    );
  END IF;

  -- Defensa: solo el user empleado puede aceptar su propia invitación
  IF v_empleado_user_id != v_user_id THEN
    RETURN jsonb_build_object(
      'ok', false,
      'mensaje', 'No tenés permiso para aceptar esta invitación'
    );
  END IF;

  -- Activar empleado
  UPDATE prestador_empleados
  SET activo = true, activado_en = now()
  WHERE id = p_empleado_id;

  -- S76-A2bis: EL PISO se concede al entrar (§1 LETRA_RECEPCION_S76). Puerta
  -- unica: todo camino de entrada pasa por aca. Idempotente por UNIQUE(empleado,rol).
  -- asignado_por = el titular del negocio (lo concede el negocio, no la persona).
  INSERT INTO empleado_roles (empleado_id, rol, asignado_por)
  VALUES (
    p_empleado_id,
    'recepcion',
    (SELECT user_id FROM prestadores WHERE id = v_prestador_id)
  )
  ON CONFLICT (empleado_id, rol) DO NOTHING;

  -- Marcar invitación como aceptada
  UPDATE empleado_invitaciones
  SET estado = 'aceptada'
  WHERE prestador_id = v_prestador_id
    AND estado = 'pendiente_aceptacion_login'
    AND email = (SELECT email FROM auth.users WHERE id = v_user_id);

  RETURN jsonb_build_object('ok', true);
END;
$function$;
