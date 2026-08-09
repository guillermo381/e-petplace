-- REVERSA de `20260808140000_s91a_cierra_oraculo_debug.sql`
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ NOTA: revertir REABRE un oráculo de enumeración de usuarios accesible con
-- la clave anon, que viaja en el bundle de las apps. Rojo reproducido el
-- 8-ago-2026: con un email, `anon` obtenía uuid, email_confirmed_at, estado de
-- onboarding, cuentas comerciales, prestadores y roles.
-- No revertir sin una razón escrita.

BEGIN;
GRANT EXECUTE ON FUNCTION public.debug_estado_user(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debug_session() TO anon, authenticated;
COMMIT;
