-- REVERSA de 20260903160000_s108a_proximo_cobro_en_el_lector.sql — ANTES.
-- ⚠️ Revertir devuelve la firma vieja del lector (sin `proximo_cobro`) ⇒ todo
--    consumidor que ya lea esa columna deja de recibirla. Si el bundle publicado
--    la pide, rebota: es cambio de contrato de lectura, no aditivo del lado del
--    cliente. Se declara (D-662).
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();
CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
 RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text, mascota_id uuid, precio_mensual numeric, estado text, periodo_desde date, periodo_hasta date, direccion_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial, s.mascota_id,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
   WHERE s.familia_id = v_fam
   /* El activo primero: es el único sobre el que la familia puede actuar. */
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $function$

;
COMMIT;
