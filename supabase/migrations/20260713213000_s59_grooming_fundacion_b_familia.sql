-- ════════════════════════════════════════════════════════════════════
-- S59-A3 — FUNDACIÓN GROOMING, pata (e)-bis: la edición FAMILIAR del
-- perfil (HALLAZGO del assert A3 de la tanda):
--
--   La letra §3 exige talla/pelaje "editables por la familia (RLS
--   espejo de la casa)", pero mascotas SOLO tenía UPDATE para admin y
--   para `mascota_codueño` (tabla LEGACY del sistema viejo — el modelo
--   de FAMILIA no entra: el titular demo no pudo editar, probado con
--   JWT+ROLE). Y `user_tiene_acceso_a_mascota` NO sirve de espejo para
--   escritura: incluye PRESTADORES con acceso vigente.
--
--   Cura: nace el helper `user_es_familiar_adulto_de_mascota` (miembro
--   ADULTO vigente de la familia de la mascota — titular o autorizado;
--   menores y cuidadores externos NO editan) + policy de UPDATE.
--   De paso se ENDURECE el gate de responder_socializacion_paseo (P19,
--   S59-A2): usaba user_tiene_acceso_a_mascota — un prestador con
--   acceso podía responder la socialización de una mascota ajena. El
--   consentimiento es de la FAMILIA.
-- ════════════════════════════════════════════════════════════════════

CREATE FUNCTION public.user_es_familiar_adulto_de_mascota(p_mascota_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM mascotas m
      JOIN familia_miembro fm ON fm.familia_id = m.familia_id
      WHERE m.id = p_mascota_id
        AND fm.user_id = auth.uid()
        AND fm.rol IN ('adulto_titular', 'adulto_autorizado')
        AND fm.hasta IS NULL
    )
    -- dueño directo (legacy/walk-in sin familia armada): sigue pudiendo
    OR EXISTS (
      SELECT 1 FROM mascotas m
      WHERE m.id = p_mascota_id AND m.user_id = auth.uid()
    )
  );
$function$;

-- L-140: toda función nueva nace con EXECUTE para anon — se mata.
REVOKE EXECUTE ON FUNCTION public.user_es_familiar_adulto_de_mascota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_es_familiar_adulto_de_mascota(uuid) TO authenticated;

-- La familia adulta edita el perfil de su mascota (la policy codueño
-- legacy queda intacta — OR permisivo, cero regresión).
CREATE POLICY mascotas_update_familia ON mascotas
  FOR UPDATE TO authenticated
  USING (user_es_familiar_adulto_de_mascota(id))
  WITH CHECK (user_es_familiar_adulto_de_mascota(id));

-- P19 endurecida: el consentimiento lo responde LA FAMILIA (el gate
-- viejo por user_tiene_acceso_a_mascota dejaba entrar prestadores).
CREATE OR REPLACE FUNCTION public.responder_socializacion_paseo(p_mascota_id uuid, p_ok boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth    uuid := auth.uid();
  v_mascota record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_ok IS NULL THEN
    RAISE EXCEPTION 'respuesta_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT id, familia_id, country_code INTO v_mascota
  FROM mascotas WHERE id = p_mascota_id;
  IF v_mascota.familia_id IS NULL THEN
    -- la pregunta única vive en el flujo de reserva de una familia; una
    -- mascota sin familia no llega acá por producto — el guard es honesto.
    RAISE EXCEPTION 'mascota_sin_familia' USING ERRCODE = '22023';
  END IF;

  UPDATE mascotas
  SET paseo_social_ok = p_ok, updated_at = now()
  WHERE id = p_mascota_id;

  -- el NO se registra SIEMPRE (P19): también el re-NO tras editar.
  IF NOT p_ok THEN
    INSERT INTO paseo_social_negativas (mascota_id, familia_id, country_code)
    VALUES (p_mascota_id, v_mascota.familia_id, COALESCE(v_mascota.country_code, 'EC'));
  END IF;

  RETURN jsonb_build_object('ok', true, 'mascota_id', p_mascota_id, 'paseo_social_ok', p_ok);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.responder_socializacion_paseo(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.responder_socializacion_paseo(uuid, boolean) TO authenticated;
