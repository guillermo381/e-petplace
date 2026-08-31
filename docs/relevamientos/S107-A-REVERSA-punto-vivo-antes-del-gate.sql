CREATE OR REPLACE FUNCTION public.obtener_punto_vivo(p_tramo_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  SELECT jsonb_build_object('lat', p.lat, 'lon', p.lon, 'vistoEn', p.visto_en)
    INTO v FROM guarderia_tramo_punto p WHERE p.tramo_id = p_tramo_id;
  -- Un punto o null. **Jamás una lista.**
  RETURN COALESCE(v, 'null'::jsonb);
END $function$
