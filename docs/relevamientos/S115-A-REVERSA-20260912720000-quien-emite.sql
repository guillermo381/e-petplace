-- REVERSA de 20260912720000_s115a_quien_emite.sql — escrita ANTES.
-- ⚠️ Revertir deja a las seis pantallas sin poder decirle a la familia quién le
--    va a facturar. No borra datos: la función es de sólo lectura.
DROP FUNCTION IF EXISTS public.fiscal_quien_emite(text, uuid);
