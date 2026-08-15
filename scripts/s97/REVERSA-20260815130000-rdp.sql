CREATE OR REPLACE FUNCTION public.revisar_documento_prestador(p_documento_id uuid, p_veredicto text, p_notas text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_estado text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  -- 'vencido' NO es veredicto de admin: es el estado del motor de
  -- vencimientos (LETRA_PERFIL_S79 §7, propuesta sin firma). 'pendiente'
  -- tampoco: des-veredictar no existe — re-veredictar SÍ (es admin).
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('aprobado', 'rechazado') THEN
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;

  UPDATE public.prestador_documentos
     SET estado         = p_veredicto,
         revisado_por   = v_auth,
         revisado_en    = now(),
         notas_revision = NULLIF(trim(p_notas), '')
   WHERE id = p_documento_id
  RETURNING estado INTO v_estado;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'documento_no_encontrado' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'documento_id', p_documento_id, 'estado', v_estado);
END;
$function$
