-- REVERSA de 20260828210000_s107a_flag_guarderia.sql · ESCRITA ANTES.
-- Saca la clave `daycare` de services_enabled en los dos países.
-- 🔴 NO deshace: si alguna superficie ya dejó de colgar de `hotel`, revertir
--    esto la deja sin flag y la guardería DESAPARECE de Explorar. Es el
--    comportamiento correcto de un fail-closed, pero se dice antes.
BEGIN;
UPDATE public.country_config
   SET services_enabled = services_enabled - 'daycare'
 WHERE services_enabled ? 'daycare';
COMMIT;
