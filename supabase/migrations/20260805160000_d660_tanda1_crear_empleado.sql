-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ① — `crear_empleado_directo`
--
-- Por donde el dedo del founder chocó. Tres curas en un acto:
--  ① EL GATE pasa al helper `user_gestiona_prestador` — el ADMINISTRADOR
--    puede crear empleados, que es la letra de S74 que no tenía motor.
--  ② EL RECHAZO DEJA DE SER MUDO: los cuatro `{ok:false}` ganan `codigo`.
--    Antes devolvían `{ok:false, mensaje:'<literal humano>'}` sin código y el
--    wrapper mapeaba POR EL LITERAL — el propio comentario de `equipo.ts`
--    declaraba la tensión con la regla 35 y pedía esta enmienda a A.
--  ③ MUERE «No sos dueño de este prestador»: voseaba, decía «dueño» donde la
--    letra tiene tres roles, y era voz de producto adentro del motor (D-539).
--    **La voz sale ahora por CÓDIGO: la escribe la superficie, no la DB.**
--
-- EL LÍMITE INTOCABLE NO SE TOCA: crear/quitar administradores sigue siendo
-- del titular — esta función crea EMPLEADOS (`rol='empleado'`), jamás admins.
--
-- VEDA 76(g): NO RIGE. REVERSA: el cuerpo anterior vive en el historial.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.crear_empleado_directo(p_prestador_id uuid, p_email text, p_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_creador_user_id uuid := auth.uid();  -- D-660: puede ser titular O administrador
  v_empleado_id uuid;
  v_invitacion_id uuid;
  v_email_normalizado text := lower(trim(p_email));
  v_es_prestador_activo boolean;
BEGIN
  -- Defensa 1 · D-660: la puerta ÚNICA de la gestión. Antes comparaba
  -- `user_id` a mano y por eso el ADMINISTRADOR no podía crear empleados,
  -- contra la letra de S74. El helper deja pasar titular y administrador.
  IF NOT public.user_gestiona_prestador(p_prestador_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'no_gestiona');
  END IF;

  -- Defensa 2: buscar user por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email_normalizado;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'email_sin_cuenta');
  END IF;

  -- Defensa 3: verificar que NO sea prestador activo (esa función no aplica)
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id 
      AND role = 'prestador' 
      AND is_active = true
  ) INTO v_es_prestador_activo;

  IF v_es_prestador_activo THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'email_es_prestador');
  END IF;

  -- Defensa 4: ya existe como empleado de este prestador
  IF EXISTS (
    SELECT 1 FROM prestador_empleados
    WHERE prestador_id = p_prestador_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ya_es_empleado');
  END IF;

  -- Insertar fila empleado con activo=false (espera confirmación al login)
  INSERT INTO prestador_empleados (
    prestador_id, user_id, rol, nombre, 
    activo, invitado_en, created_by
  ) VALUES (
    p_prestador_id, v_user_id, 'empleado', p_nombre,
    false, now(), v_creador_user_id
  ) RETURNING id INTO v_empleado_id;

  -- Upsert role 'prestador' en user_roles (idempotente)
  INSERT INTO user_roles (user_id, role, is_active, country_code)
  VALUES (v_user_id, 'prestador', true, 'EC')
  ON CONFLICT (user_id, role, country_code) 
  DO UPDATE SET is_active = true;

  -- Registrar invitación sin token, estado pendiente_aceptacion_login
  INSERT INTO empleado_invitaciones (
    prestador_id, email, nombre, rol, 
    token, expira_en, estado, created_by
  ) VALUES (
    p_prestador_id, v_email_normalizado, p_nombre, 'empleado',
    NULL, now() + interval '30 days', 'pendiente_aceptacion_login', v_creador_user_id
  ) RETURNING id INTO v_invitacion_id;

  RETURN jsonb_build_object(
    'ok', true,
    'empleado_id', v_empleado_id,
    'invitacion_id', v_invitacion_id,
    'user_id', v_user_id
  );
END;
$function$

;

REVOKE EXECUTE ON FUNCTION public.crear_empleado_directo(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_empleado_directo(uuid, text, text) TO authenticated;

COMMIT;
