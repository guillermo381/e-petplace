-- REVERSA de 20260826220000_s106a_habilitacion_minimos.sql — ESCRITA ANTES.
--
-- QUÉ DESHACE: quita el gate de mínimos de `_vet_ofertas_cobrables`, borra
-- la RPC de aceptación, el helper y la tabla de aceptaciones.
--
-- ⚠️ QUÉ **NO** DESHACE:
--   · `DROP TABLE prestador_minimos_aceptados` **BORRA LA EVIDENCIA** de qué
--     profesional aceptó qué versión de los mínimos y cuándo. Eso no se
--     recupera. Si la reversa corre después de que alguien aceptó de verdad,
--     **exportar la tabla antes**.
--   · Revertir REABRE la vitrina: la oferta de telemedicina de Clínica
--     Aurora vuelve a publicarse sin aceptación registrada, que es el estado
--     que esta migración vino a cerrar.

BEGIN;

CREATE OR REPLACE FUNCTION public._vet_ofertas_cobrables(p_mascota_id uuid)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, tipo_servicio text, servicio_nombre text, precio numeric, duracion_minutos integer, direccion text, ciudad text)
 LANGUAGE sql STABLE SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
         COALESCE(ps.nombre_custom, ts.nombre), ps.precio, ps.duracion_minutos,
         pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria IN ('veterinario', 'telemedicina', 'emergencia')
                             AND ts.activo AND ts.reservable
  WHERE m.id = p_mascota_id
    AND ps.activo AND ps.reservable
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    AND (ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)
    AND (ps.especies_compatibles IS NULL
         OR ps.especies_compatibles = '[]'::jsonb
         OR ps.especies_compatibles ? m.especie)
$function$;

DROP FUNCTION IF EXISTS public.aceptar_minimos_servicio(uuid, text);
DROP FUNCTION IF EXISTS public.prestador_acepto_minimos(uuid, text);
DROP FUNCTION IF EXISTS public._version_minimos_telemedicina();
DROP TABLE IF EXISTS public.prestador_minimos_aceptados;

COMMIT;
