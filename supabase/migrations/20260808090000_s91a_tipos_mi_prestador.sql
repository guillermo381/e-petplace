-- ============================================================================
-- S91-A · `obtener_mi_prestador`: los TIPOS, medidos uno por uno
-- ============================================================================
-- La versión de `20260808080000` declaró `lat`/`lon` como `numeric` **por
-- analogía**, y la tabla las tiene en `double precision`. El rebote fue
-- 42804 y —esto es lo importante— **ocurrió en TIEMPO DE EJECUCIÓN, no al
-- crear la función**: plpgsql valida el tipo del RETURN QUERY cuando corre.
-- O sea que la función se creó "bien", el cinturón de la migración pasó, y el
-- defecto apareció recién en el primer fixture que la llamó.
--
-- *Es la tercera vez en la sesión que un supuesto de TIPO se cuela: primero
-- `especies_elegibles` (jsonb, no text[]), después `p_raza` (requerido, no
-- opcional), ahora `lat` (double precision, no numeric). Los tres se
-- descubrieron chocando y ninguno lo habría dicho un grep del nombre.* Los 24
-- tipos de abajo salieron de `information_schema.columns`, no de la intuición.
--
-- Veda 76(g): NO RIGE. D-662: la función no tiene consumidor publicado aún.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-tipos-mi-prestador.sql
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_mi_prestador();

CREATE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(
   id uuid,
   nombre_comercial text,
   tipo text,
   country_code text,
   cuenta_comercial_id uuid,
   direccion text,
   ciudad text,
   sector text,
   lat double precision,
   lon double precision,
   radio_cobertura_km integer,
   grooming_extra_pelaje_largo numeric,
   grooming_recargo_domicilio numeric,
   descripcion text,
   telefono text,
   whatsapp text,
   email_contacto text,
   sitio_web text,
   estado text,
   foto_url text,
   clip_url text,
   expone_personas boolean,
   cohorte text,
   cohorte_anio integer)
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
$function$;

COMMENT ON FUNCTION public.obtener_mi_prestador() IS
  'S91: la puerta del DUEÑO a su fila completa. Existe porque el REVOKE por columna que cerró la fuga no distingue dueño de ajeno —los dos son authenticated—. Gate = user_gestiona_prestador (titular Y equipo activo). Tipos leídos de information_schema, no por analogía: lat/lon son double precision.';

REVOKE EXECUTE ON FUNCTION public.obtener_mi_prestador() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mi_prestador() TO authenticated;

DO $$
DECLARE v_acl text; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mi_prestador';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon_tipos: % sobrecargas', v_n; END IF;
  SELECT p.proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mi_prestador';
  IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_tipos: anon en proacl'; END IF;
END $$;

COMMIT;
