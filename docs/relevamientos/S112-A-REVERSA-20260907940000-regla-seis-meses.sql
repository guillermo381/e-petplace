-- REVERSA de 20260907940000_s112a_regla_seis_meses.sql — ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE: revertir esto **deja publicar animales adultos sin
-- esterilizar**, que es lo que la OM 019 art. 6.7 prohibe. No rompe datos; abre
-- una puerta que la ley cierra. No se revierte sin decirselo al founder.
-- Las publicaciones que ya se hayan frenado NO quedan registradas en ningun
-- lado: el rebote no deja rastro, asi que revertir no «libera» nada pendiente.
BEGIN;
DROP FUNCTION IF EXISTS public.evaluar_esterilizacion_adoptable(uuid);
CREATE OR REPLACE FUNCTION public.cambiar_estado_adoptable(
  p_publicacion_id uuid, p_estado text, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_estado text; v_masc uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_estado NOT IN ('borrador','publicada','pausada','adoptada','no_disponible') THEN
    RAISE EXCEPTION 'estado_no_valido: %', p_estado USING ERRCODE='22023';
  END IF;
  SELECT cuenta_comercial_id, estado, mascota_id INTO v_cta, v_estado, v_masc
    FROM adopcion_publicacion WHERE id = p_publicacion_id FOR UPDATE;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado = p_estado THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'estado', p_estado);
  END IF;
  IF p_estado = 'adoptada' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'adoptada_la_escribe_el_acta' USING ERRCODE='42501';
  END IF;
  UPDATE adopcion_publicacion
     SET estado = p_estado,
         retirada_en   = CASE WHEN p_estado='no_disponible' THEN now() ELSE NULL END,
         motivo_retiro = CASE WHEN p_estado='no_disponible' THEN p_motivo ELSE NULL END,
         actualizada_en = now()
   WHERE id = p_publicacion_id;
  RETURN jsonb_build_object('ok', true, 'ya_estaba', false,
                            'estado', p_estado, 'estado_anterior', v_estado);
END $fn$;
COMMIT;
