-- ═════════════════════════════════════════════════════════════════════
-- S63-A — HUECO REAL DECLARADO del Bloque 3 (L-144): la grilla DÍA/HORA
-- del flujo de reserva no tenía RPC de inicios para el oficio — paseo
-- tiene obtener_inicios_paseo_disponibles y grooming
-- obtener_inicios_grooming_disponibles; adiestramiento, ninguna.
-- Gemela DELGADA de la del grooming: sin talla, sin modalidad (default
-- único del chasis hasta S64-B0), con la duración PROPIA de cada
-- comprable (sesión suelta = duración de la oferta; programa = la de
-- su sesión). p_comprable filtra la forma elegida en el QUÉ (§8:
-- "en el QUÉ vive sesión-o-programa"); NULL = ambas.
-- Verdad única de grilla: _inicios_disponibles_prestador (S60).
-- ═════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_inicios_adiestramiento_disponibles(
  p_fecha date,
  p_mascota_id uuid,
  p_comprable text DEFAULT NULL
)
RETURNS TABLE(hora time without time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_comprable IS NOT NULL AND p_comprable NOT IN ('sesion','programa') THEN
    RAISE EXCEPTION 'comprable_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- fecha enteramente en el pasado: vacío sin error (cinturón heredado)
  IF p_fecha < (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT i.hora
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  CROSS JOIN LATERAL _inicios_disponibles_prestador(
    o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
  ) i
  WHERE (p_comprable IS NULL OR o.comprable = p_comprable)
    AND _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    -- hoy: solo horas por delante (espejo del cinturón del QUIÉN)
    AND (p_fecha + i.hora) > (now() AT TIME ZONE 'America/Guayaquil')
  ORDER BY 1;
END;
$function$;

-- L-140: ley en dos partes
REVOKE ALL ON FUNCTION public.obtener_inicios_adiestramiento_disponibles(date, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_inicios_adiestramiento_disponibles(date, uuid, text) TO authenticated, service_role;
