-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · EL ALTA DEL VENDEDOR PURO SE PUEDE COMPLETAR (13/14-ago-2026)
--
-- El hueco medido por C, con la firma de mesa que ordena la forma
-- (la configuración cuelga de la CUENTA COMERCIAL, jamás fila fantasma en
-- `prestadores`):
--   ① documentos exigía prestador → nace `cuenta_comercial_documentos`,
--     espejo de `prestador_documentos`, colgada de la cuenta.
--   ② el nombre se fijaba en el alta y no se editaba → nace
--     `actualizar_nombre_cuenta_comercial` (owner o admin).
--   ③ el perfil público del vendedor NO nace acá — v1 no lo exige
--     (§2.1: la pantalla de configuración ES su expediente cuando el
--     equipo lo revisa); queda declarado, no escondido.
--
-- Espejos MEDIDOS (no calcados de memoria): la puerta de revisión copia el
-- contrato de `revisar_documento_prestador` (veredictos aprobado|rechazado;
-- 'vencido' es del motor, 'pendiente' no existe como veredicto) · el bucket
-- copia `prestador-documentos` (PRIVADO, 5MB, mimes de documento) pero la
-- carpeta se llavea por CUENTA con el predicado del OPERADOR
-- (`_user_opera_cuenta_comercial`), no por auth.uid — una cuenta puede
-- tener más de un operador.
--
-- 76(g): NO RIGE — aditiva. Bundles vivos (D-662): tabla y puertas nuevas,
-- cero lectores vivos. REVERSA ANTES:
-- scripts/s97/2026-08-13-s97a-alta-puro-REVERSA.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① los documentos de la cuenta ──────────────────────────────────────────
CREATE TABLE public.cuenta_comercial_documentos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE CASCADE,
  tipo                text NOT NULL CHECK (tipo IN ('cedula','ruc','permiso_funcionamiento')),
  nombre              text NOT NULL,
  archivo_url         text NOT NULL CHECK (archivo_url !~* '^https?://'),
  fecha_emision       date,
  fecha_vencimiento   date,
  estado              text NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','aprobado','rechazado','vencido')),
  revisado_por        uuid REFERENCES auth.users(id),
  revisado_en         timestamptz,
  notas_revision      text,
  pais_emisor         text CHECK (pais_emisor IS NULL OR pais_emisor ~ '^[A-Z]{2}$'),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ccdoc_cuenta ON public.cuenta_comercial_documentos (cuenta_comercial_id);

ALTER TABLE public.cuenta_comercial_documentos ENABLE ROW LEVEL SECURITY;
-- el operador de la cuenta VE y SUBE los suyos; el veredicto es solo de la
-- puerta admin (DEFINER) — cero policy de UPDATE/DELETE para authenticated.
CREATE POLICY ccdoc_operador_select ON public.cuenta_comercial_documentos
  FOR SELECT TO authenticated
  USING (public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid()) OR is_admin());
CREATE POLICY ccdoc_operador_insert ON public.cuenta_comercial_documentos
  FOR INSERT TO authenticated
  WITH CHECK (public._user_opera_cuenta_comercial(cuenta_comercial_id, auth.uid()));

