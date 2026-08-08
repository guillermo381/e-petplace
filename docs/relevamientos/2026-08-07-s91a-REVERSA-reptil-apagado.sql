-- REVERSA de 20260807230000_s91a_reptil_apagado.sql (escrita ANTES)
-- Vuelve a ABRIR reptil a nuevos registros y re-enciende sus 5 razas.
-- ⚠️ Correrla deshace una FIRMA del founder (7-ago-2026) y REABRE el agujero:
-- reptil vuelve a ser insertable por RPC aunque la grilla del alta no lo
-- ofrezca. Si en el futuro reptil se ABRE de verdad, lo correcto es que
-- `activo` pase a true JUNTO con `acepta_nuevos_registros` — no esta reversa.

BEGIN;
UPDATE public.cat_especies SET acepta_nuevos_registros = true WHERE codigo = 'reptil';
UPDATE public.cat_razas SET activo = true, updated_at = now() WHERE especie = 'reptil';
COMMIT;
