-- REVERSA de 20260814140000_s97a_empleados_user_id.sql (escrita ANTES)
--
-- QUÉ DESHACE: devuelve `obtener_empleados_cuenta` a su forma de TRES
-- columnas (empleado_id, nombre, activo).
--
-- 🔴 QUÉ **NO** DESHACE, y hay que saberlo: revertir DEJA SIN CAMINO al
--    paso ④ del wizard («elegí del equipo») — sin `user_id` no se puede atar
--    un repartidor a la persona que ya está adentro, que es exactamente la
--    anti-duplicación que la enmienda de `MODELO_DESPENSA` §8.6bis ⑤ firmó.
--    Revertir reintroduce la doble carga que esa firma existe para impedir.
--
-- L-119: se cambia la FORMA del retorno, así que es DROP + CREATE. No hay
-- sobrecarga que dejar zombi: la firma de argumentos (uuid) no cambia.
-- No hay datos que perder: la función no escribe.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_empleados_cuenta(uuid);

CREATE FUNCTION public.obtener_empleados_cuenta(p_cuenta_comercial_id uuid)
RETURNS TABLE(empleado_id uuid, nombre text, activo boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT pe.id, pe.nombre, pe.activo
  FROM prestador_empleados pe
  JOIN prestadores p ON p.id = pe.prestador_id
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  ORDER BY pe.activo DESC, pe.nombre;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) TO authenticated;

COMMIT;