-- ── el bucket, privado y llaveado por cuenta ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cuenta-documentos', 'cuenta-documentos', false, 5242880,
        ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY cuenta_documentos_operador ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'cuenta-documentos'
         AND public._user_opera_cuenta_comercial(((storage.foldername(name))[1])::uuid, auth.uid()))
  WITH CHECK (bucket_id = 'cuenta-documentos'
         AND public._user_opera_cuenta_comercial(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY admin_lee_documentos_cuentas ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cuenta-documentos' AND is_admin());

-- ── la puerta de revisión (espejo del contrato del prestador) ──────────────
CREATE FUNCTION public.revisar_documento_cuenta(p_documento_id uuid, p_veredicto text, p_notas text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_auth uuid := auth.uid(); v_estado text;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT is_admin() THEN RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501'; END IF;
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('aprobado','rechazado') THEN
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;
  UPDATE public.cuenta_comercial_documentos
     SET estado = p_veredicto, revisado_por = v_auth, revisado_en = now(),
         notas_revision = NULLIF(trim(p_notas), '')
   WHERE id = p_documento_id
  RETURNING estado INTO v_estado;
  IF NOT FOUND THEN RAISE EXCEPTION 'documento_no_encontrado' USING ERRCODE = '22023'; END IF;
  RETURN jsonb_build_object('ok', true, 'documento_id', p_documento_id, 'estado', v_estado);
END $$;

-- ── ② el nombre se corrige (owner o admin) ─────────────────────────────────
CREATE FUNCTION public.actualizar_nombre_cuenta_comercial(p_cuenta_comercial_id uuid, p_nombre_comercial text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_auth uuid := auth.uid(); v_nombre text := NULLIF(btrim(COALESCE(p_nombre_comercial,'')),'');
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF v_nombre IS NULL THEN RAISE EXCEPTION 'nombre_requerido' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cuentas_comerciales
                  WHERE id = p_cuenta_comercial_id AND owner_profile_id = v_auth)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_el_titular_corrige_el_nombre' USING ERRCODE = '42501';
  END IF;
  UPDATE cuentas_comerciales
     SET nombre_comercial = v_nombre, updated_at = now()
   WHERE id = p_cuenta_comercial_id;
  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'nombre_comercial', v_nombre);
END $$;

-- L-140 en las dos puertas.
REVOKE EXECUTE ON FUNCTION public.revisar_documento_cuenta(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.revisar_documento_cuenta(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.actualizar_nombre_cuenta_comercial(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.actualizar_nombre_cuenta_comercial(uuid, text) TO authenticated;

-- ── Cinturón + fixture con discriminador (residuo 0) ──────────────────────
DO $$
DECLARE
  v_admin uuid; v_ddes uuid := '51c4b19f-ff8f-46b1-bb24-e2708a7eda18';
  v_cc uuid; v_doc uuid; v_nombre_orig text; v_r jsonb; n int;
BEGIN
  IF has_function_privilege('anon','public.revisar_documento_cuenta(uuid, text, text)','EXECUTE')
     OR has_function_privilege('anon','public.actualizar_nombre_cuenta_comercial(uuid, text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: puerta abierta a anon (L-140)';
  END IF;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT id, nombre_comercial INTO v_cc, v_nombre_orig FROM cuentas_comerciales
   WHERE owner_profile_id = v_ddes;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'CINTURON: falta la cuenta de duenodes'; END IF;

  -- duenodes SUBE su RUC por la policy (ROLE authenticated + claims)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ddes, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO cuenta_comercial_documentos (cuenta_comercial_id, tipo, nombre, archivo_url, pais_emisor)
  VALUES (v_cc, 'ruc', 'RUC de prueba S97', v_cc || '/ruc-prueba.pdf', 'EC')
  RETURNING id INTO v_doc;
  SET LOCAL ROLE postgres;

  -- el admin lo revisa por la puerta (como llama la app: ROLE authenticated)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  v_r := revisar_documento_cuenta(v_doc, 'aprobado', 'fixture S97');
  IF (v_r->>'estado') <> 'aprobado' THEN RAISE EXCEPTION 'CINTURON: veredicto no aplico'; END IF;

  -- duenodes corrige su nombre; un tercero REBOTA
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ddes, 'role','authenticated')::text, true);
  PERFORM actualizar_nombre_cuenta_comercial(v_cc, 'Despensa S97 corregida (fixture)');
  SELECT count(*) INTO n FROM cuentas_comerciales WHERE id=v_cc AND nombre_comercial='Despensa S97 corregida (fixture)';
  IF n <> 1 THEN RAISE EXCEPTION 'CINTURON: el nombre no se corrigio'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', 'dd024680-3d1c-4465-b38b-dedab45da037', 'role','authenticated')::text, true);
  BEGIN
    PERFORM actualizar_nombre_cuenta_comercial(v_cc, 'pirata');
    RAISE EXCEPTION 'CINTURON: un tercero pudo renombrar';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- residuo 0: el fixture se deshace
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ddes, 'role','authenticated')::text, true);
  PERFORM actualizar_nombre_cuenta_comercial(v_cc, v_nombre_orig);
  SET LOCAL ROLE postgres;
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM cuenta_comercial_documentos WHERE id = v_doc;
  RAISE NOTICE 'CINTURON ALTA PURO: subir OK · revisar OK · renombrar OK · tercero rebota · residuo 0';
END $$;

COMMIT;
