-- REVERSA de 20260908040000_s112a_formulario.sql — ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE:
--   · Las RESPUESTAS ya escritas se PIERDEN con la columna. Son datos de hogar
--     de personas reales; no viven en ningun otro lado.
--   · Revertir esto deja la purga de 90 dias **sin borrar el formulario**, que
--     es la mitad de lo que el founder firmo. La identidad se sigue anonimizando;
--     el hogar declarado (cuantos adultos, cuantos menores por rango) queda.
--     **Es un incumplimiento de la firma del 1-sep, y es silencioso.**
--   · El techo de 3 solicitudes desaparece: vuelve a poder postularse sin limite
--     total (el `uq_solicitud_viva` por animal sobrevive: es un indice viejo).
BEGIN;

DROP FUNCTION IF EXISTS public.crear_solicitud_adopcion(uuid, jsonb, uuid, text);
DROP FUNCTION IF EXISTS public._respuestas_postulacion_validas(jsonb);
DROP FUNCTION IF EXISTS public._columnas_solicitud_clasificadas();

CREATE OR REPLACE FUNCTION public.crear_solicitud_adopcion(p_publicacion_id uuid, p_mensaje_inicial text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_sol uuid; v_cc text; v_estado text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT p.country_code INTO v_cc FROM adopcion_publicacion p
   WHERE p.id = p_publicacion_id AND p.estado = 'publicada';
  IF v_cc IS NULL THEN RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023'; END IF;
  IF NOT public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'condiciones_no_aceptadas' USING ERRCODE='22023';
  END IF;
  IF p_mensaje_inicial IS NOT NULL AND btrim(p_mensaje_inicial) = '' THEN
    RAISE EXCEPTION 'mensaje_vacio' USING ERRCODE='22023';
  END IF;
  SELECT s.id, s.estado INTO v_sol, v_estado FROM adopcion_solicitud s
   WHERE s.publicacion_id = p_publicacion_id AND s.solicitante_user_id = v_user
     AND s.estado IN ('recibida','en_conversacion');
  IF v_sol IS NOT NULL THEN
    RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol USING ERRCODE='22023';
  END IF;
  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code)
       VALUES (p_publicacion_id, v_user, v_cc) RETURNING id INTO v_sol;
  IF p_mensaje_inicial IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_user, p_mensaje_inicial, false);
  END IF;
  RETURN jsonb_build_object('ok', true, 'solicitud_id', v_sol, 'estado', 'recibida');
END $function$;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_adopcion(uuid, text) TO authenticated;

ALTER TABLE public.adopcion_solicitud
  DROP COLUMN IF EXISTS respuestas,
  DROP COLUMN IF EXISTS aceptacion_id;

COMMIT;
