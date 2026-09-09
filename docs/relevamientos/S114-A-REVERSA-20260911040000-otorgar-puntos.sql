-- REVERSA de `20260911040000_s114a_otorgar_puntos_gate.sql`. Escrita ANTES.
--
-- 🔴 ESTA REVERSA REABRE UN AGUJERO DE SEGURIDAD PROBADO. Correrla devuelve
--    `otorgar_puntos` a su estado del 7-sep-2026: SECURITY DEFINER, sin
--    `search_path`, ejecutable por cualquier `authenticated` y sin un solo
--    gate en el cuerpo. Medido por camino real ese día: un usuario común, no
--    admin, se acuñó 999 puntos con HTTP 204.
--
-- 🔴 Y NO DESHACE LA LIMPIEZA: los 999 puntos de la sonda se borraron por id
--    dentro de la migración. Revertir NO los repone, y no debería.
--
-- Si de verdad hace falta revertir, la forma correcta es quitar SOLO el gate y
-- CONSERVAR el `search_path` — son dos curas distintas que viajaron juntas.
CREATE OR REPLACE FUNCTION public.otorgar_puntos(p_user_id uuid, p_puntos integer, p_tipo text, p_descripcion text, p_logro_id uuid DEFAULT NULL::uuid, p_referencia text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE v_nuevo_total INT; v_nuevo_nivel UUID;
BEGIN
  INSERT INTO transacciones_puntos (user_id, puntos, tipo, descripcion, logro_id, referencia_id)
  VALUES (p_user_id, p_puntos, p_tipo, p_descripcion, p_logro_id, p_referencia);
  INSERT INTO puntos_usuario (user_id, puntos_totales, puntos_mes, ultima_actividad)
  VALUES (p_user_id, p_puntos, p_puntos, public.hoy_local())
  ON CONFLICT (user_id) DO UPDATE
  SET puntos_totales = puntos_usuario.puntos_totales + p_puntos,
      puntos_mes = puntos_usuario.puntos_mes + p_puntos,
      ultima_actividad = public.hoy_local(), updated_at = NOW()
  RETURNING puntos_totales INTO v_nuevo_total;
  SELECT id INTO v_nuevo_nivel FROM niveles
  WHERE puntos_minimos <= v_nuevo_total AND (puntos_maximos IS NULL OR puntos_maximos >= v_nuevo_total)
  ORDER BY puntos_minimos DESC LIMIT 1;
  IF v_nuevo_nivel IS NOT NULL THEN
    UPDATE puntos_usuario SET nivel_id = v_nuevo_nivel WHERE user_id = p_user_id;
  END IF;
END; $function$;
GRANT EXECUTE ON FUNCTION public.otorgar_puntos(uuid,integer,text,text,uuid,text) TO authenticated;
