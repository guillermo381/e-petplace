-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807140000_s90a_folio_de_emision.sql
-- Escrita ANTES de aplicar.
-- ⚠️ NOTA DE DATOS: los folios ya emitidos viven en papeles IMPRESOS que esta
-- reversa no puede retirar. Borrar la columna borra el registro de qué folio
-- salió en qué emisión — el papel impreso queda sin respaldo verificable.
-- La secuencia NO se resetea si se re-aplica después: los números no se
-- reusan (un folio reusado es peor que un hueco).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- La RPC vuelve a la versión sin folio (la del certificado, 20260807110000)
CREATE OR REPLACE FUNCTION public.emitir_token_documento(
  p_mascota_id uuid,
  p_tipo       text DEFAULT 'carnet_vacunas',
  p_ref        uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid   uuid := auth.uid();
  v_cat   record;
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  SELECT codigo, funcion_edge, requiere_ref INTO v_cat
  FROM cat_documentos_mascota WHERE codigo = p_tipo AND activo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cat.requiere_ref AND p_ref IS NULL THEN
    RAISE EXCEPTION 'ref_requerida' USING ERRCODE = '22023';
  END IF;
  IF v_cat.codigo = 'receta' THEN
    IF NOT EXISTS (
      SELECT 1 FROM evento_medicacion_prescrita m
      WHERE m.cita_id = p_ref AND m.mascota_id = p_mascota_id
    ) THEN
      RAISE EXCEPTION 'receta_sin_medicacion' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF v_cat.codigo = 'certificado_salud' THEN
    IF NOT EXISTS (
      SELECT 1 FROM certificado_salud c
      WHERE c.id = p_ref AND c.mascota_id = p_mascota_id
    ) THEN
      RAISE EXCEPTION 'referencia_no_es_de_la_mascota' USING ERRCODE = '22023';
    END IF;
  END IF;
  INSERT INTO documento_token (user_id, mascota_id, tipo, ref_id, expira_en)
  VALUES (v_uid, p_mascota_id, v_cat.codigo, p_ref, now() + interval '10 minutes')
  RETURNING id INTO v_token;
  RETURN jsonb_build_object('ok', true, 'token', v_token, 'tipo', v_cat.codigo, 'funcion', v_cat.funcion_edge);
END;
$function$;

ALTER TABLE public.documento_token DROP COLUMN IF EXISTS folio;
DROP SEQUENCE IF EXISTS public.documento_folio_seq;

COMMIT;
