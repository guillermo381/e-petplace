-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · ORDEN 5 ① — LA HUELLA MIDE LO NUEVO, NO LO NO-LEÍDO (letra founder,
-- 6-ago-2026)
--
-- LA LETRA: la campana registra la ÚLTIMA VISITA de la persona; la huella del
-- techo deja de preguntar «¿hay algo sin leer?» y pregunta «¿hay algo
-- POSTERIOR a tu última visita?». Entrar a /avisos deposita la visita. El
-- estado leído POR AVISO no cambia — `marcar_aviso_leido` y su ley («no
-- existe marcar todos») quedan intactos.
--
-- EL ASIENTO: `notificacion_campana_visita` — una fila por persona, la fecha
-- de su última visita. Sin RLS por policies A PROPÓSITO: la tabla no se toca
-- por PostgREST (REVOKE total); las DOS RPCs DEFINER son la única puerta.
--
-- `hay_avisos_sin_leer` NO SE TOCA NI SE DROPEA (D-662: los bundles
-- publicados HOY la llaman — matarla acoplaría esta migración al próximo
-- publish). Queda DEPRECADA VIVA: muere cuando ningún bundle servido la
-- consulte (la premisa P5 del censo es exactamente el instrumento que lo va
-- a decir).
--
-- 76(g): NO RIGE — DDL nuevo, cero backfill (la primera visita de cada
--   persona nace cuando entre a /avisos; hasta entonces TODO es novedad,
--   que es la verdad).
-- D-662: cero contrato tocado; los bundles viejos siguen llamando la RPC
--   vieja, que sigue viva.
-- L-140: las dos funciones nuevas nacen con REVOKE PUBLIC/anon + GRANT
--   authenticated, y la verificación de proacl va en el cinturón.
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-huella-novedades.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.notificacion_campana_visita (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  visitada_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacion_campana_visita ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notificacion_campana_visita FROM PUBLIC, anon, authenticated;

-- ── La visita se deposita al ENTRAR a /avisos ───────────────────────────────
CREATE FUNCTION public.registrar_visita_campana()
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
  INSERT INTO notificacion_campana_visita (user_id, visitada_en)
  VALUES (v_uid, v_en)
  ON CONFLICT (user_id) DO UPDATE SET visitada_en = EXCLUDED.visitada_en;
  RETURN jsonb_build_object('ok', true, 'visitada_en', v_en);
END;
$function$;

-- ── ¿Hay algo NUEVO desde tu última visita? ─────────────────────────────────
-- El predicado de visibilidad ESPEJA al lector de la campana (S88: sin filtro
-- de canal, despacho='para_transporte') — lo que no se ve, no es novedad.
-- SIN filtro de `leida` A PROPÓSITO: leer un aviso no lo hace menos nuevo;
-- lo que apaga la huella es HABER VISITADO la campana (la letra).
-- Sin visita registrada: TODO lo visible es novedad ('-infinity').
CREATE FUNCTION public.hay_novedades()
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
          WHERE v.user_id = auth.uid()),
        '-infinity'::timestamptz)
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_visita_campana() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hay_novedades() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_visita_campana() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hay_novedades() TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_fn text; v_acl aclitem[];
BEGIN
  -- L-140 en las dos funciones nuevas
  FOREACH v_fn IN ARRAY ARRAY['registrar_visita_campana','hay_novedades'] LOOP
    SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=v_fn;
    IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl,'{}'::aclitem[])) a
               WHERE a::text LIKE 'anon=%' OR a::text LIKE '=%') THEN
      RAISE EXCEPTION 'cinturon_huella: % quedó ejecutable por anon/PUBLIC (L-140)', v_fn;
    END IF;
  END LOOP;
  -- la vieja sigue viva (los bundles publicados la llaman)
  IF to_regprocedure('public.hay_avisos_sin_leer()') IS NULL THEN
    RAISE EXCEPTION 'cinturon_huella: hay_avisos_sin_leer murió — los bundles publicados la llaman (D-662)';
  END IF;
  -- la tabla no se toca por PostgREST
  IF has_table_privilege('authenticated', 'public.notificacion_campana_visita', 'SELECT') THEN
    RAISE EXCEPTION 'cinturon_huella: la tabla de visitas quedó legible por PostgREST';
  END IF;
END $cint$;
