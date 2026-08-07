-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260807110000_s90d_certificado_salud.sql (la versión APLICADA,
-- adaptada al catálogo). Escrita ANTES de aplicar.
--
-- ⚠️ LA NOTA DE DATOS DE D, INTACTA porque es la que importa: REVERTIR EL
-- CÓDIGO **BORRA LOS CERTIFICADOS EMITIDOS**. No son datos derivados — son
-- ACTOS: el juicio de un profesional en sus propias palabras, que no vive en
-- ninguna otra tabla y no se puede recomputar. Si ya hay filas en
-- `certificado_salud`, esta reversa NO se corre sin decisión de mesa:
-- primero se exportan.
--   SELECT count(*) FROM public.certificado_salud;   -- ← correr esto ANTES
-- Un certificado que alguien ya descargó e imprimió sigue existiendo en
-- papel: revertir borra el respaldo, no la copia.
--
-- ⚠️ Y la nota de tokens: los documento_token de tipo certificado_salud
-- deben borrarse antes de quitar la fila del catálogo (FK):
--   DELETE FROM public.documento_token WHERE tipo = 'certificado_salud';
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ① La RPC del token vuelve a la versión de la orden 1 (sin rama certificado)
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
  INSERT INTO documento_token (user_id, mascota_id, tipo, ref_id, expira_en)
  VALUES (v_uid, p_mascota_id, v_cat.codigo, p_ref, now() + interval '10 minutes')
  RETURNING id INTO v_token;
  RETURN jsonb_build_object('ok', true, 'token', v_token, 'tipo', v_cat.codigo, 'funcion', v_cat.funcion_edge);
END;
$function$;

-- ② La fila del catálogo muere (tokens de certificado: ver nota arriba)
DELETE FROM public.cat_documentos_mascota WHERE codigo = 'certificado_salud';

-- ③ Los lectores y la emisión de D
DROP FUNCTION IF EXISTS public.mi_firma_clinica(uuid);
DROP FUNCTION IF EXISTS public.obtener_certificados_mascota(uuid);
DROP FUNCTION IF EXISTS public.emitir_certificado_salud(uuid, text, text, uuid);

-- ④ La tabla del acto, con su trigger (⚠️ borra los actos — ver cabecera)
DROP TRIGGER IF EXISTS trg_certificado_salud_inmutable ON public.certificado_salud;
DROP FUNCTION IF EXISTS public._certificado_es_inmutable();
DROP TABLE IF EXISTS public.certificado_salud;

COMMIT;
