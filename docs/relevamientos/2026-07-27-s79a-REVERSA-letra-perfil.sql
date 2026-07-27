-- ═════════════════════════════════════════════════════════════════════
-- REVERSA del CONTRATO 2026-07-27-s79a-CONTRATO-letra-perfil.sql
-- (escrita ANTES de que el contrato se aplique — regla de la casa).
--
-- NOTA DE DATOS (la nota obligatoria): revertir el DDL BORRA lo que se
-- haya escrito en proposito / direccion_envio / primer_ingreso_en
-- después de la aplicación — el propósito de un prestador real es voz
-- suya e IRRECUPERABLE. Esta reversa es segura solo mientras esas
-- columnas sigan vacías; con datos reales adentro, la reversa se
-- re-discute con el founder (no se ejecuta a ciegas).
-- Restaurar el DEFAULT 5 y el COALESCE devuelve el comportamiento
-- pre-letra EXACTO (medido Tanda 1).
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 4) muere la RPC del primer ingreso
DROP FUNCTION IF EXISTS public.registrar_primer_ingreso();

-- 3) vuelve la lectora de 3 parámetros (body vivo pre-contrato,
--    2026-07-27; ACL re-establecida)
DROP FUNCTION IF EXISTS public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision);

CREATE FUNCTION public.obtener_paseadores_disponibles(p_fecha date, p_hora time without time zone, p_duracion_minutos integer)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, duracion_minutos integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= v_ahora_local THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.precio,
    ps.precio_plan,
    ps.duracion_minutos
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable
  WHERE ps.activo
    AND ps.reservable
    AND ps.duracion_minutos = p_duracion_minutos
    AND NOT _prestador_bloqueado(pr.id, p_fecha)
    AND EXISTS (
      SELECT 1
      FROM prestador_horarios h
      JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
      WHERE h.prestador_id = pr.id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
        AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + p_duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
        AND (pe.rol = 'dueño' OR EXISTS (
              SELECT 1 FROM prestador_empleado_servicios pes
              WHERE pes.empleado_id = pe.id AND pes.servicio_id = ps.id))
        AND _agenda_ocupacion(pe.id, p_fecha, p_hora, p_duracion_minutos, NULL, ps.tipo_servicio)
            < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1))
    )
  ORDER BY 5, 3;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer) TO authenticated;

-- 2) vuelve el COALESCE(…, 5) — restaurar aplicando el body pre-contrato
--    (pg_get_functiondef archivado en el scratchpad de la sesión y en
--    el historial git del CONTRATO: es el mismo body con la línea
--    `COALESCE(p_radio_cobertura_km, 5)` en lugar de `p_radio_cobertura_km`).

-- 1) caen las columnas y vuelve el default
ALTER TABLE public.prestadores
  DROP COLUMN IF EXISTS proposito,
  DROP COLUMN IF EXISTS direccion_envio,
  DROP COLUMN IF EXISTS primer_ingreso_en;

ALTER TABLE public.prestadores
  ALTER COLUMN radio_cobertura_km SET DEFAULT 5;

commit;
