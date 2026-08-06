-- REVERSA de `20260805260000_mostrador_plata_y_lector.sql`. Escrita ANTES.
--
-- ⚠️ REVERTIR CIERRA LA PLATA a titular+admin_plataforma otra vez: recepción y
--    el administrador del negocio vuelven a recibir `visible:false`. Es la
--    forma anterior a la excepción firmada a L-198 (lámina §4ter, 5-ago).
--    Si la superficie de §4ter ya está publicada, revertir deja a recepción
--    con un slot que dice «Solo el titular» sobre una pantalla que la lámina
--    diseñó CON la plata — un transitorio visible, no un no-op.
--
-- ⚠️ NO DESHACE datos: las tres funciones son de lectura.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_personas_para_asignar(uuid);

-- `empleado_puede_asignar_citas` vuelve a su cuerpo propio (S88, 20260805240000)
CREATE OR REPLACE FUNCTION public.empleado_puede_asignar_citas(p_prestador_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.user_gestiona_prestador(p_prestador_id)
      OR EXISTS (
        SELECT 1 FROM prestador_empleados pe
        WHERE pe.prestador_id = p_prestador_id
          AND pe.user_id = auth.uid()
          AND pe.activo = true
          AND NOT EXISTS (SELECT 1 FROM prestador_empleado_servicios pes
                          WHERE pes.empleado_id = pe.id)
      );
$$;

DROP FUNCTION IF EXISTS public.empleado_es_mostrador_o_gestion(uuid);

-- ⚠️ El cuerpo de `obtener_plata_del_dia` se restaura desde el literal vivo
--    embebido acá porque esta reversa es su única fuente (patrón S79).
CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_es_titular boolean;
  v_total numeric; v_contadas integer; v_sin_precio integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT EXISTS (SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid)
    INTO v_es_titular;
  IF NOT (v_es_titular OR is_admin()) THEN
    RETURN jsonb_build_object('visible', false);
  END IF;
  SELECT coalesce(sum(c.precio), 0), count(*), count(*) FILTER (WHERE c.precio IS NULL)
  INTO v_total, v_contadas, v_sin_precio
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id AND c.fecha = p_fecha
    AND c.estado = ANY(public._estados_cita_contables());
  RETURN jsonb_build_object('visible', true, 'total', v_total,
                            'citas', v_contadas, 'sinPrecio', v_sin_precio);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid) TO authenticated;

COMMIT;
