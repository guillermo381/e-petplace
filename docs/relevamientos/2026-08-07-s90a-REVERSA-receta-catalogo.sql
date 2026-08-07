-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807100000_s90a_receta_catalogo_documentos.sql
-- Escrita ANTES de aplicar (disciplina de la casa).
--
-- ⚠️ NOTA DE DATOS: revertir NO borra los tokens ya emitidos de los tipos
-- nuevos (`receta`, `ficha_identidad`). El CHECK viejo que esta reversa
-- restaura NO valida filas existentes (se agrega NOT VALID a propósito para
-- no rechazar la reversa); si se quiere el estado byte-idéntico al anterior,
-- borrar antes esas filas:
--   DELETE FROM public.documento_token WHERE tipo NOT IN ('carnet_vacunas','historia_clinica');
-- y entonces el ADD CONSTRAINT puede correr sin NOT VALID.
--
-- ⚠️ Revertir también deja a las Edge Functions documento-receta y
-- documento-ficha-identidad desplegadas apuntando a tipos que la RPC ya no
-- emite: quedan inertes (el token nunca existe), no rotas.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ① La RPC vuelve a su firma y body anteriores (fuente: 20260807000000)
DROP FUNCTION IF EXISTS public.emitir_token_documento(uuid, text, uuid);

CREATE FUNCTION public.emitir_token_documento(p_mascota_id uuid, p_tipo text DEFAULT 'carnet_vacunas')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN ('carnet_vacunas', 'historia_clinica') THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;
  -- la misma puerta que el resto del expediente: el papel no ensancha permisos
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  INSERT INTO documento_token (user_id, mascota_id, tipo, expira_en)
  VALUES (v_uid, p_mascota_id, p_tipo, now() + interval '10 minutes')
  RETURNING id INTO v_token;
  RETURN jsonb_build_object('ok', true, 'token', v_token, 'tipo', p_tipo);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.emitir_token_documento(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.emitir_token_documento(uuid, text) TO authenticated;

-- ② documento_token vuelve a la enumeración a mano
ALTER TABLE public.documento_token DROP CONSTRAINT IF EXISTS documento_token_tipo_fkey;
ALTER TABLE public.documento_token DROP COLUMN IF EXISTS ref_id;
ALTER TABLE public.documento_token
  ADD CONSTRAINT documento_token_tipo_check
  CHECK (tipo IN ('carnet_vacunas', 'historia_clinica')) NOT VALID;

-- ③ El catálogo muere
DROP TABLE IF EXISTS public.cat_documentos_mascota;

COMMIT;
