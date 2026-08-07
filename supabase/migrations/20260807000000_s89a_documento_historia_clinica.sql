-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 10 ① — LA HISTORIA CLÍNICA GANA SU PAPEL
--
-- El segundo documento del producto, MISMO MOLDE que el carnet (S89 orden 8):
-- token quemable → Edge Function → PDF con la espec de B → botón en el
-- expediente. Solo se ensancha el CHECK del tipo y el gate de la RPC.
--
-- DECISIÓN DE DISEÑO (declarada, adjudicada por la mesa a esta pista):
-- **v1 = el expediente clínico COMPLETO** (todas las consultas de la
-- mascota, más nueva arriba). El rango de fechas es v2 — un papel que
-- todavía no sabe recortarse es honesto; uno que recorta sin decirlo, no.
--
-- LA PUERTA ES LA MISMA, y eso importa: `user_tiene_acceso_a_mascota` ya
-- gobierna quién puede ver el expediente clínico. El papel NO ensancha
-- permisos — imprime lo que esa persona ya podía leer en pantalla.
--
-- 76(g): NO RIGE — un CHECK ensanchado + CREATE OR REPLACE, cero backfill.
-- D-662: cero contrato roto (el parámetro ya tenía DEFAULT).
-- L-140: la RPC conserva su proacl (CREATE OR REPLACE).
-- REVERSA: docs/relevamientos/2026-08-07-s89a-REVERSA-documento-hc.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.documento_token DROP CONSTRAINT documento_token_tipo_check;
ALTER TABLE public.documento_token
  ADD CONSTRAINT documento_token_tipo_check
  CHECK (tipo IN ('carnet_vacunas', 'historia_clinica'));

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

DO $cint$
DECLARE v_src text;
BEGIN
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='emitir_token_documento';
  IF v_src NOT LIKE '%historia_clinica%' THEN
    RAISE EXCEPTION 'cinturon_hc: la RPC no acepta el tipo nuevo';
  END IF;
  IF pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname='documento_token_tipo_check'))
     NOT LIKE '%historia_clinica%' THEN
    RAISE EXCEPTION 'cinturon_hc: el CHECK no admite el tipo nuevo';
  END IF;
END $cint$;
