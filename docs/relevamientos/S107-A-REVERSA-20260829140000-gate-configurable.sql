-- REVERSA de 20260829140000_s107a_gate_sanitario_configurable.sql · ESCRITA ANTES.
-- 🔴 Revertir vuelve el gate a DURO SIEMPRE — y hoy no hay datos para
--    sostenerlo (0 de 58 mascotas pasan). Se dice antes de correrla.
BEGIN;
DELETE FROM public.app_config WHERE clave = 'guarderia_gate_sanitario_duro';
COMMIT;
