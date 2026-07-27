-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727210000_s79_hermanas_geo_e_invitar.sql (escrita
-- ANTES de aplicar). Restaura las TRES lectoras hermanas a sus bodies
-- vivos pre-migración (leídos con pg_get_functiondef el 27-Jul,
-- archivados también en el scratchpad de la sesión) y el
-- invitar_prestador de 20260727180000 (sin proposito/direccion_envio).
-- NOTA DE DATOS: cero — funciones puras de lectura + una de escritura
-- cuyo historial de filas creadas no se toca.
-- ═════════════════════════════════════════════════════════════════════
begin;

DROP FUNCTION IF EXISTS public.obtener_adiestradores_disponibles(date, time without time zone, uuid, double precision, double precision);
DROP FUNCTION IF EXISTS public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text, double precision, double precision);
DROP FUNCTION IF EXISTS public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid, double precision, double precision);
DROP FUNCTION IF EXISTS public.invitar_prestador(text, tipo_fiscal_enum, text, text, text, text, text, text, text);

-- (los CREATE de abajo son los bodies pre-migración, verbatim)

CREATE FUNCTION public.obtener_adiestradores_disponibles(p_fecha date, p_hora time without time zone, p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, comprable text, programa_id uuid, nombre text, nivel text, n_sesiones integer, vigencia_dias integer, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
    o.tipo_servicio, o.comprable, o.programa_id, o.nombre,
    o.nivel, o.n_sesiones, o.vigencia_dias,
    o.precio, o.duracion_minutos, o.direccion, o.ciudad
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  WHERE _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.comprable, o.precio, o.nombre;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid) TO authenticated;

CREATE FUNCTION public.obtener_groomers_disponibles(p_fecha date, p_hora time without time zone, p_tipo_servicio text, p_mascota_id uuid, p_modalidad text DEFAULT 'local'::text)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text, precio_base numeric, extra_pelaje numeric, recargo_domicilio numeric)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = p_tipo_servicio AND ts.categoria = 'grooming' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad,
    (SELECT pst.precio FROM prestador_servicio_tallas pst
      WHERE pst.prestador_servicio_id = o.prestador_servicio_id
        AND pst.talla = v_talla),
    CASE WHEN (SELECT m.pelaje FROM mascotas m WHERE m.id = p_mascota_id) = 'largo'
         THEN COALESCE((SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END,
    CASE WHEN p_modalidad = 'domicilio'
         THEN COALESCE((SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = o.prestador_id), 0)
         ELSE 0 END
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  WHERE o.tipo_servicio = p_tipo_servicio
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_groomers_disponibles(date, time without time zone, text, uuid, text) TO authenticated;

CREATE FUNCTION public.obtener_veterinarios_disponibles(p_fecha date, p_hora time without time zone, p_tipo_servicio text, p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_solo_hoy boolean;
  v_reservable boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_tipo_servicio IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  SELECT ts.reserva_solo_hoy, ts.reservable INTO v_solo_hoy, v_reservable
  FROM tipos_servicio ts
  WHERE ts.codigo = p_tipo_servicio
    AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
    AND ts.activo;
  IF v_reservable IS NULL THEN
    RAISE EXCEPTION 'servicio_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT v_reservable THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, p_tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;
  IF v_solo_hoy AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id,
    o.prestador_servicio_id,
    o.prestador_nombre,
    o.servicio_nombre,
    o.precio,
    o.duracion_minutos,
    o.direccion,
    o.ciudad
  FROM _vet_ofertas_cobrables(p_mascota_id) o
  WHERE o.tipo_servicio = p_tipo_servicio
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.precio, o.prestador_nombre;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_veterinarios_disponibles(date, time without time zone, text, uuid) TO authenticated;

-- invitar_prestador v1 (el body de 20260727180000): re-aplicar la
-- sección "1) invitar_prestador" de esa migración, verbatim (vive en
-- supabase/migrations/20260727180000_s79_motor_alta.sql).

commit;
