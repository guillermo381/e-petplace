-- ═════════════════════════════════════════════════════════════════════
-- S79-A · A3 — EL REMATE DE DOCUMENTOS (remate, no letra: el chasis
-- existe — medido en docs/relevamientos/2026-07-27-s79a-lecturas.md A5/A6).
--
-- Piezas (molde D-310, puntos 1 y 5 + el lado admin que faltaba):
--   1. allowed_mime_types en el bucket prestador-documentos (era NULL —
--      el único privado sin resistencia de mime; jpeg/png/webp/heic/pdf,
--      espejo de grooming-archivos + el pdf que las filas vivas ya usan).
--   2. CHECK path-no-URL en prestador_documentos.archivo_url (las 7
--      filas vivas SON paths — verificado adentro ANTES del ADD; el
--      CHECK garantiza que siga así: una URL firmada persistida es algo
--      vencido, molde 20260708233000).
--   3. RPC revisar_documento_prestador(doc, veredicto, notas) gateada
--      por is_admin() — el lado ADMIN del proceso §14.2 que el monorepo
--      no tenía (los veredictos vivos salieron del portal legado, hoy
--      NO desplegado — enmienda D-471 S79). SIN pantalla: 15 documentos,
--      una vez cada uno. El founder ES admin (censo A0: admin_users).
--   4. Higiene D-342: muere pd_own (duplicada byte-a-byte de
--      prestador_documentos_own en su USING; la que queda tiene además
--      WITH CHECK explícito).
--
-- Lo que NO hace, a propósito: el motor de vencimientos (fecha_
-- vencimiento 7/7 NULL, 'vencido' sin productor) queda como PROPUESTA
-- en LETRA_PERFIL_S79 §7 — espera gate del founder.
--
-- LA LEY DECLARADA (LETRA_PERFIL_S79 §6): el gate de oferta médica es
-- la CREDENCIAL DE LA PERSONA (titulo_profesional / registro_senescyt
-- — el trigger vivo ya lo dice); el permiso del ESTABLECIMIENTO se
-- RECOLECTA, no bloquea. Esta migración no toca ese trigger.
--
-- 76(g), DECLARADA: NO RIGE — DDL + una lectura de VALIDACIÓN sobre
-- las 7 filas vivas (el guard pre-CHECK); cero backfill, cero anclas
-- computadas, cero filas escritas.
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s79a-REVERSA-remate-documentos.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) resistencia de mime server-side (molde D-310 punto 1) ─────────
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
 WHERE id = 'prestador-documentos';

-- ── 2) CHECK path-no-URL (molde D-310 punto 5) ───────────────────────
DO $$
DECLARE v_urls int;
BEGIN
  SELECT count(*) INTO v_urls
  FROM public.prestador_documentos
  WHERE archivo_url ~* '^https?://';
  IF v_urls > 0 THEN
    RAISE EXCEPTION 'pre-CHECK: % filas de prestador_documentos guardan URL, no path — migrar datos antes del CHECK', v_urls;
  END IF;
END $$;

ALTER TABLE public.prestador_documentos
  ADD CONSTRAINT prestador_documentos_archivo_es_path
  CHECK (archivo_url !~* '^https?://');

-- ── 3) el veredicto del admin ────────────────────────────────────────
CREATE FUNCTION public.revisar_documento_prestador(
  p_documento_id uuid,
  p_veredicto text,
  p_notas text DEFAULT NULL
)
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
$function$;

-- L-140 de nacimiento: anon/PUBLIC afuera, authenticated adentro (el
-- gate real es is_admin() en el body).
REVOKE EXECUTE ON FUNCTION public.revisar_documento_prestador(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revisar_documento_prestador(uuid, text, text) TO authenticated;

-- ── 4) higiene D-342: muere la policy duplicada ──────────────────────
DROP POLICY "pd_own" ON public.prestador_documentos;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE
  v_mime text[];
  v_check int;
  v_policies int;
  v_anon int;
BEGIN
  SELECT allowed_mime_types INTO v_mime FROM storage.buckets WHERE id = 'prestador-documentos';
  IF v_mime IS NULL OR array_length(v_mime, 1) <> 5 THEN
    RAISE EXCEPTION 'verificacion A3: mime types no quedaron (%)', v_mime;
  END IF;

  SELECT count(*) INTO v_check FROM pg_constraint
  WHERE conrelid = 'public.prestador_documentos'::regclass
    AND conname = 'prestador_documentos_archivo_es_path';
  IF v_check <> 1 THEN
    RAISE EXCEPTION 'verificacion A3: el CHECK de path no existe';
  END IF;

  SELECT count(*) INTO v_policies FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'prestador_documentos';
  IF v_policies <> 1 THEN
    RAISE EXCEPTION 'verificacion A3 (D-342): quedaron % policies, se esperaba 1', v_policies;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname = 'public' AND p.proname = 'revisar_documento_prestador'
    AND r.rolname = 'anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion A3 (L-140): anon con % grants en revisar_documento_prestador', v_anon;
  END IF;
END $$;

commit;
