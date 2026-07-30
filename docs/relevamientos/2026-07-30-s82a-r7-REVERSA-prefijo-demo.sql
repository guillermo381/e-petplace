-- REVERSA de 20260730122000_s82_cura_prefijo_demo.sql — escrita ANTES.
--
-- CURA DE DATO PURA (76(g) RIGE: es backfill). Los SEIS valores previos,
-- LITERALES y medidos antes de aplicar — esta reversa ES su única
-- fuente, por eso van embebidos (precedente S79):
--
--   prestadores:
--     de300000-0000-4000-8000-0000000000e5 · '[DEMO S44] Paseos Andres'
--     de680000-0000-4000-8000-0000000000e5 · '[DEMO S68] Clínica Aurora'
--     de580000-0000-4000-8000-0000000000b1 · '[DEMO S58] Wizard'
--   cuentas_comerciales:
--     de300000-0000-4000-8000-0000000000cc · '[DEMO S44] Paseos Andres'
--     de580000-0000-4000-8000-00000000c0c1 · '[DEMO S58] Wizard'
--     de680000-0000-4000-8000-0000000000cc · '[DEMO S68] Clínica Aurora'

BEGIN;

UPDATE public.prestadores SET nombre_comercial = '[DEMO S44] Paseos Andres' WHERE id = 'de300000-0000-4000-8000-0000000000e5';
UPDATE public.prestadores SET nombre_comercial = '[DEMO S68] Clínica Aurora' WHERE id = 'de680000-0000-4000-8000-0000000000e5';
UPDATE public.prestadores SET nombre_comercial = '[DEMO S58] Wizard'         WHERE id = 'de580000-0000-4000-8000-0000000000b1';

UPDATE public.cuentas_comerciales SET nombre_comercial = '[DEMO S44] Paseos Andres' WHERE id = 'de300000-0000-4000-8000-0000000000cc';
UPDATE public.cuentas_comerciales SET nombre_comercial = '[DEMO S58] Wizard'         WHERE id = 'de580000-0000-4000-8000-00000000c0c1';
UPDATE public.cuentas_comerciales SET nombre_comercial = '[DEMO S68] Clínica Aurora' WHERE id = 'de680000-0000-4000-8000-0000000000cc';

DO $$
DECLARE n int;
BEGIN
  SELECT (SELECT count(*) FROM prestadores WHERE nombre_comercial ~ '^\[DEMO')
       + (SELECT count(*) FROM cuentas_comerciales WHERE nombre_comercial ~ '^\[DEMO') INTO n;
  IF n <> 6 THEN RAISE EXCEPTION 'reversa incompleta: % de 6 prefijos restaurados', n; END IF;
END $$;

COMMIT;
