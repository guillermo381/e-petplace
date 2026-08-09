-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-703 — `email_exists`: SE CIERRA EL ORÁCULO DE ENUMERACIÓN
--
-- **Decisión del founder, firmada el 9-ago-2026:** *«REVOCAR. Nada está
-- desplegado públicamente con checkout; las webs legacy están al aire pero sin
-- uso. Si el revoke le rompe algo a una página sin visitas, es costo aceptado y
-- firmado.»*
--
-- Esta función era la única de las 59 de D-701 que S92 había frenado. Sale del
-- freno por decisión, no por descubrimiento.
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** DCL puro (un REVOKE de EXECUTE): sin DDL de estructura, sin
-- backfill, y el cinturón lee catálogo — no ancla ninguna fila viva.
--
-- ── ROJO PRODUCIDO (9-ago-2026, camino real como `anon`) ─────────────────
--   email_exists('<correo real del founder>')       → 200 `true`
--   email_exists('no-existe-jamas-s92@example.com') → 200 `false`
-- **DISCRIMINA**, que es la definición de un oráculo de enumeración de cuentas.
-- Y la anon key viaja en el bundle de las dos apps.
-- Choca además contra letra firmada en S84: *«NUNCA se declara si un correo
-- existe»* — el mismo mensaje exista o no.
--
-- ── CENSO DE IMPACTO (L-215 · `scripts/s92/censo-impacto.mjs`) ───────────
--   · policies que la llaman ......... 0
--   · triggers ....................... 0
--   · otras funciones ................ 0
--   · consumidores en el monorepo .... 0 REALES
--     (los 2 hits son FALSOS POSITIVOS y quedan dichos para que nadie los
--      vuelva a contar: `database.types.ts` es generado, y
--      `packages/api/src/wrappers/auth.ts:40` usa la cadena `email_exists`
--      como **código de error de auth-js**, no como RPC.)
--
-- ── EL ÚNICO CONSUMIDOR REAL DE TODA LA CASA, con nombre y línea ─────────
-- Censados los cinco repos que comparten esta DB (regla 69), buscando la
-- invocación `rpc('email_exists')` y separándola de docs y tipos:
--
--   **`e-petplace-v2/src/pages/Checkout.tsx:214`**
--   `const { data: existe } = await supabase.rpc('email_exists', { check_email: normalizedEmail });`
--
-- (+ su mención en `e-petplace-v2/CONTEXT.md:575`, que es documentación.)
-- **CERO invocaciones** en `e-petplace-prestadores`, `e-petplace-admin` y
-- `e-petplace-sistema-pruebas` — ahí solo aparece en `database.types.ts`.
--
-- ⇒ **El costo, nombrado: si ese checkout volviera a usarse, su detección de
-- «email ya registrado» dejaría de funcionar.** El founder lo aceptó por
-- escrito. `authenticated` conserva EXECUTE, así que un flujo con sesión sigue
-- pudiendo consultarla.
--
-- Reversa: `docs/relevamientos/2026-08-09-s92a-REVERSA-tanda6-email-exists.sql`
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- `anon` Y `PUBLIC` juntos — L-216: todo rol hereda de PUBLIC, así que un
-- REVOKE que dejara PUBLIC intacto no cerraría nada. El ACL de esta función
-- tenía literalmente `=X/postgres`, que ES la entrada de PUBLIC.
REVOKE EXECUTE ON FUNCTION public.email_exists(text) FROM anon, PUBLIC;

-- la audiencia que queda, ESCRITA (D-701: una audiencia heredada no es una decisión)
GRANT EXECUTE ON FUNCTION public.email_exists(text) TO authenticated;

COMMENT ON FUNCTION public.email_exists(text) IS
  'S92/D-703: cerrada a anon y PUBLIC por decisión del founder (9-ago-2026). Era un oráculo de enumeración de cuentas: devolvía true/false según el correo existiera, con la anon key que viaja en el bundle. Único consumidor medido: e-petplace-v2/src/pages/Checkout.tsx:214 (sin uso; costo aceptado). authenticated conserva EXECUTE.';

DO $cinturon$
DECLARE v_anon boolean; v_auth boolean;
BEGIN
  SELECT has_function_privilege('anon', 'public.email_exists(text)', 'EXECUTE') INTO v_anon;
  SELECT has_function_privilege('authenticated', 'public.email_exists(text)', 'EXECUTE') INTO v_auth;

  -- (a) cerrada de verdad para anon — por has_function_privilege, que cuenta la
  --     herencia de PUBLIC (L-216); mirar `proacl` a ojo no habría alcanzado.
  IF v_anon THEN
    RAISE EXCEPTION 'CINTURÓN (a): anon todavia puede ejecutar email_exists';
  END IF;

  -- (b) el lado sano: un autenticado sigue pudiendo
  IF NOT v_auth THEN
    RAISE EXCEPTION 'CINTURÓN (b): authenticated quedo sin EXECUTE — se cerro de mas';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — email_exists cerrada a anon/PUBLIC, viva para authenticated';
END
$cinturon$;

COMMIT;
