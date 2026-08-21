-- Cuerpo ORIGINAL de user_tiene_acceso_a_mascota, volcado ANTES de tocarlo.
-- 🔴 Es la unica fuente para revertir: la funcion la usan 62 policies y 28
--    funciones, y su cuerpo no vive en ninguna migracion legible.

CREATE OR REPLACE FUNCTION public.user_tiene_acceso_a_mascota(p_mascota_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_caducidad_meses integer;
BEGIN
  -- Sin sesion -> no
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admin -> si
  IF is_admin() THEN
    RETURN true;
  END IF;

  -- Dueño de la mascota -> si
  IF EXISTS (
    SELECT 1 FROM mascotas
    WHERE id = p_mascota_id AND user_id = v_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Plazo de caducidad parametrizable (default defensivo 6 si falta config)
  SELECT COALESCE(
    (SELECT valor::integer FROM app_config
      WHERE clave = 'acceso_prestador_caducidad_meses'),
    6
  ) INTO v_caducidad_meses;

  -- Dueño o empleado activo de algun prestador cuya cuenta_comercial tiene
  -- acceso activo a la mascota.
  IF EXISTS (
    SELECT 1
    FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id
      AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
      AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores
        WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id
        FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true
      )
      -- Caducidad lazy: las filas otorgadas por cita automatica solo siguen
      -- vigentes si hay una cita con esta mascota y esta cuenta dentro de la
      -- ventana de N meses. Las filas de otro metodo pasan sin esta condicion.
      AND (
        map.metodo_otorgamiento <> 'cita_automatica'
        OR EXISTS (
          SELECT 1
          FROM evento_cita_servicio ecs
          JOIN prestadores p2 ON p2.id = ecs.prestador_id
          WHERE ecs.mascota_id = map.mascota_id
            AND p2.cuenta_comercial_id = map.cuenta_comercial_id
            AND ecs.fecha >= (now() - make_interval(months => v_caducidad_meses))::date
        )
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$
