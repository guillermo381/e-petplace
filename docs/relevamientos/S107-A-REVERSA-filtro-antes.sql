CREATE OR REPLACE FUNCTION public._guarderia_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, precio numeric, precio_paquete numeric, precio_mensual numeric, jornada_minutos integer, direccion text, ciudad text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT pr.id, ps.id, pr.nombre_comercial,
         ps.precio, ps.precio_paquete, ps.precio_mensual_plan,
         ps.duracion_minutos, pr.direccion, pr.ciudad
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.activo AND ts.reservable
   WHERE m.id = p_mascota_id
     AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable
     AND ps.precio IS NOT NULL AND ps.precio > 0
     AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
     -- el prestador ACOTA; NULL = rige el techo del tipo (patrón §5 grooming)
     AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie);
$function$

;
CREATE OR REPLACE FUNCTION public.obtener_guarderias_disponibles(p_fecha date, p_mascota_id uuid, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, precio numeric, precio_paquete numeric, precio_mensual numeric, jornada_minutos integer, direccion text, ciudad text, disponible integer, sobrevendido boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- 🔴 hoy tampoco: el primer día ofertable es mañana en adelante.
  IF p_fecha <= public.hoy_local() THEN RETURN; END IF;

  RETURN QUERY
  SELECT o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
         o.precio, o.precio_paquete, o.precio_mensual,
         o.jornada_minutos, o.direccion, o.ciudad,
         (c->>'disponible')::int, (c->>'sobrevendido')::boolean
    FROM _guarderia_ofertas_cobrables(p_mascota_id) o
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(o.prestador_id, p_fecha) c
   WHERE (
       p_lat IS NULL OR p_lon IS NULL
       OR EXISTS (
         SELECT 1 FROM prestadores geo
          WHERE geo.id = o.prestador_id
            AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
            AND geo.radio_cobertura_km IS NOT NULL
            AND 2 * 6371 * asin(sqrt(
                  power(sin(radians((geo.lat - p_lat) / 2)), 2)
                  + cos(radians(p_lat)) * cos(radians(geo.lat))
                    * power(sin(radians((geo.lon - p_lon) / 2)), 2)
                )) <= geo.radio_cobertura_km))
     AND (c->>'disponible')::int > 0
     AND public._guarderia_dia_operativo(o.prestador_id, p_fecha)
   ORDER BY o.precio, o.prestador_nombre;
END $function$
