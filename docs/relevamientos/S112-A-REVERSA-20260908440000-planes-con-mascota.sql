-- REVERSA de 20260908440000 · el lector de planes deja de traer la mascota.
-- ⚠️ Es un lector: revertirlo NO pierde datos, pero **la pantalla del cliente
-- vuelve a mostrar un plan sin decir de quién es**. L-119: se re-crea, no se
-- dropea, porque cambia el TABLE de retorno.
DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();
CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text, mascota_id uuid,
              precio_mensual numeric, estado text, periodo_desde date, periodo_hasta date,
              direccion_id uuid, proximo_cobro date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial, s.mascota_id,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id,
         CASE WHEN s.estado = 'activa' AND s.periodo_desde IS NOT NULL AND s.dia_de_cobro IS NOT NULL
              THEN public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde) ELSE NULL END
    FROM guarderia_suscripciones s JOIN prestadores pr ON pr.id = s.prestador_id
   WHERE s.familia_id = v_fam
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $fn$;
REVOKE ALL ON FUNCTION public.obtener_mis_planes_guarderia() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() TO authenticated;
