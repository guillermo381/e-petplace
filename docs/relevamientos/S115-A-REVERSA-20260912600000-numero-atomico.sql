-- REVERSA de 20260912600000 · escrita ANTES.
-- ⚠️ Revertir vuelve a separar la toma del secuencial de su persistencia: desde
--    ahí, un fallo entre las dos QUEMA el número y deja un hueco que hay que
--    explicarle al SRI. La reversa no devuelve los números ya quemados.
DROP FUNCTION IF EXISTS public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric);
