-- S61-A13 — LA ESCALERA DEL PRECIO HONESTO (enmienda de la gramática
-- v1.8): el ÚNICO agregado que mentía con >1 prestador era el chip de
-- domicilio del QUÉ (pintaba el MIN como '+$X' exacto). La oferta gana
-- recargo_domicilio_varia (MIN<>MAX entre groomers con domicilio) —
-- patrón desde_precio/varia generalizado. Relevado: el resto ya era
-- honesto (paseo min+varia en pantalla sobre filas del server; las
-- cards de AMBOS QUIÉN son exactas por prestador; desgloses A6).
-- L-119: DROP explícito (cambia RETURNS). L-140 abajo.

DROP FUNCTION IF EXISTS public.obtener_oferta_grooming(uuid, text);
CREATE FUNCTION public.obtener_oferta_grooming(p_mascota_id uuid, p_modalidad text DEFAULT 'local')
 RETURNS TABLE(tipo_servicio text, servicio_nombre text, desde_precio numeric, varia boolean, atiende_local boolean, atiende_domicilio boolean, recargo_domicilio_desde numeric, recargo_domicilio_varia boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_talla text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- techo de plataforma perro+gato (§5): la UI filtra, la DB manda
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'grooming') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  SELECT m.talla INTO v_talla FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_talla IS NULL THEN
    RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  -- las modalidades del AGREGADO se computan SIN el filtro de modalidad
  -- (el selector del QUÉ necesita saber si existen ambas aunque la
  -- elegida sea una); recargo_domicilio_desde = MIN entre los groomers
  -- que atienden domicilio (v1: agregado declarado, no por groomer).
  WITH mods AS (
    SELECT ps.tipo_servicio AS tipo,
           bool_or(ps.atiende_local)      AS m_local,
           bool_or(ps.atiende_domicilio)  AS m_domicilio,
           MIN(COALESCE(pr.grooming_recargo_domicilio, 0))
             FILTER (WHERE ps.atiende_domicilio) AS m_recargo_desde,
           -- S61-A13 (escalera del precio honesto): el chip del QUÉ
           -- dice "desde" cuando el recargo VARÍA entre groomers
           MIN(COALESCE(pr.grooming_recargo_domicilio, 0)) FILTER (WHERE ps.atiende_domicilio)
             IS DISTINCT FROM
           MAX(COALESCE(pr.grooming_recargo_domicilio, 0)) FILTER (WHERE ps.atiende_domicilio)
             AS m_recargo_varia
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts2      ON ts2.codigo = ps.tipo_servicio
                                AND ts2.categoria = 'grooming' AND ts2.activo
    JOIN prestador_servicio_tallas pst ON pst.prestador_servicio_id = ps.id
                                      AND pst.talla = m.talla
    WHERE m.id = p_mascota_id
      AND ps.activo
      AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
    GROUP BY ps.tipo_servicio
  )
  SELECT
    o.tipo_servicio,
    ts.nombre,               -- voz canónica del selector (no la custom por groomer)
    MIN(o.precio),
    MIN(o.precio) <> MAX(o.precio),
    mods.m_local,
    mods.m_domicilio,
    mods.m_recargo_desde,
    mods.m_recargo_varia
  FROM _grooming_ofertas_cobrables(p_mascota_id, p_modalidad) o
  JOIN tipos_servicio ts ON ts.codigo = o.tipo_servicio
  JOIN mods ON mods.tipo = o.tipo_servicio
  GROUP BY o.tipo_servicio, ts.nombre, mods.m_local, mods.m_domicilio, mods.m_recargo_desde, mods.m_recargo_varia
  ORDER BY MIN(o.precio);
END;
$function$;

REVOKE ALL ON FUNCTION public.obtener_oferta_grooming(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_oferta_grooming(uuid, text) TO authenticated;
