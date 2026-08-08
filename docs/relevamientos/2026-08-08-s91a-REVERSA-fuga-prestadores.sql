-- REVERSA de 20260808080000_s91a_cierra_fuga_prestadores.sql (escrita ANTES)
-- ⚠️ CORRERLA REABRE UNA FUGA DE PRIVACIDAD MEDIDA: cualquier cliente
-- autenticado vuelve a leer la lat/lon EXACTA (4 filas), la dirección (5) y
-- el email de contacto (1) de negocios ajenos, salteando el ofuscado que S84
-- firmó. No se corre por comodidad: si algo se rompió, se arregla lo que se
-- rompió.
BEGIN;
GRANT SELECT (lat, lon, direccion, email_contacto, metadata, motivo_rechazo,
              aprobado_por, aprobado_en, cuenta_comercial_id)
  ON public.prestadores TO authenticated;
ALTER VIEW public.v_prestadores_publicos SET (security_invoker = true);
DROP FUNCTION IF EXISTS public.obtener_mi_prestador();
COMMIT;
