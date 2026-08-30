CREATE OR REPLACE FUNCTION public.obtener_acta_guarderia(p_acta_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_mascota uuid; v_prest uuid; v_r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT c.mascota_id, c.prestador_id INTO v_mascota, v_prest
    FROM guarderia_actas a
    JOIN guarderia_estadias e ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
   WHERE a.id = p_acta_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'acta_no_existe' USING ERRCODE='22023'; END IF;

  /* Las DOS audiencias del acta: la familia del animal y quien gestiona el
     negocio que la levantó. Nadie más — ni con el id en la mano. */
  IF NOT user_tiene_acceso_a_mascota(v_mascota)
     AND NOT user_gestiona_prestador(v_prest)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  SELECT jsonb_build_object(
    'actaId',           a.id,
    'estadiaId',        a.estadia_id,
    'direccion',        a.direccion,
    'carnetVerificado', a.carnet_verificado,
    'objetos',          a.objetos,
    'observaciones',    a.observaciones,
    'conformidad',      a.conformidad,
    'conformidadEn',    a.conformidad_en,
    'reservaTexto',     a.reserva_texto,
    /* 🔴 LA HORA DE LA PUERTA, no la de llegada del dato: `cerrada_en` la pone
       el cliente al cerrar el acta en la casa; `recibida_en` es cuándo el
       servidor la recibió. **Son dos hechos distintos y se muestran los dos.** */
    'cerradaEn',        a.cerrada_en,
    'recibidaEn',       a.recibida_en,
    'mascotaNombre',    m.nombre,
    'prestadorNombre',  pr.nombre_comercial,
    'media', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'mediaId', gm.id, 'tipo', gm.tipo,
               'archivoUrl', gm.archivo_url, 'miniaturaUrl', gm.miniatura_url,
               'capturadaEn', gm.capturada_en)
             ORDER BY gm.capturada_en)
        FROM guarderia_media_etiquetas et
        JOIN guarderia_media gm ON gm.id = et.media_id
       WHERE et.estadia_id = a.estadia_id
         AND et.mascota_id = c.mascota_id
    ), '[]'::jsonb)
  ) INTO v_r
    FROM guarderia_actas a
    JOIN guarderia_estadias e   ON e.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    JOIN prestadores pr         ON pr.id = c.prestador_id
   WHERE a.id = p_acta_id;

  RETURN v_r;
END $function$

;
CREATE OR REPLACE FUNCTION public.obtener_resumen_guarderias(p_modalidad text, p_fecha date, p_mascota_id uuid, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_especie   int;
  v_modalidad int;
  v_cobertura int;
  v_final     int;
  v_desde     numeric;
  v_causa     text;
  v_hay_geo   boolean := (p_lat IS NOT NULL AND p_lon IS NOT NULL);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE='22023';
  END IF;
  IF p_modalidad IS NULL OR p_modalidad NOT IN ('dia','paquete','mensual') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE='22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;
  -- La víspera REBOTA (ver la cabecera): no es una causa, es una precondición.
  IF p_fecha <= public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_no_ofertable' USING ERRCODE='22023';
  END IF;

  -- ① sólo especie (el helper sin modalidad ya exige «vende algo»)
  SELECT count(*) INTO v_especie FROM _guarderia_ofertas_cobrables(p_mascota_id, NULL);

  -- ② + modalidad
  SELECT count(*) INTO v_modalidad FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad);

  -- ③ + cobertura (si no hay geo, esta etapa NO descarta: arrastra ②)
  IF v_hay_geo THEN
    SELECT count(*) INTO v_cobertura
      FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad) o
     WHERE EXISTS (
       SELECT 1 FROM prestadores geo
        WHERE geo.id = o.prestador_id
          AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
          AND geo.radio_cobertura_km IS NOT NULL
          AND 2 * 6371 * asin(sqrt(
                power(sin(radians((geo.lat - p_lat) / 2)), 2)
                + cos(radians(p_lat)) * cos(radians(geo.lat))
                  * power(sin(radians((geo.lon - p_lon) / 2)), 2)
              )) <= geo.radio_cobertura_km);
  ELSE
    v_cobertura := v_modalidad;
  END IF;

  /* ④ el conjunto REAL — y sale del lector publicado, no de una copia de sus
     predicados. *Si acá se reimplementaran, el resumen y la lista podrían
     discrepar, que es exactamente el defecto que este contrato viene a evitar.* */
  SELECT count(*), min(COALESCE(d.precio_modalidad, d.precio))
    INTO v_final, v_desde
    FROM public.obtener_guarderias_disponibles(p_fecha, p_mascota_id, p_lat, p_lon, p_modalidad) d;

  IF v_final > 0 THEN
    v_causa := NULL;
  ELSIF v_especie = 0 THEN
    v_causa := 'especie_sin_oferta';
  ELSIF v_modalidad = 0 THEN
    v_causa := 'nadie_vende_esa_modalidad';
  ELSIF v_hay_geo AND v_cobertura = 0 THEN
    v_causa := 'sin_cobertura';
  ELSIF v_cobertura > 0 THEN
    v_causa := 'sin_cupo_ese_dia';
  ELSE
    -- No debería alcanzarse. Se DECLARA en vez de elegir la más plausible.
    v_causa := 'causa_indeterminada';
  END IF;

  RETURN jsonb_build_object(
    'cuantos', v_final,
    /* `null`, jamás 0: **un 0 se lee como GRATIS**, y acá significa «no hay
       ninguno del que sacar un precio». */
    'precioDesde', v_desde,
    'causa', v_causa,
    'modalidad', p_modalidad,
    'fecha', p_fecha
  );
END $function$
