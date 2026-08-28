-- REVERSA de 20260828220000_s107a_clave_guarderia.sql · ESCRITA ANTES.
-- Vuelve la clave a `daycare` (el nombre equivocado). Se conserva por
-- completitud; nadie debería querer correrla.
BEGIN;
UPDATE public.country_config
   SET services_enabled = (services_enabled - 'guarderia') || jsonb_build_object('daycare', services_enabled->'guarderia')
 WHERE services_enabled ? 'guarderia';
COMMIT;
