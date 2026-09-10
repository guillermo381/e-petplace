-- REVERSA de 20260912190000_s115a_tax_profiles.sql (escrita ANTES de aplicar)
-- 🔴 QUÉ NO REVIERTE: los tax_profiles que se hayan creado se PIERDEN.
--    Verificar antes:  SELECT count(*) FROM tax_profiles;
-- La segunda parte SÍ es exactamente reversible: el default de
-- profiles.tipo_identificacion y el valor de las filas que se nulearon se
-- restauran por el MISMO predicado con el que se nulearon (cedula IS NULL).
BEGIN;
DROP TABLE IF EXISTS public.tax_profiles;
DROP TYPE IF EXISTS public.tipo_identificacion_enum;
UPDATE public.profiles SET tipo_identificacion = 'cedula'
 WHERE tipo_identificacion IS NULL AND cedula IS NULL;
ALTER TABLE public.profiles ALTER COLUMN tipo_identificacion SET DEFAULT 'cedula';
COMMIT;
