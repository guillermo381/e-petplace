-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807000000_s89a_documento_historia_clinica.sql
-- Escrita ANTES. Devuelve el CHECK y la RPC al tipo único del carnet.
-- Nota de datos: los tokens de historia_clinica vivos violarían el CHECK —
-- se borran primero (son de un solo uso y 10 minutos: cero pérdida real).
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM public.documento_token WHERE tipo = 'historia_clinica';
ALTER TABLE public.documento_token DROP CONSTRAINT documento_token_tipo_check;
ALTER TABLE public.documento_token
  ADD CONSTRAINT documento_token_tipo_check CHECK (tipo IN ('carnet_vacunas'));

CREATE OR REPLACE FUNCTION public.emitir_token_documento(p_mascota_id uuid, p_tipo text DEFAULT 'carnet_vacunas')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_tipo IS DISTINCT FROM 'carnet_vacunas' THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  INSERT INTO documento_token (user_id, mascota_id, tipo, expira_en)
  VALUES (v_uid, p_mascota_id, p_tipo, now() + interval '10 minutes')
  RETURNING id INTO v_token;
  RETURN jsonb_build_object('ok', true, 'token', v_token, 'tipo', p_tipo);
END;
$function$;
