-- ═══════════════════════════════════════════════════════════════════
-- S62 · LA CURA DEL VEROSÍMIL-FALSO DEL TRACK (letra founder S62 +
-- addendum de corrección — hallazgo Tanda 0 de la A + verificación de
-- la B sobre el CHECK)
--
-- El caso: el paseo real del founder (15 Jul, atención 40088be9) cerró
-- con UN punto GPS escrito en el flush del cierre y gps_estado dijo
-- 'registrado' — verosímil-falso de estado (L-139): un punto no puede
-- trazar recorrido, pero el sistema declaraba éxito. Sistémico: 6 de 9
-- paseos históricos tienen <2 puntos y todos dicen 'registrado'.
--
-- La letra (addendum): (1) gps_estado gana 'incompleto' (track con <2
-- puntos y >0); (2) el CHECK se enmienda — motivo obligatorio para
-- 'fallido' Y para 'incompleto' (en 'incompleto' el track PUEDE portar
-- puntos: es su definición); 'registrado' exige ≥2 y motivo NULL;
-- (3) terminar pide motivo cuando el total sea <2, no solo 0 — el
-- canal nuevo para "se cortó a mitad". El pasado NO se reescribe: la
-- cita de hoy (paseo 0f252b2f) y las 6 filas históricas quedan como
-- están — por eso la regla registrado-exige-≥2 nace NOT VALID (rige
-- para toda escritura nueva; las filas viejas no se validan).
-- DECLARADO: si algún flujo futuro llegara a UPDATEar una de esas 6
-- filas históricas, el CHECK NOT VALID la mordería — hoy ningún flujo
-- toca un paseo cerrado (todos los escritores gatean 'en_curso').
--
-- Sin tocar ocupación ni devengo (la letra): solo gps_estado, sus
-- CHECKs y terminar_atencion_paseo.
-- ═══════════════════════════════════════════════════════════════════

-- 1 ▸ el estado nuevo entra al vocabulario
ALTER TABLE public.eventos_mascota_paseo
  DROP CONSTRAINT eventos_mascota_paseo_gps_estado_check;

ALTER TABLE public.eventos_mascota_paseo
  ADD CONSTRAINT eventos_mascota_paseo_gps_estado_check
  CHECK (gps_estado = ANY (ARRAY['registrado'::text, 'incompleto'::text, 'fallido'::text]));

-- 2 ▸ coherencia motivo↔estado (VALIDADA: las 9 filas históricas son
--     'registrado' con motivo NULL y la cumplen; en vivo el estado es
--     NULL hasta terminar)
ALTER TABLE public.eventos_mascota_paseo
  DROP CONSTRAINT gps_motivo_solo_si_fallido;

ALTER TABLE public.eventos_mascota_paseo
  ADD CONSTRAINT gps_motivo_coherente
  CHECK (
    (gps_estado IS NULL AND gps_motivo_fallo IS NULL)
    OR (gps_estado = 'registrado' AND gps_motivo_fallo IS NULL)
    OR (gps_estado IN ('fallido', 'incompleto') AND gps_motivo_fallo IS NOT NULL)
  );

-- 3 ▸ 'registrado' exige track de verdad (≥2 puntos) — NOT VALID por
--     las 6 filas históricas (el pasado no se reescribe, letra)
ALTER TABLE public.eventos_mascota_paseo
  ADD CONSTRAINT gps_registrado_exige_track
  CHECK (gps_estado <> 'registrado' OR COALESCE(jsonb_array_length(track_gps), 0) >= 2)
  NOT VALID;

-- 4 ▸ terminar: el umbral pasa a <2 (el canal nuevo del "se cortó a
--     mitad") — resto del cuerpo INTACTO (pausas, atención, retorno)
CREATE OR REPLACE FUNCTION public.terminar_atencion_paseo(p_atencion_id uuid, p_gps_motivo_fallo text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_now timestamptz := now();
  v_paseo_id uuid;
  v_puntos int;
  v_track_completo boolean;
  v_gps_estado text;
  v_pausa_cerrada boolean := false;
BEGIN
  SELECT id, COALESCE(jsonb_array_length(track_gps), 0)
  INTO v_paseo_id, v_puntos
  FROM eventos_mascota_paseo WHERE evento_atencion_id = p_atencion_id;
  IF v_paseo_id IS NULL THEN
    RAISE EXCEPTION 'atencion_sin_oficio_paseo' USING ERRCODE = '22023';
  END IF;

  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(p_atencion_id);

  -- S62 (cura del verosímil-falso, enmienda paseo-3/D-271): un track
  -- con <2 puntos no puede trazar recorrido — 'registrado' exige ≥2;
  -- 1 punto = 'incompleto' (se cortó a mitad) y 0 = 'fallido', AMBOS
  -- con motivo obligatorio. Simetría estricta intacta.
  v_track_completo := v_puntos >= 2;
  IF v_track_completo AND p_gps_motivo_fallo IS NOT NULL THEN
    RAISE EXCEPTION 'gps_motivo_innecesario: hay track registrado' USING ERRCODE = '22023';
  END IF;
  IF NOT v_track_completo AND (p_gps_motivo_fallo IS NULL OR length(trim(p_gps_motivo_fallo)) = 0) THEN
    RAISE EXCEPTION 'gps_motivo_fallo_required: track insuficiente (menos de 2 puntos), el motivo del fallo es obligatorio'
      USING ERRCODE = '22023';
  END IF;
  v_gps_estado := CASE
    WHEN v_puntos >= 2 THEN 'registrado'
    WHEN v_puntos = 1 THEN 'incompleto'
    ELSE 'fallido'
  END;

  -- Pausa abierta se cierra automáticamente (calco del molde, transversal por capa)
  UPDATE evento_grooming_pausas
  SET reanudada_en = v_now
  WHERE evento_atencion_id = p_atencion_id AND reanudada_en IS NULL;
  IF FOUND THEN v_pausa_cerrada := true; END IF;

  UPDATE eventos_mascota_paseo
  SET gps_estado = v_gps_estado,
      gps_motivo_fallo = CASE WHEN v_track_completo THEN NULL ELSE p_gps_motivo_fallo END
  WHERE id = v_paseo_id;

  UPDATE evento_atencion
  SET estado = 'terminada', terminada_en = v_now
  WHERE id = p_atencion_id;

  RETURN jsonb_build_object(
    'ok', true,
    'paseo_id', v_paseo_id,
    'estado', 'terminada',
    'terminada_en', v_now,
    'gps_estado', v_gps_estado,
    'pausa_abierta_cerrada_automaticamente', v_pausa_cerrada
  );
END;
$function$;

-- L-140: CREATE OR REPLACE conserva el acl existente de la función —
-- la verificación post-migración confirma proacl sin anon igualmente.
