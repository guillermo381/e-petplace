-- REVERSA de 20260829060000_s107a_cupo_cuatro_casos.sql · ESCRITA ANTES.
-- 🔴 NO deshace: revertir devuelve un cupo que NO distingue «no abren» de «se
--    llenó» ⇒ la pantalla vuelve a tener que inferirlo, y no puede sin mentir.
BEGIN;
DROP FUNCTION IF EXISTS public.cupo_guarderia_del_rango(uuid, date, date);
CREATE FUNCTION public.cupo_guarderia_del_rango(p_prestador_id uuid, p_desde date, p_hasta date)
RETURNS TABLE(fecha date, capacidad int, consumido int, disponible int, sobrevendido boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public','pg_temp' AS $$
DECLARE v_dias int := (p_hasta - p_desde) + 1;
BEGIN
  IF p_hasta < p_desde THEN RAISE EXCEPTION 'rango_invertido' USING ERRCODE='22023'; END IF;
  IF v_dias > 62 THEN RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE='22023'; END IF;
  RETURN QUERY
  SELECT d::date,(c->>'capacidad')::int,(c->>'consumido')::int,(c->>'disponible')::int,(c->>'sobrevendido')::boolean
    FROM generate_series(p_desde,p_hasta,interval '1 day') d
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(p_prestador_id,d::date) c;
END $$;
REVOKE EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cupo_guarderia_del_rango(uuid,date,date) TO authenticated;
COMMIT;
