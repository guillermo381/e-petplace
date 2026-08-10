-- ══════════════════════════════════════════════════════════════════════════
-- S94-PERF · REVERSA de `20260809180000_perf_zona_en_obtener_mi_prestador.sql`
-- ESCRITA ANTES DE APLICAR (disciplina §4 del arranque).
--
-- Restaura `obtener_mi_prestador()` a su definición del 9-ago-2026 (leída con
-- `pg_get_functiondef`, no reconstruida de memoria): 24 columnas, sin las tres
-- de zona.
--
-- ── QUÉ **NO** DESHACE ────────────────────────────────────────────────────
-- ① Los CONSUMIDORES. Si `packages/api` ya dejó de llamar a `leerZona()`,
--    revertir esta función deja al wrapper devolviendo `zona_* = undefined`
--    para siempre: el mapa de zona del prestador dejaría de dibujarse. **La
--    reversa de la base y la del bundle son DOS actos, y en este orden: primero
--    se revierte el bundle (o se publica el OTA viejo), después esta función.**
--    Al revés hay una ventana con la zona rota en el aparato de quien ya tenga
--    el OTA nuevo.
-- ② Nada de datos: esta migración no escribe una sola fila.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_mi_prestador();

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

-- Los grants se restauran EXACTOS a los medidos antes de tocar nada
-- (`proacl` = postgres, authenticated, service_role · anon **fuera**). Se
-- escriben los tres porque un DROP se lleva el ACL entero: olvidar
-- `service_role` acá dejaría sin puerta a las edge functions, y ese rebote
-- aparecería lejos de esta reversa.
REVOKE ALL ON FUNCTION public.obtener_mi_prestador() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_mi_prestador() TO authenticated, service_role;

COMMIT;
