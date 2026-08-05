-- REVERSA de `20260805150000_lote_d660_gestion.sql` (S88-A · D-660).
-- Escrita ANTES.
--
-- ⚠️ Revertir REABRE D-660: el rol `administrador` vuelve a tener lectura
-- perfecta y escritura CERO — la letra de S74 sin motor. Y las policies
-- vuelven a comparar user_id a mano, que es lo que garantiza el olvidado
-- silencioso (0 filas sin fallar).
--
-- Los cuerpos anteriores de las policies y RPCs viven en el historial de
-- migraciones: se re-aplican ESOS. La reversa NO los reconstruye a mano.

BEGIN;
-- (las policies y RPC se restauran desde el historial — ver cabecera)
DROP FUNCTION IF EXISTS public.user_gestiona_prestador(uuid);
COMMIT;
