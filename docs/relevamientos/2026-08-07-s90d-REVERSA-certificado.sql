-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA — S90-D · el certificado de salud
-- Escrita ANTES de aplicar (regla de la casa). La entrega la pista D junto
-- con el SQL; quien la corre es A.
--
-- ⚠️ NOTA DE DATOS, y es la que importa: REVERTIR EL CODIGO **BORRA LOS
-- CERTIFICADOS EMITIDOS**. No son datos derivados — son ACTOS: el juicio de
-- un profesional en sus propias palabras, que no vive en ninguna otra tabla
-- y no se puede recomputar. Si ya hay filas en `certificado_salud`, esta
-- reversa NO se corre sin decision de mesa: primero se exportan.
--
--   SELECT count(*) FROM public.certificado_salud;   -- <- correr esto ANTES
--
-- Y una consecuencia hacia afuera: un certificado que alguien ya descargo e
-- imprimio sigue existiendo en papel. Revertir borra el respaldo, no la copia.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ⑤ el token vuelve a su forma de dos papeles
DROP FUNCTION IF EXISTS public.emitir_token_documento(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.emitir_token_documento(p_mascota_id uuid, p_tipo text DEFAULT 'carnet_vacunas')
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
GRANT  EXECUTE ON FUNCTION public.emitir_token_documento(uuid, text) TO authenticated;

-- Los tokens de certificado que quedaran vivos violarian el CHECK viejo.
DELETE FROM public.documento_token WHERE tipo = 'certificado_salud';

ALTER TABLE public.documento_token DROP CONSTRAINT documento_token_tipo_check;
ALTER TABLE public.documento_token
  ADD CONSTRAINT documento_token_tipo_check
  CHECK (tipo IN ('carnet_vacunas', 'historia_clinica'));

ALTER TABLE public.documento_token DROP COLUMN IF EXISTS referencia_id;

-- ④bis ④ ③ los lectores y la emision
DROP FUNCTION IF EXISTS public.mi_firma_clinica(uuid);
DROP FUNCTION IF EXISTS public.obtener_certificados_mascota(uuid);
DROP FUNCTION IF EXISTS public.emitir_certificado_salud(uuid, text, text, uuid);

-- ② ① la tabla y su inmutabilidad (el trigger cae con la tabla)
DROP TABLE IF EXISTS public.certificado_salud;
DROP FUNCTION IF EXISTS public._certificado_es_inmutable();

COMMIT;
