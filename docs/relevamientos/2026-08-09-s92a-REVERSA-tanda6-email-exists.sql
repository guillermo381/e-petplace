-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260809010000_s92_revoke_email_exists.sql` (S92-A · D-703)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN.
--
-- QUÉ DESHACE: devuelve EXECUTE sobre `email_exists(text)` a `anon` y a PUBLIC.
--
-- QUÉ **NO** DESHACE, y por qué esta reversa es de las que no deberían correrse:
--   Reabre un ORÁCULO DE ENUMERACIÓN DE CUENTAS probado el 9-ago-2026 con el
--   correo real del founder: `true` para una cuenta que existe, `false` para una
--   inventada. **Discrimina**, que es la definición del defecto.
--   Y choca contra letra firmada en S84: *«NUNCA se declara si un correo
--   existe»*.
--
-- CUÁNDO SE CORRERÍA LEGÍTIMAMENTE: solo si el checkout de `e-petplace-v2`
-- volviera a estar en uso Y se decidiera que ese flujo vale más que la regla —
-- decisión de founder, no de una sesión. **El costo del REVOKE ya fue aceptado
-- y firmado** (founder, 9-ago-2026): las webs legacy están al aire pero sin uso.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon, PUBLIC;

COMMIT;
