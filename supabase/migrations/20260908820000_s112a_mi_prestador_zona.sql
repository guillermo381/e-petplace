-- S112-A · LA ZONA VIAJA AL PRESTADOR QUE LA PIDE
-- 76(g) — NO RIGE: lector. L-119: DROP porque cambia el TABLE.
DROP FUNCTION IF EXISTS public.obtener_mi_prestador();
CREATE OR REPLACE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(id uuid, nombre_comercial text, tipo text, country_code text, cuenta_comercial_id uuid, direccion text, ciudad text, sector text, lat double precision, lon double precision, radio_cobertura_km integer, grooming_extra_pelaje_largo numeric, grooming_recargo_domicilio numeric, descripcion text, telefono text, whatsapp text, email_contacto text, sitio_web text, estado text, foto_url text, clip_url text, expone_personas boolean, cohorte text, cohorte_anio integer, zona_lat double precision, zona_lon double precision, zona_radio_m integer, zona_horaria text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Gate: titular/admin por `user_gestiona_prestador` **más el brazo del
  -- EMPLEADO ACTIVO, escrito ACÁ y no en el helper** (S92: ensancharlo
  -- tocaría 239 policies). S96: este brazo repara el arco de equipo que S91
  -- rompió al revocar columnas — el fallback de tabla del wrapper murió con
  -- esos grants y ningún empleado raso pudo entrar desde entonces.
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.tipo, p.country_code,
         p.cuenta_comercial_id, p.direccion, p.ciudad, p.sector,
         p.lat, p.lon, p.radio_cobertura_km,
         p.grooming_extra_pelaje_largo, p.grooming_recargo_domicilio,
         p.descripcion, p.telefono, p.whatsapp, p.email_contacto,
         p.sitio_web, p.estado, p.foto_url, p.clip_url,
         p.expone_personas, p.cohorte, p.cohorte_anio,
         -- LEFT JOIN contra la vista, JAMÁS la fórmula copiada (S94-PERF):
         -- el ofuscado de S84 tiene UNA implementación y su filtro
         -- `estado='activo'` viaja con ella.,
         /* S112-A · la zona con la que la app tiene que pedir «hoy». **No es
            el reloj del teléfono**: a las 23:01 de Guayaquil el UTC ya corrió
            el día y el lector devuelve las filas del día siguiente, en otro
            estado y sin error. ⚠️ El MOTOR sigue calculando con la constante
            de la casa: esta columna es para la APP. */
         v.zona_lat, v.zona_lon, v.zona_radio_m,
         p.zona_horaria
    FROM prestadores p
    LEFT JOIN v_prestadores_publicos v ON v.id = p.id
   WHERE public.user_gestiona_prestador(p.id)
      OR EXISTS (SELECT 1 FROM prestador_empleados pe
                  WHERE pe.prestador_id = p.id
                    AND pe.user_id = v_uid
                    AND pe.activo)
   -- La titularidad manda: quien es titular de lo suyo Y empleado de otro
   -- ve SU negocio (el orden del wrapper viejo, ahora en la fuente).
   ORDER BY public.user_gestiona_prestador(p.id) DESC, p.created_at ASC
   LIMIT 1;
END;
$function$

;
REVOKE ALL ON FUNCTION public.obtener_mi_prestador() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mi_prestador() TO authenticated;
