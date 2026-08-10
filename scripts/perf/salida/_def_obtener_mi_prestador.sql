CREATE OR REPLACE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(id uuid, nombre_comercial text, tipo text, country_code text, cuenta_comercial_id uuid, direccion text, ciudad text, sector text, lat double precision, lon double precision, radio_cobertura_km integer, grooming_extra_pelaje_largo numeric, grooming_recargo_domicilio numeric, descripcion text, telefono text, whatsapp text, email_contacto text, sitio_web text, estado text, foto_url text, clip_url text, expone_personas boolean, cohorte text, cohorte_anio integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Gate: el MISMO predicado de la policy del dueño, así que titular Y
  -- equipo activo entran (la puerta del arco de equipo de S75 sigue abierta).
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.tipo, p.country_code,
         p.cuenta_comercial_id, p.direccion, p.ciudad, p.sector,
         p.lat, p.lon, p.radio_cobertura_km,
         p.grooming_extra_pelaje_largo, p.grooming_recargo_domicilio,
         p.descripcion, p.telefono, p.whatsapp, p.email_contacto,
         p.sitio_web, p.estado, p.foto_url, p.clip_url,
         p.expone_personas, p.cohorte, p.cohorte_anio
    FROM prestadores p
   WHERE public.user_gestiona_prestador(p.id)
   LIMIT 1;
END;
$function$
