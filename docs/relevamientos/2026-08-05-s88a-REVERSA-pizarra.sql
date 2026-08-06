-- REVERSA de `20260805290000_pizarra_ojos_del_mostrador.sql`. Escrita ANTES.
-- ⚠️ REVERTIR devuelve el defecto medido: el admin y la recepción vuelven a
--    ver «nada para tomar» con la huérfana viva delante — un vacío que MIENTE.
--    No es volver a un estado seguro: es volver al defecto.
BEGIN;
CREATE OR REPLACE FUNCTION public.obtener_pizarra(p_prestador_id uuid)
RETURNS TABLE(cita_id uuid, fecha date, hora time without time zone, tipo_servicio text,
              servicio_voz text, mascota_id uuid, mascota_nombre text, mascota_especie text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_empleado uuid; v_es_dueno boolean;
  v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT pe.id, (pe.rol = 'dueño') INTO v_empleado, v_es_dueno
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id AND pe.user_id = v_uid AND pe.activo LIMIT 1;
  IF v_empleado IS NULL THEN RAISE EXCEPTION 'no_sos_del_equipo' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT c.id, c.fecha, c.hora, c.tipo_servicio, ts.nombre, m.id, m.nombre, m.especie
  FROM evento_cita_servicio c
  LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
  LEFT JOIN mascotas m ON m.id = c.mascota_id
  WHERE c.prestador_id = p_prestador_id
    AND c.empleado_id IS NULL
    AND c.estado = ANY(public._estados_cita_contables())
    AND c.fecha >= v_hoy
    AND (v_es_dueno OR EXISTS (
      SELECT 1 FROM prestador_servicios ps
      JOIN prestador_empleado_servicios pes ON pes.servicio_id = ps.id AND pes.empleado_id = v_empleado
      WHERE ps.prestador_id = c.prestador_id AND ps.tipo_servicio = c.tipo_servicio))
  ORDER BY c.fecha ASC, c.hora ASC NULLS LAST, c.id ASC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.obtener_pizarra(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_pizarra(uuid) TO authenticated;
COMMIT;
