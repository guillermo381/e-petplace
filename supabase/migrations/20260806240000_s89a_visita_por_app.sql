-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 6 ② — LA VISITA ES POR USUARIO **Y APP** (el contrato que C
-- y D consumen — su freno, medido dos veces, muere acá)
--
-- POR QUÉ LA DIMENSIÓN: las dos apps tienen campana y una misma persona puede
-- operar en las dos. Visitar la campana del CLIENTE no puede apagar la huella
-- del PRESTADOR — cada casa tiene su propia «última visita». La letra founder
-- de la huella (mide lo nuevo, leído por aviso NO cambia) queda intacta; solo
-- gana el eje.
--
-- El asiento estaba en 0 filas (medido antes de tocar — nadie lo consumía
-- todavía): el re-dimensionado es DDL puro sin colapso de datos.
-- L-119: las firmas cambian (0-arg → p_app) ⇒ DROP EXPLÍCITO de las viejas —
-- sin él quedarían sobrecargas zombis. Cero callers vivos de las 0-arg
-- (medido: los wrappers de packages/api aún no tienen consumidor en apps).
--
-- 76(g): NO RIGE — DDL sobre tabla vacía, cero backfill.
-- D-662: cero bundle llama estas RPCs todavía (nacieron hoy).
-- L-140: REVOKE + GRANT explícitos, verificados en el cinturón.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-visita-por-app.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Las firmas viejas mueren explícitas (L-119)
DROP FUNCTION public.hay_novedades();
DROP FUNCTION public.registrar_visita_campana();

-- El asiento gana el eje app
ALTER TABLE public.notificacion_campana_visita
  DROP CONSTRAINT notificacion_campana_visita_pkey,
  ADD COLUMN app text NOT NULL DEFAULT 'cliente',
  ADD CONSTRAINT chk_visita_app CHECK (app IN ('cliente', 'prestador')),
  ADD PRIMARY KEY (user_id, app);
ALTER TABLE public.notificacion_campana_visita ALTER COLUMN app DROP DEFAULT;

CREATE FUNCTION public.registrar_visita_campana(p_app text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_en  timestamptz := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_app IS NULL OR p_app NOT IN ('cliente', 'prestador') THEN
    RAISE EXCEPTION 'app_invalida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO notificacion_campana_visita (user_id, app, visitada_en)
  VALUES (v_uid, p_app, v_en)
  ON CONFLICT (user_id, app) DO UPDATE SET visitada_en = EXCLUDED.visitada_en;
  RETURN jsonb_build_object('ok', true, 'app', p_app, 'visitada_en', v_en);
END;
$function$;

CREATE FUNCTION public.hay_novedades(p_app text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM notificacion_intencion i
    WHERE i.destinatario_user_id = auth.uid()
      AND i.resuelto_como->>'despacho' = 'para_transporte'
      AND i.created_at > COALESCE(
        (SELECT v.visitada_en FROM notificacion_campana_visita v
          WHERE v.user_id = auth.uid() AND v.app = p_app),
        '-infinity'::timestamptz)
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_visita_campana(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hay_novedades(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_visita_campana(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hay_novedades(text) TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_fn text; v_acl aclitem[]; v_n int;
BEGIN
  -- las 0-arg murieron de verdad (L-119: cero sobrecargas zombis)
  IF to_regprocedure('public.hay_novedades()') IS NOT NULL
     OR to_regprocedure('public.registrar_visita_campana()') IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon_visita_app: la firma vieja sigue viva (sobrecarga zombi)';
  END IF;
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('hay_novedades','registrar_visita_campana');
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'cinturon_visita_app: sobrecargas=% (esperaba 2)', v_n;
  END IF;
  -- L-140 en las nuevas
  FOREACH v_fn IN ARRAY ARRAY['registrar_visita_campana','hay_novedades'] LOOP
    SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_fn;
    IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
               WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
      RAISE EXCEPTION 'cinturon_visita_app: % ejecutable por anon/PUBLIC (L-140)', v_fn;
    END IF;
  END LOOP;
  -- la tabla sigue sellada a PostgREST
  IF has_table_privilege('authenticated', 'public.notificacion_campana_visita', 'SELECT') THEN
    RAISE EXCEPTION 'cinturon_visita_app: la tabla quedó legible por PostgREST';
  END IF;
END $cint$;
