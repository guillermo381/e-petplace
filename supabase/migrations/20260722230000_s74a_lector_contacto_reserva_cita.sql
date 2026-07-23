-- ============================================================================
-- S74-A · EL LECTOR ANGOSTO DEL CONTACTO DE LA VISITA (decisión de mesa S74):
-- se expone NOMBRE + TELÉFONO de QUIEN RESERVÓ LA CITA — el contacto es
-- propiedad de la VISITA, no del animal: recepción v1 no toca D-485 ni el
-- modelo de familia.
--
-- Relevado ANGOSTO antes de construir (S74-A, literal):
--   · evento_cita_servicio.user_id — quién reservó, primera clase,
--     poblada 75/75 en producción;
--   · profiles.nombre / telefono / telefono_codigo_pais existen (teléfono
--     nullable → null honesto: 1 de 2 reservadores vivos lo tiene);
--   · el teléfono viaja con su codigo_pais TAL CUAL está guardado — jamás
--     derivado del país del perfil (letra Uber P21).
-- Gate: la puerta única del rol (LETRA_EQUIPO §4) — cualquier rol del
-- equipo del negocio de la cita, recepción INCLUIDA (A3.4: el contacto de
-- la visita es parte de recibirla; "a qué viene" es la agenda).
-- Walk-in fantasma / cita sin reservador: fila de nulls honestos — la
-- pantalla dice el hueco (Ley 13), el motor no inventa.
--
-- 76(g): NO RIGE — función nueva, cero filas tocadas, cero anclas
-- computadas sobre datos vivos (los asserts leen in-txn sin sedimentar).
-- ============================================================================

CREATE FUNCTION public.obtener_contacto_reserva_cita(p_cita_id uuid)
RETURNS TABLE(nombre text, telefono text, telefono_codigo_pais text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_prestador uuid;
  v_reservador uuid;
  v_hay boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT true, c.prestador_id, c.user_id INTO v_hay, v_prestador, v_reservador
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;
  IF v_hay IS NOT TRUE THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  -- una cita sin negocio no tiene equipo que la reciba
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empleado_tiene_rol(v_prestador, ARRAY['dueño', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  IF v_reservador IS NULL THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pr.nombre, pr.telefono, pr.telefono_codigo_pais
  FROM profiles pr
  WHERE pr.id = v_reservador;
END;
$function$;

COMMENT ON FUNCTION public.obtener_contacto_reserva_cita(uuid) IS
  'S74-A · contacto de la VISITA (quién reservó la cita: nombre+teléfono de profiles). Gate: empleado_tiene_rol del negocio de la cita, recepción incluida. Nulls honestos si la cita no tiene reservador (walk-in fantasma).';

REVOKE EXECUTE ON FUNCTION public.obtener_contacto_reserva_cita(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_contacto_reserva_cita(uuid) TO authenticated, service_role;

-- ── ASSERTS in-txn (restauración por current_user capturado — jamás
--    RESET ROLE: devuelve al login role de la CLI, lección S74) ──────────────
DO $$
DECLARE
  v_rol text := current_user;
  v_cita uuid;
  v_prest uuid;
  v_reserv uuid;
  v_titular uuid;
  v_nombre text;
  v_ok boolean := false;
BEGIN
  -- una cita real cuyo negocio tiene equipo con rol, y cuyo reservador NO
  -- es del equipo (para probar el rebote con actor real, L-151)
  SELECT c.id, c.prestador_id, c.user_id INTO v_cita, v_prest, v_reserv
  FROM evento_cita_servicio c
  WHERE c.user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM prestador_empleados pe
      JOIN empleado_roles er ON er.empleado_id = pe.id
      WHERE pe.prestador_id = c.prestador_id AND pe.activo
    )
    AND NOT EXISTS (
      SELECT 1 FROM prestador_empleados pe2
      WHERE pe2.prestador_id = c.prestador_id AND pe2.user_id = c.user_id AND pe2.activo
    )
  LIMIT 1;
  IF v_cita IS NULL THEN
    RAISE EXCEPTION 'assert: no hay cita con equipo y reservador externo para probar';
  END IF;

  SELECT pe.user_id INTO v_titular
  FROM prestador_empleados pe
  JOIN empleado_roles er ON er.empleado_id = pe.id
  WHERE pe.prestador_id = v_prest AND pe.activo
  LIMIT 1;

  -- (1) un miembro del equipo (rol vivo) LEE el contacto — fila devuelta
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT r.nombre INTO v_nombre FROM public.obtener_contacto_reserva_cita(v_cita) r;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  -- (v_nombre puede ser null honesto; lo que se prueba es que NO rebotó)

  -- (2) el RESERVADOR (authenticated, ajeno al equipo) rebota sin_acceso
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_reserv, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    PERFORM * FROM public.obtener_contacto_reserva_cita(v_cita);
  EXCEPTION WHEN insufficient_privilege THEN
    v_ok := true;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  IF NOT v_ok THEN
    RAISE EXCEPTION 'el no-empleado NO rebotó sin_acceso — el gate no gatea';
  END IF;

  -- (3) sonda L-140
  IF has_function_privilege('anon', 'public.obtener_contacto_reserva_cita(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon ejecuta el lector de contacto';
  END IF;
END $$;
