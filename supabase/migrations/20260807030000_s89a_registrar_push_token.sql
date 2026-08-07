-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · EL TREN DE PUSH — LA PUERTA DEL TOKEN
--
-- `push_tokens` EXISTE desde S81 (relevada con 0 filas) con su RLS `pt_own`.
-- Lo que faltaba era la PUERTA: una RPC idempotente que el aparato llama al
-- conceder el permiso. Idempotente por (user_id, token): un mismo aparato
-- que re-arranca no acumula filas — refresca `last_used_at` y reactiva.
--
-- POR QUÉ RPC Y NO UN INSERT POR RLS: el token es del APARATO, no del
-- formulario. Una puerta única deja el upsert en UN lugar y el día que haya
-- que limpiar tokens muertos, hay dónde hacerlo.
--
-- 76(g): NO RIGE — función nueva, cero backfill.
-- L-140: REVOKE + GRANT explícitos, verificados en el cinturón.
-- REVERSA: docs/relevamientos/2026-08-07-s89a-REVERSA-registrar-push-token.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.registrar_push_token(p_token text, p_plataforma text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(btrim(p_token), '') = '' THEN
    RAISE EXCEPTION 'token_vacio' USING ERRCODE = '22023';
  END IF;
  IF p_plataforma NOT IN ('android', 'ios') THEN
    RAISE EXCEPTION 'plataforma_invalida' USING ERRCODE = '22023';
  END IF;

  -- El MISMO token puede cambiar de dueño (un teléfono prestado, una cuenta
  -- nueva en el mismo aparato): se reasigna, jamás se duplica.
  UPDATE push_tokens
     SET user_id = v_uid, plataforma = p_plataforma, activo = true, last_used_at = now()
   WHERE token = p_token;
  IF NOT FOUND THEN
    INSERT INTO push_tokens (user_id, token, plataforma, activo, last_used_at)
    VALUES (v_uid, p_token, p_plataforma, true, now());
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_push_token(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_push_token(text, text) TO authenticated;

DO $cint$
DECLARE v_acl aclitem[];
BEGIN
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='registrar_push_token';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_push_token: ejecutable por anon/PUBLIC (L-140)';
  END IF;
END $cint$;
