-- ═════════════════════════════════════════════════════════════════════
-- S79-A · A0 — v_prestadores_publicos: security_invoker + anon afuera.
--
-- Hallazgo lateral 1 de la Tanda 1 (docs/relevamientos/
-- 2026-07-27-s79a-lecturas.md): la vista corría con semántica de OWNER
-- (reloptions NULL → bypassea la RLS de prestadores) y con ACL TOTAL
-- para anon (anon=arwdDxtm, herencia v2): un anónimo leía user_id,
-- lat/lon, ciudad/sector y precios de todos los prestadores activos —
-- exactamente las columnas que este arco (S79 geo) va a poblar con
-- datos reales. Familia L-140/D-390.
--
-- Decisión de mesa S79 (mandato Tanda 2, A0):
--   · security_invoker = on  → la vista pasa a evaluar la RLS del que
--     consulta. Para authenticated NADA cambia en la práctica: la
--     policy prestadores_public (estado='activo' OR own OR admin) deja
--     pasar lo mismo que el WHERE estado='activo' de la vista.
--   · REVOKE ALL a anon      → el anónimo queda afuera.
--   · NO se dropea: el founder conserva los fuentes del portal legado
--     (la vista es herencia v2 con CERO consumidores en el monorepo y
--     CERO funciones DB que la nombren — medido Tanda 1).
--
-- 76(g): NO RIGE — DDL puro sobre una vista; cero backfill, cero
-- anclas computadas sobre datos vivos, cero filas tocadas.
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s79a-REVERSA-v-publicos.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

ALTER VIEW public.v_prestadores_publicos SET (security_invoker = on);
REVOKE ALL ON public.v_prestadores_publicos FROM anon;

-- ── Verificación imperativa (la migración se aborta sola si no quedó) ──
DO $$
DECLARE
  v_opts text[];
  v_anon int;
BEGIN
  SELECT c.reloptions INTO v_opts
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'v_prestadores_publicos';

  IF v_opts IS NULL OR NOT ('security_invoker=on' = ANY (v_opts)) THEN
    RAISE EXCEPTION 'verificacion A0: security_invoker no quedo on (reloptions=%)', v_opts;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
  LATERAL aclexplode(c.relacl) a
  JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname = 'public' AND c.relname = 'v_prestadores_publicos'
    AND r.rolname = 'anon';

  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion A0: anon conserva % grants sobre la vista', v_anon;
  END IF;
END $$;

commit;
