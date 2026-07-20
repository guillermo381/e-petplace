-- S70-A10 — DOS LECTORES que la V2 pide (bloquean el Durante del vet).
-- 76(g) aditiva (funciones nuevas). L-140 al cierre.
--   (1) casos activos de la mascota, por el camino PRESTADOR (acceso vigente;
--       D-441 sigue durmiendo) — consumidores: el Antes del vet + el bloque
--       caso de la Confirmación (nuevo | activo | ninguno). es_tratante da la voz.
--   (2) personas de la cuenta para el selector de "Fijar fecha".

CREATE OR REPLACE FUNCTION public.obtener_casos_activos_mascota(
  p_mascota_id uuid,
  p_cuenta_comercial_id uuid
)
RETURNS TABLE(
  caso_id uuid,
  condicion text,
  fecha_apertura timestamptz,
  horizonte_proximo_evento timestamptz,
  empleado_tratante_id uuid,
  es_tratante boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  -- camino PRESTADOR: acceso vigente de la cuenta a la mascota (D-441 duerme)
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    cc.id,
    cc.condicion,
    cc.fecha_apertura,
    cc.horizonte_proximo_evento,
    cc.empleado_tratante_id,
    (cc.cuenta_comercial_tratante_id = p_cuenta_comercial_id) AS es_tratante
  FROM caso_clinico cc
  WHERE cc.mascota_id = p_mascota_id AND cc.estado = 'activo'
  ORDER BY cc.fecha_apertura DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_empleados_cuenta(p_cuenta_comercial_id uuid)
RETURNS TABLE(
  empleado_id uuid,
  nombre text,
  activo boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- Todas las personas de la cuenta con su flag `activo` (titular incluido);
  -- activas primero. El selector de "Fijar fecha" filtra activo=true (fijar_
  -- fecha_procedimiento rebota empleado_no_es_de_cuenta si no está activo).
  RETURN QUERY
  SELECT pe.id, pe.nombre, pe.activo
  FROM prestador_empleados pe
  JOIN prestadores p ON p.id = pe.prestador_id
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  ORDER BY pe.activo DESC, pe.nombre;
END;
$function$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.obtener_casos_activos_mascota(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_casos_activos_mascota(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_empleados_cuenta(uuid) TO authenticated;
