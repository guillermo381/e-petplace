-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · PASO 5 — `v_ranking_usuarios` FUERA DE `anon`
--
-- Autoría del cuerpo: **S102-B** (`…-s102b-CURA-2-ranking-fuera-de-anon.sql`).
-- **A numera y aplica** — `L-331`: el número se asigna al DEPOSITAR.
-- **La reversa está escrita ANTES y vive en el archivo de origen, bloque ①.**
--
-- 🔓 **DESBLOQUEADA POR CENSO, no por decisión.** La tanda la dejó
-- `⏸ BLOQUEADA — 🔒 el censo de los 5 repos`. El censo se corrió el 22-ago
-- (`docs/loop/S103-A.md` §⑥) y salió VERDE:
--   · consumidores reales: **2**, los dos en `e-petplace-admin`
--     (`Gamificacion.tsx:414` · `Dashboard.tsx:133`) · **0** en los otros siete
--     repos, con control positivo (20 líneas de `from('profiles')` en el mismo).
--   · el admin crea el cliente con la anon key **pero entra por
--     `signInWithPassword`** ⇒ sus consultas corren como `authenticated`.
--   · `authenticated` **conserva SELECT**; esta migración revoca `anon` y
--     `PUBLIC` únicamente.
-- 🔴 **Residuo declarado: no se corrió la app.** Si alguna de esas dos pantallas
-- fuera alcanzable ANTES del login, esa carga saldría como `anon` y rompería.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Guard de estado: se firmó sobre lo que se midió ────────────────────────
DO $guard$
BEGIN
  IF to_regclass('public.v_ranking_usuarios') IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la vista no existe. Releer antes de tocar.';
  END IF;
  IF NOT has_table_privilege('anon','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon YA no tiene SELECT. Alguien lo curó antes — no re-aplicar a ciegas.';
  END IF;
END $guard$;

-- ── El REVOKE ──────────────────────────────────────────────────────────────
-- Se revoca TODO, no solo SELECT: la ACL medida daba `arwdDxtm` a anon.
-- (Los de escritura son inertes —la vista no es actualizable— pero un grant
--  inerte que nadie decidió es exactamente lo que S92 vino a barrer.)
REVOKE ALL ON public.v_ranking_usuarios FROM anon;

-- 🔴 L-216 — LA MITAD QUE SE OLVIDA: un REVOKE a `anon` que deja `PUBLIC`
--    intacto NO CIERRA NADA, porque todo rol hereda de PUBLIC.
--    **Medido acá: la ACL de esta vista NO tiene entrada PUBLIC** ⇒ la trampa
--    no aplica en este caso. Se revoca igual por si el default privilege la
--    repone, y el cinturón lo verifica por `has_table_privilege`, JAMÁS
--    parseando `relacl` (el error ② de S91 abortó una migración de seguridad
--    por leer la ACL con LIKE).
REVOKE ALL ON public.v_ranking_usuarios FROM PUBLIC;

-- ── CINTURÓN, con DISCRIMINADOR ────────────────────────────────────────────
DO $cinturon$
BEGIN
  IF has_table_privilege('anon','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon TODAVÍA puede leer la vista.';
  END IF;

  -- EL DISCRIMINADOR: probar que no rompimos a quien SÍ debe leerla.
  -- Sin este brazo, un `REVOKE ... FROM authenticated` accidental daría verde.
  IF NOT has_table_privilege('authenticated','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: se cerró de más — authenticated perdió el SELECT.';
  END IF;
  IF NOT has_table_privilege('service_role','public.v_ranking_usuarios','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: se cerró de más — service_role perdió el SELECT.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — anon: SIN acceso · authenticated y service_role: INTACTOS';
END $cinturon$;

COMMIT;
