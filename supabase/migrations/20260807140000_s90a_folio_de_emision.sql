-- ═══════════════════════════════════════════════════════════════════════════
-- S90-A · ORDEN 9 ② — EL FOLIO DE EMISIÓN, fase 1 (sin QR)
--
-- LO FIRMADO: folio único en MONO en LOS CINCO papeles, que NACE CON el
-- papel — un papel emitido sin folio no se puede folear retroactivamente sin
-- mentir la fecha. SIN QR todavía: el QR espera la landing de epetplace.com
-- (fase 2, y solo en certificado · receta · carnet — jamás en ficha ni en
-- historia clínica). Hasta entonces cada papel sigue declarando que no hay
-- mecanismo público de verificación.
--
-- LA FORMA: el folio es de la EMISIÓN — vive en `documento_token`, que ES el
-- asiento de cada impresión (uno por papel servido, quemado al usarse). Lo
-- asigna la RPC al nacer el token: secuencia global + año de emisión,
-- `F-2026-000123`. Una reimpresión es OTRA emisión y gana OTRO folio — dos
-- papeles en dos mostradores nunca comparten número.
--
-- 76(g) VEDA: NO RIGE — columna nueva + secuencia + CREATE OR REPLACE, cero
--   backfill (los 9 tokens históricos quedan con folio NULL: emisiones
--   anteriores al folio, y decir NULL es la verdad).
-- D-662: misma firma de RPC; el retorno agrega `folio` (aditivo).
-- L-140: CREATE OR REPLACE conserva proacl; la secuencia no es ejecutable
--   por PostgREST (cero grants nuevos).
-- REVERSA: docs/relevamientos/2026-08-07-s90a-REVERSA-folio.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE public.documento_folio_seq;
REVOKE ALL ON SEQUENCE public.documento_folio_seq FROM PUBLIC, anon, authenticated;

ALTER TABLE public.documento_token ADD COLUMN folio text UNIQUE;
COMMENT ON COLUMN public.documento_token.folio IS
  'S90-A orden 9: el folio de ESTA emisión (F-YYYY-NNNNNN, mono en el papel). NULL solo en emisiones anteriores al folio. Una reimpresión gana otro folio.';

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
  v_folio text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT codigo, funcion_edge, requiere_ref INTO v_cat
  FROM cat_documentos_mascota
  WHERE codigo = p_tipo AND activo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'tipo_documento_invalido' USING ERRCODE = '22023';
  END IF;

  -- la misma puerta que el resto del expediente: el papel no ensancha permisos
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

  -- EL FOLIO NACE CON EL PAPEL (orden 9): secuencia global + año de emisión.
  v_folio := 'F-' || to_char(now() AT TIME ZONE 'America/Guayaquil', 'YYYY')
             || '-' || lpad(nextval('public.documento_folio_seq')::text, 6, '0');

  INSERT INTO documento_token (user_id, mascota_id, tipo, ref_id, folio, expira_en)
  VALUES (v_uid, p_mascota_id, v_cat.codigo, p_ref, v_folio, now() + interval '10 minutes')
  RETURNING id INTO v_token;

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'tipo', v_cat.codigo,
    'funcion', v_cat.funcion_edge,
    'folio', v_folio
  );
END;
$function$;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_src text; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_folio: % firmas de la RPC (L-119)', v_n;
  END IF;
  SELECT p.prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'emitir_token_documento';
  IF v_src NOT LIKE '%documento_folio_seq%' THEN
    RAISE EXCEPTION 'cinturon_folio: la RPC no asigna folio';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documento_token' AND column_name='folio') THEN
    RAISE EXCEPTION 'cinturon_folio: la columna no existe';
  END IF;
  IF has_table_privilege('authenticated', 'public.documento_token', 'SELECT') THEN
    RAISE EXCEPTION 'cinturon_folio: la tabla de tokens quedo legible por PostgREST';
  END IF;
END $cint$;
