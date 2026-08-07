-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 8 ⑤ — EL ARRANQUE REAL DE DOCUMENTOS: el token quemable
--
-- El motor de generación vive en la Edge Function `documento-carnet` (PDF
-- compuesto server-side). Esta migración pone LA PUERTA: el aparato pide un
-- token de un solo uso (10 minutos) por RPC autenticada con el gate de
-- acceso a la mascota, y abre la URL del documento con ese token — el JWT
-- jamás viaja en una URL. La función valida y QUEMA el token (service role);
-- la tabla es ilegible por PostgREST.
--
-- v1: tipo único `carnet_vacunas`. Historia clínica y certificados heredan
-- el molde (mismo asiento, otro tipo) — C §4 preguntas 2/4/5/7 son de ESOS
-- papeles y no frenan éste.
--
-- 76(g): NO RIGE — DDL nuevo, cero backfill.
-- L-140: REVOKE + GRANT explícitos, cinturón con proacl.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-documento-token.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.documento_token (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  tipo       text NOT NULL CHECK (tipo IN ('carnet_vacunas')),
  expira_en  timestamptz NOT NULL,
  usado_en   timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documento_token ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.documento_token FROM PUBLIC, anon, authenticated;

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
  IF p_tipo IS DISTINCT FROM 'carnet_vacunas' THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;
  -- la misma puerta que el resto del expediente
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

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_acl aclitem[];
BEGIN
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='emitir_token_documento';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_doc_token: la RPC quedó ejecutable por anon/PUBLIC (L-140)';
  END IF;
  IF has_table_privilege('authenticated', 'public.documento_token', 'SELECT') THEN
    RAISE EXCEPTION 'cinturon_doc_token: la tabla de tokens quedó legible por PostgREST';
  END IF;
END $cint$;
