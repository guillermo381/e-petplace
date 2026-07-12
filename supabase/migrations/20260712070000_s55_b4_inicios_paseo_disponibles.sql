-- ═════════════════════════════════════════════════════════════════════
-- S55-A B4 — obtener_inicios_paseo_disponibles: la GRILLA del CUÁNDO
-- tipo Teams. Para (fecha, duración del menú) devuelve los INICIOS
-- donde la ventana completa cabe con cupo para AL MENOS un prestador
-- cobrable que oferte ese bloque — server-side (regla 7.13: no se
-- oferta quien no puede cobrar; el filtro jamás vive en el cliente).
--
-- CIERRA D-321: el rango horario del CUÁNDO deja de estar hardcodeado
-- en la pantalla (06:00–20:00) — los inicios salen de las franjas
-- REALES (prestador_horarios) vía el motor de ocupación por ventana
-- (S55-B2: fit en franja + cupo en todo el recorrido, expiración
-- perezosa adentro de _agenda_ocupacion).
--
-- Un inicio se pinta si ALGÚN prestador puede; el QUIÉN
-- (obtener_paseadores_disponibles) resuelve quiénes exactamente.
-- Slot sin cupo NO aparece (silencio digno — la pantalla jamás
-- pinta gris).
-- ═════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_inicios_paseo_disponibles(
  p_fecha date,
  p_duracion_minutos integer
)
RETURNS TABLE(hora time without time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT DISTINCT s.s_hora
  FROM (
    SELECT
      pr.id AS s_prestador,
      (h.hora_inicio + make_interval(mins => g.n * h.duracion_slot_minutos))::time AS s_hora,
      h.hora_fin AS s_fin,
      COALESCE(h.max_citas_por_slot, 1) AS s_cupo
    FROM prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
    JOIN prestador_horarios h    ON h.prestador_id = pr.id
                                AND h.activo
                                AND h.duracion_slot_minutos > 0
                                AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
                                AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int  -- regla 32
    CROSS JOIN LATERAL generate_series(
      0,
      (EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))::int / 60) / h.duracion_slot_minutos - 1
    ) AS g(n)
    WHERE ps.activo
      AND ps.duracion_minutos = p_duracion_minutos
  ) s
  WHERE
    -- la ventana entera cabe en SU franja
    EXTRACT(EPOCH FROM s.s_hora)::int + p_duracion_minutos * 60 <= EXTRACT(EPOCH FROM s.s_fin)::int
    -- cupo libre en TODO el recorrido (motor S55-B2)
    AND (s.s_cupo - _agenda_ocupacion(s.s_prestador, p_fecha, s.s_hora, p_duracion_minutos)) > 0
    AND (p_fecha + s.s_hora) > v_ahora_local
  ORDER BY 1;
END;
$function$;

-- L-140: grant explícito + verificación proacl/sonda en el gate.
REVOKE ALL ON FUNCTION public.obtener_inicios_paseo_disponibles(date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_inicios_paseo_disponibles(date, integer) TO authenticated, service_role;
